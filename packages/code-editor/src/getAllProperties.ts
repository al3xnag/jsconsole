import type { Metadata } from '@jsconsole/interpreter'

export type Property = PropertyDescriptor & {
  name: string | symbol
  owner: unknown
}

export function getAllProperties(
  value: unknown,
  metadata: Metadata,
  options: { skipIndexedKeys?: boolean; skipSymbolKeys?: boolean } = {},
): Property[] {
  if (value === null || value === undefined) {
    throw new TypeError('Cannot get properties of null or undefined')
  }

  const isObject = typeof value === 'object' || typeof value === 'function'

  if (isObject && metadata.proxies.has(value)) {
    const { handler } = metadata.proxies.get(value)!
    if ('getOwnPropertyDescriptor' in handler || 'getPrototypeOf' in handler) {
      return []
    }
  }

  const ownDescriptors =
    // Always skip indexed properties of strings.
    isObject
      ? (Object.getOwnPropertyDescriptors(value) as Record<string | symbol, PropertyDescriptor>)
      : {}

  let ownKeys = Reflect.ownKeys(ownDescriptors)

  if (options.skipIndexedKeys || options.skipSymbolKeys) {
    ownKeys = ownKeys.filter((key) => {
      if (options.skipSymbolKeys && typeof key === 'symbol') {
        return false
      }

      if (options.skipIndexedKeys && typeof key === 'string' && !Number.isNaN(Number(key[0]))) {
        return false
      }

      return true
    })
  }

  const ownProps = ownKeys.map<Property>((key) => {
    const desc = ownDescriptors[key]
    return {
      name: key,
      owner: value,
      ...desc,
    }
  })

  const proto = Object.getPrototypeOf(value)
  const protoProps = proto !== null ? getAllProperties(proto, metadata, options) : []
  return ownProps.concat(protoProps)
}
