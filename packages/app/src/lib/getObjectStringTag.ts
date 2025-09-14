export function getObjectStringTag(value: object): string | null {
  try {
    const stringTagDescriptor = Object.getOwnPropertyDescriptor(value, Symbol.toStringTag)
    if (stringTagDescriptor && typeof stringTagDescriptor.value === 'string') {
      return stringTagDescriptor.value
    }
  } catch (error) {
    console.assert(false, 'Failed to get object string tag using Symbol.toStringTag', error)
  }

  try {
    const constructorDescriptor = Object.getOwnPropertyDescriptor(value, 'constructor')
    if (typeof constructorDescriptor?.value === 'function') {
      return constructorDescriptor.value.name
    }
  } catch (error) {
    console.assert(false, 'Failed to get object string tag using constructor.name', error)
  }

  const proto = Object.getPrototypeOf(value) as object | null
  if (proto) {
    return getObjectStringTag(proto)
  }

  return null
}
