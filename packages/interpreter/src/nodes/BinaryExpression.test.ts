import { expect } from 'vitest'
import { it } from '../test-utils'

it('5 + 5', 10)
it('5 - 5', 0)
it('5 * 5', 25)
it('5 / 5', 1)
it('5 % 5', 0)
it('5 ** 5', 3125)
it('5 == 5', true)
it('5 === 5', true)
it('5 != 5', false)
it('5 !== 5', false)
it('5 < 5', false)
it('5 <= 5', true)
it('5 > 5', false)
it('5 >= 5', true)

it('1 in {}', false)
it('1 in ["a", "b"]', true)
it('"a" in { a: 1 }', true)
it('"b" in { a: 1 }', false)
it('({ toString() { return "a" } }) in {a: 1}', true)
it('"a" in null', ({ thrown }) => {
  // Chrome: "Cannot use 'in' operator to search for 'a' in null"
  expect(thrown).toThrow(
    new TypeError("Cannot use 'in' operator to search for '#<String>' in null"),
  )
})
it('({ toString: 1 }) in null', ({ thrown }) => {
  // Chrome: "Cannot use 'in' operator to search for '[object Object]' in null"
  expect(thrown).toThrow(
    new TypeError("Cannot use 'in' operator to search for '#<Object>' in null"),
  )
})
it('({}) in null', ({ thrown }) => {
  // Chrome: Cannot use 'in' operator to search for '#<Object>' in null
  expect(thrown).toThrow(
    new TypeError("Cannot use 'in' operator to search for '#<Object>' in null"),
  )
})

it('({}) instanceof Object', true)
it('({}) instanceof Array', false)
it('({}) instanceof null', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError("Right-hand side of 'instanceof' is not an object"))
})
it('({}) instanceof {}', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError("Right-hand side of 'instanceof' is not callable"))
})
it('function fn() {}; fn.prototype = null; ({}) instanceof fn', ({ thrown }) => {
  expect(thrown).toThrow(
    new TypeError("Function has non-object prototype 'null' in instanceof check"),
  )
})
it(`
    function fn() {}; 
    fn.prototype = null; 
    Object.defineProperty(fn, Symbol.hasInstance, { value: null });
    ({}) instanceof fn
  `, ({ thrown }) => {
  expect(thrown).toThrow(
    new TypeError("Function has non-object prototype 'null' in instanceof check"),
  )
})
