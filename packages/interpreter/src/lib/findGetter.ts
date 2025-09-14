// @ts-expect-error deprecated, non-standard, yet widely available
const lookupGetter = Object.prototype.__lookupGetter__ as (
  prop: PropertyKey,
) => (() => any) | undefined

const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const getPrototypeOf = Object.getPrototypeOf

export function findGetter(obj: unknown, prop: PropertyKey): (() => any) | undefined {
  if (lookupGetter) {
    return lookupGetter.call(obj, prop)
  }

  while (obj != null) {
    const desc = getOwnPropertyDescriptor(obj, prop)
    if (desc) {
      return desc.get
    }

    obj = getPrototypeOf(obj)
  }
}
