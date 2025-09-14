import { it } from '../test-utils'

it(';', undefined)
it(';;;;', undefined)
it('123;', 123)
it('123;;', 123)
it(';;123', 123)
it(';123;', 123)
it('function asd() { return 123 }; asd();', 123)
