/**
 * Check whether the value is `typeof globalThis` (cross-realm).
 *
 * This check does not need to be exhaustive.
 */
export function isProbablyGlobalThis(value: unknown): value is typeof globalThis {
  if (value === globalThis) {
    return true
  }

  if (typeof value !== 'object' || value === null || !('globalThis' in value)) {
    return false
  }

  const stringTag = Object.getOwnPropertyDescriptor(value, Symbol.toStringTag)?.value
  return stringTag === 'Window' /* browser */ || stringTag === 'global' /* node */
}
