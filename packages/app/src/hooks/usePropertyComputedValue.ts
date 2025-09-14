import { SyntheticSetter } from '@/lib/synthetic'
import { SIDE_EFFECT_FREE, type SideEffectInfo } from '@jsconsole/interpreter'
import { useState } from 'react'

const NO_VALUE = Symbol('NO_VALUE')

export type PropertyComputedData = {
  value: unknown
  isException: boolean
  compute: () => void
  hasComputed: boolean
}

export function usePropertyComputedValue(
  descriptor: PropertyDescriptor,
  owner: unknown,
  sideEffectInfo: SideEffectInfo,
): PropertyComputedData {
  const [value, setValue] = useState(() => {
    if ('value' in descriptor) {
      return descriptor.value
    }

    if (typeof descriptor.get === 'function') {
      if (sideEffectInfo.functions.get(descriptor.get) === SIDE_EFFECT_FREE) {
        try {
          return descriptor.get.call(owner)
        } catch {
          return NO_VALUE
        }
      }

      return NO_VALUE
    }

    // TODO: implement displaying getters and setters as extra synthetic properties,
    // as it's done in chrome devtools, and do not display `x: <setter>`.
    if (typeof descriptor.set === 'function') {
      return SyntheticSetter
    }

    throw new Error('Invalid property descriptor')
  })

  const [isException, setIsException] = useState(false)

  const compute = () => {
    if (value === NO_VALUE && typeof descriptor.get === 'function') {
      try {
        setValue(descriptor.get.call(owner))
        setIsException(false)
      } catch (error) {
        setValue(error)
        setIsException(true)
      }
    }
  }

  return {
    value,
    isException,
    compute,
    hasComputed: value !== NO_VALUE,
  }
}
