import { expect } from 'vitest'
import { it } from '../test-utils'

it('while (false) { 1 }', undefined)
it('var x = 0; while (x < 10) { x += 1 }', 10)
it('var x = 0; while (x < 10) { x += 1; break; }', 1)
it('var x = 0; while (x < 10) { x += 1; if (x === 4) { [x]; break; -1 } }', [4])
// Each iteration of the loop creates a new scope for the loop body.
it(`
  var x = 0;
  while (x < 5) {
    x += 1;
    
    if (x === 3) {
      console.log(y);
    }
    
    let y = x;
  }
`, ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError("Cannot access 'y' before initialization"))
})
