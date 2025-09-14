import { Context } from '../types'
import { syncContext } from './syncContext'
import { assertPropertyWriteSideEffectFree } from './assertPropertyWriteSideEffectFree'
import { getPropertyDescriptor } from './getPropertyDescriptor'

const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const isExtensible = Object.isExtensible

// 7.3.4 Set (O,P,V,Throw): https://tc39.es/ecma262/#sec-set-o-p-v-throw
// 10.1.9 [[Set]] (P,V,Receiver): https://tc39.es/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-set-p-v-receiver
export function setPropertyValue(
  object: any,
  propertyKey: PropertyKey,
  value: unknown,
  context: Context,
): void {
  if (syncContext?.throwOnSideEffect) {
    assertPropertyWriteSideEffectFree(object, propertyKey, context)
  }

  if (!context.strict && object != null && !ordinarySetCheck(object, propertyKey, value)) {
    return
  }

  object[propertyKey] = value
}

// Checks according to the 10.1.9.2 OrdinarySetWithOwnDescriptor (https://tc39.es/ecma262/#sec-ordinarysetwithowndescriptor),
function ordinarySetCheck(object: any, propertyKey: PropertyKey, value: unknown): boolean {
  const desc: PropertyDescriptor = getPropertyDescriptor(object, propertyKey) ?? {
    value: undefined,
    writable: true,
    enumerable: true,
    configurable: true,
  }

  if (isDataDescriptor(desc)) {
    if (!desc.writable) {
      return false
    }

    if (!isObject(object)) {
      return false
    }

    // This is the "existingDescriptor" from 10.1.9.2 OrdinarySetWithOwnDescriptor.
    const ownDesc = getOwnPropertyDescriptor(object, propertyKey)
    if (ownDesc) {
      if (isAccessorDescriptor(ownDesc)) {
        return false
      }

      if (!ownDesc.writable) {
        return false
      }

      const valueDesc: PropertyDescriptor = { value }
      return ordinaryDefineOwnPropertyCheck(object, propertyKey, valueDesc, ownDesc)
    } else {
      const newDesc: PropertyDescriptor = {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      }
      return ordinaryDefineOwnPropertyCheck(object, propertyKey, newDesc, undefined)
    }
  }

  if (desc.set === undefined) {
    return false
  }

  return true
}

function isDataDescriptor(desc: PropertyDescriptor): boolean {
  return 'value' in desc || 'writable' in desc
}

function isAccessorDescriptor(desc: PropertyDescriptor): boolean {
  return 'get' in desc || 'set' in desc
}

function isGenericDescriptor(desc: PropertyDescriptor): boolean {
  if (isAccessorDescriptor(desc)) {
    return false
  }

  if (isDataDescriptor(desc)) {
    return false
  }

  return true
}

function isObject(object: unknown): boolean {
  return object != null && (typeof object === 'object' || typeof object === 'function')
}

function ordinaryDefineOwnPropertyCheck(
  object: any,
  _propertyKey: PropertyKey,
  desc: PropertyDescriptor,
  currentDesc: PropertyDescriptor | undefined,
): boolean {
  if (currentDesc === undefined) {
    return isExtensible(object)
  }

  if (
    desc.configurable === undefined &&
    desc.enumerable === undefined &&
    desc.writable === undefined &&
    !('value' in desc) &&
    desc.get === undefined &&
    desc.set === undefined
  ) {
    return true
  }

  if (!currentDesc.configurable) {
    if (desc.configurable) {
      return false
    }

    if (desc.enumerable !== undefined && desc.enumerable !== currentDesc.enumerable) {
      return false
    }

    if (
      !isGenericDescriptor(desc) &&
      isAccessorDescriptor(desc) !== isAccessorDescriptor(currentDesc)
    ) {
      return false
    }

    if (isAccessorDescriptor(currentDesc)) {
      if (desc.get !== undefined && desc.get !== currentDesc.get) {
        return false
      }

      if (desc.set !== undefined && desc.set !== currentDesc.set) {
        return false
      }
    } else if (!currentDesc.writable) {
      if (desc.writable) {
        return false
      }

      if ('value' in desc) {
        return Object.is(desc.value, currentDesc.value)
      }
    }
  }

  return true
}
