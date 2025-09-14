import { it } from '../test-utils'

it('[1, 2, 3]', [1, 2, 3])
it('[1, 2, 3][1]', 2)
it("['nested', ['array', 1, 2]]", ['nested', ['array', 1, 2]])
it('[1, ...[2, 3], 4][1]', 2)

it('[1, 2,]', [1, 2])
it('[1, 2,].length', 2)

// Actually it's [1, <empty>] (which is not the same as [1, undefined])
it('[1,,]', [1, undefined])
it('[1,,].length', 2)
it('[1,,][0]', 1)
it('[1,,][1]', undefined)
it('1 in [1,,]', false)
it('1 in [,1,]', true)
it('[,1,].length', 2)
it('Object.keys([,1,])', ['1'])

// [empty, empty]
it('[,,]', [undefined, undefined])
it('[,,].length', 2)
it('[,,][0]', undefined)
it('Object.keys([,,])', [])
