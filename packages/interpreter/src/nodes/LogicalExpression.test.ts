import { it } from '../test-utils'

it('true && false', false)
it('(true && false) || true', true)
it('(true || false) && true', true)
it('(null ?? false) || true', true)
it('(null ?? false) || false', false)
it('(null ?? true) || false', true)
it('false && foo()', false)
it('true || foo()', true)
it('0 ?? foo()', 0)
it('0 ?? foo(a, b, c())', 0)
it('true && await Promise.resolve(1)', 1)
