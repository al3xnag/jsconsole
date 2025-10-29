// @vitest-environment happy-dom
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { describe, test, expect } from 'vitest'
import { isRevived, RevivedValue, toRevived } from './revived'
import { ValueContext } from './ValueContextContext'
import { getGlobals } from './globals'
import { MarshalledValue } from './marshalled'
import { FunctionMetadata, Metadata, SideEffectInfo } from '@jsconsole/interpreter'
import { SPECIAL_RESULTS } from '@/constants'

describe('toRevived', () => {
  type TestCase = [value: MarshalledValue, expected: RevivedValue, context?: Partial<ValueContext>]

  const defaultContext: ValueContext = {
    globals: getGlobals(globalThis),
    metadata: new Metadata(globalThis),
    sideEffectInfo: new SideEffectInfo(),
  }

  const cases: TestCase[] = [
    [null, null],
    ['', ''],
    ['string', 'string'],
    [true, true],
    [false, false],
    [{ $: 'undefined' }, undefined],
    [{ $: 'number', value: 0 }, 0],
    [{ $: 'number', value: 'Infinity' }, Infinity],
    [{ $: 'number', value: 'NaN' }, NaN],
    [{ $: 'bigint', value: '555' }, 555n],
    [{ $: 'bigint', value: '9999999999999999' }, 9999999999999999n],
    [{ $: 'symbol' }, Symbol()],
    [{ $: 'symbol', desc: '' }, Symbol('')],
    [{ $: 'symbol', desc: 'symbol' }, Symbol('symbol')],
    [{ $: 'special', value: 'HELP' }, SPECIAL_RESULTS.HELP],
    [{ $: 'date', value: 0 }, new Date(0)],
    [{ $: 'date', value: 1744828097586 }, new Date(1744828097586)],
    [{ $: 'date', value: null }, new Date('invalid')],
    [{ $: 'regexp', source: 'test', flags: '' }, /test/],
    [{ $: 'regexp', source: 'test', flags: 'gi' }, /test/gi],
    [{ $: 'array', proto: 'Array.prototype', props: {} }, []],
    [{ $: 'object', proto: 'Object.prototype', props: {} }, {}],
    [{ $: 'unknown-object', tag: 'Object' }, {}],
    // Invalid marshalled value is returned as is:
    [
      // @ts-expect-error xxx
      { $: 'invalid', foo: 1 },
      { $: 'invalid', foo: 1 },
    ],
    // Invalid marshalled value is returned as is:
    // @ts-expect-error xxx
    [{ foo: 2 }, { foo: 2 }],
  ]

  expect.addEqualityTesters([
    function symbolsEqual(a: unknown, b: unknown) {
      if (typeof a === 'symbol' && typeof b === 'symbol') {
        return a.toString() === b.toString()
      }

      return undefined
    },
  ])

  test.each(cases)('%o', (value, expected, context) => {
    const actual = toRevived(value, {
      ...defaultContext,
      ...context,
    })

    expect(actual).toEqual(expected)
  })
})

describe('isRevived', () => {
  type TestCase = [value: unknown, expected: boolean]

  const defaultContext: ValueContext = {
    globals: getGlobals(globalThis),
    metadata: new Metadata(globalThis),
    sideEffectInfo: new SideEffectInfo(),
  }

  const cases: TestCase[] = [
    [undefined, false],
    [null, false],
    ['', false],
    [true, false],
    [false, false],
    [0, false],
    [1, false],
    [{}, false],
    [{ $: {} }, false],
    [{ $: 'undefined' }, false],
    [toRevived({ $: 'function', str: '', name: 'test', length: 0 }, defaultContext), true],
    [toRevived({ $: 'array', proto: 'Array.prototype', props: {} }, defaultContext), true],
    [toRevived({ $: 'object', proto: 'Object.prototype', props: {} }, defaultContext), true],
    [toRevived({ $: 'unknown-object', tag: 'Object' }, defaultContext), true],
  ]

  test.each(cases)('%o -> %s', (value, expected) => {
    const actual = isRevived(value)
    expect(actual).toBe(expected)
  })
})

describe('RevivedFunction', () => {
  const defaultContext: ValueContext = {
    globals: getGlobals(globalThis),
    metadata: new Metadata(globalThis),
    sideEffectInfo: new SideEffectInfo(),
  }

  test('basic function: name=test length=0', () => {
    const fn = toRevived(
      {
        $: 'function',
        str: 'function test() {}',
        name: 'test',
        length: 0,
        arrow: false,
        async: false,
        generator: false,
      },
      defaultContext,
    ) as Function

    expect(typeof fn).toEqual('function')
    expect(fn.name).toEqual('test')
    expect(fn.length).toEqual(0)
    expect(fn.prototype).toBeDefined()
    expect(defaultContext.metadata.functions.get(fn)).toEqual<FunctionMetadata>({
      sourceCode: 'function test() {}',
      arrow: false,
      async: false,
      generator: false,
    })
  })

  test('basic function: name=test length=2', () => {
    const fn = toRevived(
      {
        $: 'function',
        str: 'function test(a, b) {}',
        name: 'test',
        length: 2,
        arrow: false,
        async: false,
        generator: false,
      },
      defaultContext,
    ) as Function
    expect(typeof fn).toEqual('function')
    expect(fn.name).toEqual('test')
    expect(fn.length).toEqual(2)
    expect(fn.prototype).toBeDefined()
    expect(defaultContext.metadata.functions.get(fn)).toEqual<FunctionMetadata>({
      sourceCode: 'function test(a, b) {}',
      arrow: false,
      async: false,
      generator: false,
    })
  })

  test('arrow function', () => {
    const fn = toRevived(
      {
        $: 'function',
        str: '() => {}',
        name: '',
        length: 0,
        arrow: true,
        async: false,
        generator: false,
      },
      defaultContext,
    ) as Function

    expect(typeof fn).toEqual('function')
    expect(fn.name).toEqual('')
    expect(fn.length).toEqual(0)
    expect(fn.prototype).toBeUndefined()
    expect(defaultContext.metadata.functions.get(fn)).toEqual<FunctionMetadata>({
      sourceCode: '() => {}',
      arrow: true,
      async: false,
      generator: false,
    })
  })
})

describe('RevivedArray', () => {
  const defaultContext: ValueContext = {
    globals: getGlobals(globalThis),
    metadata: new Metadata(globalThis),
    sideEffectInfo: new SideEffectInfo(),
  }

  test('empty array', () => {
    const arr = toRevived(
      { $: 'array', proto: 'Array.prototype', props: {} },
      defaultContext,
    ) as unknown[]
    expect(Array.isArray(arr)).toBe(true)
    expect(arr.length).toEqual(0)
  })

  test('array with 2 elements', () => {
    const arr = toRevived(
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [
            ['0', { value: 'a' }],
            ['1', { value: 'b' }],
            ['length', { value: { $: 'number', value: 2 } }],
          ],
        },
      },
      defaultContext,
    ) as unknown[]

    expect(Array.isArray(arr)).toBe(true)
    expect([...arr]).toEqual(['a', 'b'])
  })

  test('array with 2 elements and 1 empty slot', () => {
    const arr = toRevived(
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [
            ['0', { value: 'a' }],
            ['2', { value: 'c' }],
            ['length', { value: { $: 'number', value: 3 } }],
          ],
        },
      },
      defaultContext,
    ) as unknown[]

    expect(Array.isArray(arr)).toBe(true)
    // eslint-disable-next-line no-sparse-arrays
    expect([...arr]).toEqual(['a', , 'c'])
  })
})

describe('RevivedObject', () => {
  const defaultContext: ValueContext = {
    globals: getGlobals(globalThis),
    metadata: new Metadata(globalThis),
    sideEffectInfo: new SideEffectInfo(),
  }

  test('empty object', () => {
    const obj = toRevived(
      { $: 'object', proto: 'Object.prototype', props: {} },
      defaultContext,
    ) as object
    expect(typeof obj).toEqual('object')
    expect(Object.keys(obj)).toEqual([])
  })

  test('object with 2 properties', () => {
    const obj = toRevived(
      {
        $: 'object',
        proto: 'Object.prototype',
        props: {
          names: [
            ['a', { value: 'a' }],
            ['b', { value: 'b' }],
          ],
        },
      },
      defaultContext,
    ) as object
    expect(typeof obj).toEqual('object')
    expect(obj).toMatchObject({ a: 'a', b: 'b' })
  })

  test('custom string tag', () => {
    const obj = toRevived(
      {
        $: 'object',
        proto: 'Object.prototype',
        props: {
          wellKnownSymbols: [['Symbol.toStringTag', { value: 'Custom' }]],
        },
      },
      defaultContext,
    ) as object
    expect(typeof obj).toEqual('object')
    expect(obj.toString()).toEqual('[object Custom]')
  })
})

describe('RevivedUnknownObject', () => {
  const defaultContext: ValueContext = {
    globals: getGlobals(globalThis),
    metadata: new Metadata(globalThis),
    sideEffectInfo: new SideEffectInfo(),
  }

  test('default', () => {
    const obj = toRevived({ $: 'unknown-object', tag: 'Custom' }, defaultContext) as object
    expect(typeof obj).toEqual('object')
    expect(Object.keys(obj)).toEqual([])
    expect(Object.prototype.toString.call(obj)).toEqual('[object Custom]')
  })
})
