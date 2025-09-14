import { expect } from 'vitest'
import { it } from '../test-utils'

it('x.a', 1, { globalObject: { x: { a: 1 } } })
it('x.a', 1, {
  globalObject: {
    x: {
      get a() {
        return 1
      },
    },
  },
})
it(
  'x[a]',
  ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('a is not defined'))
  },
  { globalObject: { x: { a: 1 } } },
)
it('x?.a', 1, { globalObject: { x: { a: 1 } } })
it('x?.a', undefined, { globalObject: { x: null } })
it('x?.a?.b?.c', undefined, { globalObject: { x: null } })
it("x['a']", 1, { globalObject: { x: { a: 1 } } })
it("x?.['a']", 1, { globalObject: { x: { a: 1 } } })
it("x?.['a']", undefined, { globalObject: { x: null } })
it("x['a', 'b']", 1, { globalObject: { x: { b: 1 } } })
it("x[a = 0, 'b']", 1, { globalObject: { x: { b: 1 } } })
