import { it } from '../test-utils'

it('[1, 2, 3].map(x => x * 2)', [2, 4, 6])
it('[1, 2, 3].map(x => { return x * 2 })', [2, 4, 6])
it('[1, 2, 3].map(x => { x * 2 })', [undefined, undefined, undefined])
it('const sum = (a, b) => a + b; sum(1, 2)', 3)
it('const sum = (a, b) => a + b; sum.name', 'sum')
it('const sum = (a, b) => a + b; sum.length', 2)
