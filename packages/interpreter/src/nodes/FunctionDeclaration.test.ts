import { describe, expect, test } from 'vitest'
import { getBasicGlobalObject, it } from '../test-utils'
import { evaluate, Metadata } from '..'

describe('toString', () => {
  test('fn.toString()', async () => {
    const code = `
      function foo() { return 123 }
      foo.toString()
    `
    const expected = 'function foo() { return 123 }'
    const result = await evaluate(code)
    expect(result.value).toEqual(expected)
  })

  test('Function.prototype.toString.call(fn)', async () => {
    const code = `
      function foo() { return 123 }
      Function.prototype.toString.call(foo)
    `
    const expected = 'function foo() { return 123 }'
    const result = await evaluate(code)
    expect(result.value).toEqual(expected)
  })

  test('Function.prototype.toString.apply(fn)', async () => {
    const code = `
      function foo() { return 123 }
      Function.prototype.toString.apply(foo)
    `
    const expected = 'function foo() { return 123 }'
    const result = await evaluate(code)
    expect(result.value).toEqual(expected)
  })

  test("Function.prototype.toString = () => 'x'", async () => {
    const code = `
      const fn = () => {};
      Function.prototype.toString = () => 'x';
      fn.toString();
    `
    const expected = 'x'

    const origToString = Function.prototype.toString
    try {
      const result = await evaluate(code)
      expect(result.value).toEqual(expected)
    } finally {
      Function.prototype.toString = origToString
    }
  })

  test("Function.prototype.toString = () => 'x' (2)", async () => {
    const code = `
      const fn = () => {};
      const toStr = fn.toString;
      Function.prototype.toString = () => 'x';
      toStr(); 
    `

    const expectedError = new TypeError(
      "Function.prototype.toString requires that 'this' be a Function",
    )

    const origToString = Function.prototype.toString
    try {
      expect(() => evaluate(code)).toThrow(expectedError)
    } finally {
      Function.prototype.toString = origToString
    }
  })

  test("Function.prototype.toString = () => 'x' (3)", async () => {
    const code = `
      const fn = () => {};
      const toString = fn.toString;
      Function.prototype.toString = () => 'x';
      toString(); 
    `

    const expectedError = new TypeError(
      "Function.prototype.toString requires that 'this' be a Function",
    )

    const origToString = Function.prototype.toString
    try {
      expect(() => evaluate(code)).toThrow(expectedError)
    } finally {
      Function.prototype.toString = origToString
    }
  })
})

describe('bind', () => {
  test('fn.bind(1)()', async () => {
    const code = `
      function fn() { return this }
      fn.bind(1)()
    `
    const result = await evaluate(code)
    expect(result.value).toEqual(new Number(1))
    expect(result.value).toBeInstanceOf(Number)
  })

  test('fn.bind(1)() (strict)', async () => {
    const code = `
      'use strict'
      function fn() { return this }
      fn.bind(1)()
    `
    const result = await evaluate(code)
    expect(result.value).toBe(1)
    expect(result.value).not.toBeInstanceOf(Number)
  })

  it('function fn() { return this } var fn2 = fn.bind("1"); fn2() === fn2()', false)
  it('"use strict"; function fn() { return this } var fn2 = fn.bind("1"); fn2() === fn2()', true)

  test('fn.bind()()', async () => {
    const code = `
      function fn() { return this }
      fn.bind()()
    `
    const globalObject = getBasicGlobalObject()
    const result = await evaluate(code, { globalObject })
    expect(result.value).toBe(globalObject)
  })

  test('fn.bind(undefined)()', async () => {
    const code = `
      function fn() { return this }
      fn.bind(undefined)()
    `
    const globalObject = getBasicGlobalObject()
    const result = await evaluate(code, { globalObject })
    expect(result.value).toBe(globalObject)
  })

  test('fn.bind(null)()', async () => {
    const code = `
      function fn() { return this }
      fn.bind(null)()
    `
    const globalObject = getBasicGlobalObject()
    const result = await evaluate(code, { globalObject })
    expect(result.value).toBe(globalObject)
  })

  test('Function.prototype.toString.bind(fn)()', async () => {
    const code = `
      function fn() { return 123 }
      Function.prototype.toString.bind(fn)()
    `
    const expected = 'function fn() { return 123 }'
    const result = await evaluate(code)
    expect(result.value).toBe(expected)
  })

  test('Function.prototype.toString.bind(fn).call()', async () => {
    const code = `
      function fn() { return 123 }
      Function.prototype.toString.bind(fn).call()
    `
    const expected = 'function fn() { return 123 }'
    const result = await evaluate(code)
    expect(result.value).toBe(expected)
  })

  test('WeakMap.prototype.set.bind(new WeakMap(), { x: 1 }).call(null, { x: 2 })', async () => {
    const code = `
      WeakMap.prototype.set.bind(new WeakMap(), { x: 1 }).call(null, { x: 2 })
    `
    const metadata = new Metadata(globalThis)
    const result = await evaluate(code, { metadata })
    const weakMapMetadata = metadata.weakMaps.get(result.value as WeakMap<WeakKey, unknown>)

    expect(result.value).toBeInstanceOf(WeakMap)
    expect(weakMapMetadata).toBeDefined()
    expect(weakMapMetadata!.entries.size).toBe(1)

    const [key, value] = Array.from(weakMapMetadata!.entries)[0] as [
      WeakRef<WeakKey>,
      WeakRef<WeakKey>,
    ]

    expect(key).toBeInstanceOf(WeakRef)
    expect(value).toBeInstanceOf(WeakRef)
    expect(key.deref()).toEqual({ x: 1 })
    expect(value.deref()).toEqual({ x: 2 })
  })

  test('let a = WeakMap.prototype.set.bind(new WeakMap(), { x: 1 }); a.call.bind(a, null, { x: 2 })()', async () => {
    const code = `
      let a = WeakMap.prototype.set.bind(new WeakMap(), { x: 1 });
      a.call.bind(a, null, { x: 2 })()
    `
    const metadata = new Metadata(globalThis)
    const result = await evaluate(code, { metadata })
    const weakMapMetadata = metadata.weakMaps.get(result.value as WeakMap<WeakKey, unknown>)

    expect(result.value).toBeInstanceOf(WeakMap)
    expect(weakMapMetadata).toBeDefined()
    expect(weakMapMetadata!.entries.size).toBe(1)

    const [key, value] = Array.from(weakMapMetadata!.entries)[0] as [
      WeakRef<WeakKey>,
      WeakRef<WeakKey>,
    ]

    expect(key).toBeInstanceOf(WeakRef)
    expect(value).toBeInstanceOf(WeakRef)
    expect(key.deref()).toEqual({ x: 1 })
    expect(value.deref()).toEqual({ x: 2 })
  })

  test('fn.bind().toString()', async () => {
    const code = `
      function fn() { return 123 }
      fn.bind().toString()
    `
    const expected = 'function () { [native code] }'
    const result = await evaluate(code)
    expect(result.value).toBe(expected)
  })

  // NOTE: The newly bound thisArg value is ignored (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#description).
  test('fn.bind(1, 2).bind(3, 4)()', async () => {
    const code = `
      function fn() { return [this, ...arguments] }
      fn.bind(1, 2).bind(3, 4)()
    `
    const result = await evaluate(code)
    expect(result.value).toEqual([new Number(1), 2, 4])
  })

  test('fn.bind(1, 2).bind(3, 4).call(5)', async () => {
    const code = `
      function fn() { return [this, ...arguments] }
      fn.bind(1, 2).bind(3, 4).call(5)
    `
    const result = await evaluate(code)
    expect(result.value).toEqual([new Number(1), 2, 4])
  })

  test('fn.call.bind(fn, 1, 2, 3)()', async () => {
    const code = `
      function fn() { return [this, ...arguments] }
      fn.call.bind(fn, 1, 2, 3)()
    `
    const result = await evaluate(code)
    expect(result.value).toEqual([new Number(1), 2, 3])
  })

  test('fn.call.bind(fn, 1, 2, 3).call(4, 5)', async () => {
    const code = `
      function fn() { return [this, ...arguments] }
      fn.call.bind(fn, 1, 2, 3).call(4, 5)
    `
    const result = await evaluate(code)
    expect(result.value).toEqual([new Number(1), 2, 3, 5])
  })
})

it('function asd() { return 123 }', undefined)
it('function asd() { return 123 }; asd();', 123)
it('function asd() { return 123 }\n asd();', 123)
it('function asd(a) { return 123 + a }\n asd(1);', 124)
it('function asd(a) { return 123 + a; throw new Error("asd") }\n asd(1);', 124)
it('function asd() { return 123, 124 }\n asd();', 124)
it('function foo() { return 123 }\n foo.name', 'foo')
it('function foo() { return 123 }\n foo.length', 0)
it('function foo() { return 123 }\n foo.toString()', 'function foo() { return 123 }')
it(
  'function foo() { return 123 }\n Function.prototype.toString.call(foo)',
  'function foo() { return 123 }',
)
it('function foo(a, b) { return a + b }\n foo.length', 2)
it('function foo(a, b, ...c) { return a + b + c.length }\n foo.length', 2)

// TODO: some tests for fn hoisting are in Identifier.test.ts, we should move them here.
describe('hoisting in block', () => {
  it(
    `
      const a = foo;
      while (true) {
        function foo(a) {} 
        break;
      }
      const b = foo;
      [a, b];
    `,
    [undefined, expect.any(Function)],
  )
  it(
    `
      const a = foo;
      while (true) {
        break;
        function foo(a) {} 
      }
      const b = foo;
      [a, b];
    `,
    [undefined, undefined],
  )
})

it(
  `
    function fn(arguments, b = arguments[0], [c] = [], ...d) { 
      return [arguments,b,c,d] 
    }
    fn('a')
  `,
  ['a', 'a', undefined, []],
)

it(`
    'use strict'
    function fn(arguments, b = arguments[0], [c] = [], ...d) { 
      return [arguments,b,c,d] 
    }
    fn('a')
  `, ({ thrown }) => {
  expect(thrown).toThrow(SyntaxError)
  expect(thrown).toThrow('Binding arguments in strict mode')
})

it(`
    function foo(a = b, {b} = a, [c] = [], ...d) { console.log(a,b,c,d) }
    foo()
  `, ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError("Cannot access 'b' before initialization"))
})

it(`
    function foo(a = b, [c] = [], ...d) { var b = 1; console.log(a,b,c,d) }
    foo()
  `, ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError('b is not defined'))
})

describe('call', () => {
  it('function fn() { return this } fn.call(1)', ({ value }) => {
    expect(value).toEqual(new Number(1))
  })
  it('"use strict"; function fn() { return this } fn.call(1)', ({ value }) => {
    expect(value).toBe(1)
  })

  it('function fn() { return this === this } fn.call(1)', ({ value }) => {
    expect(value).toBe(true)
  })
  it('"use strict"; function fn() { return this === this } fn.call(1)', ({ value }) => {
    expect(value).toBe(true)
  })

  it('function fn() { return this } fn.call(null)', ({ value, globalObject }) => {
    expect(value).toEqual(globalObject)
    expect(value).toBeTruthy()
  })
  it('"use strict"; function fn() { return this } fn.call(null)', ({ value }) => {
    expect(value).toEqual(null)
  })

  it('function fn() { return this } fn.call(undefined)', ({ value, globalObject }) => {
    expect(value).toEqual(globalObject)
    expect(value).toBeTruthy()
  })
  it('"use strict"; function fn() { return this } fn.call(undefined)', ({ value }) => {
    expect(value).toEqual(undefined)
  })
})

describe('apply', () => {
  it('function fn() { return this } fn.apply(1)', ({ value }) => {
    expect(value).toEqual(new Number(1))
  })
  it('"use strict"; function fn() { return this } fn.apply(1)', ({ value }) => {
    expect(value).toBe(1)
  })

  it('function fn() { return this === this } fn.apply(1)', ({ value }) => {
    expect(value).toBe(true)
  })
  it('"use strict"; function fn() { return this === this } fn.apply(1)', ({ value }) => {
    expect(value).toBe(true)
  })

  it('function fn() { return this } fn.apply(null)', ({ value, globalObject }) => {
    expect(value).toEqual(globalObject)
    expect(value).toBeTruthy()
  })
  it('"use strict"; function fn() { return this } fn.apply(null)', ({ value }) => {
    expect(value).toEqual(null)
  })

  it('function fn() { return this } fn.apply(undefined)', ({ value, globalObject }) => {
    expect(value).toEqual(globalObject)
    expect(value).toBeTruthy()
  })
  it('"use strict"; function fn() { return this } fn.apply(undefined)', ({ value }) => {
    expect(value).toEqual(undefined)
  })
})
