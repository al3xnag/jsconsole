import { expect } from 'vitest'
import { it } from '../test-utils'

it('class A {}', undefined)
it('class A extends Array {}', undefined)
it('class A { fn() {} }', undefined)
it('class A {}; A.name', 'A')
it('class A {}; A.prototype.constructor.name', 'A')
it('class A {}; A.length', 0)
it('class A { constructor(a) {} }; A.length', 1)
it('class A {}; A.toString()', 'class A {}')
it('A; class A {}', ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError("Cannot access 'A' before initialization"))
})
it('A; { class A {} }', ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError('A is not defined'))
})
it('class A { constructor() { return Number } }; new A === new A', true)
