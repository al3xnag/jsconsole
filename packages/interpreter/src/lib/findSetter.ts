// @ts-expect-error deprecated, non-standard, yet widely available
const lookupSetter = Object.prototype.__lookupSetter__ as (
  prop: PropertyKey,
) => ((v: any) => void) | undefined

const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const getPrototypeOf = Object.getPrototypeOf

export function findSetter(obj: unknown, prop: PropertyKey) {
  if (lookupSetter) {
    return lookupSetter.call(obj, prop)
  }

  while (obj != null) {
    const desc = getOwnPropertyDescriptor(obj, prop)
    if (desc) {
      return desc.set
    }

    obj = getPrototypeOf(obj)
  }
}
