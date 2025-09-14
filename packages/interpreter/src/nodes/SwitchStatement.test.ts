import { describe, expect } from 'vitest'
import { it } from '../test-utils'

it('switch(0) {}', undefined)
it('switch(0) { case 0: 1 }', 1)
it('switch(1) { case 0: 1 }', undefined)
it('switch(0) { case 0: 0; break; case 1: 1; break; }', 0)
it('switch(1) { case 0: 0; break; case 1: 1; break; }', 1)
it('switch(0) { case 0: 0; case 1: 1; break; }', 1)
it('switch(0) { case 0: case 1: 1; break; }', 1)
it('switch(0) { case 0: case 1: default: 1; break; }', 1)
it('switch(1) { case 0: 0; case 1: 1; break; }', 1)
it('switch(1) { case 0: 0; break; default: 1; break; }', 1)
it('switch(2) { case 0: 0; break; default: 1; break; case 2: 2; break; }', 2)
it('switch(3) { case 0: 0; break; default: 1; break; case 2: 2; break; }', 1)
it('switch(3) { case 0: 0; break; default: 1; case 2: 2; break; }', 2)
it('switch(0) { case 0: 0; default: 1; case 2: 2; break; }', 2)
it('switch(2) { case 0: 0; break; case 1: 1; break; case 2: default: 2; break; }', 2)
it(
  `
    const steps = [];
    switch (1) {
      case (steps.push('>a'), 1): steps.push('a'); break;
      case (steps.push('>b'), 1): steps.push('b'); break;
    }
    steps;
  `,
  ['>a', 'a'],
)
it(
  `
    const steps = [];
    switch (1) {
      case (steps.push('>a'), 1): steps.push('a');
      case (steps.push('>b'), 1): steps.push('b'); break;
    }
    steps;
  `,
  ['>a', 'a', 'b'],
)
it(
  `
    const steps = [];
    switch (1) {
      case (steps.push('>a'), 1): steps.push('a');
      default: steps.push('c'); break;
      case (steps.push('>b'), 1): steps.push('b'); break;
    }
    steps;
`,
  ['>a', 'a', 'c'],
)
it(
  `
    const steps = [];
    switch (1) {
      case (steps.push('>a'), 1): steps.push('a');
      default: steps.push('c');
      case (steps.push('>b'), 1): steps.push('b'); break;
    }
    steps;
`,
  ['>a', 'a', 'c', 'b'],
)
it(
  `
    const steps = [];
    switch (2) {
      case (steps.push('>a'), 1): steps.push('a');
      default: steps.push('c');
      case (steps.push('>b'), 1): steps.push('b'); break;
    }
    steps;
`,
  ['>a', '>b', 'c', 'b'],
)
it(
  `
    const steps = [];
    switch (2) {
      case (steps.push('>a'), 1): steps.push('a');
      default: steps.push('c');
      case (steps.push('>b'), 1): steps.push('b');
    }
    steps;
`,
  ['>a', '>b', 'c', 'b'],
)
it(
  `
    const steps = [];
    switch (2) {
      case (steps.push('>a'), 1): steps.push('a');
      default: steps.push('c');
      case (steps.push('>b'), 2): steps.push('b');
    }
    steps;
`,
  ['>a', '>b', 'b'],
)
it(
  `
    const steps = [];
    switch (2) {
      case (steps.push('>a'), 1): steps.push('a');
      default: steps.push('c');
      case (steps.push('>b'), 2): steps.push('b'); break;
    }
    steps;
`,
  ['>a', '>b', 'b'],
)

describe('scope', () => {
  it('let a = 1; switch(0) { case 0: a; }', 1)
  it('let a = 1; switch(0) { case 0: let a = 2; a; }', 2)
  it('let a = 1; switch(0) { case 0: let a = 2; } a', 1)
  it('let a = 1; switch(0) { case 0: let a = 2; break; case 1: a; }', undefined)
  it('let a = 1; switch(1) { case 0: let a = 2; break; case 1: a; }', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError("Cannot access 'a' before initialization"))
  })
  it('let a = 1; switch(1) { case 0: let a = 2; case 1: a; }', ({ thrown }) => {
    expect(thrown).toThrow(new ReferenceError("Cannot access 'a' before initialization"))
  })
  it('let a = 1; switch(0) { case 0: let a = 2; case 1: a; }', 2)
})
