import { Context } from '../types'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import { assertPropertyReadSideEffectFree } from './assertPropertyReadSideEffectFree'
import { throwIfTimedOut } from './throwIfTimedOut'

const propertyIsEnumerable = Object.prototype.propertyIsEnumerable
const ownKeys = Reflect.ownKeys

export function assertObjectSpreadSideEffectFree(obj: unknown, context: Context): void {
  if (obj == null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return
  }

  const proxies = context.metadata.proxies
  if (proxies.has(obj)) {
    const { handler } = proxies.get(obj)!
    if ('get' in handler || 'getOwnPropertyDescriptor' in handler || 'ownKeys' in handler) {
      throw new PossibleSideEffectError()
    }
  }

  const enumerableOwnKeys = ownKeys(obj).filter((key) => propertyIsEnumerable.call(obj, key))

  for (const key of enumerableOwnKeys) {
    throwIfTimedOut()
    assertPropertyReadSideEffectFree(obj, key, context)
  }
}
