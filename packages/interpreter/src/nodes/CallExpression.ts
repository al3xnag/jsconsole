import { CallExpression } from 'acorn'
import { evaluateNode } from '.'
import { assertFunctionCallSideEffectFree } from '../lib/assertFunctionCallSideEffectFree'
import { setActiveCalleeCallStack } from '../lib/callStack'
import { syncContext } from '../lib/syncContext'
import { throwError } from '../lib/throwError'
import { unbindFunction } from '../lib/unbindFunction'
import {
  CallStack,
  CallStackLocation,
  Context,
  EvaluatedNode,
  EvaluateGenerator,
  Scope,
} from '../types'
import { evaluateSuperCall } from './Super'
import { hookCallAfter } from '../lib/hookCall'
import {
  TYPE_ERROR_EXPR_IS_NOT_FUNCTION,
  TYPE_ERROR_EXPR_IS_NOT_ITERABLE,
} from '../lib/errorDefinitions'

export function* evaluateCallExpression(
  node: CallExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  node.callee.parent = node

  if (node.callee.type !== 'Super') {
    const {
      value: func,
      base,
      thisValue,
    } = yield* evaluateNode(node.callee, scope, callStack, context)
    const thisArg = thisValue !== undefined ? thisValue : base

    if (node.optional && func == null) {
      const evaluated: EvaluatedNode = { value: undefined }
      return evaluated
    }

    if (typeof func !== 'function') {
      throw TYPE_ERROR_EXPR_IS_NOT_FUNCTION(node.callee, context)
    }

    const argValues = yield* evaluateArguments(node, scope, callStack, context)

    if (syncContext?.throwOnSideEffect) {
      assertFunctionCallSideEffectFree(func, thisArg, argValues, context)
    }

    const callStackLocation = getCallStackLocation(node, context)
    const calleeCallStack = callStack.concat({
      fn: unbindFunction(func, context),
      loc: callStackLocation,
    })
    setActiveCalleeCallStack(calleeCallStack)

    let result: unknown

    try {
      result = Reflect.apply(func, thisArg, argValues)
    } catch (e) {
      throwError(e, callStackLocation, calleeCallStack, context, 'unsafe')
    } finally {
      setActiveCalleeCallStack(null)
    }

    result = hookCallAfter(node, func, thisArg, argValues, result, callStack, context)

    const evaluated: EvaluatedNode = { value: result }
    return evaluated
  } else {
    const argValues = yield* evaluateArguments(node, scope, callStack, context)
    const result = yield* evaluateSuperCall(node.callee, scope, callStack, context, argValues)
    return { value: result }
  }
}

function* evaluateArguments(
  node: CallExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
) {
  const argValues: unknown[] = []
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

      argValues.push(...items)
    } else {
      argValues.push(value)
    }
  }

  return argValues
}

function getCallStackLocation(node: CallExpression, context: Context): CallStackLocation {
  const pos =
    node.callee.type === 'Identifier'
      ? node.callee.loc!.start
      : node.callee.type === 'MemberExpression'
        ? node.callee.property.loc!.start
        : node.callee.loc!.end
  return { file: context.name, line: pos.line, col: pos.column + 1 }
}
