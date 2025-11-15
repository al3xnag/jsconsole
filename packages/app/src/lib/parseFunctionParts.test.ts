import { describe, test, expect } from 'vitest'
import { parseFunctionParts } from './parseFunctionParts'
import { ValueContext } from './ValueContextContext'
import { getGlobals } from './globals'
import { Metadata, SideEffectInfo } from '@jsconsole/interpreter'

const context: ValueContext = {
  metadata: new Metadata(globalThis),
  globals: getGlobals(globalThis),
  sideEffectInfo: new SideEffectInfo(),
}

describe('classic function', () => {
  test.each([
    [
      'anonymous',
      function () {},
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: '',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'async anonymous',
      async function () {},
      {
        isAsync: true,
        isGenerator: false,
        isArrow: false,
        name: '',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'named',
      function foo() {},
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: 'foo',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'async named',
      async function foo() {},
      {
        isAsync: true,
        isGenerator: false,
        isArrow: false,
        name: 'foo',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'with args',
      eval('(function (a, b) {})'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: '',
        args: 'a, b',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'with complex args',
      eval('(function (a, b = [a], c = { x: 1 }, ...d) {})'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: '',
        args: 'a, b = [a], c = { x: 1 }, ...d',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'with body',
      eval('(function () { return "foo" })'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: '',
        args: '',
        body: '{ return "foo" }',
        isClassConstructor: false,
      },
    ],
    [
      'native function',
      Object.toString,
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: 'toString',
        args: '',
        body: '{ [native code] }',
        isClassConstructor: false,
      },
    ],
  ])('%s', (_description, fn, expected) => {
    const parts = parseFunctionParts(fn, context)
    expect(parts).toEqual(expected)
  })
})

describe('arrow function', () => {
  test.each([
    [
      'noop',
      () => {},
      {
        isAsync: false,
        isGenerator: false,
        isArrow: true,
        name: '',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'async noop',
      async () => {},
      {
        isAsync: true,
        isGenerator: false,
        isArrow: true,
        name: '',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'with args and body',
      eval('(a, b) => { return "foo" }'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: true,
        name: '',
        args: 'a, b',
        body: '{ return "foo" }',
        isClassConstructor: false,
      },
    ],
    [
      'single arg w/o parentheses',
      eval('a => {}'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: true,
        name: '',
        args: 'a',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'no block',
      eval('a => 1'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: true,
        name: '',
        args: 'a',
        body: '1',
        isClassConstructor: false,
      },
    ],
  ])('%s', (_description, fn, expected) => {
    const parts = parseFunctionParts(fn, context)
    expect(parts).toEqual(expected)
  })
})

describe('generator function', () => {
  test.each([
    [
      'anonymous',
      function* () {},
      {
        isAsync: false,
        isGenerator: true,
        isArrow: false,
        name: '',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'async anonymous',
      async function* () {},
      {
        isAsync: true,
        isGenerator: true,
        isArrow: false,
        name: '',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'named',
      function* foo() {},
      {
        isAsync: false,
        isGenerator: true,
        isArrow: false,
        name: 'foo',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'bad formatting',
      eval('(async  /* foo */ function    *     foo  (  s  ,d) {   })'),
      {
        isAsync: true,
        isGenerator: true,
        isArrow: false,
        name: 'foo',
        args: 's  ,d',
        body: '{   }',
        isClassConstructor: false,
      },
    ],
  ])('%s', (_description, fn, expected) => {
    const parts = parseFunctionParts(fn, context)
    expect(parts).toEqual(expected)
  })
})

describe('class', () => {
  test.each([
    [
      'class expression',
      eval('let A = class {}; A'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: 'A',
        args: null,
        body: '{}',
        isClassConstructor: true,
      },
    ],
    [
      'class declaration',
      eval('class A {}; A'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: 'A',
        args: null,
        body: '{}',
        isClassConstructor: true,
      },
    ],
  ])('%s', (_description, fn, expected) => {
    const parts = parseFunctionParts(fn, context)
    expect(parts).toEqual(expected)
  })
})

describe('method', () => {
  test.each([
    [
      'object method',
      eval('({ fn() {} }).fn'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: 'fn',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'class method',
      eval('(class { fn() {} }).prototype.fn'),
      {
        isAsync: false,
        isGenerator: false,
        isArrow: false,
        name: 'fn',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
    [
      'async object method',
      eval('({ async fn() {} }).fn'),
      {
        isAsync: true,
        isGenerator: false,
        isArrow: false,
        name: 'fn',
        args: '',
        body: '{}',
        isClassConstructor: false,
      },
    ],
  ])('%s', (_description, fn, expected) => {
    const parts = parseFunctionParts(fn, context)
    expect(parts).toEqual(expected)
  })
})
