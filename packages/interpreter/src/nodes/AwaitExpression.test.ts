import { test, expect, describe } from 'vitest'
import { evaluate, PromiseMetadata } from '..'
import { EvaluatedNode } from '../types'
import { it } from '../test-utils'

describe('top-level await', () => {
  test('await 1', async () => {
    const result = evaluate('await 1', { globalObject: {} })
    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toMatchObject({ value: 1 })
  })

  test('await Promise.resolve(1)', async () => {
    const result = evaluate('await Promise.resolve(1)')
    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toMatchObject({ value: 1 })
  })

  test('Promise.resolve(1)', async () => {
    const result = evaluate('Promise.resolve(1)') as EvaluatedNode
    expect(result).not.toBeInstanceOf(Promise)
    expect(result.value).toBeInstanceOf(Promise)
    await expect(result.value).resolves.toBe(1)
  })

  test('await 1; 2', async () => {
    const result = evaluate('await 1; 2', { globalObject: {} })
    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toMatchObject({ value: 2 })
  })

  test('await await 1', async () => {
    const result = evaluate('await await 1', { globalObject: {} })
    expect(result).toBeInstanceOf(Promise)
    await expect(result).resolves.toMatchObject({ value: 1 })
  })

  test('event loop 1', async () => {
    const result = await evaluate(
      `
        const arr = [];
        arr.push(1);
        Promise.resolve().then(() => { arr.push(3) })
        arr.push(2);
        await Promise.resolve();
        arr.push(4);
        arr;
      `,
    )
    expect(result.value).toEqual([1, 2, 3, 4])
  })

  test('event loop 2', async () => {
    const result = await evaluate(
      `
        const arr = [];
        arr.push(1);
        Promise.resolve().then(() => { arr.push(3) })
        await 1;
        arr.push(2);
        await Promise.resolve();
        arr.push(4);
        arr;
      `,
    )
    expect(result.value).toEqual([1, 3, 2, 4])
  })

  test('event loop 3', async () => {
    const result = await evaluate(
      `
        const arr = [];
        arr.push(1);
        Promise.resolve().then(() => { arr.push(3) })
        arr.push(2);
        await new Promise((resolve) => setTimeout(resolve, 0)).then(() => { arr.push(4) })
        arr.push(5);
        arr;
      `,
    )
    expect(result.value).toEqual([1, 2, 3, 4, 5])
  })
})

describe('async functions', () => {
  test('(async () => { await 1 })()', async () => {
    const result = evaluate('(async () => { await 1 })()') as EvaluatedNode
    expect(result).not.toBeInstanceOf(Promise)
    expect(result.value).toBeInstanceOf(Promise)
    await expect(result.value).resolves.toBeUndefined()
  })

  test('(async () => { return await 1 })()', async () => {
    const result = evaluate('(async () => { return await 1 })()') as EvaluatedNode
    expect(result).not.toBeInstanceOf(Promise)
    expect(result.value).toBeInstanceOf(Promise)
    await expect(result.value).resolves.toBe(1)
  })

  test('(async () => { return 1 })()', async () => {
    const result = evaluate('(async () => { return 1 })()') as EvaluatedNode
    expect(result).not.toBeInstanceOf(Promise)
    expect(result.value).toBeInstanceOf(Promise)
    await expect(result.value).resolves.toBe(1)
  })
})

describe('promise metadata', () => {
  it('Promise.resolve(1)', ({ value, metadata, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.Promise)
    expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
      state: 'fulfilled',
      result: 1,
    })
  })

  it('Promise.reject(1)', ({ value, metadata, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.Promise)
    expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
      state: 'rejected',
      result: 1,
    })
  })

  it('new Promise(() => {})', ({ value, metadata, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.Promise)
    expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
      state: 'pending',
      result: undefined,
    })
  })

  it('new Promise((resolve) => { resolve(1) })', ({ value, metadata, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.Promise)
    expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
      state: 'fulfilled',
      result: 1,
    })
  })

  it('Promise.resolve(1).then()', ({ value, metadata, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.Promise)
    expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
      state: 'pending',
      result: undefined,
    })
  })

  it('Promise.resolve(1).then().then().then().then().then()', async ({
    value,
    metadata,
    globalObject,
  }) => {
    expect(value).toBeInstanceOf(globalObject.Promise)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
      state: 'fulfilled',
      result: 1,
    })
  })

  it('new Promise((resolve) => setTimeout(resolve, 0))', async ({
    value,
    metadata,
    globalObject,
  }) => {
    expect(value).toBeInstanceOf(globalObject.Promise)
    expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
      state: 'pending',
      result: undefined,
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
      state: 'fulfilled',
      result: undefined,
    })
  })

  it('({ x: new Promise((resolve) => setTimeout(resolve, 0)) })', async ({
    value,
    metadata,
    globalObject,
  }) => {
    expect(value).toEqual({ x: expect.any(globalObject.Promise) })
    expect(metadata.promises.get(value.x)).toEqual<PromiseMetadata>({
      state: 'pending',
      result: undefined,
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(metadata.promises.get(value.x)).toEqual<PromiseMetadata>({
      state: 'fulfilled',
      result: undefined,
    })
  })
})

it('x = 0; promise = Promise.resolve().then(() => { x = 2 }); x = 1; await promise; x', 2)
it('async function foo() { await 1; } foo() instanceof Promise', true)
