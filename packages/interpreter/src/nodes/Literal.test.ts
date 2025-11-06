import { expect } from 'vitest'
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
// test262/test/built-ins/RegExp/prototype/exec/duplicate-named-indices-groups-properties.js
// acorn bug?
it.fails('/(?:(?<x>a)|(?<y>a)(?<x>b))(?:(?<z>c)|(?<z>d))/d', ({ value }) => {
  expect(value).not.toBeNull()
})
