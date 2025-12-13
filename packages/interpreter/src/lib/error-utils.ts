import { findGetter } from './findGetter'
import { findSetter } from './findSetter'
import { getPropertyDescriptor } from './getPropertyDescriptor'
import { Metadata } from './Metadata'

export function getErrorNameUnsafe(obj: object): string {
  const nameDescriptor = getPropertyDescriptor(obj, 'name')
  const name =
    typeof nameDescriptor?.value === 'string' && nameDescriptor.value !== ''
      ? nameDescriptor.value
      : obj.constructor.name
  return name
}

export function getErrorMessageUnsafe(obj: object): string {
  const messageDescriptor = Object.getOwnPropertyDescriptor(obj, 'message')
  const message = typeof messageDescriptor?.value === 'string' ? messageDescriptor.value : ''
  return message
}

export function getErrorStackUnsafe(obj: object, metadata: Metadata): string | null {
  const errorStackGetter = findGetter(obj, 'stack')
  if (
    typeof errorStackGetter === 'function' &&
    errorStackGetter === metadata.globals.ErrorStackGetter
  ) {
    return Reflect.apply(errorStackGetter, obj, [])
  }

  return null
}

export function getErrorStackSetterUnsafe(
  obj: object,
  metadata: Metadata,
): ((s: string) => void) | null {
  const errorStackSetter = findSetter(obj, 'stack')
  if (
    typeof errorStackSetter === 'function' &&
    errorStackSetter === metadata.globals.ErrorStackSetter
  ) {
    return errorStackSetter
  }

  return null
}
