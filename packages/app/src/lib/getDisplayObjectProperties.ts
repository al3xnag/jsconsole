import { Property } from '@/types'
import { ValueContext } from './ValueContextContext'
import { ObjectTypeInspector } from './ObjectTypeInspector'
import { isRevivedUnknownObject } from './revived'
import { getAllObjectProperties } from './getAllObjectProperties'
import {
  isSyntheticValue,
  SYNTHETIC_PROPERTY_KEY_BOUND_ARGS,
  SYNTHETIC_PROPERTY_KEY_BOUND_THIS,
  SYNTHETIC_PROPERTY_KEY_ENTRIES,
  SYNTHETIC_PROPERTY_KEY_HANDLER,
  SYNTHETIC_PROPERTY_KEY_PRIMITIVE_VALUE,
  SYNTHETIC_PROPERTY_KEY_PROMISE_RESULT,
  SYNTHETIC_PROPERTY_KEY_PROMISE_STATE,
  SYNTHETIC_PROPERTY_KEY_PROTOTYPE,
  SYNTHETIC_PROPERTY_KEY_TARGET,
  SYNTHETIC_PROPERTY_KEY_TARGET_FUNCTION,
  SYNTHETIC_PROPERTY_KEY_WEAK_REF_TARGET,
  SyntheticEntries,
  SyntheticKeyValuePair,
  SyntheticUnknown,
} from '@/lib/synthetic'
import { SyntheticProperty } from '@/types'

type DisplayObjectPropertiesOptions = {
  /**
   * Whether to include synthetic properties.
   * @defaultValue `true`
   */
  includeSynthetic?: boolean
}

// TODO: sorting
export function getDisplayObjectProperties(
  value: object,
  context: ValueContext,
  options?: DisplayObjectPropertiesOptions,
): Property[] {
  const o = new ObjectTypeInspector({ value, context })
  const props = getProps(value, o)
  const syntheticProps =
    options?.includeSynthetic !== false ? getSyntheticProps(value, context, o) : []
  return [...props, ...syntheticProps]
}

function getProps(value: object, o: ObjectTypeInspector): Property[] {
  if (isRevivedUnknownObject(value)) {
    return []
  }

  if (value instanceof SyntheticEntries) {
    // Do not display "length" and prototype.
    return value.map((x, i) => ({
      name: i,
      descriptor: { value: x },
      isOwn: true,
    }))
  }

  if (o.isProxy(value)) {
    return []
  }

  return getAllObjectProperties(value).filter((property) => {
    return property.isOwn || property.descriptor.enumerable === true
  })
}

function getSyntheticProps(
  value: object,
  context: ValueContext,
  o: ObjectTypeInspector,
): SyntheticProperty[] {
  const props: SyntheticProperty[] = []

  switch (true) {
    case typeof value === 'function': {
      // TODO: [[FunctionLocation]], [[Scopes]]
      const meta = context.metadata.functions.get(value)
      if (meta?.bound) {
        props.push({
          name: SYNTHETIC_PROPERTY_KEY_TARGET_FUNCTION,
          descriptor: {
            value: meta.targetFunction !== undefined ? meta.targetFunction : SyntheticUnknown,
          },
          isSynthetic: true,
        })

        props.push({
          name: SYNTHETIC_PROPERTY_KEY_BOUND_THIS,
          descriptor: {
            value: 'boundThis' in meta ? meta.boundThis : SyntheticUnknown,
          },
          isSynthetic: true,
        })

        props.push({
          name: SYNTHETIC_PROPERTY_KEY_BOUND_ARGS,
          descriptor: {
            value: meta.boundArgs !== undefined ? meta.boundArgs : SyntheticUnknown,
          },
          isSynthetic: true,
        })
      }

      break
    }

    case o.isMap(value): {
      props.push({
        name: SYNTHETIC_PROPERTY_KEY_ENTRIES,
        descriptor: {
          value: SyntheticEntries.from(value).map(
            ([key, value]) => new SyntheticKeyValuePair(key, value),
          ),
        },
        isSynthetic: true,
      })
      break
    }

    case o.isSet(value): {
      props.push({
        name: SYNTHETIC_PROPERTY_KEY_ENTRIES,
        descriptor: {
          value: SyntheticEntries.from(value),
        },
        isSynthetic: true,
      })
      break
    }

    case o.isPromise(value): {
      const meta = context.metadata.promises.get(value)
      const state = meta?.state
      const result = meta?.result
      const isUnknown = state === undefined

      props.push({
        name: SYNTHETIC_PROPERTY_KEY_PROMISE_STATE,
        descriptor: { value: isUnknown ? SyntheticUnknown : state },
        isSynthetic: true,
      })

      props.push({
        name: SYNTHETIC_PROPERTY_KEY_PROMISE_RESULT,
        descriptor: { value: isUnknown ? SyntheticUnknown : result },
        isSynthetic: true,
      })

      break
    }

    case o.isWeakMap(value): {
      const meta = context.metadata.weakMaps.get(value)

      props.push({
        name: SYNTHETIC_PROPERTY_KEY_ENTRIES,
        descriptor: {
          value: meta
            ? SyntheticEntries.from(meta.entries)
                .map<SyntheticKeyValuePair | undefined>(([key, value]) => {
                  if (key instanceof context.globals.WeakRef) {
                    const target = key.deref()
                    if (target === undefined) {
                      return undefined
                    }

                    key = target
                  }

                  if (value instanceof context.globals.WeakRef) {
                    const target = value.deref()
                    if (target === undefined) {
                      return undefined
                    }

                    value = target
                  }

                  return new SyntheticKeyValuePair(key, value)
                })
                .filter((x) => x !== undefined)
            : SyntheticUnknown,
        },
        isSynthetic: true,
      })
      break
    }

    case o.isWeakSet(value): {
      const meta = context.metadata.weakSets.get(value)

      props.push({
        name: SYNTHETIC_PROPERTY_KEY_ENTRIES,
        descriptor: {
          value: meta
            ? SyntheticEntries.from(meta.values)
                .map<WeakKey | undefined>((value) => {
                  if (value instanceof context.globals.WeakRef) {
                    const target = value.deref()
                    if (target === undefined) {
                      return undefined
                    }

                    value = target
                  }

                  return value
                })
                .filter((x) => x !== undefined)
            : SyntheticUnknown,
        },
        isSynthetic: true,
      })
      break
    }

    case o.isWeakRef(value): {
      props.push({
        name: SYNTHETIC_PROPERTY_KEY_WEAK_REF_TARGET,
        descriptor: { value: value.deref() },
        isSynthetic: true,
      })
      break
    }

    case o.isStringObject(value):
    case o.isNumberObject(value):
    case o.isBooleanObject(value):
    case o.isBigIntObject(value):
    case o.isSymbolObject(value): {
      props.push({
        name: SYNTHETIC_PROPERTY_KEY_PRIMITIVE_VALUE,
        descriptor: { value: value.valueOf() },
        isSynthetic: true,
      })
      break
    }

    case o.isProxy(value): {
      // TODO: [[IsRevoked]]
      const meta = context.metadata.proxies.get(value)

      props.push({
        name: SYNTHETIC_PROPERTY_KEY_HANDLER,
        descriptor: { value: meta ? meta.handler : SyntheticUnknown },
        isSynthetic: true,
      })

      props.push({
        name: SYNTHETIC_PROPERTY_KEY_TARGET,
        descriptor: { value: meta ? meta.target : SyntheticUnknown },
        isSynthetic: true,
      })

      break
    }
  }

  const prototype = getPrototype(value, o)
  if (prototype) {
    props.push({
      name: SYNTHETIC_PROPERTY_KEY_PROTOTYPE,
      descriptor: { value: prototype },
      isSynthetic: true,
    })
  }

  return props
}

function getPrototype(value: object, o: ObjectTypeInspector): object | null {
  if (isSyntheticValue(value) || o.isProxy(value)) {
    return null
  }

  return Object.getPrototypeOf(value)
}
