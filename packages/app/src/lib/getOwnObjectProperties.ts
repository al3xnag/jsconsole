import { Property } from '@/types'

export function getOwnObjectProperties(value: object): Property[] {
  const descriptors = Object.getOwnPropertyDescriptors(value) as PropertyDescriptorMap
  const keys = Reflect.ownKeys(descriptors)
  return keys.map((key) => ({
    name: key,
    descriptor: descriptors[key],
    isOwn: true,
  }))
}
