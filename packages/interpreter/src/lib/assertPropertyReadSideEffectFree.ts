import { Context } from '../types'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import { assertFunctionSideEffectFree } from './assertFunctionSideEffectFree'

const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const getPrototypeOf = Object.getPrototypeOf

export function assertPropertyReadSideEffectFree(
  object: unknown,
  propertyKey: PropertyKey,
  context: Context,
): void {
  while (object != null) {
    if (context.metadata.proxies.has(object)) {
      const { handler } = context.metadata.proxies.get(object)!
      if ('getOwnPropertyDescriptor' in handler || 'getPrototypeOf' in handler) {
        throw new PossibleSideEffectError()
      }
    }

    const desc = getOwnPropertyDescriptor(object, propertyKey)
    if (desc) {
      if (desc.get) {
        assertFunctionSideEffectFree(desc.get, context)
        return
      }

      return
    }

    object = getPrototypeOf(object)
  }
}
