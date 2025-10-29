import { Context } from '../types'

const sharedWeakRefMap = new WeakMap<WeakKey, WeakRef<WeakKey>>()

export function getSharedWeakRef(value: WeakKey): WeakRef<WeakKey> | undefined {
  return sharedWeakRefMap.get(value)
}

export function getOrCreateSharedWeakRef(value: WeakKey, context: Context): WeakRef<WeakKey> {
  let ref = sharedWeakRefMap.get(value)
  if (ref) {
    return ref
  }

  const _WeakRef = context.metadata.globals.WeakRef ?? WeakRef
  ref = new _WeakRef(value)
  sharedWeakRefMap.set(value, ref)
  return ref
}
