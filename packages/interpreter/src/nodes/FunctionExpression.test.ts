import { describe, expect, test } from 'vitest'
import { getTestGlobalObject, it } from '../test-utils'
import { evaluate } from '..'

it('[1, 2, 3].map(function(x) { return x * 2 })', [2, 4, 6])
it('(function foo() { return 123 }).name', 'foo')
it('(function foo() { return 123 }).length', 0)
it('(function foo() { return 123 }).toString()', 'function foo() { return 123 }')
it('(function foo() { return 123 }).toString.name', 'toString')
it('(() => {}).toString === (() => {}).toString', true)
it('(function foo(a, b) { return a + b }).length', 2)
it('(function foo(a, b, ...c) { return a + b + c.length }).length', 2)
it('(function() { return 123 })()', 123)
it('[1, 2, 3].map(function(x) { x * 2 })', [undefined, undefined, undefined])
it('(function foo() { return 123 }).toString.toString()', 'function toString() { [native code] }')
it('({ fn() {} }).fn.name', 'fn')
it('({ fn(a, b) {} }).fn.length', 2)
it('({ fn(a, b) {} }).fn.toString()', 'fn(a, b) {}')
it('({ fn: () => {} }).fn.name', 'fn')
it('({ fn: (a, b) => {} }).fn.length', 2)
it('({ fn: (a, b) => {} }).fn.toString()', '(a, b) => {}')
it('({ fn: function myFn() {} }).fn.name', 'myFn')
it('({ fn: function myFn() {} }).fn.toString()', 'function myFn() {}')
it('({ fn: function() {} }).fn.name', 'fn')
it('({ fn: function() {} }).fn.toString()', 'function() {}')
it('const fn = () => {}; fn.name', 'fn')
it('const fn = () => {}; fn.toString()', '() => {}')
it('const fn = function() {}; fn.name', 'fn')
it('const fn = function() {}; fn.toString()', 'function() {}')
it('const fn = function myFn() {}; fn.name', 'myFn')
it('const fn = function myFn() {}; fn.toString()', 'function myFn() {}')

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/prototype
 *
 * The following functions do not have prototype, and are therefore ineligible as constructors,
 * even if a prototype property is later manually assigned:
 * - const method = { foo() {} }.foo;
 * - const arrowFunction = () => {};
 * - async function asyncFunction() {}
 *
 * The following are valid constructors that have prototype:
 * - class Class {}
 * - function fn() {}
 */
describe('function prototype', () => {
  test('basic function', async () => {
    expect(function () {}.prototype).toBeDefined()

    const result = await evaluate('(function () {}).prototype')
    expect(result.value).toBeDefined()
  })

  test.todo('class', async () => {
    expect(class Class {}.prototype).toBeDefined()

    const result = await evaluate('(class Class {}).prototype')
    expect(result.value).toBeDefined()
  })

  test.todo('method', async () => {
    expect({ foo() {} }.foo.prototype).toBeUndefined()

    const result = await evaluate('({ foo() {} }).foo.prototype')
    expect(result.value).toBeUndefined()
  })

  test('arrow function', async () => {
    expect((() => {}).prototype).toBeUndefined()

    const result = await evaluate('(() => {}).prototype')
    expect(result.value).toBeUndefined()
  })

  test('async function', async () => {
    expect(async function () {}.prototype).toBeUndefined()

    const result = await evaluate('(async function() {}).prototype')
    expect(result.value).toBeUndefined()
  })
})

describe('this context', () => {
  test('basic function', async () => {
    const result = await evaluate('(function() { return this }).call(1)')
    expect(result.value).toEqual(new Number(1))
  })

  test('basic function (script strict)', async () => {
    const result = await evaluate('"use strict"; (function() { return this }).call(1)')
    expect(result.value).toBe(1)
  })

  test('basic function (fn strict)', async () => {
    const result = await evaluate('(function() { "use strict"; return this }).call(1)')
    expect(result.value).toBe(1)
  })

  test('arrow function', async () => {
    const globalObject = getTestGlobalObject()
    const result = await evaluate('(() => { return this }).call(1)', { globalObject })
    expect(result.value).toBe(globalObject)
  })

  test('arrow function inside basic function', async () => {
    const globalObject = getTestGlobalObject()
    const result = await evaluate('function fn() { const a = () => this; return a() }; fn()', {
      globalObject,
    })
    expect(result.value).toBe(globalObject)
  })

  test('arrow function inside basic function, call', async () => {
    const globalObject = getTestGlobalObject()
    const result = await evaluate(
      'function fn() { const a = () => this; return a() }; fn.call(1)',
      {
        globalObject,
      },
    )
    expect(result.value).toEqual(new Number(1))
  })
})

// https://tc39.es/ecma262/#sec-runtime-semantics-instantiateordinaryfunctionexpression
// > NOTE: The BindingIdentifier in a FunctionExpression can be referenced from inside the FunctionExpression's
// > FunctionBody to allow the function to call itself recursively. However, unlike in a FunctionDeclaration,
// > the BindingIdentifier in a FunctionExpression cannot be referenced from and does not affect the scope
// > enclosing the FunctionExpression.
describe('accessing function by its name inside function expression', () => {
  it('const a = function b() { return b }; a().name', 'b')
  it('const b = 1; const a = function b() { return b }; a().name', 'b')
  it('const a = function b(b) { return b }; a()', undefined)
  it('const a = function b(b) { return b }; a(1)', 1)
  it('const a = function b(c = b) { return c }; a().name', 'b')
  it('const a = function b(c = b) { return c }; a(1)', 1)
  it('const a = function b() { const b = 1; return b }; a()', 1)
})
