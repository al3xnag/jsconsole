import { expect } from 'vitest'
import { getTestGlobalObject, it } from '../test-utils'

it('x.a', 1, { globalObject: Object.assign(getTestGlobalObject(), { x: { a: 1 } }) })
it('x.a', 1, {
  globalObject: Object.assign(getTestGlobalObject(), {
    x: {
      get a() {
        return 1
      },
    },
  }),
})
it(
  'x[a]',
  ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('a is not defined'))
  },
  { globalObject: Object.assign(getTestGlobalObject(), { x: { a: 1 } }) },
)
it('x?.a', 1, { globalObject: Object.assign(getTestGlobalObject(), { x: { a: 1 } }) })
it('x?.a', undefined, { globalObject: Object.assign(getTestGlobalObject(), { x: null }) })
it('x?.a?.b?.c', undefined, { globalObject: Object.assign(getTestGlobalObject(), { x: null }) })
it("x['a']", 1, { globalObject: Object.assign(getTestGlobalObject(), { x: { a: 1 } }) })
it("x?.['a']", 1, { globalObject: Object.assign(getTestGlobalObject(), { x: { a: 1 } }) })
it("x?.['a']", undefined, { globalObject: Object.assign(getTestGlobalObject(), { x: null }) })
it("x['a', 'b']", 1, { globalObject: Object.assign(getTestGlobalObject(), { x: { b: 1 } }) })
it("x[a = 0, 'b']", 1, { globalObject: Object.assign(getTestGlobalObject(), { x: { b: 1 } }) })
