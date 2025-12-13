import { describe, expect } from 'vitest'
import { it } from '../test-utils'

describe('empty', () => {
  it('for (var i in []) {}', undefined)
  it('for (let i in []) {}', undefined)
  it('for (const i in []) {}', undefined)
  it('for (var i in [0, 1, 2]) {}', undefined)
  it('for (let i in [0, 1, 2]) {}', undefined)
  it('for (const i in [0, 1, 2]) {}', undefined)
  it('for (let i in []);', undefined)
  it('for (let i in []) 0', undefined)
})

describe('statement result', () => {
  it('1; for (let i in [0, 1, 2]) {}', undefined)
  it('for (let i in ["a", "b", "c"]) { i }', '2')
  it('for (let i in ["a", "b", "c"]) i', '2')
})

describe('scope', () => {
  it('for (let i in [0, 1, 2]) {} i', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('i is not defined'))
  })
  it('i; for (let i in [0, 1, 2]) {}', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('i is not defined'))
  })
  it('for (var i in ["a", "b"]) {} i', '1')
  it('i; for (var i in ["a", "b"]) {}', undefined)
  it('const r = []; for (let a in [1, 2, 3]) { r.push(a); } r', ['0', '1', '2'])
  it(
    `
      const a = [];
      let x = -2;
      a.push(x);
      for (let x in [0]) { let x = 2; a.push(x); }
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
      for (const x in [0]) { const x = 2; a.push(x); }
      a.push(x);
      a;
    `,
    [-2, 2, -2],
  )
  it('let i; for (let i in []) {}', undefined)
  it('const i = 1; for (const i in []) {}', undefined)
  it('var i; for (var i in []) {}', undefined)
  it('let i; for (var i in []) {}', ({ thrown, globalObject }) => {
    expect(thrown).toThrow(globalObject.SyntaxError)
    expect(thrown).toThrow("Identifier 'i' has already been declared")
  })
  it('const i = 1; for (var i in []) {}', ({ thrown, globalObject }) => {
    expect(thrown).toThrow(globalObject.SyntaxError)
    expect(thrown).toThrow("Identifier 'i' has already been declared")
  })
  it(
    `
    const r = [];
    for (let a in [1,2,3]) { setTimeout(() => r.push(a), 0) }
    await new Promise((resolve) => setTimeout(resolve, 0));
    r;
  `,
    ['0', '1', '2'],
  )
  it(
    `
    const r = [];
    for (var a in [1,2,3]) { setTimeout(() => r.push(a), 0) }
    await new Promise((resolve) => setTimeout(resolve, 0));
    r;
  `,
    ['2', '2', '2'],
  )
})

it('const r = []; for (let {a = 1} in [0, 1, 2]) { r.push(a) } r', [1, 1, 1])
it('const r = []; for (let [a = 1] in [0, 1, 2]) { r.push(a) } r', ['0', '1', '2'])
it('const r = []; for (let a in [0, 1, 2]) { r.push(a); break; } r', ['0'])
it('const r = []; for (let a in [0, 1, 2]) { r.push(a); continue; } r', ['0', '1', '2'])
it('const r = []; for (let a in [0, 1, 2]) { break; r.push(a); } r', [])
it('const r = []; for (let a in [0, 1, 2]) { continue; r.push(a); } r', [])
