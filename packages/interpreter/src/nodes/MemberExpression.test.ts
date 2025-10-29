import { expect } from 'vitest'
import { getBasicGlobalObject, it } from '../test-utils'

it('x.a', 1, { globalObject: Object.assign(getBasicGlobalObject(), { x: { a: 1 } }) })
it('x.a', 1, {
  globalObject: Object.assign(getBasicGlobalObject(), {
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
  { globalObject: Object.assign(getBasicGlobalObject(), { x: { a: 1 } }) },
)
it('x?.a', 1, { globalObject: Object.assign(getBasicGlobalObject(), { x: { a: 1 } }) })
it('x?.a', undefined, { globalObject: Object.assign(getBasicGlobalObject(), { x: null }) })
it('x?.a?.b?.c', undefined, { globalObject: Object.assign(getBasicGlobalObject(), { x: null }) })
it("x['a']", 1, { globalObject: Object.assign(getBasicGlobalObject(), { x: { a: 1 } }) })
it("x?.['a']", 1, { globalObject: Object.assign(getBasicGlobalObject(), { x: { a: 1 } }) })
it("x?.['a']", undefined, { globalObject: Object.assign(getBasicGlobalObject(), { x: null }) })
it("x['a', 'b']", 1, { globalObject: Object.assign(getBasicGlobalObject(), { x: { b: 1 } }) })
it("x[a = 0, 'b']", 1, { globalObject: Object.assign(getBasicGlobalObject(), { x: { b: 1 } }) })
