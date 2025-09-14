import { it } from '../test-utils'

it('do { 1 } while (false)', 1)
it('var x = 0; do { x += 1 } while (x < 10)', 10)
it('var x = 0; do { x += 1; break; } while (x < 10)', 1)
it('var x = 0; do { x += 1; if (x === 4) { [x]; break; -1 } } while (x < 10)', [4])
