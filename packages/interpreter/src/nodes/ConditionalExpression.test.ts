import { it } from '../test-utils'

it('1 ? 2 : 3', 2)
it('0 ? 1 : 2', 2)
it('await 1 ? await 2 : await 3', 2)
it('await Promise.resolve(1) ? await Promise.resolve(2) : await Promise.resolve(3)', 2)
it('await 1 ? ((await 2), 3) : ((await 4), 5)', 3)
