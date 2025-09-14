// All synthetic properties are unique symbols with description.
// Symbol description will be shown in the UI as synthetic property name.
/**
 * Prototype of an object.
 */
export const SYNTHETIC_PROPERTY_KEY_PROTOTYPE = Symbol('[[Prototype]]')
/**
 * Primitive value of Number, String, Boolean, BigInt, Symbol objects.
 */
export const SYNTHETIC_PROPERTY_KEY_PRIMITIVE_VALUE = Symbol('[[PrimitiveValue]]')
/**
 * Entries of Map, Set, WeakMap, WeakSet objects.
 */
export const SYNTHETIC_PROPERTY_KEY_ENTRIES = Symbol('[[Entries]]')
/**
 * State of a Promise.
 */
export const SYNTHETIC_PROPERTY_KEY_PROMISE_STATE = Symbol('[[PromiseState]]')
/**
 * Result of a Promise.
 */
export const SYNTHETIC_PROPERTY_KEY_PROMISE_RESULT = Symbol('[[PromiseResult]]')
/**
 * Target object of a WeakRef.
 */
export const SYNTHETIC_PROPERTY_KEY_WEAK_REF_TARGET = Symbol('[[WeakRefTarget]]')
/**
 * Target function of a bound function.
 */
export const SYNTHETIC_PROPERTY_KEY_TARGET_FUNCTION = Symbol('[[TargetFunction]]')
/**
 * Bound this of a bound function.
 */
export const SYNTHETIC_PROPERTY_KEY_BOUND_THIS = Symbol('[[BoundThis]]')
/**
 * Bound arguments of a bound function.
 */
export const SYNTHETIC_PROPERTY_KEY_BOUND_ARGS = Symbol('[[BoundArgs]]')
/**
 * TODO: Location of a function.
 */
export const SYNTHETIC_PROPERTY_KEY_FUNCTION_LOCATION = Symbol('[[FunctionLocation]]')
/**
 * TODO: Scopes of a function.
 */
export const SYNTHETIC_PROPERTY_KEY_SCOPES = Symbol('[[Scopes]]')
/**
 * Handler of a Proxy.
 */
export const SYNTHETIC_PROPERTY_KEY_HANDLER = Symbol('[[Handler]]')
/**
 * Target of a Proxy.
 */
export const SYNTHETIC_PROPERTY_KEY_TARGET = Symbol('[[Target]]')
/**
 * TODO: Whether a revocable Proxy is revoked.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable
 */
export const SYNTHETIC_PROPERTY_KEY_IS_REVOKED = Symbol('[[IsRevoked]]')

export type AnySyntheticPropertyKey =
  | typeof SYNTHETIC_PROPERTY_KEY_PROTOTYPE
  | typeof SYNTHETIC_PROPERTY_KEY_PRIMITIVE_VALUE
  | typeof SYNTHETIC_PROPERTY_KEY_ENTRIES
  | typeof SYNTHETIC_PROPERTY_KEY_PROMISE_STATE
  | typeof SYNTHETIC_PROPERTY_KEY_PROMISE_RESULT
  | typeof SYNTHETIC_PROPERTY_KEY_WEAK_REF_TARGET
  | typeof SYNTHETIC_PROPERTY_KEY_TARGET_FUNCTION
  | typeof SYNTHETIC_PROPERTY_KEY_BOUND_THIS
  | typeof SYNTHETIC_PROPERTY_KEY_BOUND_ARGS
  | typeof SYNTHETIC_PROPERTY_KEY_FUNCTION_LOCATION
  | typeof SYNTHETIC_PROPERTY_KEY_SCOPES
  | typeof SYNTHETIC_PROPERTY_KEY_HANDLER
  | typeof SYNTHETIC_PROPERTY_KEY_TARGET
  | typeof SYNTHETIC_PROPERTY_KEY_IS_REVOKED

export function isSyntheticPropertyKey(key: PropertyKey): key is AnySyntheticPropertyKey {
  return (
    key === SYNTHETIC_PROPERTY_KEY_PROTOTYPE ||
    key === SYNTHETIC_PROPERTY_KEY_PRIMITIVE_VALUE ||
    key === SYNTHETIC_PROPERTY_KEY_ENTRIES ||
    key === SYNTHETIC_PROPERTY_KEY_PROMISE_STATE ||
    key === SYNTHETIC_PROPERTY_KEY_PROMISE_RESULT ||
    key === SYNTHETIC_PROPERTY_KEY_WEAK_REF_TARGET ||
    key === SYNTHETIC_PROPERTY_KEY_TARGET_FUNCTION ||
    key === SYNTHETIC_PROPERTY_KEY_BOUND_THIS ||
    key === SYNTHETIC_PROPERTY_KEY_BOUND_ARGS ||
    key === SYNTHETIC_PROPERTY_KEY_FUNCTION_LOCATION ||
    key === SYNTHETIC_PROPERTY_KEY_SCOPES ||
    key === SYNTHETIC_PROPERTY_KEY_HANDLER ||
    key === SYNTHETIC_PROPERTY_KEY_TARGET ||
    key === SYNTHETIC_PROPERTY_KEY_IS_REVOKED
  )
}

export class SyntheticEntries extends Array<unknown> {}

export class SyntheticKeyValuePair {
  constructor(key: unknown, value: unknown) {
    return Object.create(null, {
      key: { value: key },
      value: { value: value },
    })
  }
}

export const SyntheticUnknown = Symbol('<unknown>')
export const SyntheticEmpty = Symbol('<empty>')
export const SyntheticGetter = Symbol('<getter>')
export const SyntheticSetter = Symbol('<setter>')

export type AnySyntheticValue =
  | SyntheticEntries
  | SyntheticKeyValuePair
  | typeof SyntheticUnknown
  | typeof SyntheticEmpty

export function isSyntheticValue(value: unknown): value is AnySyntheticValue {
  return (
    value instanceof SyntheticEntries ||
    value instanceof SyntheticKeyValuePair ||
    value === SyntheticUnknown ||
    value === SyntheticEmpty
  )
}
