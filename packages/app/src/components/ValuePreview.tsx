import { useValueContext } from '@/hooks/useValueContext'
import { getDisplayObjectProperties } from '@/lib/getDisplayObjectProperties'
import { getObjectStringTag } from '@/lib/getObjectStringTag'
import { ObjectTypeInspector } from '@/lib/ObjectTypeInspector'
import { parseFunctionParts } from '@/lib/parseFunctionParts'
import { PropertyContext } from '@/lib/PropertyContext'
import { stringifyString } from '@/lib/stringifyString'
import {
  SYNTHETIC_PROPERTY_KEY_PROTOTYPE,
  SyntheticEmpty,
  SyntheticGetter,
  SyntheticSetter,
  SyntheticUnknown,
} from '@/lib/synthetic'
import { ValueContext } from '@/lib/ValueContextContext'
import { assertNever } from '@jsconsole/interpreter/src/lib/assert'
import { memo, useContext, useInsertionEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { exhaustMicrotaskQueue } from '@/lib/exhaustMicrotaskQueue'
import { isRevived } from '@/lib/revived'

export type ValuePreviewProps<T = unknown> = {
  value: T
  placement: 'top' | 'item' | 'inner'
  renderStringAsPlainText?: boolean
}

type ValuePreviewPropsWithContext<T = unknown> = ValuePreviewProps<T> & { context: ValueContext }

export const ValuePreview = memo(function ValuePreview(props: ValuePreviewProps) {
  return (
    <span>
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <RenderUnknown {...props} />
      </ErrorBoundary>
    </span>
  )
})

function RenderUnknown(props: ValuePreviewProps) {
  const { value, placement, renderStringAsPlainText } = props

  const context = useValueContext()
  const property = useContext(PropertyContext)

  if (value === null || value === undefined) {
    return <span className="token-muted">{String(value)}</span>
  }

  if (typeof value === 'string') {
    if (renderStringAsPlainText) {
      return <span>{value}</span>
    }

    const text = placement === 'item' ? JSON.stringify(value) : stringifyString(value)
    return <span className="token-string">{text}</span>
  }

  if (typeof value === 'number') {
    return <span className="token-number">{String(value)}</span>
  }

  if (typeof value === 'bigint') {
    return <span className="token-bigint">{value}n</span>
  }

  if (typeof value === 'boolean') {
    return <span className="token-atom">{value.toString()}</span>
  }

  if (value === SyntheticUnknown) {
    return <span className="token-muted">{'<unknown>'}</span>
  }

  if (value === SyntheticEmpty) {
    return <span className="token-muted">{'<empty>'}</span>
  }

  if (value === SyntheticGetter) {
    return <span>{'(...)'}</span>
  }

  if (value === SyntheticSetter) {
    return <span>{'<setter>'}</span>
  }

  if (typeof value === 'symbol') {
    return <span className="token-symbol">{value.toString()}</span>
  }

  const o = new ObjectTypeInspector({ value, context })

  if (
    property &&
    (property.name === SYNTHETIC_PROPERTY_KEY_PROTOTYPE || property.name === '__proto__')
  ) {
    return <RenderSyntheticProto value={value} placement={placement} context={context} />
  }

  if (o.isProxy(value)) {
    return <RenderProxy value={value} placement={placement} context={context} />
  }

  if (typeof value === 'function') {
    return <RenderFunction value={value} placement={placement} context={context} />
  }

  if (o.isArray(value)) {
    return <RenderArray value={value} placement={placement} context={context} />
  }

  if (o.isDate(value)) {
    return <span className="token-date">{value.toString()}</span>
  }

  if (o.isRegExp(value)) {
    return <span className="token-regexp">{value.toString()}</span>
  }

  if (o.isError(value)) {
    return <RenderError value={value} placement={placement} />
  }

  if (o.isPromise(value)) {
    return <RenderPromise value={value} placement={placement} context={context} />
  }

  if (o.isNode(value)) {
    // TODO: switch between JS object preview and HTML prettified preview?
    // TODO: console.dir support?
    return <span className="TODO">{value.toString()}</span>
  }

  // TODO: Set, Map

  return <RenderObject value={value} placement={placement} context={context} />
}

function RenderProxy({ value, placement, context }: ValuePreviewPropsWithContext<object>) {
  const target = useMemo(
    () => context.metadata.proxies.get(value)!.target,
    [value, context.metadata.proxies],
  )

  if (placement === 'inner') {
    const targetTag = getObjectStringTag(target) || 'Object'
    return <span>Proxy({targetTag})</span>
  }

  if (placement === 'top') {
    return (
      <span className="italic">
        <span>Proxy(</span>
        <RenderUnknown value={target} placement="item" />
        <span>)</span>
      </span>
    )
  }

  if (placement === 'item') {
    return (
      <>
        <span className="token-meta">Proxy(</span>
        <RenderUnknown value={target} placement="item" />
        <span className="token-meta">)</span>
      </>
    )
  }

  assertNever(placement, 'Unknown placement value')
}

function RenderArray(props: ValuePreviewPropsWithContext<Array<unknown>>) {
  switch (props.placement) {
    case 'top':
    case 'item':
      return <RenderArrayTopOrItem {...props} />
    case 'inner':
      return <RenderArrayInner {...props} />
    default: {
      assertNever(props.placement, 'Unknown placement value')
    }
  }
}

// NOTE:
//   - [1,,3] // (3) [1, empty, 3]
//   - class Arr extends Array { get [9]() { return 9 }; [10] = 10 }; new Arr() // Arr(11) [empty × 10, 10] // { 10: 10, length: 11, 9: (...) }
//   - Object.defineProperty(new Arr(), 15, { value: 15 }) // Arr(16) [empty × 10, 10, empty × 4, 15]
//   - Object.defineProperty(new Arr(), 15, { get() { return 15 } }) // Arr(16) [empty × 10, 10, empty × 4, (...)] // { 10: 10, 15: (...), length: 16, 9: (...) }
//   - Object.defineProperty(new Arr(), 15, { set(v) {} }) // Arr(16) [empty × 10, 10, empty × 5]
function RenderArrayTopOrItem({ value, placement }: ValuePreviewPropsWithContext<Array<unknown>>) {
  const displayTag = useMemo(() => {
    const tag = getObjectStringTag(value)
    return tag && tag !== 'Array' ? tag : null
  }, [value])

  const displayLength = useMemo(() => (value.length > 1 ? `(${value.length})` : null), [value])

  const ownPropDescriptors = useMemo(() => Object.getOwnPropertyDescriptors(value), [value])
  const displayItems = useMemo(() => {
    const maxItems = 30
    return Array.from({ length: Math.min(maxItems, value.length) }, (_, index) => {
      if (!Object.prototype.hasOwnProperty.call(ownPropDescriptors, index)) {
        return SyntheticEmpty
      }

      const descriptor = ownPropDescriptors[index]!
      if (descriptor.get) {
        return SyntheticGetter
      }

      if ('value' in descriptor) {
        return descriptor.value
      }

      return SyntheticEmpty
    })
  }, [ownPropDescriptors, value.length])

  return (
    <span className={placement === 'top' ? 'italic' : ''}>
      <span className="token-meta">
        {displayTag}
        {displayLength}
        {(displayTag || displayLength) && ' '}
      </span>
      {'['}
      {displayItems.map((item, index) => (
        <span key={index}>
          <RenderUnknown value={item} placement="inner" />
          {index < displayItems.length - 1 && ', '}
        </span>
      ))}
      {value.length > displayItems.length && ', …'}
      {']'}
    </span>
  )
}

function RenderArrayInner({ value }: ValuePreviewPropsWithContext<Array<unknown>>) {
  const tag = useMemo(() => getObjectStringTag(value) || 'Array', [value])
  return (
    <span>
      {tag}({value.length})
    </span>
  )
}

function RenderError({ value }: ValuePreviewProps<Error>) {
  const str = useMemo(() => Error.prototype.toString.call(value), [value])
  return <span className="">{str}</span>
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function RenderFunction(props: ValuePreviewPropsWithContext<Function>) {
  switch (props.placement) {
    case 'top': {
      return <RenderFunctionTop {...props} />
    }

    case 'item': {
      return <RenderFunctionItem {...props} />
    }

    case 'inner': {
      return <span className="token-keyword italic">ƒ</span>
    }

    default: {
      assertNever(props.placement, 'Unknown placement value')
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function RenderFunctionTop({ value, context }: ValuePreviewPropsWithContext<Function>) {
  const parts = useMemo(() => parseFunctionParts(value, context), [value, context])
  return (
    <span className="italic">
      {parts.isAsync && <span className="token-keyword">async </span>}
      <span className="token-keyword">
        {parts.isClassConstructor ? 'class' : 'ƒ'}
        {parts.isGenerator && <span className="token-keyword">*</span>}{' '}
      </span>
      {!parts.isArrow && <span className="token-variable">{parts.name}</span>}
      {parts.args !== null && <span className="">({parts.args})</span>}
      {parts.isArrow && <span className=""> =&gt;</span>}
      <span className=""> {parts.body}</span>
    </span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function RenderFunctionItem({ value, context }: ValuePreviewPropsWithContext<Function>) {
  const parts = useMemo(() => parseFunctionParts(value, context), [value, context])
  return (
    <span className="italic">
      {parts.isAsync && <span className="token-keyword">async </span>}
      <span className="token-keyword">
        {parts.isClassConstructor ? 'class' : 'ƒ'}
        {parts.isGenerator && <span className="token-keyword">*</span>}{' '}
      </span>
      {!parts.isArrow && <span className="token-variable">{parts.name}</span>}
      {parts.args !== null && <span className="">({parts.args})</span>}
      {parts.isArrow && <span className=""> =&gt;</span>}
      {parts.isArrow && <span className=""> {'{…}'}</span>}
    </span>
  )
}

function RenderPromise({
  value,
  placement,
  context,
}: ValuePreviewPropsWithContext<Promise<unknown>>) {
  const tag = useMemo(() => getObjectStringTag(value) || 'Promise', [value])

  function getMeta() {
    const { state, result } = context.metadata.promises.get(value) ?? {}
    return { state, result }
  }

  const [{ state, result }, updateMeta] = useState(getMeta)

  useInsertionEffect(() => {
    if ((state === 'pending' || state === undefined) && !isRevived(value)) {
      exhaustMicrotaskQueue().then(() => {
        updateMeta(getMeta)
      })
    }
  }, [state, value])

  if (placement === 'inner') {
    return <span>{tag}</span>
  }

  return (
    <span className={placement === 'top' ? 'italic' : ''}>
      {tag}
      {' {'}
      <span className="token-meta">{`<${state ?? 'unknown'}>`}</span>
      {(state === 'fulfilled' || state === 'rejected') && (
        <>
          {': '}
          <RenderUnknown value={result} placement="inner" />
        </>
      )}
      {'}'}
    </span>
  )
}

// placement: 'top'
// placement: 'item'
// - {} // {}
// - Object.create(null) // {}
// - {x: 1, y: 2} // {x: 1, y: 2}
// - {x: 1, y: 2, z: 3, a: 4, b: 5, c: 6} // {x: 1, y: 2, z: 3, a: 4, b: 5, …}
// - Object.assign(new class Foo {}, {}) // Foo {}
// - Object.assign(new class Foo {}, { x: 1, y: 2 }) // Foo {x: 1, y: 2}
// - Object.assign(new class Foo {}, {x: 1, y: 2, z: 3, a: 4, b: 5, c: 6}) // Foo {x: 1, y: 2, z: 3, a: 4, b: 5, …}
// - Object.assign(new class Foo {}, {x() {}, y: 2, z: 3, a: 4, b: 5, c: 6}) // Foo {y: 2, z: 3, a: 4, b: 5, x: ƒ, …}
// - new class Foo { x = 1; y = 2 } // Foo {x: 1, y: 2}
// - new class Bar extends (class Foo { x = 1; y = 2 }) {} // Bar {x: 1, y: 2}
// - new class Bar extends (class Foo { x = 1; y = 2 }) { z = 3 } // Bar {x: 1, y: 2, z: 3}
// - new class Bar extends (class Foo { x = 1; y() {} }) { z() {} } // Bar {x: 1}
// - Object.assign(new class Foo {}, { [Symbol()]: 1 }) // Foo {Symbol(): 1}
// - Object.assign(new class Foo {}, { a: 1, [Symbol()]: 2, b: 3 }) // Foo {a: 1, b: 3, Symbol(): 2}
// - Object.assign(new class Foo {}, { a: 1, fn() {}, [Symbol()]: 2, b: 3 }) // Foo {a: 1, b: 3, Symbol(): 2, fn: ƒ}
// - Object.assign(new class Foo {}, { a: 1, z: 1, x: 2, [Symbol()]: 2, fn() {}, b: 3 }) // Foo {a: 1, z: 1, x: 2, b: 3, fn: ƒ, …}
// placement: 'inner'
// - {} // {…}
// - Object.create(null) // {…}
// - {a: 1} // {…}
// - new class Bar {} // Bar
function RenderObject(props: ValuePreviewPropsWithContext<object>) {
  switch (props.placement) {
    case 'top':
    case 'item':
      return <RenderObjectTopOrItem {...props} />
    case 'inner':
      return <RenderObjectInner {...props} />
    default: {
      assertNever(props.placement, 'Unknown placement value')
    }
  }
}

function RenderObjectTopOrItem({
  value,
  context,
  placement,
}: ValuePreviewPropsWithContext<object>) {
  const tag = useMemo(() => getObjectStringTag(value), [value])

  function getDisplayProps() {
    // TODO: sorting
    const props = getDisplayObjectProperties(value, context, { includeSynthetic: false }).filter(
      // Filter out getters and setters.
      (prop) => 'value' in prop.descriptor,
    )

    const maxProps = 5
    return Object.assign(props.slice(0, maxProps), {
      hasMore: props.length > maxProps,
    })
  }

  const [displayProps, updateDisplayProps] = useState(getDisplayProps)

  useInsertionEffect(() => {
    if (!isRevived(value)) {
      exhaustMicrotaskQueue().then(() => {
        updateDisplayProps(getDisplayProps)
      })
    }
  }, [value])

  return (
    <span className={placement === 'top' ? 'italic' : ''}>
      {tag && tag !== 'Object' && <span>{tag} </span>}
      {'{'}
      {displayProps.map((prop, index) => (
        <span key={String(prop.name)}>
          <span className={placement === 'top' ? 'token-meta' : ''}>{String(prop.name)}</span>
          {': '}
          <RenderUnknown value={prop.descriptor.value} placement="inner" />
          {index < displayProps.length - 1 && ', '}
        </span>
      ))}
      {displayProps.hasMore && ', …'}
      {'}'}
    </span>
  )
}

function RenderObjectInner({ value }: ValuePreviewPropsWithContext<object>) {
  const tag = useMemo(() => getObjectStringTag(value), [value])
  return tag && tag !== 'Object' ? <span>{tag}</span> : <span>{'{…}'}</span>
}

function RenderSyntheticProto({ value, context }: ValuePreviewPropsWithContext<object>) {
  const tag = useMemo(() => {
    const proxyMetadata = context.metadata.proxies.get(value)
    const targetTag = getObjectStringTag(proxyMetadata ? proxyMetadata.target : value) || 'Object'
    return proxyMetadata ? `Proxy(${targetTag})` : targetTag
  }, [value, context.metadata.proxies])

  return <span>{tag}</span>
}
