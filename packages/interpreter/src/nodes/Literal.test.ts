import { it } from '../test-utils'

// string
it('"123"', '123')
it("'123'", '123')
// number
it('123', 123)
it('12.3', 12.3)
it('0xFF', 255)
it('0xFF.toString()', '255')
// bigint
it('123n', 123n)
// boolean
it('true', true)
it('false', false)
it('(true && false) || true', true)
it('true && false', false)
// null
it('null', null)
// regex
it('/abc/', /abc/)
