import { it } from '../test-utils'

it('var x = 0; x++', 0)
it('var x = 0; ++x', 1)
it('let x = 0; x++', 0)
it('let x = 0; ++x', 1)
it('let x = 0; x--', 0)
it('let x = 0; --x', -1)
it(
  `
    Object.defineProperty(window, "x", { get() { return 1 }, set(v) {} })
    ;[++x, ++x, x++, x++, x]
  `,
  [1, 1, 1, 1, 1],
)
it(
  `
    var x = 0;
    [++x, ++x, x++, x++, x]
  `,
  [1, 2, 2, 3, 4],
)
it('let a = { x: 0 }; a.x++', 0)
it('let a = { x: 0 }; ++a.x', 1)
it(
  `
    const calls = []
    function fn() { calls.push('fn'); return window; }
    Object.defineProperty(window, 'x', { get() { calls.push('x get'); return 1 }, set(v) { calls.push('x set') } })
    const result = fn().x++;
    [result, ...calls];
  `,
  [1, 'fn', 'x get', 'x set'],
)
it('let x = 0; if (x++ >= 1) 1', undefined)
it('let x = 0; if (++x >= 1) 1', 1)
it('let x = "a"; x++; x', NaN)
it('let x = "a"; x--; x', NaN)
it('let x = 2n; x++; x', 3n)
it('let x = 2n; x--; x', 1n)
it('let x = new Number(1); x++; x', 2)
it('let x = new Number(1); x--; x', 0)
it('let x = Object(BigInt(1)); x++; x', 2n)
it('let x = Object(BigInt(1)); x--; x', 0n)
