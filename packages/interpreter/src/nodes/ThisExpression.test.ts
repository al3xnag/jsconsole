import { expect, test } from 'vitest'
import { evaluate } from '..'

test('global this (strict: false)', async () => {
  const globalObject = {}
  const code = `this`
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(globalObject)
})

test('global this (strict: true)', async () => {
  const globalObject = {}
  const code = `"use strict"; this`
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(globalObject)
})

test('fn() { return this } (strict: false)', async () => {
  const globalObject = {}
  const code = `
    function fn() { return this }
    fn()
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(globalObject)
})

test('fn() { return this } (strict: true)', async () => {
  const globalObject = {}
  const code = `
    "use strict";
    function fn() { return this }
    fn()
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(undefined)
})

test('fn.call(1) (strict: false)', async () => {
  const globalObject = {}
  const code = `
    function fn() { return this }
    fn.call(1)
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toEqual(new Number(1))
  expect(result.value).toBeInstanceOf(Number)
})

test('fn.call(1) (strict: true)', async () => {
  const globalObject = {}
  const code = `
    "use strict";
    function fn() { return this }
    fn.call(1)
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(1)
  expect(result.value).not.toBeInstanceOf(Number)
})

test('fn() | inner() (strict: false)', async () => {
  const globalObject = {}
  const code = `
    function fn() {
      function inner() {
        return this;
      }
      return inner()
    }
    fn()
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(globalObject)
})

test('fn() | inner() (strict: true)', async () => {
  const globalObject = {}
  const code = `
    "use strict";
    function fn() {
      function inner() {
        return this;
      }
      return inner()
    }
    fn()
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(undefined)
})

test('fn.call(1) | inner() (strict: false)', async () => {
  const globalObject = {}
  const code = `
    function fn() {
      function inner() {
        return this;
      }
      return inner()
    }
    fn.call(1)
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(globalObject)
})

test('fn.call(1) | inner() (strict: true)', async () => {
  const globalObject = {}
  const code = `
    "use strict";
    function fn() {
      function inner() {
        return this;
      }
      return inner()
    }
    fn.call(1)
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(undefined)
})

test('this in arrow function', async () => {
  const globalObject = {}
  const code = `
    const fn = () => this
    fn()
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(globalObject)
})

test('this in arrow function 2', async () => {
  const globalObject = {}
  const code = `
    const fn = () => this
    fn.call(1)
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(globalObject)
})

test('this in arrow function 3', async () => {
  const globalObject = {}
  const code = `
    const fn = () => this
    fn.bind(1)()
  `
  const result = await evaluate(code, { globalObject })
  expect(result.value).toBe(globalObject)
})
