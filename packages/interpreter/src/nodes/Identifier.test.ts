import { describe, expect, test, vi } from 'vitest'
import { evaluate } from '..'
import { getTestGlobalObject, it } from '../test-utils'

it('NaN', NaN)
it('Infinity', Infinity)

// NOTE: globalThis.toString === Object.prototype.toString // true
//       Object.getOwnPropertyDescriptor(Object.prototype, 'toString')
//       // -> {writable: true, enumerable: false, configurable: true, value: ƒ}
describe('toString', () => {
  it('toString', ({ value, globalObject }) => {
    expect(value).toBe(globalObject.toString)
    expect(value).toBe(globalObject.Object.prototype.toString)
  })
  it('toString = 1', 1)
  it('"use strict"; toString = 1', 1)
  it('const toString = 1; toString', ({ value, globalObject }) => {
    expect(value).toBe(1)
    expect(globalObject.toString).toBeInstanceOf(globalObject.Function)
  })
  it('"use strict"; const toString = 1; toString', ({ value, globalObject }) => {
    expect(value).toBe(1)
    expect(globalObject.toString).toBeInstanceOf(globalObject.Function)
  })
  it('var toString = 1; toString', ({ value, globalObject }) => {
    expect(value).toBe(1)
    expect(globalObject.toString).toBe(1)
  })
  it('"use strict"; var toString = 1; toString', ({ value, globalObject }) => {
    expect(value).toBe(1)
    expect(globalObject.toString).toBe(1)
  })
})

describe('re-declare globalThis properties using var', () => {
  // NOTE: Object.getOwnPropertyDescriptor(globalThis, 'Math')
  //       -> {value: Math, writable: true, enumerable: false, configurable: true}
  test.each([
    { code: 'var Math = 1; Math' },
    { code: '"use strict"; var Math = 1; Math' },
    { code: '{ var Math = 1; } Math' },
    { code: '"use strict"; { var Math = 1; } Math' },
  ])('writable | $code', async ({ code }) => {
    const globalObject = getTestGlobalObject() as any
    expect(Object.getOwnPropertyDescriptor(globalObject, 'Math')).toEqual({
      value: globalObject.Math,
      writable: true,
      enumerable: false,
      configurable: true,
    })

    const result = await evaluate(code, { globalObject })
    expect(result.value).toBe(1)
  })

  // NOTE: Object.getOwnPropertyDescriptor(globalThis, 'NaN')
  //       -> {value: NaN, writable: false, enumerable: false, configurable: false}
  test.each(['var NaN = 1; NaN', '{ var NaN = 1; } NaN', 'NaN = 1; NaN'])(
    'non-writable | $0',
    async (code) => {
      const globalObject = getTestGlobalObject() as any

      expect(Object.getOwnPropertyDescriptor(globalObject, 'NaN')).toEqual({
        value: NaN,
        writable: false,
        enumerable: false,
        configurable: false,
      })

      const result = await evaluate(code, { globalObject })
      // toBe uses Object.is, so that's ok to check NaN values here.
      expect(result.value).toBe(NaN)
    },
  )

  // NOTE: Object.getOwnPropertyDescriptor(globalThis, 'NaN')
  //       -> {value: NaN, writable: false, enumerable: false, configurable: false}
  test.each([
    '"use strict"; var NaN = 1; NaN',
    '"use strict"; { var NaN = 1; } NaN',
    '"use strict"; NaN = 1; NaN',
  ])('non-writable | $0', async (code) => {
    const globalObject = getTestGlobalObject()

    expect(Object.getOwnPropertyDescriptor(globalObject, 'NaN')).toEqual({
      value: NaN,
      writable: false,
      enumerable: false,
      configurable: false,
    })

    expect(() => evaluate(code, { globalObject })).toThrow(
      new TypeError("Cannot assign to read only property 'NaN' of #<Object>"),
    )
  })

  // NOTE: Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  //       -> {set: undefined, enumerable: true, configurable: true, get: ƒ}
  test.each([
    'var localStorage = 1; localStorage',
    '{ var localStorage = 1; } localStorage',
    'localStorage = 1; localStorage',
  ])('getter only | $0', async (code) => {
    const __localStorage = {}
    const getter = vi.fn(() => __localStorage)
    const globalObject = Object.defineProperty(getTestGlobalObject(), 'localStorage', {
      set: undefined,
      enumerable: true,
      configurable: true,
      get: getter,
    }) as any

    const result = await evaluate(code, { globalObject })
    expect(result.value).toBe(__localStorage)
    expect(getter).toHaveBeenCalledTimes(1)
  })

  // NOTE: Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  //       -> {set: undefined, enumerable: true, configurable: true, get: ƒ}
  test.each([
    '"use strict"; var localStorage = 1; localStorage',
    '"use strict"; { var localStorage = 1; } localStorage',
    '"use strict"; localStorage = 1; localStorage',
  ])('getter only | $0', async (code) => {
    const __localStorage = {}
    const getter = vi.fn(() => __localStorage)
    const globalObject = Object.defineProperty(getTestGlobalObject(), 'localStorage', {
      set: undefined,
      enumerable: true,
      configurable: true,
      get: getter,
    }) as any

    expect(() => evaluate(code, { globalObject })).toThrow(
      new TypeError(`Cannot set property 'localStorage' of #<Object> which has only a getter`),
    )

    expect(getter).not.toHaveBeenCalled()
  })

  // NOTE: Object.getOwnPropertyDescriptor(globalThis, 'name')
  //       -> {enumerable: true, configurable: true, get: ƒ, set: ƒ}
  test.each([
    'var name = "test"; name',
    '"use strict"; var name = "test"; name',
    '{ var name = "test"; } name',
    '"use strict"; { var name = "test"; } name',
    'name = "test"; name',
    '"use strict"; name = "test"; name',
  ])('getter and setter | $code', async (code) => {
    let __name = 'initial'
    const getter = vi.fn(() => __name)
    const setter = vi.fn((value) => (__name = value))

    const globalObject = Object.defineProperty(getTestGlobalObject(), 'name', {
      enumerable: true,
      configurable: true,
      get: getter,
      set: setter,
    }) as any

    const result = await evaluate(code, { globalObject })
    expect(result.value).toBe('test')
    expect(setter, 'should be called when we init variable').toHaveBeenCalledTimes(1)
    expect(getter, 'should be called when we read variable').toHaveBeenCalledTimes(1)
    expect(
      Object.getOwnPropertyDescriptor(globalObject, 'name'),
      'var declaration should not declare new property descriptor',
    ).toEqual({
      enumerable: true,
      configurable: true,
      get: getter,
      set: setter,
    })
  })
})

it('undefined', undefined)
it('"use strict"; x', (x) => expect(() => x.value).toThrow(new ReferenceError('x is not defined')))
it('x', ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError('x is not defined'))
})
it('"use strict"; x', ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError('x is not defined'))
})
it('x', 123, { globalObject: Object.assign(getTestGlobalObject(), { x: 123 }) })
it('let a = 1; a', 1)
it('toString', ({ value, globalObject }) => expect(value).toBe(globalObject.toString))
it('toString()', '[object Undefined]')

describe('hoisting', () => {
  it(
    `
      const desc = Object.getOwnPropertyDescriptor(globalThis, 'x');
      var x = 1;
      desc;
    `,
    { value: undefined, writable: true, enumerable: true, configurable: false },
  )

  it(
    `
      const desc = Object.getOwnPropertyDescriptor(globalThis, 'x');
      let x = 1;
      desc;
    `,
    undefined,
  )

  it(
    `
      const desc = Object.getOwnPropertyDescriptor(globalThis, 'x');
      const x = 1;
      desc;
    `,
    undefined,
  )

  it(
    `
      const desc = Object.getOwnPropertyDescriptor(globalThis, 'x');
      function x() {}
      desc;
    `,
    { value: expect.any(Function), writable: true, enumerable: true, configurable: false },
  )

  it(
    `
    function fn() {
      function x() { return fn_hoisted }
      { var fn_hoisted = 1 }
      return x()
    }
  
    fn()
    `,
    1,
  )

  it(`
      'use strict';
      function fn() {
        function x() { return block_hoisted }
        { let block_hoisted = 1 }
        return x()
      }
    
      fn()
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('block_hoisted is not defined'))
  })

  it(`
    function fn() {
      function x() { return block_hoisted }
      { let block_hoisted = 1 }
      return x()
    }
  
    fn()
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('block_hoisted is not defined'))
  })

  it(
    `
    const a = fn;
    function fn() { return 1 }
    const b = fn;
    [a, b];
    `,
    [expect.any(Function), expect.any(Function)],
  )

  it(
    `
    const a = fn;
    { function fn() { return 1 } }
    const b = fn;
    [a, b];
    `,
    [undefined, expect.any(Function)],
  )

  it(
    `
    const a = fn;
    var fn = 1;
    { function fn() { return 1 } }
    const b = fn;
    [a, b];
    `,
    [undefined, expect.any(Function)],
  )

  it(
    `
    const a = fn;
    { function fn() { return 1 } }
    var fn = 1;
    const b = fn;
    [a, b];
    `,
    [undefined, 1],
  )

  it(
    `
    const a = fn;
    { function fn() { return 1 } }
    var fn;
    const b = fn;
    [a, b];
    `,
    [undefined, expect.any(Function)],
  )

  it(`
    const a = fn;
    // { function fn() { return 1 } }
    const b = fn;
    [a, b];
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('fn is not defined'))
  })

  it(
    `
    const a = Math;
    function Math() {}
    const b = Math;
    [a, b];
    `,
    [expect.any(Function), expect.any(Function)],
  )

  it(
    `
    const a = Math;
    { function Math() {} }
    const b = Math;
    [a, b];
    `,
    [Math, expect.any(Function)],
  )

  it(
    `
    const a = v;
    var v = 1;
    const b = v;
    [a, b];
    `,
    [undefined, 1],
  )

  it(
    `
    { function fn() {} }
    fn;
    `,
    expect.any(Function),
  )

  it(
    `
    fn;
    { function fn() {} }
    `,
    undefined,
  )

  it(`
    'use strict';
    fn;
    { function fn() {} }
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('fn is not defined'))
  })

  it(`
    'use strict';
    { function fn() {} }
    fn;
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('fn is not defined'))
  })

  // https://stackoverflow.com/questions/63948741
  it(
    `
    {
      function foo() {};
      foo = 1;

      function foo() {};
      foo = 2;
    }

    foo;
    `,
    1,
  )

  // https://stackoverflow.com/questions/63948741
  it(
    `
    {
      function foo() {};
      foo = 1;

      function foo() {};
      foo = 2;
    }
    `,
    2,
  )

  // https://stackoverflow.com/questions/63948741
  it(
    `
    {
      function foo() {};
      foo = 1;

      function foo() {};
      foo = 2;

      function foo() {};
      foo = 3;
    }

    foo;
    `,
    2,
  )

  it(`
    'use strict';
    {
      function foo() {};
      foo = 1;

      function foo() {};
      foo = 2;
    }
    `, ({ thrown }) => {
    expect(thrown).toThrow(SyntaxError)
    expect(thrown).toThrow("Identifier 'foo' has already been declared")
  })

  // https://stackoverflow.com/questions/63948741
  it(
    `
    function bar() {
      {
        function foo() {};
        foo = 1;

        function foo() {};
        foo = 2;
      }

      return foo;
    }

    bar()
    `,
    1,
  )

  // https://stackoverflow.com/questions/63948741
  it(
    `
    function bar() {
      {
        function foo() {};
        foo = 1;

        function foo() {};
        foo = 2;

        function foo() {};
        foo = 3;
      }

      return foo;
    }

    bar()
    `,
    2,
  )

  it(
    `
    let a, b;
    { 
      a = globalThis.foo;
      function foo() {};
      b = globalThis.foo;
    }
    [a, b];
    `,
    [undefined, expect.any(Function)],
  )

  it(
    `
    'use strict';
    let a, b;
    { 
      a = globalThis.foo;
      function foo() {};
      b = globalThis.foo;
    }
    [a, b];
    `,
    [undefined, undefined],
  )

  it(
    `
    let a = globalThis.foo;
    function foo() {};
    let b = globalThis.foo;
    [a, b];
    `,
    [expect.any(Function), expect.any(Function)],
  )

  it(
    `
    'use strict';
    let a = globalThis.foo;
    function foo() {};
    let b = globalThis.foo;
    [a, b];
    `,
    [expect.any(Function), expect.any(Function)],
  )

  it(
    `
    function foo() {};
    var foo;
    foo;
    `,
    expect.any(Function),
  )

  it(
    `
    'use strict';
    function foo() {};
    var foo;
    foo;
    `,
    expect.any(Function),
  )

  it(
    `
    function foo() {};
    var foo = 1;
    foo;
    `,
    1,
  )

  it(
    `
    'use strict';
    function foo() {};
    var foo = 1;
    foo;
    `,
    1,
  )

  it(`
    {
      function foo() {};
      var foo;
    }
    `, ({ thrown }) => {
    expect(thrown).toThrow(
      Object.assign(new SyntaxError("Identifier 'foo' has already been declared"), {
        loc: { line: 4, column: 10 },
        pos: 42,
        raisedAt: 46,
      }),
    )
  })

  it(`
    'use strict';
    {
      function foo() {};
      var foo;
    }
    `, ({ thrown }) => {
    expect(thrown).toThrow(SyntaxError)
    expect(thrown).toThrow("Identifier 'foo' has already been declared")
  })

  it(
    `
    function foo() {};
    foo = 1;
    [foo, globalThis.foo];
    `,
    [1, 1],
  )

  it(
    `
    'use strict';
    function foo() {};
    foo = 1;
    [foo, globalThis.foo];
    `,
    [1, 1],
  )

  it(
    `
    {
      function foo() {};
      foo = 1;
    }
    [foo, globalThis.foo];
    `,
    [expect.any(Function), expect.any(Function)],
  )

  it(
    `
    let a;
    {
      function foo() {};
      foo = 1;
      a = foo;
    }
    [foo, globalThis.foo, a];
    `,
    [expect.any(Function), expect.any(Function), 1],
  )

  it(`
    'use strict';
    {
      function foo() {};
      foo = 1;
    }
    [foo, globalThis.foo];
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('foo is not defined'))
  })

  it(
    `
      function foo() {};
      globalThis.foo = 1;
      [foo, globalThis.foo];
    `,
    [1, 1],
  )

  it(
    `
      'use strict';
      function foo() {};
      globalThis.foo = 1;
      [foo, globalThis.foo];
    `,
    [1, 1],
  )

  it(
    `
    {
      function foo() {};
      globalThis.foo = 1;
      [foo, globalThis.foo];
    }
    `,
    [expect.any(Function), 1],
  )

  it(
    `
    'use strict';
    {
      function foo() {};
      globalThis.foo = 1;
      [foo, globalThis.foo];
    }
    `,
    [expect.any(Function), 1],
  )

  it(
    `
      var foo = 1;
      globalThis.foo = 2;
      [foo, globalThis.foo];
    `,
    [2, 2],
  )

  it(
    `
      'use strict';
      var foo = 1;
      globalThis.foo = 2;
      [foo, globalThis.foo];
    `,
    [2, 2],
  )

  it(
    `
    {
      var foo = 1;
      globalThis.foo = 2;
      [foo, globalThis.foo];
    }
    `,
    [2, 2],
  )

  it(
    `
    'use strict';
    {
      var foo = 1;
      globalThis.foo = 2;
      [foo, globalThis.foo];
    }
    `,
    [2, 2],
  )

  it(
    `
    const a = v;
    { var v = 1; }
    const b = v;
    [a, b];
    `,
    [undefined, 1],
  )

  it(
    `
    { var v = 1; }
    Object.getOwnPropertyDescriptor(globalThis, 'v')
    `,
    { configurable: false, enumerable: true, value: 1, writable: true },
  )

  it(
    `
    Object.getOwnPropertyDescriptor(globalThis, 'v')
    { var v = 1; }
    `,
    { configurable: false, enumerable: true, value: undefined, writable: true },
  )

  it(
    `
    Object.getOwnPropertyDescriptor(globalThis, 'v')
    // { var v = 1; }
    `,
    undefined,
  )

  it(
    `
      { function x() {} }
      Object.getOwnPropertyDescriptor(globalThis, 'x');
    `,
    { value: expect.any(Function), writable: true, enumerable: true, configurable: false },
  )

  it(`{ var a = 1; var a = 2; }`, undefined)
  it(`'use strict'; { var a = 1; var a = 2; }`, 'use strict')

  // https://github.com/tc39/ecma262/issues/162
  it(
    `
    const a = [];
    try {
      function foo() {
        a.push(1)
        foo = () => {}
      }
    } catch (e) { }
    foo()
    foo()
    a;
    `,
    [1, 1],
  )

  // https://dev.to/rkirsling/tales-from-ecma-s-crypt-annex-b-3-3-56go
  // https://262.ecma-international.org/6.0/#sec-block-level-function-declarations-web-legacy-compatibility-semantics
  // https://tc39.es/ecma262/#sec-web-compat-functiondeclarationinstantiation
  it(
    `
      var a = -1;
      var r;
      (function () {
        const printOuter = () => { r = a; }
        {
          a = 1;
          function a() {}
          a = 2;
          printOuter();
        }
      })();
      r;
    `,
    1,
  )

  it(
    `
      'use strict';
      var a = -1;
      var r;
      (function () {
        const printOuter = () => { r = a; }
        {
          a = 1;
          function a() {}
          a = 2;
          printOuter();
        }
      })();
      r;
    `,
    -1,
  )

  it(
    `
    var a;
    function a() {}
    [a, globalThis.a];
    `,
    [expect.any(Function), expect.any(Function)],
  )

  it(
    `
    'use strict';
    var a;
    function a() {}
    [a, globalThis.a];
    `,
    [expect.any(Function), expect.any(Function)],
  )

  it(
    `
    function a() {}
    var a;
    [a, globalThis.a];
    `,
    [expect.any(Function), expect.any(Function)],
  )

  it(
    `
    'use strict';
    function a() {}
    var a;
    [a, globalThis.a];
    `,
    [expect.any(Function), expect.any(Function)],
  )

  it(`
      function foo(a = b, b = 1) {}
      foo()
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError("Cannot access 'b' before initialization"))
  })

  it(`
      function foo(a = b, b = 1) { var b = 2; }
      foo()
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError("Cannot access 'b' before initialization"))
  })

  it(`
      function foo(a = b) { var b = 1; }
      foo()
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('b is not defined'))
  })

  it(
    `
    const arr = []
    function foo(b = 2, a = b) { arr.push([b, a]); var b = 1; arr.push([b, a]); return arr; }
    foo()
    `,
    [
      [2, 2],
      [1, 2],
    ],
  )

  it(`
      function foo(a = b) {}
      foo()
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('b is not defined'))
  })

  it(
    `
      function foo(a = 1, b = a) { var a = 2; return [a, b]; }
      foo()
    `,
    [2, 1],
  )

  it(
    `
      function foo(a, b = arguments[0]) { return [a, b] }
      foo(1)
    `,
    [1, 1],
  )

  it(
    `
      function foo(arguments, b = arguments[0]) { return [arguments, b] }
      foo('foo')
    `,
    ['foo', 'f'],
  )

  it(`
      'use strict';
      function foo(arguments, b = arguments[0]) { return [arguments, b] }
      foo('foo')
    `, ({ thrown }) => {
    expect(thrown).toThrow(SyntaxError)
    expect(thrown).toThrow('Binding arguments in strict mode')
  })

  it(
    `
    const a = v;
    for (let i in []) { var v = 1; }
    [a, v];
    `,
    [undefined, undefined],
  )

  it(
    `
    const a = v;
    for (let i in [1]) { var v = 1; }
    [a, v];
    `,
    [undefined, 1],
  )

  it(
    `
    const a = v;
    for (var i in [1]) { var v = 1; }
    [a, v, i];
    `,
    [undefined, 1, '0'],
  )

  it(
    `
    const a = v;
    for (var i in []) { var v = 1; }
    [a, v, i];
    `,
    [undefined, undefined, undefined],
  )

  it(`
    const a = v;
    for (let i in []) { var v = 1; }
    [a, v, i];
    `, ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('i is not defined'))
  })

  it(
    `
    function fn(a = 1) {
      var a;
      return a;
    }
    fn();
    `,
    1,
  )

  it(
    `
    var a = 1;
    function fn() {
      var a;
      return a;
    }
    
    fn();
    `,
    undefined,
  )

  it(`var a = 1; var a = 2; a;`, 2)
  it(`function fn() { var a = 1; var a = 2; return a; } fn();`, 2)
  it(`function fn() { var a = 1; {var a = 2;} return a; } fn();`, 2)
  it(`function fn() { {var a = 1;} var a = 2; return a; } fn();`, 2)
  it(`var a = 1; var a; a;`, 1)
  it(`function fn() { var a = 1; var a; return a; } fn();`, 1)
  it(`function fn() { var a = 1; {var a;} return a; } fn();`, 1)

  it(`const fn = function() { arguments.callee = () => {} }; fn()`, undefined)
  it(`"use strict"; const fn = function() { arguments.callee = () => {} }; fn()`, ({ thrown }) => {
    // It's `Cannot assign to read only property 'callee' of #<Object>` in Chrome,
    // and `'caller', 'callee', and 'arguments' properties may not be accessed...` in Firefox.
    expect(thrown).toThrow(
      new TypeError(
        `'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them`,
      ),
    )
  })
  it(`const fn = function() { "use strict"; arguments.callee = () => {} }; fn()`, ({ thrown }) => {
    // It's `Cannot assign to read only property 'callee' of #<Object>` in Chrome,
    // and `'caller', 'callee', and 'arguments' properties may not be accessed...` in Firefox.
    expect(thrown).toThrow(
      new TypeError(
        `'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them`,
      ),
    )
  })

  it(`function fn(a = arguments) { return a; } fn();`, ({ value }) => {
    expect(value).toHaveLength(0)
    expect(Array.from(value as any)).toEqual([])
    expect(Object.prototype.toString.call(value)).toBe('[object Arguments]')
  })
  it(`function fn(a = arguments) { return a; } fn(undefined);`, ({ value }) => {
    expect(value).toHaveLength(1)
    expect(Array.from(value as any)).toEqual([undefined])
    expect(Object.prototype.toString.call(value)).toBe('[object Arguments]')
  })
  it(`function fn(a = arguments) { return a; } fn(null);`, null)
  it(`function fn(a = arguments[0]) { return a; } fn();`, undefined)
  it(`function fn(a = arguments[0]) { return a; } fn(1);`, 1)
})
