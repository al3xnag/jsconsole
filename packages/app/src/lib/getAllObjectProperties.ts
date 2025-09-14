import { Property } from '@/types'

export function getAllObjectProperties(value: object): Property[] {
  return _getAllObjectProperties(value)
}

function _getAllObjectProperties(
  value: object,
  isOwn = true,
  properties: Property[] = [],
  seenKeys = new Set<PropertyKey>(),
): Property[] {
  const ownDescriptors = Object.getOwnPropertyDescriptors(value) as PropertyDescriptorMap
  const ownKeys = Reflect.ownKeys(ownDescriptors)
  for (const key of ownKeys) {
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      properties.push({
        name: key,
        descriptor: ownDescriptors[key],
        isOwn,
      })
    }
  }

  const proto = Object.getPrototypeOf(value) as object | null
  if (proto !== null) {
    _getAllObjectProperties(proto, false, properties, seenKeys)
  }

  return properties
}
