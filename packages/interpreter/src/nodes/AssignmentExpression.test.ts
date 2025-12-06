import { expect } from 'vitest'
import { ExpectToThrowPossibleSideEffectError, getTestGlobalObject, it } from '../test-utils'

it('a = 1', 1)
it('let a = 1', undefined)
it('a = 1; a', 1)
it('let a = 1; a', 1)
it(
  '"use strict"; a = 1',
  (x) => expect(() => x.value).toThrow(new ReferenceError('a is not defined')),
  {},
)
it('var a = null; a ??= 1', 1)
it('var a = 1; a ??= 2', 1)
it('var a = 1; a ??= foo()', 1)
it('var a = 1; a ??= foo(a, b, c())', 1)
it('var a = { b: 1 }; a.b ??= foo()', 1)
it('var a = { b: 1 }; a.b ??= foo(a, b, c())', 1)
it('[a] = [1]', [1])
it('[a] = [1]; a', 1)
it('let [a] = [1]; a', 1)
it(
  '"use strict"; [a] = [1]',
  (x) => expect(() => x.value).toThrow(new ReferenceError('a is not defined')),
  {},
)
it('[x, ...x] = [1]', [1])
it('[x, ...x] = [1]; x', [])
it('[...{length}] = [1,2,3]; length', 3)
it('let [...{length}] = [1,2,3]; length', 3)
it('({x} = {x: 1}); x', 1)
it('let {x} = {x: 1}; x', 1)
it('let {x = 0} = {x: 1}; x', 1)
it('let {x = 0} = {x: undefined}; x', 0)

it('({x: xx} = { x: 1 }); xx', 1)
it('({x: xx} = { x: 1 }); globalThis.xx', 1)
it('({"x": xx} = { x: 1 }); xx', 1)
it('({["x"]: xx} = { x: 1 }); xx', 1)
it('({[x()]: xx} = { x: () => 1 }); xx', ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError('x is not defined'))
})
it('function key() {return "x"}; ({[key()]: xx} = { x: 1 }); xx', 1)
it('({x: [xx]} = { x: [1] }); xx', 1)
it('let xx = {}; ({x: xx.a} = { x: 1 }); xx', { a: 1 })
it('let xx = {}; ({x: xx.a} = { x: 1 }); [globalThis.xx, globalThis.a, globalThis.x]', [
  undefined,
  undefined,
  undefined,
])

it('let {x: xx} = { x: 1 }; xx', 1)
it('let {x: xx} = { x: 1 }; globalThis.xx', undefined)
it('let {"x": xx} = { x: 1 }; xx', 1)
it('let {["x"]: xx} = { x: 1 }; xx', 1)
it('let {[x()]: xx} = { x: () => 1 }; xx', ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError('x is not defined'))
})
it('function key() {return "x"}; let {[key()]: xx} = { x: 1 }; xx', 1)
it('let {x: [xx]} = { x: [1] }; xx', 1)
it('let {x: [xx]} = { x: [1] }; globalThis.x', undefined)
it('let {x: [xx]} = { x: [1] }; globalThis.xx', undefined)

it('a = 1; a', ExpectToThrowPossibleSideEffectError, { throwOnSideEffect: true })
it('var a = {}; a.b = 1; a.b', 1)
it('var a = { b: 1 }; a.b = 2; a.b', 2)
it('{ var a = 1 }; globalThis.a', 1)
it('{ var a = 1 }; a *= 2; [a, globalThis.a]', [2, 2])
it('globalThis.a = 1; var a; a', 1)
it('globalThis.a = 1; var a = 2; a', 2)
it('globalThis.a = 1; var a = 2; globalThis.a', 2)
it('var a; "a" in globalThis', true)
it('{ let a = 1; a = 2; a }', 2, { throwOnSideEffect: true })
it('{ let a = 1; globalThis.a = 2; }', ExpectToThrowPossibleSideEffectError, {
  throwOnSideEffect: true,
})
it('{ let a = 1; globalThis.a = 2; }', ExpectToThrowPossibleSideEffectError, {
  throwOnSideEffect: true,
})
it('globalThis.a = 1; globalThis.a', 1)
it('globalThis.a = 1', 1)
it('globalThis.a = 1; a = 2; globalThis.a', 2)
it('globalThis.a = 1; globalThis.a', ExpectToThrowPossibleSideEffectError, {
  throwOnSideEffect: true,
})
it('(function(x) { x = x + 2; return x; })(2)', 4, { throwOnSideEffect: true })
it('(function(x) { a = x })(2)', ExpectToThrowPossibleSideEffectError, {
  throwOnSideEffect: true,
})
it(`Object.defineProperty(globalThis, 'a', { set(x) { this.b = x } }); a = 1; b`, 1)
it(`Object.defineProperty(globalThis, 'a', { set(x) { this.b = x } }); a = 1`, 1)
it(`Object.defineProperty(globalThis, 'a', { set(x) {} }); a = 1`, 1)
it(`Object.defineProperty(globalThis, 'a', { set(x) {} }); [a = 1, a] `, [1, undefined])
it(`Object.defineProperty(globalThis, 'a', { value: 1 });`, ExpectToThrowPossibleSideEffectError, {
  throwOnSideEffect: true,
})
it(`a = 1;`, ExpectToThrowPossibleSideEffectError, {
  throwOnSideEffect: true,
  globalObject: Object.defineProperty(getTestGlobalObject(), 'a', { set() {} }),
})
it(
  `
    function foo() {
      a = 1;
      return a;
    }

    foo()
    `,
  1,
)
it(
  `
    function foo() {
      a = 1;
      return a;
    }

    foo()
    `,
  ExpectToThrowPossibleSideEffectError,
  { throwOnSideEffect: true },
)

it('undefined = 1', 1, {
  globalObject: Object.defineProperty(getTestGlobalObject(), 'undefined', {
    value: undefined,
    configurable: false,
    enumerable: false,
    writable: false,
  }),
})
it('undefined = 1; undefined', undefined, {
  globalObject: Object.defineProperty(getTestGlobalObject(), 'undefined', {
    value: undefined,
    configurable: false,
    enumerable: false,
    writable: false,
  }),
})
it(
  '"use strict"; undefined = 1; undefined',
  ({ thrown }) => {
    expect(thrown).toThrow(
      new TypeError("Cannot assign to read only property 'undefined' of #<Object>"),
    )
  },
  {
    globalObject: Object.defineProperty(getTestGlobalObject(), 'undefined', {
      value: undefined,
      configurable: false,
      enumerable: false,
      writable: false,
    }),
  },
)

it('false.false = true', true)
it('"use strict"; false.false = true', ({ thrown }) => {
  // Chrome: "Cannot create property 'false' on boolean 'false'"
  expect(thrown).toThrow(new TypeError("Cannot set properties of #<Boolean> (setting 'false')"))
})

it('"a".b = 1', 1)
it('"use strict"; "a".b = 1', ({ thrown }) => {
  // Chrome: "Cannot create property 'b' on string 'a'"
  expect(thrown).toThrow(new TypeError("Cannot set properties of #<String> (setting 'b')"))
})

it('null.a = 1', ({ thrown }) => {
  // Chrome: "Cannot set properties of null (setting 'a')"
  expect(thrown).toThrow(new TypeError("Cannot set properties of null (setting 'a')"))
})
it('"use strict"; null.a = 1', ({ thrown }) => {
  // Chrome: "Cannot set properties of null (setting 'a')"
  expect(thrown).toThrow(new TypeError("Cannot set properties of null (setting 'a')"))
})

it('Object.freeze({}).a = 1', 1)
it('"use strict"; Object.freeze({}).a = 1', ({ thrown }) => {
  // Chrome: 'Cannot add property a, object is not extensible'
  expect(thrown).toThrow(new TypeError("Cannot add property 'a', #<Object> is not extensible"))
})

it('Object.seal({}).a = 1', 1)
it('"use strict"; Object.seal({}).a = 1', ({ thrown }) => {
  // Chrome: 'Cannot add property a, object is not extensible'
  expect(thrown).toThrow(new TypeError("Cannot add property 'a', #<Object> is not extensible"))
})

it('Object.freeze({a: 0}).a = 1', 1)
it('"use strict"; Object.freeze({a: 0}).a = 1', ({ thrown }) => {
  expect(thrown).toThrow(
    // Chrome: "Cannot assign to read only property 'a' of object '#<Object>'"
    new TypeError("Cannot assign to read only property 'a' of #<Object>"),
  )
})

it('Object.defineProperty({}, "a", { writable: false }).a = 1', 1)
it('"use strict"; Object.defineProperty({}, "a", { writable: false }).a = 1', ({ thrown }) => {
  expect(thrown).toThrow(
    // Chrome: "Cannot assign to read only property 'a' of object '#<Object>'"
    new TypeError("Cannot assign to read only property 'a' of #<Object>"),
  )
})

it('Object(false).a = 1', 1)
it('"use strict"; Object(false).a = 1', 1)

it('"a".toString = 1', 1)
it('"use strict"; "a".toString = 1', ({ thrown }) => {
  // Chrome: "Cannot create property 'toString' on string 'a'"
  expect(thrown).toThrow(new TypeError("Cannot set properties of #<String> (setting 'toString')"))
})

it('"a".__proto__ = Number.prototype', Number.prototype)
it('"use strict"; "a".__proto__ = Number.prototype', Number.prototype)

it(
  `
    var steps = [];
    var x = {};
    var fn = () => { steps.push('fn called'); return []; }
    try {
      ;[x.a.b.c] = fn();
    } catch (e) {
      steps.push(e)
    }
    
    steps
  `,
  ['fn called', new TypeError("Cannot read properties of undefined (reading 'b')")],
)

it(
  `
    var steps = [];
    var x = {};
    var fn = () => { steps.push('fn called') }
    try {
      x.a.b.c = fn();
    } catch (e) {
      steps.push(e)
    }
    
    steps
  `,
  [new TypeError("Cannot read properties of undefined (reading 'b')")],
)

it(
  `
    'use strict';
    var steps = [];
    var fn = () => { steps.push('fn called') }
    try {
      not_defined = fn();
    } catch (e) {
      steps.push(e)
    }
    
    steps
  `,
  ['fn called', new ReferenceError('not_defined is not defined')],
)

it(
  `
    var steps = [];
    var fn = () => { steps.push('fn called') }
    try {
      not_defined += fn();
    } catch (e) {
      steps.push(e)
    }
    
    steps
  `,
  [new ReferenceError('not_defined is not defined')],
)

it(
  `
    'use strict';
    var steps = [];
    var fn = () => { steps.push('fn called') }
    try {
      obj_not_defined.not_defined_prop = fn();
    } catch (e) {
      steps.push(e)
    }
    
    steps
  `,
  [new ReferenceError('obj_not_defined is not defined')],
)

it(
  `
    'use strict';
    var steps = [];
    var fn = () => { steps.push('fn called') }
    var obj = {};
    try {
      obj.obj_not_defined.not_defined_prop = fn();
    } catch (e) {
      steps.push(e)
    }
    
    steps
  `,
  [
    'fn called',
    // Chrome: "Cannot set properties of undefined (setting 'not_defined_prop')"
    new TypeError("Cannot set properties of undefined (setting 'not_defined_prop')"),
  ],
)

it(
  `
    'use strict';
    var steps = [];
    var fn = () => { steps.push('fn called') }
    var obj = {};
    try {
      obj.obj_not_defined.not_defined_prop.not_defined_prop = fn();
    } catch (e) {
      steps.push(e)
    }
    
    steps
  `,
  [
    // Chrome: "Cannot read properties of undefined (reading 'not_defined_prop')"
    new TypeError("Cannot read properties of undefined (reading 'not_defined_prop')"),
  ],
)
