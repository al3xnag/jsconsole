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
        args: '()',
        body: '{}',
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
        args: '()',
        body: '{}',
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
        args: '()',
        body: '{}',
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
        args: '()',
        body: '{}',
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
        args: '(a, b)',
        body: '{}',
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
        args: '(a, b = [a], c = { x: 1 }, ...d)',
        body: '{}',
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
        args: '()',
        body: '{ return "foo" }',
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
        args: '()',
        body: '{ [native code] }',
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
        args: '()',
        body: '{}',
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
        args: '()',
        body: '{}',
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
        args: '(a, b)',
        body: '{ return "foo" }',
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
        args: '()',
        body: '{}',
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
        args: '()',
        body: '{}',
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
        args: '()',
        body: '{}',
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
        args: '(  s  ,d)',
        body: '{   }',
      },
    ],
  ])('%s', (_description, fn, expected) => {
    const parts = parseFunctionParts(fn, context)
    expect(parts).toEqual(expected)
  })
})
