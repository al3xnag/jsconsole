import { expect } from 'vitest'
import { it, ExpectToThrowPossibleSideEffectError } from '../test-utils'

it('var x', undefined)
it('var x = 1', undefined)
it('var x = 1; x', 1)
it('x = 1', ExpectToThrowPossibleSideEffectError, { throwOnSideEffect: true })
it('const x;', (x) => expect(x.thrown).toThrow(SyntaxError))
it('const x = 1;', undefined)
it('const x = 1; x', 1)
it('let x = 1;', undefined)
it('let x = 1; x', 1)
it('let x = 1', ExpectToThrowPossibleSideEffectError, { throwOnSideEffect: true })
it('let [x] = [1];', undefined)
it('let [x] = [1]; x', 1)
it('let {x} = {x: 1}', undefined)
it('let {x} = {x: 1}; x', 1)
it('let {x = 1} = {}; x', 1)
it('let [x = 1] = []; x', 1)
it('let [x = 1] = [2]; x', 2)
it('let {x = 1} = {x: 2}; x', 2)
it('let x, y = 1;', undefined)
it('let x, y = 1; y', 1)
it('x = 1; let x; x', (x) =>
  expect(() => x.value).toThrow(new ReferenceError("Cannot access 'x' before initialization")))
it('x; let x; x', (x) =>
  expect(() => x.value).toThrow(new ReferenceError("Cannot access 'x' before initialization")))
it('globalThis.x = 1; var x = 2; x', 2)
it('x = 1; var x = 2; x', 2)
it('x = 1; var x; x', 1)
it('var x = 1; var x = 2; x', 2)
it('function fn() { return 1 }; let [x = fn()] = []; x', 1)
it('function fn() { throw 0 }; let [x = fn()] = [1]; x', 1)
it('function fn() { return 1 }; let [x = fn()] = [undefined]; x', 1)
it('function fn() { throw 0 }; let [x = fn()] = [null]; x', null)

it('undefined = 1; undefined', undefined)
it('"use strict"; undefined = 1; undefined', ({ thrown }) => {
  expect(thrown).toThrow(
    new TypeError("Cannot assign to read only property 'undefined' of #<Object>"),
  )
})
it('var undefined = 1; undefined', undefined)
it('"use strict"; var undefined = 1; undefined', ({ thrown }) => {
  expect(thrown).toThrow(
    new TypeError("Cannot assign to read only property 'undefined' of #<Object>"),
  )
})
it('let undefined = 1', ({ thrown }) => {
  expect(thrown).toThrow(new SyntaxError("Identifier 'undefined' has already been declared"))
})
it('"use strict"; let undefined = 1', ({ thrown }) => {
  expect(thrown).toThrow(new SyntaxError("Identifier 'undefined' has already been declared"))
})
it('const NaN = 1', ({ thrown }) => {
  expect(thrown).toThrow(new SyntaxError("Identifier 'NaN' has already been declared"))
})
it('{ var undefined = 1; undefined }', undefined)
it('{ let undefined = 1; undefined }', 1)
it('{ const undefined = 1; undefined }', 1)
it('(function() { var undefined = 1; return undefined })()', 1)
it('(function() { let undefined = 1; return undefined })()', 1)
