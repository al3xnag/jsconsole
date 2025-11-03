export function toShortStringTag(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }

  if (value === null) {
    return 'null'
  }

  let proto: object | null = value
  while (proto != null) {
    const constructorDescriptor = Object.getOwnPropertyDescriptor(proto, 'constructor')
    if (constructorDescriptor) {
      if (typeof constructorDescriptor.value === 'function') {
        return `#<${constructorDescriptor.value.name || 'Object'}>`
      } else {
        break
      }
    }

    proto = Object.getPrototypeOf(proto)
  }

  return Object.prototype.toString.call(value)
}
