import { it } from '../test-utils'

it(`a: 1`, 1)
it(`a: b: 1`, 1)
it(`{ a: 1 }`, 1)
it(`{ a: 1 }`, { a: 1 }, { wrapObjectLiteral: true })
it(`a: { break a; }`, undefined)
it(`a: { 1; break a; }`, 1)
it(`function fn() { a: return 1 }; fn()`, 1)
it(`switch(1) { case 1: a: 2 }`, 2)
it(`a: if (1) break a;`, undefined)
it(`a: { if (1) break a; throw 2; }`, undefined)
it(
  `a: b: for (var i = 0; i < 3; i++) {
    c: d: for (var j = 0; j < 3; j++) {
      {
        continue a;
        throw 1;
      }
    }
    throw 2;
  }`,
  undefined,
)
it(
  `a: b: for (var i = 0; i < 3; i++) {
    c: d: for (var j = 0; j < 3; j++) {
      {
        continue d;
        throw 1;
      }
    }
    [i, j];
  }`,
  [2, 3],
)
it(`a: for (var j = 0; j < 3; j++) { j; break a; }`, 0)
