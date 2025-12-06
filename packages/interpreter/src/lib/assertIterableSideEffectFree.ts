import { Context } from '../types'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import { assertFunctionCallSideEffectFree } from './assertFunctionCallSideEffectFree'
import { assertPropertyReadSideEffectFree } from './assertPropertyReadSideEffectFree'
import { throwIfTimedOut } from './throwIfTimedOut'

const arrayValuesIterator = Array.prototype[Symbol.iterator]

export function assertIterableSideEffectFree(obj: unknown, context: Context): void {
  if (obj == null) {
    return
  }

  if (typeof obj === 'object' || typeof obj === 'function') {
    const proxies = context.metadata.proxies
    if (proxies.has(obj)) {
      const { handler } = proxies.get(obj)!
      if ('get' in handler || 'getOwnPropertyDescriptor' in handler) {
        throw new PossibleSideEffectError()
      }
    }
  }

  assertPropertyReadSideEffectFree(obj, Symbol.iterator, context)

  const iteratorMethod = (obj as Partial<Iterable<unknown>>)[Symbol.iterator]
  if (typeof iteratorMethod !== 'function') {
    return
  }

  assertFunctionCallSideEffectFree(iteratorMethod, obj, [], context)

  if (iteratorMethod === arrayValuesIterator) {
    assertPropertyReadSideEffectFree(obj, 'length', context)
    const length = (obj as Partial<ArrayLike<unknown>>).length
    if (typeof length === 'number') {
      for (let i = 0; i < length; i++) {
        throwIfTimedOut()
        assertPropertyReadSideEffectFree(obj, i, context)
      }
    }
  }
}
