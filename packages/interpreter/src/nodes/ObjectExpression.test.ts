import { describe, expect } from 'vitest'
import { it, TestWindow } from '../test-utils'

// var a = 1; ({ ...a }) // {}
// var a = null; ({ ...a }) // {}
// var a = undefined; ({ ...a }) // {}
// var a = 'abc'; ({ ...a }) // {0: 'a', 1: 'b', 2: 'c'}
// var a = [1,2,3]; ({ ...a }) // {0: 1, 1: 2, 2: 3}
// var a = { get foo() { return 1 } }; ({ ...a }) // {foo: 1}
// var a = { set foo(x) {} }; ({ ...a }) // {foo: undefined}
// var a = Object.defineProperty({}, 'foo', { value: 1 }); ({ ...a }) // {}
// var a = Object.defineProperty({}, 'foo', { value: 1, enumerable: true }); ({ ...a }) // {foo: 1}
// var a = { [Symbol()]: 1 }; ({ ...a }) // {Symbol(): 1}
// var a = new class { [Symbol()] = 1 }; ({ ...a }) // {Symbol(): 1}
// var a = new class { get x() { return 1 } }; ({ ...a }) // {}
// var a = { get x() { return 1 } }; ({ ...a }) // {x: 1}
it('({ ...1 })', {})
it('({ ...null })', {})
it('({ ...undefined })', {})
it('({ ..."abc" })', { 0: 'a', 1: 'b', 2: 'c' })
it('({ ...[1, 2, 3] })', { 0: 1, 1: 2, 2: 3 })
it('({ ...{ get foo() { return 1 } } })', { foo: 1 })
it('({ ...{ set foo(x) {} } })', { foo: undefined })
it('({ ...Object.defineProperty({}, "foo", { value: 1 }) })', {}, { globalObject: { Object } })
it(
  '({ ...Object.defineProperty({}, "foo", { value: 1, enumerable: true }) })',
  { foo: 1 },
  { globalObject: { Object } },
)
it(
  '({ ...{ [Symbol.for("a")]: 1 } })',
  { [Symbol.for('a')]: 1 },
  { globalObject: { Symbol, Object } },
)
it.todo(
  '({ ...new class { [Symbol.for("a")] = 1 } })',
  { [Symbol.for('a')]: 1 },
  { globalObject: { Symbol } },
)
it.todo('({ ...new class { get x() { return 1 } } })', {})
it('({ ...{ get x() { return 1 } } })', { x: 1 })
it('({ get foo() {}, foo: 1, set foo(x) {}, ...{ get foo() { return 2 } } })', ({ value }) => {
  expect(value).toEqual({ foo: 2 })
  expect(Object.getOwnPropertyDescriptor(value, 'foo')).toEqual({
    value: 2,
    configurable: true,
    enumerable: true,
    writable: true,
  })
})
it(
  'Object.getOwnPropertyDescriptors({ x: 1, [Symbol.for("a")]: 2, get y() {}, get foo() {}, set foo(x) {} })',
  {
    x: {
      value: 1,
      configurable: true,
      enumerable: true,
      writable: true,
    },
    [Symbol.for('a')]: {
      value: 2,
      configurable: true,
      enumerable: true,
      writable: true,
    },
    y: {
      get: expect.any(Function),
      set: undefined,
      configurable: true,
      enumerable: true,
    },
    foo: {
      get: expect.any(Function),
      set: expect.any(Function),
      configurable: true,
      enumerable: true,
    },
  },
)

// NOTE: { __proto__: {} } - sets prototype, but { ['__proto__']: {} } - sets property.
describe('__proto__', () => {
  it('({ __proto__: {x: 1} }).x', 1)
  it('({ x: 1, __proto__: {x: 2} }).x', 1)
  it('({ x: 1, __proto__: {x: 2} }).__proto__', { x: 2 })
  it('({ get __proto__() { return 1 } }).__proto__', 1)
  it('Reflect.ownKeys({ get __proto__() { return 1 } })', ['__proto__'])
  it('Reflect.ownKeys({ set __proto__(v) {} })', ['__proto__'])
  it('Reflect.ownKeys({ __proto__() {} })', ['__proto__'])
  it('Reflect.ownKeys({ __proto__() { return {x: 1} } })', ['__proto__'])
  it('Reflect.ownKeys({ __proto__: () => {} })', [])
  it('Reflect.ownKeys({ __proto__: function() {} })', [])
  it('Reflect.ownKeys({ __proto__: function __proto__() {} })', [])
  it('Reflect.ownKeys({ __proto__: {} })', [])
  it('Reflect.ownKeys({ __proto__: 1 })', [])
  it('Object.getPrototypeOf({ __proto__: { x: 1 } })', { x: 1 })
  it('Object.getPrototypeOf({ __proto__: 1 }) === Object.prototype', true)
  it('Object.getPrototypeOf({ __proto__: null })', null)
  it('Object.getPrototypeOf({ __proto__: undefined }) === Object.prototype', true)
  it('Object.getPrototypeOf({ __proto__: Function }) === Function', true)
  it('typeof Object.getPrototypeOf({ __proto__: () => {} })', 'function')
  it('typeof Object.getPrototypeOf({ __proto__: function () {} })', 'function')
  it('typeof Object.getPrototypeOf({ __proto__: function __proto__() {} })', 'function')
  it('typeof Object.getPrototypeOf({ __proto__() {} })', 'object')
  it('Object.getPrototypeOf({ __proto__: () => {} })', ({ value }) => {
    expect(value).toBeInstanceOf(Function)
  })
  it('Object.getPrototypeOf({ __proto__: function () {} })', ({ value }) => {
    expect(value).toBeInstanceOf(Function)
  })
  it('Object.getPrototypeOf({ __proto__: function __proto__() {} })', ({ value }) => {
    expect(value).toBeInstanceOf(Function)
  })
  it('Object.getPrototypeOf({ __proto__() {} })', ({ value }) => {
    expect(value).not.toBeInstanceOf(Function)
    expect(value).toBe(Object.prototype)
  })
  it('const __proto__ = { x: 1 }; ({ __proto__ })', ({ value }) => {
    expect(value).toEqual({ ['__proto__']: { x: 1 } })
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype)
  })
  it('const __proto__ = { x: 1 }; ({ ...{ __proto__ } })', ({ value }) => {
    expect(value).toEqual({ ['__proto__']: { x: 1 } })
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype)
  })
  it(
    'var __proto__ = { x: 1 }; Object.getPrototypeOf(window)',
    { x: 1 },
    { globalObject: new TestWindow() },
  )
  it("({ ['__proto__']: { x: 1 } })", ({ value }) => {
    expect(value).toEqual({ ['__proto__']: { x: 1 } })
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype)
  })
  it('({ __proto__: { x: 1 } })', ({ value }) => {
    expect(value).toEqual({})
    expect(Object.getPrototypeOf(value)).toEqual({ x: 1 })
  })
  it('({ __proto__: 1 })', ({ value }) => {
    expect(value).toEqual({})
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype)
  })
})
