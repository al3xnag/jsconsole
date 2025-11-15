import { EMPTY, TYPE_BREAK, TYPE_CONTINUE, TYPE_RETURN } from '../constants'
import { Constructor, Context, EvaluatedNode, Primitive, PrivateName } from '../types'
import { assertFunctionCallSideEffectFree } from './assertFunctionCallSideEffectFree'
import { assertPropertyReadSideEffectFree } from './assertPropertyReadSideEffectFree'
import { InternalError } from './InternalError'
import { isCallable } from './isCallable'
import { getOrCreatePrivateElements } from './Metadata'
import { syncContext } from './syncContext'
import { toShortStringTag } from './toShortStringTag'

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
    throw new context.metadata.globals.TypeError('Cannot convert undefined or null to object')
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
    throw new context.metadata.globals.TypeError('Cannot convert a Symbol value to a string')
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
      throw new context.metadata.globals.TypeError(
        `Private method '${name}' has already been declared`,
      )
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
        throw new context.metadata.globals.TypeError(
          `Private field '${name}' has already been declared`,
        )
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
        throw new context.metadata.globals.TypeError(
          `Cannot set property '${name}' of ${toShortStringTag(obj)}`,
        )
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
    throw new context.metadata.globals.TypeError(
      `${toShortStringTag(fn)} returned for property "${propertyName.toString()}" of ${toShortStringTag(value)} is not a function`,
    )
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

      throw new context.metadata.globals.TypeError('Cannot convert object to primitive value')
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

  throw new context.metadata.globals.TypeError('Cannot convert object to primitive value')
}

// https://tc39.es/ecma262/#sec-instanceofoperator
export function instanceofOperator(left: any, right: any, context: Context): boolean {
  if (!isObject(right)) {
    throw new context.metadata.globals.TypeError(`Right-hand side of 'instanceof' is not an object`)
  }

  const instOfHandler = getMethod(right, Symbol.hasInstance, context)
  if (instOfHandler) {
    if (syncContext?.throwOnSideEffect) {
      assertFunctionCallSideEffectFree(instOfHandler, right, [left], context)
    }

    return Boolean(Reflect.apply(instOfHandler, right, [left]))
  }

  if (!isCallable(right)) {
    throw new context.metadata.globals.TypeError(`Right-hand side of 'instanceof' is not callable`)
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
    throw new context.metadata.globals.TypeError(
      `Function has non-object prototype '${toShortStringTag(p)}' in instanceof check`,
    )
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
