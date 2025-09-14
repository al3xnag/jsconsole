const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const getPrototypeOf = Object.getPrototypeOf

/**
 * It's like `Object.getOwnPropertyDescriptor`, but it looks up the prototype chain.
 */
export function getPropertyDescriptor(
  obj: unknown,
  prop: PropertyKey,
): PropertyDescriptor | undefined {
  while (obj != null) {
    const desc = getOwnPropertyDescriptor(obj, prop)
    if (desc) {
      return desc
    }

    obj = getPrototypeOf(obj)
  }
}
