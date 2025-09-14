import { describe, expect } from 'vitest'
import { it } from '../test-utils'

describe('empty', () => {
  it('for (var i of []) {}', undefined)
  it('for (let i of []) {}', undefined)
  it('for (const i of []) {}', undefined)
  it('for (var i of [0, 1, 2]) {}', undefined)
  it('for (let i of [0, 1, 2]) {}', undefined)
  it('for (const i of [0, 1, 2]) {}', undefined)
  it('for (let i of []);', undefined)
  it('for (let i of []) 0', undefined)
})

describe('statement result', () => {
  it('1; for (let i of [0, 1, 2]) {}', undefined)
  it('for (let i of ["a", "b", "c"]) { i }', 'c')
  it('for (let i of ["a", "b", "c"]) i', 'c')
})

describe('scope', () => {
  it('for (let i of [0, 1, 2]) {} i', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('i is not defined'))
  })
  it('i; for (let i of [0, 1, 2]) {}', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('i is not defined'))
  })
  it('for (var i of ["a", "b"]) {} i', 'b')
  it('i; for (var i of ["a", "b"]) {}', undefined)
  it('const r = []; for (let a of [1, 2, 3]) { r.push(a); } r', [1, 2, 3])
  it('const r = []; for (let a of [1, 2, Promise.resolve(3)]) { r.push(a); } r', [
    1,
    2,
    expect.any(Promise),
  ])
  it(
    `
      const a = [];
      let x = -2;
      a.push(x);
      for (let x of [0]) { let x = 2; a.push(x); }
      a.push(x);
      a;
    `,
    [-2, 2, -2],
  )
  it(
    `
      const a = [];
      const x = -2;
      a.push(x);
      for (const x of [0]) { const x = 2; a.push(x); }
      a.push(x);
      a;
    `,
    [-2, 2, -2],
  )
  it('let i; for (let i of []) {}', undefined)
  it('const i = 1; for (const i of []) {}', undefined)
  it('var i; for (var i of []) {}', undefined)
  it('let i; for (var i of []) {}', ({ thrown }) => {
    expect(thrown).toThrow(SyntaxError)
    expect(thrown).toThrow("Identifier 'i' has already been declared")
  })
  it('const i = 1; for (var i of []) {}', ({ thrown }) => {
    expect(thrown).toThrow(SyntaxError)
    expect(thrown).toThrow("Identifier 'i' has already been declared")
  })
  it(
    `
    const r = [];
    for (let a of [1,2,3]) { setTimeout(() => r.push(a), 0) }
    await new Promise((resolve) => setTimeout(resolve, 0));
    r;
  `,
    [1, 2, 3],
  )
  it(
    `
    const r = [];
    for (var a of [1,2,3]) { setTimeout(() => r.push(a), 0) }
    await new Promise((resolve) => setTimeout(resolve, 0));
    r;
  `,
    [3, 3, 3],
  )
})

it('const r = []; for (let {a = 1} of [0, 1, 2]) { r.push(a) } r', [1, 1, 1])
it('const r = []; for (let [a = 1] of [0, 1, 2]) { r.push(a) } r', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('0 is not iterable'))
})
it('const r = []; for (let a of [0, 1, 2]) { r.push(a); break; } r', [0])
it('const r = []; for (let a of [0, 1, 2]) { r.push(a); continue; } r', [0, 1, 2])
it('const r = []; for (let a of [0, 1, 2]) { break; r.push(a); } r', [])
it('const r = []; for (let a of [0, 1, 2]) { continue; r.push(a); } r', [])

describe('for-await-of', () => {
  it('for await (let i of []) {}', undefined)
  it('for await (let i of [1, 2, 3]) {}', undefined)
  it('for await (let i of [1, 2, 3]) { i }', 3)
  it('for await (let i of [1, 2, 3]) i', 3)
  it('const r = []; for await (let a of [1, 2, 3]) { r.push(a); } r', [1, 2, 3])
  it('const r = []; for await (let a of [1, 2, Promise.resolve(3)]) { r.push(a); } r', [1, 2, 3])
  // TODO: support async generators
  it.todo(
    `
      async function* foo() {
        yield 1;
        yield 2;
      }

      const r = [];
      for await (const num of foo()) {
        r.push(num);
      }
      r;
    `,
    [1, 2],
  )
  it(
    `
      const LIMIT = 3;
      const asyncIterable = {
        [Symbol.asyncIterator]() {
          let i = 0;
          return {
            next() {
              const done = i === LIMIT;
              const value = done ? undefined : i++;
              return Promise.resolve({ value, done });
            },
            return() {
              // This will be reached if the consumer called 'break' or 'return' early in the loop.
              return { done: true };
            },
          };
        },
      };

      const r = [];
      for await (const num of asyncIterable) {
        r.push(num);
      }
      r;
    `,
    [0, 1, 2],
  )
  it(
    `
      const LIMIT = 3;
      const asyncIterable = {
        [Symbol.asyncIterator]() {
          let i = 0;
          return {
            next() {
              const done = i === LIMIT;
              let value;
              if (done) {
                value = undefined;
              } else {
                value = i;
                i += 1;
              }
              return Promise.resolve({ value, done });
            },
            return() {
              // This will be reached if the consumer called 'break' or 'return' early in the loop.
              return { done: true };
            },
          };
        },
      };

      const r = [];
      for await (const num of asyncIterable) {
        r.push(num);
      }
      r;
    `,
    [0, 1, 2],
  )
  it(
    `
      const LIMIT = 3;
      const asyncIterable = {
        [Symbol.asyncIterator]() {
          let i = 0;
          return {
            next() {
              const done = i === LIMIT;
              let value;
              if (done) {
                value = undefined;
              } else {
                value = i;
                i += 1;
              }
              return Promise.resolve({ value, done });
            },
            return() {
              // This will be reached if the consumer called 'break' or 'return' early in the loop.
              return { done: true };
            },
          };
        },
      };

      const r = [];
      for await (const num of asyncIterable) {
        r.push(num);
        if (num === 1) {
          break;
        }
      }
      r;
    `,
    [0, 1],
  )
})
