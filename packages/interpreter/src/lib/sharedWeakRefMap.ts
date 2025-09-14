const sharedWeakRefMap = new WeakMap<WeakKey, WeakRef<WeakKey>>()

export function getSharedWeakRef(value: WeakKey): WeakRef<WeakKey> | undefined {
  return sharedWeakRefMap.get(value)
}

export function getOrCreateSharedWeakRef(value: WeakKey): WeakRef<WeakKey> {
  let ref = sharedWeakRefMap.get(value)
  if (ref) {
    return ref
  }

  ref = new WeakRef(value)
  sharedWeakRefMap.set(value, ref)
  return ref
}
