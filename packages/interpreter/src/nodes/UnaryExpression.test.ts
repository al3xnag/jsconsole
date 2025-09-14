import { describe, expect } from 'vitest'
import { it } from '../test-utils'

it('+1', 1)
it('-1', -1)
it('!true', false)
it('~1', -2)
it('void 1', undefined)

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
    expect(thrown).toThrow(SyntaxError)
    expect(thrown).toThrow('Deleting local variable in strict mode')
  })
  it('delete Math', true, {
    globalObject: Object.defineProperty({}, 'Math', {
      value: Math,
      writable: true,
      enumerable: false,
      configurable: true,
    }),
  })
  it(
    '"use strict"; delete Math',
    ({ thrown }) => {
      expect(thrown).toThrow(SyntaxError)
      expect(thrown).toThrow('Deleting local variable in strict mode')
    },
    {
      globalObject: Object.defineProperty({}, 'Math', {
        value: Math,
        writable: true,
        enumerable: false,
        configurable: true,
      }),
    },
  )
  it('delete NaN', false, {
    globalObject: Object.defineProperty({}, 'NaN', {
      value: NaN,
      writable: false,
      enumerable: false,
      configurable: false,
    }),
  })
  it('delete window.NaN', false, {
    globalObject: (() => {
      const obj = Object.defineProperty({}, 'NaN', {
        value: NaN,
        writable: false,
        enumerable: false,
        configurable: false,
      })
      return Object.assign(obj, { window: obj })
    })(),
  })
  it(
    '"use strict"; delete window.NaN',
    ({ thrown }) => {
      expect(thrown).toThrow(new TypeError("Cannot delete property 'NaN' of #<Object>"))
    },
    {
      globalObject: (() => {
        const obj = Object.defineProperty({}, 'NaN', {
          value: NaN,
          writable: false,
          enumerable: false,
          configurable: false,
        })
        return Object.assign(obj, { window: obj })
      })(),
    },
  )
  it('delete ({}).a', true)
  it('"use strict"; delete ({}).a', true)
  it('delete ({a: 1}).a', true)
  it('"use strict"; delete ({a: 1}).a', true)
})
