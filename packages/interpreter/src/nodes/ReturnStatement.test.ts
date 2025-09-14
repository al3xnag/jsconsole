import { expect } from 'vitest'
import { it } from '../test-utils'

it('function foo() { return 1 } foo();', 1)
it('function foo() { return 1; 2 } foo();', 1)
it('function foo() { return 1; return 2; } foo();', 1)
it('function foo() { { return 1; } return 2; } foo();', 1)
it('function foo() { try { return 1; } finally { return 2; } } foo();', 2)
it('function foo() { if (1) return 1 } foo();', 1)
it('function foo() { if (0) return 1 } foo();', undefined)
it('function foo() { 1 } foo();', undefined)
it('return 1', (x) =>
  expect(x.thrown).toThrow(
    Object.assign(new SyntaxError("'return' outside of function (1:0)"), {
      loc: { line: 1, column: 0 },
      pos: 0,
      raisedAt: 6,
    }),
  ))
