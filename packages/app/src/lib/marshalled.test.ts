// @vitest-environment happy-dom

import { expect, test, describe } from 'vitest'
import { isMarshalled, MarshalledValue, toMarshalled } from './marshalled'
import { ValueContext } from './ValueContextContext'
import { getGlobals } from './globals'
import { Metadata, SideEffectInfo } from '@jsconsole/interpreter'
import { SPECIAL_RESULTS } from '@/constants'

describe('toMarshalled', () => {
  type TestCase = [value: unknown, expected: MarshalledValue, context?: Partial<ValueContext>]

  const defaultContext: ValueContext = {
    globals: getGlobals(globalThis),
    metadata: new Metadata(globalThis),
    sideEffectInfo: new SideEffectInfo(),
  }

  const cases: TestCase[] = [
    // undefined
    [undefined, { $: 'undefined' }],

    // null
    [null, null],

    // string
    ['', ''],
    ['string', 'string'],

    // boolean
    [true, true],
    [false, false],

    // number
    [0, { $: 'number', value: 0 }],
    [1, { $: 'number', value: 1 }],
    [1.5, { $: 'number', value: 1.5 }],
    [NaN, { $: 'number', value: 'NaN' }],
    [Infinity, { $: 'number', value: 'Infinity' }],
    [-Infinity, { $: 'number', value: '-Infinity' }],
    [-0, { $: 'number', value: '-0' }],

    // bigint
    [42n, { $: 'bigint', value: '42' }],
    [9999999999999999n, { $: 'bigint', value: '9999999999999999' }],

    // symbol
    [Symbol('test'), { $: 'symbol', desc: 'test' }],
    [Symbol.for('test'), { $: 'symbol', desc: 'test' }],
    [Symbol(''), { $: 'symbol', desc: '' }],
    [Symbol(), { $: 'symbol', desc: undefined }],

    // Special
    [SPECIAL_RESULTS.HELP, { $: 'special', value: 'HELP' }],

    // function
    [eval('(() => {})'), { $: 'function', str: '() => {}', name: '', length: 0 }],
    [eval('(_a => {})'), { $: 'function', str: '_a => {}', name: '', length: 1 }],
    [eval('(async () => {})'), { $: 'function', str: 'async () => {}', name: '', length: 0 }],
    [
      eval('(function test() {})'),
      { $: 'function', str: 'function test() {}', name: 'test', length: 0 },
    ],
    [
      eval('(async function test(_a, _b) {})'),
      { $: 'function', str: 'async function test(_a, _b) {}', name: 'test', length: 2 },
    ],

    // Date
    [new Date('2024-01-01T00:00:00.000Z'), { $: 'date', value: 1704067200000 }],
    [new Date('invalid'), { $: 'date', value: null }],

    // RegExp
    [/test/, { $: 'regexp', source: 'test', flags: '' }],
    [/test/gi, { $: 'regexp', source: 'test', flags: 'gi' }],
    [/[0-9]+\\[a-z]*/gi, { $: 'regexp', source: '[0-9]+\\\\[a-z]*', flags: 'gi' }],

    // Array
    [
      [],
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [['length', { value: { $: 'number', value: 0 }, writable: true }]],
        },
      },
    ],
    [
      ['a', 'b', 'c'],
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [
            ['0', { value: 'a', enumerable: true, configurable: true, writable: true }],
            ['1', { value: 'b', enumerable: true, configurable: true, writable: true }],
            ['2', { value: 'c', enumerable: true, configurable: true, writable: true }],
            ['length', { value: { $: 'number', value: 3 }, writable: true }],
          ],
        },
      },
    ],
    [
      // eslint-disable-next-line no-sparse-arrays
      ['a', , 'c'],
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [
            ['0', { value: 'a', enumerable: true, configurable: true, writable: true }],
            ['2', { value: 'c', enumerable: true, configurable: true, writable: true }],
            ['length', { value: { $: 'number', value: 3 }, writable: true }],
          ],
        },
      },
    ],
    [
      ['a', undefined, 'c'],
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [
            ['0', { value: 'a', enumerable: true, configurable: true, writable: true }],
            [
              '1',
              { value: { $: 'undefined' }, enumerable: true, configurable: true, writable: true },
            ],
            ['2', { value: 'c', enumerable: true, configurable: true, writable: true }],
            ['length', { value: { $: 'number', value: 3 }, writable: true }],
          ],
        },
      },
    ],
    [
      ['a', null, 'c'],
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [
            ['0', { value: 'a', enumerable: true, configurable: true, writable: true }],
            ['1', { value: null, enumerable: true, configurable: true, writable: true }],
            ['2', { value: 'c', enumerable: true, configurable: true, writable: true }],
            ['length', { value: { $: 'number', value: 3 }, writable: true }],
          ],
        },
      },
    ],
    [
      [1, 2, 3],
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [
            [
              '0',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                configurable: true,
                writable: true,
              },
            ],
            [
              '1',
              {
                value: { $: 'number', value: 2 },
                enumerable: true,
                configurable: true,
                writable: true,
              },
            ],
            [
              '2',
              {
                value: { $: 'number', value: 3 },
                enumerable: true,
                configurable: true,
                writable: true,
              },
            ],
            ['length', { value: { $: 'number', value: 3 }, writable: true }],
          ],
        },
      },
    ],
    [
      (() => {
        return eval('class Foo extends Array {}; new Foo(3)')
      })(),
      {
        $: 'array',
        proto: {
          $: 'object',
          proto: 'Array.prototype',
          props: {
            names: [
              [
                'constructor',
                {
                  value: {
                    $: 'function',
                    str: 'class Foo extends Array {}',
                    name: 'Foo',
                    length: 0,
                  },
                  writable: true,
                  configurable: true,
                },
              ],
            ],
          },
        },
        props: {
          names: [['length', { value: { $: 'number', value: 3 }, writable: true }]],
        },
      },
    ],
    [
      (() => {
        return eval(`
          class Foo extends Array { x = 1 }
          new Foo(3).fill(1)
        `)
      })(),
      {
        $: 'array',
        proto: {
          $: 'object',
          proto: 'Array.prototype',
          props: {
            names: [
              [
                'constructor',
                {
                  value: {
                    $: 'function',
                    str: 'class Foo extends Array { x = 1 }',
                    name: 'Foo',
                    length: 0,
                  },
                  writable: true,
                  configurable: true,
                },
              ],
            ],
          },
        },
        props: {
          names: [
            [
              '0',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            [
              '1',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            [
              '2',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            ['length', { value: { $: 'number', value: 3 }, writable: true }],
            [
              'x',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
          ],
        },
      },
    ],
    [
      (() => {
        return eval(`
          class Foo extends Array { x = 1 }
          Object.defineProperty(new Foo(2), '2', { set() {} })
        `)
      })(),
      {
        $: 'array',
        proto: {
          $: 'object',
          proto: 'Array.prototype',
          props: {
            names: [
              [
                'constructor',
                {
                  value: {
                    $: 'function',
                    str: 'class Foo extends Array { x = 1 }',
                    name: 'Foo',
                    length: 0,
                  },
                  writable: true,
                  configurable: true,
                },
              ],
            ],
          },
        },
        props: {
          names: [
            ['2', { set: { $: 'function', str: 'set() {}', name: 'set', length: 0 } }],
            ['length', { value: { $: 'number', value: 3 }, writable: true }],
            [
              'x',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
          ],
        },
      },
    ],
    [
      (() => {
        return eval(`
          class Foo extends Array { x = 1 }
          Object.defineProperty(new Foo(2), '2', { set() {} }).map(() => 1)
        `)
      })(),
      {
        $: 'array',
        proto: {
          $: 'object',
          proto: 'Array.prototype',
          props: {
            names: [
              [
                'constructor',
                {
                  value: {
                    $: 'function',
                    str: 'class Foo extends Array { x = 1 }',
                    name: 'Foo',
                    length: 0,
                  },
                  writable: true,
                  configurable: true,
                },
              ],
            ],
          },
        },
        props: {
          names: [
            [
              '2',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            ['length', { value: { $: 'number', value: 3 }, writable: true }],
            [
              'x',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
          ],
        },
      },
    ],
    [
      [1, 2, [3]],
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [
            [
              '0',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            [
              '1',
              {
                value: { $: 'number', value: 2 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            [
              '2',
              {
                value: {
                  $: 'array',
                  proto: 'Array.prototype',
                  props: {
                    names: [
                      [
                        '0',
                        {
                          value: { $: 'number', value: 3 },
                          enumerable: true,
                          writable: true,
                          configurable: true,
                        },
                      ],
                      ['length', { value: { $: 'number', value: 1 }, writable: true }],
                    ],
                  },
                },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            ['length', { value: { $: 'number', value: 3 }, writable: true }],
          ],
        },
      },
    ],
    [
      (() => {
        const arr: unknown[] = [1]
        arr.push(arr)

        // HACK: workaround for RangeError: Maximum call stack size exceeded
        //   at inspectList (/jsconsole/node_modules/loupe/lib/helpers.js:91:28).
        // loupe is used under the hood for printf formatting (`test.each(cases)('%o', ...)`) in vitest.
        // It seems it can't handle circular references in some cases,
        // see https://github.com/chaijs/loupe/issues/75 for details.
        // arr[inspect.custom] = () => 'circular' - it doesn't help, vitest doesn't pass `customInspect: true` option to loupe.
        Object.defineProperty(arr, Symbol.toStringTag, { value: 'CircularArray' })

        return arr
      })(),
      {
        $: 'array',
        proto: 'Array.prototype',
        props: {
          names: [
            [
              '0',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            [
              '1',
              {
                value: { $: 'unknown-object', tag: 'CircularArray' },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            ['length', { value: { $: 'number', value: 2 }, writable: true }],
          ],
          wellKnownSymbols: [['Symbol.toStringTag', { value: 'CircularArray' }]],
        },
      },
    ],

    // Object
    [
      {},
      {
        $: 'object',
        proto: 'Object.prototype',
        props: {},
      },
    ],
    [
      { a: 1, b: 'test' },
      {
        $: 'object',
        proto: 'Object.prototype',
        props: {
          names: [
            [
              'a',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            ['b', { value: 'test', enumerable: true, writable: true, configurable: true }],
          ],
        },
      },
    ],
    [
      { a: 1, b: 'test', c: { d: 2 } },
      {
        $: 'object',
        proto: 'Object.prototype',
        props: {
          names: [
            [
              'a',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            ['b', { value: 'test', enumerable: true, writable: true, configurable: true }],
            [
              'c',
              {
                value: {
                  $: 'object',
                  proto: 'Object.prototype',
                  props: {
                    names: [
                      [
                        'd',
                        {
                          value: { $: 'number', value: 2 },
                          enumerable: true,
                          writable: true,
                          configurable: true,
                        },
                      ],
                    ],
                  },
                },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
          ],
        },
      },
    ],
    [
      (() => {
        return eval(`
          ({
            a: 1,
            get b() { return 2 },
            set b(x) {},
          })
        `)
      })(),
      {
        $: 'object',
        proto: 'Object.prototype',
        props: {
          names: [
            [
              'a',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
            [
              'b',
              {
                get: { $: 'function', str: 'get b() { return 2 }', name: 'get b', length: 0 },
                set: { $: 'function', str: 'set b(x) {}', name: 'set b', length: 1 },
                enumerable: true,
                configurable: true,
              },
            ],
          ],
        },
      },
    ],
    [
      (() => {
        return eval(`
          class Foo {}
          new Foo()
        `)
      })(),
      {
        $: 'object',
        proto: {
          $: 'object',
          proto: 'Object.prototype',
          props: {
            names: [
              [
                'constructor',
                {
                  value: { $: 'function', str: 'class Foo {}', name: 'Foo', length: 0 },
                  writable: true,
                  configurable: true,
                },
              ],
            ],
          },
        },
        props: {},
      },
    ],
    [
      (() => {
        return eval(`
          class Foo { x = 1; foo() {} }
          new Foo()
        `)
      })(),
      {
        $: 'object',
        proto: {
          $: 'object',
          proto: 'Object.prototype',
          props: {
            names: [
              [
                'constructor',
                {
                  value: {
                    $: 'function',
                    str: 'class Foo { x = 1; foo() {} }',
                    name: 'Foo',
                    length: 0,
                  },
                  writable: true,
                  configurable: true,
                },
              ],
              [
                'foo',
                {
                  value: { $: 'function', str: 'foo() {}', name: 'foo', length: 0 },
                  writable: true,
                  configurable: true,
                },
              ],
            ],
          },
        },
        props: {
          names: [
            [
              'x',
              {
                value: { $: 'number', value: 1 },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
          ],
        },
      },
    ],
    [
      (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = {}
        obj.x = obj
        return obj
      })(),
      {
        $: 'object',
        proto: 'Object.prototype',
        props: {
          names: [
            [
              'x',
              {
                value: { $: 'unknown-object', tag: 'Object' },
                enumerable: true,
                writable: true,
                configurable: true,
              },
            ],
          ],
        },
      },
    ],
    [
      Object.defineProperty({}, Symbol.toStringTag, { value: 'CustomObject' }),
      {
        $: 'object',
        proto: 'Object.prototype',
        props: {
          wellKnownSymbols: [['Symbol.toStringTag', { value: 'CustomObject' }]],
        },
      },
    ],

    // String object
    [new String('test'), { $: 'string-object', value: 'test' }],

    // Number object
    [new Number(1), { $: 'number-object', value: 1 }],

    // BigInt object
    [Object(1n), { $: 'bigint-object', value: '1' }],

    // Boolean object
    [new Boolean(true), { $: 'boolean-object', value: true }],

    // Symbol object
    [Object(Symbol('test')), { $: 'symbol-object', desc: 'test' }],

    // Error
    [
      (() => {
        const err = new Error('test')
        Object.defineProperty(err, 'stack', { value: 'test', configurable: true })
        return err
      })(),
      {
        $: 'error',
        proto: 'Error.prototype',
        props: {
          names: [
            ['stack', { value: 'test', configurable: true }],
            ['message', { value: 'test', writable: true, configurable: true }],
          ],
        },
      },
    ],
    [
      (() => {
        const err = new TypeError('test')
        Object.defineProperty(err, 'stack', { value: 'test', configurable: true })
        return err
      })(),
      {
        $: 'error',
        proto: 'TypeError.prototype',
        props: {
          names: [
            ['stack', { value: 'test', configurable: true }],
            ['message', { value: 'test', writable: true, configurable: true }],
          ],
        },
      },
    ],

    // Element
    [
      document.createElement('div'),
      { $: 'element', objectTag: 'HTMLDivElement', tagName: 'DIV', attributes: [] },
    ],

    // Map
    [
      new Map([['a', 1]]),
      {
        $: 'map',
        entries: [['a', { $: 'number', value: 1 }]],
      },
    ],

    // Set
    [
      new Set(['a', 1]),
      {
        $: 'set',
        values: ['a', { $: 'number', value: 1 }],
      },
    ],
  ]

  test.each(cases)('%o', (value, expected, context) => {
    const actual = toMarshalled(value, {
      ...defaultContext,
      ...context,
    })

    expect(actual).toEqual(expected)
  })

  describe('Proxy', () => {
    test('known proxy', () => {
      const target = { a: 'test' }
      const handler: ProxyHandler<object> = eval(`({ get() { return 1 } })`)
      const proxy = new Proxy(target, handler)

      const metadata = new Metadata({})
      metadata.proxies.set(proxy, { target, handler })

      const context: ValueContext = {
        ...defaultContext,
        metadata,
      }

      const actual = toMarshalled(proxy, context)
      expect(actual).toEqual({
        $: 'proxy',
        target: {
          $: 'object',
          proto: 'Object.prototype',
          props: {
            names: [['a', { value: 'test', enumerable: true, writable: true, configurable: true }]],
          },
        },
        handler: {
          $: 'object',
          proto: 'Object.prototype',
          props: {
            names: [
              [
                'get',
                {
                  value: { $: 'function', str: 'get() { return 1 }', name: 'get', length: 0 },
                  enumerable: true,
                  writable: true,
                  configurable: true,
                },
              ],
            ],
          },
        },
      })
    })

    test('unknown proxy', () => {
      const target = { a: 'test' }
      const handler: ProxyHandler<object> = {
        get() {
          return 1
        },
      }

      const proxy = new Proxy(target, handler)

      const actual = toMarshalled(proxy, defaultContext)
      expect(actual).toEqual({
        $: 'object',
        proto: 'Object.prototype',
        props: {
          names: [['a', { value: 'test', enumerable: true, writable: true, configurable: true }]],
        },
      })
    })
  })

  describe('Node', () => {
    test('text node', () => {
      const node = document.createTextNode('test')
      const actual = toMarshalled(node, defaultContext)
      expect(actual).toEqual({
        $: 'node',
        objectTag: 'Text',
        nodeType: Node.TEXT_NODE,
        nodeName: '#text',
        nodeValue: 'test',
      })
    })
  })

  describe('Promise', () => {
    test('known resolved promise', () => {
      const promise = Promise.resolve('test')
      const metadata = new Metadata({})
      metadata.promises.set(promise, { state: 'fulfilled', result: 'test' })
      const context: ValueContext = {
        ...defaultContext,
        metadata,
      }

      const actual = toMarshalled(promise, context)
      expect(actual).toEqual({ $: 'promise', state: 'fulfilled', result: 'test' })
    })

    test('unknown resolved promise', () => {
      const promise = Promise.resolve('test')
      const actual = toMarshalled(promise, defaultContext)
      expect(actual).toEqual({ $: 'promise' })
    })
  })

  describe('WeakMap', () => {
    test('known WeakMap', () => {
      const weakMap = new WeakMap([[{}, 1]])
      const metadata = new Metadata({})
      metadata.weakMaps.set(weakMap, { entries: new Map([[new WeakRef({}), 1]]) })
      const context: ValueContext = {
        ...defaultContext,
        metadata,
      }

      const actual = toMarshalled(weakMap, context)
      expect(actual).toEqual({
        $: 'weakmap',
        entries: [
          [
            { $: 'object', proto: 'Object.prototype', props: {} },
            { $: 'number', value: 1 },
          ],
        ],
      })
    })
  })
})

describe('isMarshalled', () => {
  type TestCase = [value: unknown, expected: boolean]

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
    [{ $: null }, false],
    [{ $: 'undefined' }, true],
    [{ $: 'number', value: 0 }, true],
    [{ $: 'unknown-object', tag: 'Array' }, true],
  ]

  test.each(cases)('%o -> %s', (value, expected) => {
    const actual = isMarshalled(value)
    expect(actual).toBe(expected)
  })
})
