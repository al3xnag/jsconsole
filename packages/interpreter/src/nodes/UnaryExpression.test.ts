import { describe, expect } from 'vitest'
import { it } from '../test-utils'

it('+1', 1)
it('-1', -1)
it('!true', false)
it('~1', -2)
it('void 1', undefined)

it('+1n', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('Cannot convert a BigInt value to a number'))
})
it('+Object(1n)', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('Cannot convert a BigInt value to a number'))
})

describe('typeof', () => {
  it('typeof 1', 'number')
  it('typeof "1"', 'string')
  it('typeof true', 'boolean')
  it('typeof undefined', 'undefined')
  it('typeof null', 'object')
  it('typeof ({}).toString', 'function')
  it('typeof ({}).a', 'undefined')
  it('let a = 1; typeof a', 'number')
  it('typeof a', 'undefined')
  it('"use strict"; typeof a', 'undefined')
  it('typeof a; let a = 1', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError("Cannot access 'a' before initialization"))
  })
  it('"use strict"; typeof a; let a = 1', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError("Cannot access 'a' before initialization"))
  })
  it('typeof a; var a = 1', 'undefined')
  it('"use strict"; typeof a; var a = 1', 'undefined')
})

describe('delete', () => {
  it('delete 1', true)
  it('"use strict"; delete 1', true)
  it('delete a', true)
  it('"use strict"; delete a', ({ thrown }) => {
    expect(thrown).toThrow(new SyntaxError('Deleting local variable in strict mode'))
  })
  it('delete Math', true)
  it('"use strict"; delete Math', ({ thrown }) => {
    expect(thrown).toThrow(new SyntaxError('Deleting local variable in strict mode'))
  })
  it('delete NaN', false)
  it('delete globalThis.NaN', false)
  it('"use strict"; delete globalThis.NaN', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError("Cannot delete property 'NaN' of #<Object>"))
  })
  it('"use strict"; delete [].length', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError("Cannot delete property 'length' of #<Array>"))
  })
  it('delete foo.NaN', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('foo is not defined'))
  })
  it('"use strict"; delete foo.NaN', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('foo is not defined'))
  })
  it('delete ({}).a', true)
  it('"use strict"; delete ({}).a', true)
  it('delete ({a: 1}).a', true)
  it('"use strict"; delete ({a: 1}).a', true)
})
