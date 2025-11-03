import { describe, expect } from 'vitest'
import { it } from '../test-utils'

describe('empty', () => {
  it('for (var i = 0; i < 3; i++) {}', undefined)
  it('for (let i = 0; i < 3; i++) {}', undefined)
  it('for (const i = 0; i < 3; i++) {}', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('Assignment to constant variable.'))
  })
  it('for (var i = 0; i < 3; i++);', undefined)
  it('for (let i = 0; i < 3; i++);', undefined)
  it('for (const i = 0; i < 3; i++);', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('Assignment to constant variable.'))
  })
})

describe('statement result', () => {
  it('1; for (let i = 0; i < 3; i++) {}', undefined)
  it('for (let i = 0; i < 3; i++) i', 2)
  it('for (let i = 0; i < 3; i++) { i }', 2)
  it('for (let i = 0; i < 3; i++) { i; break; }', 0)
})

describe('scope', () => {
  it('for (let i = 0; i < 3; i++) {} i', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('i is not defined'))
  })
  it('i; for (let i = 0; i < 3; i++) {}', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError('i is not defined'))
  })
  it('for (var i = 0; i < 3; i++) {} i', 3)
  it(
    `
      const r = [];
      for (let i = 0; i < 3; i++) { setTimeout(() => r.push(i), 0) }
      await new Promise((resolve) => setTimeout(resolve, 0));
      r;
    `,
    [0, 1, 2],
  )
  it(
    `
      const r = [];
      for (var i = 0; i < 3; i++) { setTimeout(() => r.push(i), 0) }
      await new Promise((resolve) => setTimeout(resolve, 0));
      r;
    `,
    [3, 3, 3],
  )
})

it(
  `
    const steps = [];
    let __i = undefined;

    Object.defineProperty(globalThis, 'i', {
      get() {
        steps.push(__i + ' get')
        return __i;
      },
      set(v) {
        __i = v;
        steps.push(__i + ' set')
      },
    })
    
    for (
      (steps.push(__i + ' before init'), i = 0, steps.push(__i + ' after init'));
      (steps.push(__i + ' test'), i < 2);
      (steps.push(__i + ' before update'), i++, steps.push(__i + ' after update'))
    ) {
      steps.push(__i + ' body')
    }

    steps;
  `,
  [
    'undefined before init',
    '0 set',
    '0 after init',
    '0 test',
    '0 get',
    '0 body',
    '0 before update',
    '0 get',
    '1 set',
    '1 after update',
    '1 test',
    '1 get',
    '1 body',
    '1 before update',
    '1 get',
    '2 set',
    '2 after update',
    '2 test',
    '2 get',
  ],
)

it('for (let i = 0; i < 3; i++) { await Promise.resolve(i) }', 2)
