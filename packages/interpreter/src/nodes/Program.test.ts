import { describe, expect } from 'vitest'
import { it } from '../test-utils'

it('', undefined)

describe('wrapObjectLiteral', () => {
  it('{ a: 1 }', { a: 1 }, { wrapObjectLiteral: true })
  it('  { a: 1 }  ', { a: 1 }, { wrapObjectLiteral: true })
  it(
    '{ a: 1, b() {}, get c() { return 1 } }',
    { a: 1, b: expect.any(Function), c: 1 },
    { wrapObjectLiteral: true },
  )
  it('await { a: 1 }', { a: 1 }, { wrapObjectLiteral: true })
})
