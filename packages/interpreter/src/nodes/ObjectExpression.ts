import { ObjectExpression, Property, SpreadElement } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { assertNever } from '../lib/assert'
import { evaluateProperty } from './Property'
import { evaluateSpreadElement } from './SpreadElement'
import { syncContext } from '../lib/syncContext'

const defineProperty = Object.defineProperty

export function* evaluateObjectExpression(
  node: ObjectExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  let prototype: object | null = context.metadata.globals.ObjectPrototype

  const propertyDescriptors: PropertyDescriptorMap = {}

  function addProperty(key: unknown, value: unknown, property: Property | SpreadElement) {
    if (
      key === '__proto__' &&
      property.type === 'Property' &&
      property.kind === 'init' &&
      !property.computed &&
      !property.method &&
      !property.shorthand
    ) {
      // `null` is taken into account.
      if (typeof value === 'object' || typeof value === 'function') {
        prototype = value
      }
      return
    }

    const kind = property.type === 'Property' ? property.kind : 'init'
    const descriptor: PropertyDescriptor = {
      enumerable: true,
      configurable: true,
      value: {
        ...(kind === 'init' && { value, writable: true }),
        ...(kind === 'get' && {
          get: value as () => any,
          set: propertyDescriptors[key as PropertyKey]?.set,
        }),
        ...(kind === 'set' && {
          set: value as (v: any) => void,
          get: propertyDescriptors[key as PropertyKey]?.get,
        }),
        enumerable: true,
        configurable: true,
      },
    }

    defineProperty(propertyDescriptors, key as PropertyKey, descriptor)
  }

  for (const property of node.properties) {
    property.parent = node

    if (property.type === 'SpreadElement') {
      const { value } = yield* evaluateSpreadElement(property, scope, context)
      const rest = { ...value }
      Reflect.ownKeys(rest).forEach((key) => {
        addProperty(key, rest[key], property)
      })
    } else if (property.type === 'Property') {
      const { key, value } = yield* evaluateProperty(property, scope, context)
      addProperty(key, value, property)
    } else {
      assertNever(property, 'Unhandled property type')
    }
  }

  const object = context.metadata.globals.ObjectCreate(prototype, propertyDescriptors)
  syncContext?.tmpRefs.add(object)

  return { value: object }
}
