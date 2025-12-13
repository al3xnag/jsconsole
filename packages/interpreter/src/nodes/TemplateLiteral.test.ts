import { describe, expect } from 'vitest'
import { ExpectToThrowPossibleSideEffectError, it } from '../test-utils'

it('`1`', '1')
it('`\t`', '\t')
it('`\\t`', '\t')
it('`${1}`', '1')
it('`${1 + 1}`', '2')
it('`${"1" + "1"}`', '11')
it('x = "world"; `Hello, ${x}!`', 'Hello, world!')
it('`1${x = 23}`', '123')
it('`1${x = 23, 45}`', '145')
it('`1${{}}`', '1[object Object]')
it('`1${[]}`', '1')
it('`${1}${2}${3}`', '123')
it('`\\9`', ({ thrown }) => {
  expect(thrown).toThrow(new SyntaxError('Bad escape sequence in untagged template literal'))
})
it('`42${x = 123}`', ExpectToThrowPossibleSideEffectError, { throwOnSideEffect: true })

describe('string conversion semantics', () => {
  it('`${{ toString: () => "2" }}`', '2')
  it('`${{ toString: () => 2 }}`', '2')
  it('`${{ valueOf: () => "1", toString: () => "2" }}`', '2')
  it('`${{ valueOf: () => "1" }}`', '[object Object]')
  it('`${Object.create(null)}`', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('Cannot convert object to primitive value'))
  })
  it('`${Symbol()}`', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('Cannot convert a Symbol value to a string'))
  })
  it('`${Object.create(null, { valueOf: { value: () => "1" } })}`', '1')
  it('`${Object.create(null, { valueOf: { value: () => 1 } })}`', '1')
  it('`${{ [Symbol.toPrimitive]: () => 1, toString: () => 2, valueOf: () => 3 }}`', '1')
})
