import { Context } from '../types'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import { syncContext } from './syncContext'
import { assertFunctionCallSideEffectFree } from './assertFunctionCallSideEffectFree'

const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const getPrototypeOf = Object.getPrototypeOf

export function assertPropertyWriteSideEffectFree(
  object: unknown,
  propertyKey: PropertyKey,
  value: unknown,
  context: Context,
): void {
  let proto = object
  while (proto != null) {
    if (context.metadata.proxies.has(proto)) {
      const { handler } = context.metadata.proxies.get(proto)!
      if ('getOwnPropertyDescriptor' in handler || 'getPrototypeOf' in handler) {
        throw new PossibleSideEffectError()
      }
    }

    const desc = getOwnPropertyDescriptor(proto, propertyKey)
    if (desc) {
      if (desc.set) {
        assertFunctionCallSideEffectFree(desc.set, object, [value], context)
        return
      }

      if (desc.writable) {
        break
      }

      return
    }

    proto = getPrototypeOf(proto)
  }

  // No setter found? Don't allow mutation of an already existing object.
  if (
    object != null &&
    (typeof object === 'object' || typeof object === 'function') &&
    !syncContext?.tmpRefs.has(object)
  ) {
    throw new PossibleSideEffectError()
  }
}
