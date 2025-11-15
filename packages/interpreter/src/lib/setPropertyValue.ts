import { Context, PrivateName } from '../types'
import { syncContext } from './syncContext'
import { assertPropertyWriteSideEffectFree } from './assertPropertyWriteSideEffectFree'
import { getPropertyDescriptor } from './getPropertyDescriptor'
import { toShortStringTag } from './toShortStringTag'
import { isObject, isPropertyKey, toObject, toPropertyKey } from './evaluation-utils'
import { assertNever } from './assert'

const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const isExtensible = Object.isExtensible

// https://tc39.es/ecma262/#sec-putvalue
// 7.3.4 Set (O,P,V,Throw): https://tc39.es/ecma262/#sec-set-o-p-v-throw
// 10.1.9 [[Set]] (P,V,Receiver): https://tc39.es/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-set-p-v-receiver
export function setPropertyValue(
  object: any,
  propertyName: PropertyKey | PrivateName | unknown,
  receiver: unknown,
  value: unknown,
  context: Context,
): void {
  if (object == null) {
    // NOTE: about propertyName and toPropertyKey:
    // In Chrome:
    //   - null['a'] = 1 // TypeError: Cannot set properties of null (setting 'a')
    //   - null[{ toString: 1 }] = 1 // TypeError: Cannot set properties of null
    //   - null.#a = 1 // TypeError: Cannot access private name #a from null
    if (isPropertyKey(propertyName)) {
      throw new context.metadata.globals.TypeError(
        `Cannot set properties of ${object} (setting '${propertyName.toString()}')`,
      )
    } else if (propertyName instanceof PrivateName) {
      throw new context.metadata.globals.TypeError(
        `Cannot access private name #${propertyName.name} from ${object}`,
      )
    } else {
      throw new context.metadata.globals.TypeError(`Cannot set properties of ${object}`)
    }
  }

  receiver = receiver !== undefined ? receiver : object
  object = toObject(object, context)

  // https://tc39.es/ecma262/#sec-privateset
  if (propertyName instanceof PrivateName) {
    const privateElement = context.metadata.privateElements.get(object)?.[propertyName.name]
    if (!privateElement) {
      throw new context.metadata.globals.TypeError(
        `Private member '#${propertyName.name}' is not declared in ${toShortStringTag(object)}`,
      )
    }

    if (privateElement.kind === 'field') {
      privateElement.value = value
    } else if (privateElement.kind === 'method') {
      throw new context.metadata.globals.TypeError(
        `Private method '#${propertyName.name}' is not writable`,
      )
    } else if (privateElement.kind === 'accessor') {
      if (!privateElement.set) {
        throw new context.metadata.globals.TypeError(
          `'#${propertyName.name}' was defined without a setter`,
        )
      }

      Reflect.apply(privateElement.set, object, [value])
    } else {
      assertNever(privateElement.kind, 'Unexpected private element kind')
    }

    return
  }

  const propertyKey = isPropertyKey(propertyName)
    ? propertyName
    : toPropertyKey(propertyName, context)

  if (syncContext?.throwOnSideEffect) {
    assertPropertyWriteSideEffectFree(object, propertyKey, context)
  }

  const checkResult = ordinarySetCheck(object, propertyKey, value)

  if (checkResult !== true) {
    if (!context.strict) {
      return
    }

    if (checkResult === ORDINARY_SET_FAILURE_READ_ONLY) {
      throw new context.metadata.globals.TypeError(
        `Cannot assign to read only property '${propertyKey.toString()}' of ${toShortStringTag(object)}`,
      )
    }

    if (checkResult === ORDINARY_SET_FAILURE_GETTER_ONLY) {
      throw new context.metadata.globals.TypeError(
        `Cannot set property '${propertyKey.toString()}' of ${toShortStringTag(object)} which has only a getter`,
      )
    }

    if (checkResult === ORDINARY_DEFINE_OWN_PROPERTY_FAILURE_NOT_EXTENSIBLE) {
      throw new context.metadata.globals.TypeError(
        `Cannot add property '${propertyKey.toString()}', ${toShortStringTag(object)} is not extensible`,
      )
    }

    throw new context.metadata.globals.TypeError(
      `Cannot set property '${propertyKey.toString()}' of ${toShortStringTag(object)}`,
    )
  }

  // https://tc39.es/ecma262/multipage/indexed-collections.html#sec-properties-of-array-instances-length
  // > Reducing the value of the "length" property has the side-effect of deleting own array elements
  // > whose array index is between the old and new length values. However, non-configurable properties can not be deleted.
  // In this case: in non-strict mode, `arr.length = N` is silently ignored; in strict mode, a TypeError is thrown:
  // "Failed to set the 'length' property on 'Array': Cannot delete property 'N' of [object Array]".
  // This is covered by several tests in test262, e.g. test262/test/built-ins/Array/prototype/some/15.4.4.17-7-b-16.js
  // and test262/test/built-ins/Array/prototype/reduceRight/15.4.4.22-9-b-29.js.

  const success = Reflect.set(object, propertyKey, value, receiver)

  if (!success && context.strict) {
    throw new context.metadata.globals.TypeError(
      `Cannot set property '${propertyKey.toString()}' of ${toShortStringTag(object)}`,
    )
  }
}

const ORDINARY_SET_FAILURE_READ_ONLY = Symbol()
const ORDINARY_SET_FAILURE_GETTER_ONLY = Symbol()
const ORDINARY_DEFINE_OWN_PROPERTY_FAILURE_NOT_EXTENSIBLE = Symbol()

// Checks according to the 10.1.9.2 OrdinarySetWithOwnDescriptor (https://tc39.es/ecma262/#sec-ordinarysetwithowndescriptor),
function ordinarySetCheck(object: any, propertyKey: PropertyKey, value: unknown): boolean | symbol {
  const desc: PropertyDescriptor = getPropertyDescriptor(object, propertyKey) ?? {
    value: undefined,
    writable: true,
    enumerable: true,
    configurable: true,
  }

  if (isDataDescriptor(desc)) {
    if (!desc.writable) {
      return ORDINARY_SET_FAILURE_READ_ONLY
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
    return ORDINARY_SET_FAILURE_GETTER_ONLY
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

// https://tc39.es/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc
function ordinaryDefineOwnPropertyCheck(
  object: any,
  _propertyKey: PropertyKey,
  desc: PropertyDescriptor,
  currentDesc: PropertyDescriptor | undefined,
): boolean | symbol {
  if (currentDesc === undefined) {
    return isExtensible(object) ? true : ORDINARY_DEFINE_OWN_PROPERTY_FAILURE_NOT_EXTENSIBLE
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
