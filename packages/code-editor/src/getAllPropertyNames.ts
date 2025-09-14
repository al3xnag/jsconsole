export function getAllPropertyNames(
  value: unknown,
  options: { skipIndexed?: boolean } = {},
): string[] {
  if (value === null || value === undefined) {
    throw new TypeError('Cannot get property names of null or undefined')
  }

  let ownNames =
    // Always skip indexed properties of strings.
    typeof value === 'object' || typeof value === 'function'
      ? Object.getOwnPropertyNames(value)
      : []

  if (options.skipIndexed) {
    ownNames = ownNames.filter((name) => {
      return Number.isNaN(Number(name[0]))
    })
  }

  const proto = Object.getPrototypeOf(value)
  const protoNames = proto !== null ? getAllPropertyNames(proto, options) : []

  return Array.from(new Set([...ownNames, ...protoNames]))
}
