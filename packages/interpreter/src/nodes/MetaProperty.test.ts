import { expect } from 'vitest'
import { it } from '../test-utils'

it('function fn() { return new.target }; fn()', undefined)
it('function fn() { this.x = new.target }; const a = new fn(); [a, a.x === fn]', [
  { x: expect.any(Function) },
  true,
])
