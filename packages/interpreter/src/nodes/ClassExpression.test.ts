import { expect } from 'vitest'
import { it } from '../test-utils'

it('new (class {})', {})
it('new (class extends Array {})', [])
it('(new (class extends Array {})).push === Array.prototype.push', true)
it('Array.isArray(new class extends Array {})', true)
it('new (class extends Array {})(1, 2, 3)', [1, 2, 3])
it('new (class { constructor() {} })', {})
it('new (class { constructor() { this.a = 1 } })', { a: 1 })
it('new (class { constructor() { return [1,2,3] } })', [1, 2, 3])
it('new (class { constructor() { return null } })', {})
it('new (class { constructor() { return undefined } })', {})
it('new (class { constructor() { return 1 } })', {})
it('new (class { constructor() { return new Number(1) } })', new Number(1))
it('new (class { constructor() { return {a:1} } })', { a: 1 })
it('new (class { constructor() { return this } })', {})
it('new (class { constructor() { this.a = 1; return this } })', { a: 1 })
it('new (class { constructor() { this.a = 1; return 1 } })', { a: 1 })
it('new (class { constructor() { this.a = 1; return {a:2} } })', { a: 2 })
it('new (class extends null { constructor() { return {a:1} } })', { a: 1 })
it('new (class extends Array { constructor() { return {a:1} } })', { a: 1 })
it('new (class extends Array { constructor() { return () => {} } }) instanceof Function', true)
it('new (class extends null { constructor() { return null } })', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('Derived constructors may only return object or undefined'))
})
it('new (class extends null { constructor() { return 1 } })', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('Derived constructors may only return object or undefined'))
})
it('new (class extends Array { constructor() { return 1 } })', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('Derived constructors may only return object or undefined'))
})
it('new (class extends null { constructor() { return undefined } })', ({ thrown }) => {
  expect(thrown).toThrow(
    new ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    ),
  )
})
it('new (class extends Array { constructor() { return undefined } })', ({ thrown }) => {
  expect(thrown).toThrow(
    new ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    ),
  )
})
it('new (class extends Array { constructor() { this; } })', ({ thrown }) => {
  expect(thrown).toThrow(
    new ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    ),
  )
})
it('new (class extends Array { constructor() { this.a = 1; } })', ({ thrown }) => {
  expect(thrown).toThrow(
    new ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    ),
  )
})
it('new (class extends Array { constructor() { this.a = 1; return {} } })', ({ thrown }) => {
  expect(thrown).toThrow(
    new ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    ),
  )
})
it('new (class extends Array { constructor() { return this } })', ({ thrown }) => {
  expect(thrown).toThrow(
    new ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    ),
  )
})
it('new (class extends Array { constructor() {} })', ({ thrown }) => {
  expect(thrown).toThrow(
    new ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    ),
  )
})
it('new (class { constructor() { /* strict mode here */ false.false = 0 } })', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError("Cannot set properties of #<Boolean> (setting 'false')"))
})
it('new (class extends Array { constructor() { super() } })', [])
it('new (class extends Array { constructor() { super(1, 2, 3) } })', [1, 2, 3])
it('new (class extends Array { constructor() { super(); this.push(1) } })', [1])
it('new (class extends Array { constructor() { super(); super() } })', ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError('Super constructor may only be called once'))
})
it(
  'new (class extends Array { constructor() { const fn = (...args) => { super(...args) }; fn(1, 2, 3) } })',
  [1, 2, 3],
)
it('new (class extends Array { constructor() { super(); super.push(1) } })', [1])
it('new (class extends Array { constructor() { super.push(1) } })', ({ thrown }) => {
  expect(thrown).toThrow(
    new ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    ),
  )
})
it(
  'new (class extends Array { constructor() { super(); super.push(2); return [super.length, this.length] } })',
  [0, 1],
)
it('new (class { static a })', {})
it('new (class { static a = 1 })', {})
it('(new (class { static a = 1 })).constructor.a', 1)
it('(class { static a = 1 }).a', 1)
it('(class extends Array { static a = super.prototype.length }).a', 0)
it('(class extends Array { static a = super.length }).a', 1) // `Array.length` is 1 (function length)
it('(class extends Array { static a = this.length }).a', 0)
it('(class extends Array { static a = this }).a.a.a instanceof Function', true)
it('(class extends Array { static a = this.a }).a', undefined)
it('(class extends Array { static a = new.target }).a', undefined)

it('(new (class extends Array { a = super.length })).a', 0)
it('(new (class extends Array { a = this.length })).a', 0)
it('new (class { a = 1 })', { a: 1 })
it('(new (class { fn() { return 1 } })).fn()', 1)
it('(new (class { a = this })).a.a.a instanceof Object', true)
it('(new (class extends Object { a = this })).a.a.a instanceof Object', true)
it('(new (class extends Number { a = this })).a.a.a instanceof Number', true)
it('(new (class extends Array { a = this })).a.a.a instanceof Array', true)
it('(new (class extends Array { a = new.target })).a', undefined)
it('Reflect.ownKeys(new (class extends Array { constructor() { super(); super.a = 1; } }))', [
  'length',
  'a',
])
it('Reflect.ownKeys(new (class extends Array { static { super.a = 1; } }))', ['length'])
it(
  'Reflect.ownKeys((new (class extends Array { static { super.a = 1; } })).constructor).includes("a")',
  true,
)
it('Reflect.ownKeys(class extends Array { static { super.a = 1; } }).includes("a")', true)

it('new (class extends Array { constructor() { super(); this.push(1) } })', [1])
it('(new (class extends Array { a = 1; constructor() { super(); this.a++; } })).a', 2)
it('let j; (class extends Array { static { j = super.length } }); j', 1)
it('(new (class { #a = 1; get b() { return this.#a + 1 } })).b', 2)
it('(new (class { #a = 1; b() { return this.#a + 1 } })).b()', 2)
it('(new (class { #a = 1; b() { this.#a += 1; return this.#a } })).b()', 2)
it('(new (class { #a; b() { this.#a = 2; return this.#a } })).b()', 2)
it('class A { #a() {} }; [new A, new A]', ({ value, metadata, globalObject }) => {
  const [i1, i2] = value
  const i1PrivateElements = metadata.privateElements.get(i1)
  const i2PrivateElements = metadata.privateElements.get(i2)

  expect(i1PrivateElements).toBeDefined()
  expect(i2PrivateElements).toBeDefined()
  expect(i1PrivateElements!.a.value).toBeInstanceOf(globalObject.Function)
  expect(i2PrivateElements!.a.value).toBeInstanceOf(globalObject.Function)

  // https://tc39.es/ecma262/#sec-privatemethodoraccessoradd
  // > NOTE: The values for private methods and accessors are shared across instances.
  // > This operation does not create a new copy of the method or accessor.
  expect(i1PrivateElements!.a.value).toBe(i2PrivateElements!.a.value)
})
it('(new class { #a() {}; constructor() { this.#a = 2 } })', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError("Private method '#a' is not writable"))
})
