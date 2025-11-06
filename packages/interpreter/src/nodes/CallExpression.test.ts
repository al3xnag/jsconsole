import { expect } from 'vitest'
import { it } from '../test-utils'
import { WeakMapMetadata, WeakSetMetadata } from '../lib/Metadata'

it("Number('1')", 1)
it('String(123)', '123')
it('globalThis.String(123)', '123')
it('Math.max(1, ...[2, 3], ...[4, 5])', 5)
it(
  `
  const w = new WeakMap()
  w.set({}, 1)
  w.set({}, 2)
  const obj3 = {}
  w.set(obj3, 3)
  w.delete(obj3)
  w
`,
  ({ value, metadata, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.WeakMap)
    expect(metadata.weakMaps.get(value)).toEqual<WeakMapMetadata>({
      entries: new Map([
        [new globalObject.WeakRef({}), 1],
        [new globalObject.WeakRef({}), 2],
      ]),
    })
  },
  undefined,
  'WeakMap metadata',
)
it(
  `
  const w = new WeakSet()
  w.add({})
  w.add({})
  const obj3 = {}
  w.add(obj3)
  w.delete(obj3)
  w
  `,
  ({ value, metadata, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.WeakSet)
    expect(metadata.weakSets.get(value)).toEqual<WeakSetMetadata>({
      values: new Set([new globalObject.WeakRef({}), new globalObject.WeakRef({})]),
    })
  },
  undefined,
  'WeakSet metadata',
)
it('Map()', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError("Constructor Map requires 'new'"))
})
