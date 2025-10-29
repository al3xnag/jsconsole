import { expect, test } from 'vitest'
import { getBasicGlobalObject, it } from '../test-utils'
import { evaluate } from '..'

it('(1)', 1)
it('(1).toString()', '1')
it('Math.min(1, 2, 3)', 1)
it('Math.min.name', 'min')
it('Math.min(1, 2, 3).toString()', '1')
it("Math['min'](1, 2, 3)", 1)
it('Math[minProp](1, 2, 3)', 1, {
  globalObject: Object.assign(getBasicGlobalObject(), { minProp: 'min' }),
})
it("'foo'.slice(1).toUpperCase()", 'OO')
it('Math.max(1,2,3); 456;', 456)

test('syntax error', () => {
  expect(() => evaluate('Math.min(')).toThrow(SyntaxError)
})
