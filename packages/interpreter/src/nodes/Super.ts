import { Super } from 'acorn'
import {
  CallStack,
  CallStackLocation,
  Context,
  EvaluateGenerator,
  FunctionScope,
  Scope,
} from '../types'
import { InternalError } from '../lib/InternalError'
import { findScope } from '../lib/scopes'
import { initializeInstanceElements, isConstructor } from '../lib/evaluation-utils'
import { UNINITIALIZED } from '../constants'
import { syncContext } from '../lib/syncContext'
import { assertFunctionConstructSideEffectFree } from '../lib/assertFunctionConstructSideEffectFree'
import { hookConstructAfter } from '../lib/hookConstruct'
import { setActiveCalleeCallStack } from '../lib/callStack'
import { throwError } from '../lib/throwError'
import {
  REFERENCE_ERROR_CLASS_CTOR_MUST_CALL_SUPER,
  REFERENCE_ERROR_SUPER_MAY_ONLY_BE_CALLED_ONCE,
  TYPE_ERROR_ARG_IS_NOT_CONSTRUCTOR,
} from '../lib/errorDefinitions'

export function* evaluateSuper(
  node: Super,
  scope: Scope,
  _callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const parent = node.parent!
  if (parent.type === 'MemberExpression') {
    return yield* evaluateSuperProperty(node, scope, context)
  } else {
    throw new InternalError('Unexpected super evaluation, parent: ' + parent.type)
  }
}

export function* evaluateSuperCall(
  node: Super,
  scope: Scope,
  callStack: CallStack,
  context: Context,
  args: unknown[],
) {
  const thisScope = findScope(
    scope,
    (scope) => scope.kind === 'function' && !!scope.hasThisBinding,
  ) as FunctionScope

  const func = Object.getPrototypeOf(thisScope.functionObject)

  if (!isConstructor(func, context)) {
    throw TYPE_ERROR_ARG_IS_NOT_CONSTRUCTOR(func)
  }

  if (syncContext?.throwOnSideEffect) {
    assertFunctionConstructSideEffectFree(func, args, context)
  }

  const callStackLocation: CallStackLocation = {
    file: context.name,
    line: node.loc!.start.line,
    col: node.loc!.start.column + 1,
  }
  const calleeCallStack = callStack.concat({ fn: func, loc: callStackLocation, construct: true })
  setActiveCalleeCallStack(calleeCallStack)

  let result: object

  try {
    result = Reflect.construct(func, args, thisScope.newTarget ?? func)
  } catch (error) {
    throwError(error, callStackLocation, calleeCallStack, context, 'unsafe')
  } finally {
    setActiveCalleeCallStack(null)
  }

  result = hookConstructAfter(node, func, args, result, callStack, context)

  if (thisScope.thisValue !== UNINITIALIZED) {
    throw REFERENCE_ERROR_SUPER_MAY_ONLY_BE_CALLED_ONCE()
  }

  thisScope.thisValue = result

  yield* initializeInstanceElements(result, thisScope.functionObject, context)

  return result
}

export function* evaluateSuperProperty(
  _node: Super,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const { thisValue, functionObject } = findScope(
    scope,
    (scope) => scope.kind === 'function' && !!scope.hasThisBinding,
  ) as FunctionScope

  if (thisValue === UNINITIALIZED) {
    throw REFERENCE_ERROR_CLASS_CTOR_MUST_CALL_SUPER()
  }

  const homeObject = context.metadata.functions.get(functionObject)?.homeObject
  const value = homeObject !== undefined ? Object.getPrototypeOf(homeObject) : undefined
  return { value, thisValue }
}
