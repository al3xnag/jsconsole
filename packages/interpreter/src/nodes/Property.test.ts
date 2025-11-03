import { getTestGlobalObject, it } from '../test-utils'

it('x.y', 1, { globalObject: Object.assign(getTestGlobalObject(), { x: { y: 1 } }) })
it("x['y']", 1, { globalObject: Object.assign(getTestGlobalObject(), { x: { y: 1 } }) })
it('({ a: 1 }).a', 1)
it("({ a: 1 })['a']", 1)
