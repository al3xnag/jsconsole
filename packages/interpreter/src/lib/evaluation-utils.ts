import { EMPTY, TYPE_BREAK, TYPE_CONTINUE, TYPE_RETURN } from '../constants'
import { Constructor, Context, EvaluatedNode, Primitive, PrivateName } from '../types'
import { assertFunctionCallSideEffectFree } from './assertFunctionCallSideEffectFree'
import { assertPropertyReadSideEffectFree } from './assertPropertyReadSideEffectFree'
import {
  TYPE_ERROR_CANNOT_CONVERT_BIGINT_TO_NUMBER,
  TYPE_ERROR_CANNOT_CONVERT_NULLISH_TO_OBJECT,
  TYPE_ERROR_CANNOT_CONVERT_OBJECT_TO_PRIMITIVE,
  TYPE_ERROR_CANNOT_CONVERT_SYMBOL_TO_NUMBER,
  TYPE_ERROR_CANNOT_CONVERT_SYMBOL_TO_STRING,
  TYPE_ERROR_CANNOT_SET_PROPERTY,
  TYPE_ERROR_INSTANCEOF_RIGHT_ARG_IS_NOT_CALLABLE,
  TYPE_ERROR_INSTANCEOF_RIGHT_ARG_IS_NOT_OBJECT,
  TYPE_ERROR_INSTANCEOF_RIGHT_ARG_NON_OBJECT_PROTOTYPE,
  TYPE_ERROR_METHOD_NOT_CALLABLE,
  TYPE_ERROR_PRIVATE_FIELD_ALREADY_DECLARED,
  TYPE_ERROR_PRIVATE_METHOD_ALREADY_DECLARED,
} from './errorDefinitions'
import { InternalError } from './InternalError'
import { isCallable } from './isCallable'
import { getOrCreatePrivateElements } from './Metadata'
import { syncContext } from './syncContext'

// https://tc39.es/ecma262/#sec-completion-record-specification-type
export function isAbruptCompletion(evaluated: EvaluatedNode): boolean {
  return (
    evaluated.type === TYPE_BREAK ||
    evaluated.type === TYPE_CONTINUE ||
    evaluated.type === TYPE_RETURN
  )
}

// https://tc39.es/ecma262/#sec-updateempty
export function updateEmpty(evaluated: EvaluatedNode, value: unknown): EvaluatedNode {
  if (evaluated.type === TYPE_RETURN && evaluated.value === EMPTY) {
    throw new InternalError('Invalid return statement')
  }

  if (evaluated.value !== EMPTY) {
    return evaluated
  }

  return { ...evaluated, value }
}

// https://tc39.es/ecma262/#sec-runtime-semantics-labelledevaluation
export function breakableStatementCompletion(evaluated: EvaluatedNode): EvaluatedNode {
  const { type, label, value } = evaluated
  if (type === TYPE_BREAK && label === undefined) {
    return {
      ...evaluated,
      type: undefined,
      value: value === EMPTY ? undefined : value,
    }
  }

  return evaluated
}

// https://tc39.es/ecma262/#sec-loopcontinues
export function loopContinues(evaluated: EvaluatedNode, labels: string[] | undefined | null) {
  if (evaluated.type === undefined) {
    return true
  }

  if (evaluated.type !== TYPE_CONTINUE) {
    return false
  }

  if (evaluated.label === undefined) {
    return true
  }

  if (labels?.includes(evaluated.label)) {
    return true
  }

  return false
}

// https://tc39.es/ecma262/#sec-toobject
export function toObject(value: unknown, context: Context): object {
  if (value == null) {
    throw TYPE_ERROR_CANNOT_CONVERT_NULLISH_TO_OBJECT()
  }

  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint'
  ) {
    return context.metadata.globals.Object(value)
  }

  return value
}

// https://tc39.es/ecma262/#sec-tostring
export function toString(value: unknown, context: Context): string {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'symbol') {
    throw TYPE_ERROR_CANNOT_CONVERT_SYMBOL_TO_STRING()
  }

  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'bigint') return String(value)

  if (!syncContext?.throwOnSideEffect) {
    return context.metadata.globals.String(value)
  }

  const primValue = toPrimitive(value, context, 'string')
  return toString(primValue, context)
}

// https://tc39.es/ecma262/#sec-tonumber
export function toNumber(value: unknown, context: Context): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'symbol') {
    throw TYPE_ERROR_CANNOT_CONVERT_SYMBOL_TO_NUMBER()
  }

  if (typeof value === 'bigint') {
    throw TYPE_ERROR_CANNOT_CONVERT_BIGINT_TO_NUMBER()
  }

  if (value === undefined) {
    return NaN
  }

  if (value === null || value === false) {
    return 0
  }

  if (value === true) {
    return 1
  }

  if (typeof value === 'string') {
    return Number(value)
  }

  const primValue = toPrimitive(value, context, 'number')
  return toNumber(primValue, context)
}

// https://tc39.es/ecma262/#sec-tonumeric
export function toNumeric(value: unknown, context: Context): number | bigint {
  const primValue = toPrimitive(value, context, 'number')
  if (typeof primValue === 'bigint') {
    return primValue
  }

  return toNumber(primValue, context)
}

// https://tc39.es/ecma262/#sec-isconstructor
export function isConstructor(callee: unknown, context: Context): callee is Constructor {
  if (typeof callee !== 'function') {
    return false
  }

  const metadata = context.metadata.functions.get(callee)
  if (metadata && typeof metadata.constructable === 'boolean') {
    return metadata.constructable
  }

  // There is no built-in way to check whether an unknown value is constructable (has [[Construct]] internal method).
  // Since this interpreter is non-sandboxed, and `callee` can be an external value created outside of the interpreter,
  // we use this workaround to check if the value is constructable:
  try {
    // `callee` isn't called here, so it's safe in terms of side effects.
    Reflect.construct(function () {}, [], callee)
  } catch {
    return false
  }

  return true
}

// https://tc39.es/ecma262/#sec-initializeinstanceelements
export function* initializeInstanceElements(obj: object, constructor: Function, context: Context) {
  const metadata = context.metadata.functions.get(constructor)
  const privateMethods = metadata?.privateMethods
  const fields = metadata?.fields

  if (!privateMethods || !fields) {
    throw new InternalError('Private methods or fields are not defined')
  }

  const privateElements = getOrCreatePrivateElements(obj, context)

  for (const name in privateMethods) {
    if (name in privateElements) {
      throw TYPE_ERROR_PRIVATE_METHOD_ALREADY_DECLARED(name)
    }

    const entry = privateMethods[name]

    // https://tc39.es/ecma262/#sec-privatemethodoraccessoradd
    // > NOTE: The values for private methods and accessors are shared across instances.
    // > This operation does not create a new copy of the method or accessor.
    privateElements[name] = entry
  }

  for (const record of fields) {
    const { name, isPrivate, initializer } = record
    const value = initializer ? yield* initializer.call(obj) : undefined
    if (isPrivate) {
      if (name in privateElements) {
        throw TYPE_ERROR_PRIVATE_FIELD_ALREADY_DECLARED(name)
      }

      privateElements[name] = { value, kind: 'field' }
    } else {
      const success = Reflect.defineProperty(obj, name, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      })

      if (!success) {
        throw TYPE_ERROR_CANNOT_SET_PROPERTY(obj, name)
      }
    }
  }
}

// https://tc39.es/ecma262/#sec-topropertykey
export function toPropertyKey(value: PropertyKey | unknown, context: Context): PropertyKey {
  if (import.meta.env.DEV && value instanceof PrivateName) {
    throw new InternalError('Private name cannot be converted to a property key')
  }

  const key = toPrimitive(value, context, 'string')
  if (typeof key === 'symbol') {
    return key
  }

  return toString(key, context)
}

export function isPropertyKey(
  propertyName: PropertyKey | PrivateName | unknown,
): propertyName is PropertyKey {
  return (
    typeof propertyName === 'string' ||
    typeof propertyName === 'number' ||
    typeof propertyName === 'symbol'
  )
}

// https://tc39.es/ecma262/#sec-getmethod
export function getMethod(
  value: unknown,
  propertyName: PropertyKey,
  context: Context,
): Function | undefined {
  const object = toObject(value, context)

  if (syncContext?.throwOnSideEffect) {
    assertPropertyReadSideEffectFree(object, propertyName, context)
  }

  const fn = Reflect.get(object, propertyName, value) as unknown
  if (fn == null) {
    return undefined
  }

  if (!isCallable(fn)) {
    throw TYPE_ERROR_METHOD_NOT_CALLABLE(value, propertyName, fn)
  }

  return fn
}

// https://tc39.es/ecma262/#sec-toprimitive
export function toPrimitive(
  value: unknown,
  context: Context,
  hint?: 'string' | 'number',
): Primitive {
  if (isObject(value)) {
    const exoticToPrim = getMethod(value, Symbol.toPrimitive, context)
    if (exoticToPrim) {
      const args = [hint ?? 'default']
      if (syncContext?.throwOnSideEffect) {
        assertFunctionCallSideEffectFree(exoticToPrim, value, args, context)
      }

      const result = Reflect.apply(exoticToPrim, value, args)
      if (!isObject(result)) {
        return result
      }

      throw TYPE_ERROR_CANNOT_CONVERT_OBJECT_TO_PRIMITIVE()
    }

    return ordinaryToPrimitive(value, hint ?? 'number', context)
  }

  return value as Primitive
}

export function isObject(value: unknown): value is object {
  return typeof value == 'object' ? value !== null : isCallable(value)
}

// https://tc39.es/ecma262/#sec-ordinarytoprimitive
export function ordinaryToPrimitive(
  value: object,
  hint: 'string' | 'number',
  context: Context,
): Primitive {
  const methodNames = hint === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString']
  for (const methodName of methodNames) {
    if (syncContext?.throwOnSideEffect) {
      assertPropertyReadSideEffectFree(value, methodName, context)
    }

    const method = Reflect.get(value, methodName, value) as unknown
    if (isCallable(method)) {
      if (syncContext?.throwOnSideEffect) {
        assertFunctionCallSideEffectFree(method, value, [], context)
      }

      const result = Reflect.apply(method, value, [])
      if (!isObject(result)) {
        return result
      }
    }
  }

  throw TYPE_ERROR_CANNOT_CONVERT_OBJECT_TO_PRIMITIVE()
}

// https://tc39.es/ecma262/#sec-instanceofoperator
export function instanceofOperator(left: any, right: any, context: Context): boolean {
  if (!isObject(right)) {
    throw TYPE_ERROR_INSTANCEOF_RIGHT_ARG_IS_NOT_OBJECT()
  }

  const instOfHandler = getMethod(right, Symbol.hasInstance, context)
  if (instOfHandler) {
    if (syncContext?.throwOnSideEffect) {
      assertFunctionCallSideEffectFree(instOfHandler, right, [left], context)
    }

    return Boolean(Reflect.apply(instOfHandler, right, [left]))
  }

  if (!isCallable(right)) {
    throw TYPE_ERROR_INSTANCEOF_RIGHT_ARG_IS_NOT_CALLABLE()
  }

  return ordinaryHasInstance(right, left, context)
}

// https://tc39.es/ecma262/#sec-ordinaryhasinstance
export function ordinaryHasInstance(right: any, left: any, context: Context): boolean {
  if (!isCallable(right)) {
    return false
  }

  const boundTargetFn = context.metadata.functions.get(right)?.targetFunction
  if (boundTargetFn) {
    return instanceofOperator(left, boundTargetFn, context)
  }

  if (!isObject(left)) {
    return false
  }

  const p = Reflect.get(right, 'prototype')
  if (!isObject(p)) {
    throw TYPE_ERROR_INSTANCEOF_RIGHT_ARG_NON_OBJECT_PROTOTYPE(p)
  }

  while (true) {
    left = Reflect.getPrototypeOf(left)
    if (left === null) {
      return false
    }

    if (left === p) {
      return true
    }
  }
}
