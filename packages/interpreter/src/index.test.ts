import { describe, expect, test } from 'vitest'
import { evaluate, Metadata, TimeoutError } from '.'
import { EvaluateResult, PublicGlobalScope } from './types'
import { it } from './test-utils'

test('empty', () => {
  const result = evaluate('')
  expect(result).toEqual({ value: undefined })
})

test('sync', () => {
  const result = evaluate('1')
  expect(result).toEqual({ value: 1 })
})

test('top-level await', async () => {
  const result = evaluate('await 1')
  expect(result).toBeInstanceOf(Promise)
  await expect(result).resolves.toEqual({ value: 1 })
})

test('syntax error', () => {
  expect(() => evaluate('<')).toThrow(SyntaxError)
})

test('eval error', () => {
  expect(() => evaluate('a')).toThrow(ReferenceError)
})

test('timeout', () => {
  expect(() => evaluate('while (true) { crypto.randomUUID() }', { timeout: 10 })).toThrow(
    TimeoutError,
  )
})

test('reusing globalObject & globalScope', () => {
  const globalObject = {}
  const globalScope: PublicGlobalScope = { bindings: new Map() }
  const metadata = new Metadata(globalThis)

  evaluate('function fn() { return 1 }', { globalObject, globalScope, metadata })
  evaluate('let a = 1', { globalObject, globalScope, metadata })

  let result = evaluate('fn()', { globalObject, globalScope, metadata })
  expect(result).toEqual({ value: 1 })
  expect(globalScope.bindings.get('a')).toEqual({ kind: 'let', value: 1 })

  result = evaluate('fn', { globalObject, globalScope, metadata }) as EvaluateResult
  expect(result).toEqual({ value: expect.any(Function) })
  expect(metadata.functions.get(result.value as Function)).toEqual({
    sourceCode: 'function fn() { return 1 }',
    arrow: false,
    async: false,
    generator: false,
    constructable: true,
  })
})

describe('options.stripTypes', () => {
  it('const a: number = 1; a', ({ thrown, globalObject }) => {
    expect(thrown).toThrow(globalObject.SyntaxError)
  })
  it('const a: number = 1; a', 1, { stripTypes: true })
  it('const a: string = 1; a', 1, { stripTypes: true })
  it(
    `function fn<T extends number>(a: T, b?: object | string) { return [a, b] }; fn(1, 2)`,
    [1, 2],
    { stripTypes: true },
  )
  it(`type T = { a: number }; const obj: T = { a: 1 } as const; (obj as any).a`, 1, {
    stripTypes: true,
  })
})
