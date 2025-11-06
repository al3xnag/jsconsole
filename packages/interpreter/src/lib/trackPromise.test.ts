import { expect } from 'vitest'
import { it } from '../test-utils'
import { PromiseMetadata } from './Metadata'

it('Promise.resolve(1)', ({ value, metadata, globalObject }) => {
  expect(value).toBeInstanceOf(globalObject.Promise)
  expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
    state: 'fulfilled',
    result: 1,
  })
})

it('Promise.resolve({})', ({ value, metadata, globalObject }) => {
  expect(value).toBeInstanceOf(globalObject.Promise)
  expect(metadata.promises.get(value)).toEqual<PromiseMetadata>({
    state: 'fulfilled',
    result: {},
  })
  expect(metadata.promises.get(value)!.result).toBeInstanceOf(globalObject.Object)
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

it(
  `
    function isConstructor(f) {
      try {
        Reflect.construct(function(){}, [], f);
      } catch (e) {
        return false;
      }
      return true;
    }
      
    isConstructor(Promise)
  `,
  true,
)
