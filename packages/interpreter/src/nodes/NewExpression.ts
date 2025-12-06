import { NewExpression } from 'acorn'
import { evaluateNode } from '.'
import { SIDE_EFFECT_CONSTRUCT_FREE } from '../lib/SideEffectInfo'
import { assertFunctionConstructSideEffectFree } from '../lib/assertFunctionConstructSideEffectFree'
import { hasFlag } from '../lib/bitwiseFlags'
import { setActiveCalleeCallStack } from '../lib/callStack'
import { isConstructor } from '../lib/evaluation-utils'
import { syncContext } from '../lib/syncContext'
import { CallStack, CallStackLocation, Context, EvaluateGenerator, Scope } from '../types'
import { throwError } from '../lib/throwError'
import { hookConstructAfter } from '../lib/hookConstruct'
import {
  TYPE_ERROR_EXPR_IS_NOT_CONSTRUCTOR,
  TYPE_ERROR_EXPR_IS_NOT_ITERABLE,
} from '../lib/errorDefinitions'

// https://tc39.es/ecma262/#sec-new-operator
export function* evaluateNewExpression(
  node: NewExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const { value: callee } = yield* evaluateNode(node.callee, scope, callStack, context)

  const args: unknown[] = []
  for (const arg of node.arguments) {
    arg.parent = node
    const { value } = yield* evaluateNode(arg, scope, callStack, context)

    if (arg.type === 'SpreadElement') {
      let items: unknown[]
      try {
        items = [...(value as unknown[])]
      } catch (error) {
        if (error instanceof TypeError) {
          throw TYPE_ERROR_EXPR_IS_NOT_ITERABLE(arg.argument, context)
        }

        throw error
      }

      args.push(...items)
    } else {
      args.push(value)
    }
  }

  if (!isConstructor(callee, context)) {
    throw TYPE_ERROR_EXPR_IS_NOT_CONSTRUCTOR(node.callee, context)
  }

  if (syncContext?.throwOnSideEffect) {
    assertFunctionConstructSideEffectFree(callee, args, context)
  }

  const callStackLocation = getCallStackLocation(node, context)
  const calleeCallStack = callStack.concat({ fn: callee, loc: callStackLocation, construct: true })
  setActiveCalleeCallStack(calleeCallStack)

  let instance: object

  // NOTE: instance is always an object, even if constructor returns primitive value.
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new#description for details.
  try {
    instance = new callee(...args)
  } catch (error) {
    throwError(error, callStackLocation, calleeCallStack, context, 'unsafe')
  } finally {
    setActiveCalleeCallStack(null)
  }

  instance = hookConstructAfter(node, callee, args, instance, callStack, context)

  // NOTE: In constructor we can return any existing object: class A { constructor() { return Number } }
  if (!context.metadata.functions.has(callee)) {
    const sideEffectFlags = context.sideEffectInfo.functions.get(callee)
    if (sideEffectFlags !== undefined && hasFlag(sideEffectFlags, SIDE_EFFECT_CONSTRUCT_FREE)) {
      syncContext?.tmpRefs.add(instance)
    }
  }

  return { value: instance }
}

function getCallStackLocation(node: NewExpression, context: Context): CallStackLocation {
  const pos =
    node.callee.type === 'MemberExpression' ? node.callee.property.loc!.start : node.loc!.start
  return { file: context.name, line: pos.line, col: pos.column + 1 }
}
