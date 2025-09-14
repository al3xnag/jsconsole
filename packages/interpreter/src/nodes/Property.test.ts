import { it } from '../test-utils'

it('x.y', 1, { globalObject: { x: { y: 1 } } })
it("x['y']", 1, { globalObject: { x: { y: 1 } } })
it('({ a: 1 }).a', 1)
it("({ a: 1 })['a']", 1)
