import { it } from '../test-utils'

it('{ 2 }', 2)
it('{ let x = 1; 2 }', 2)
it('{{ 2 }}', 2)
it('{{ 2 }};', 2)
it('{{ 2 };};', 2)
it('{1, 2, 3}', 3)
