import { expect } from 'vitest'
import { it } from '../test-utils'

it('throw new Error("foo")', ({ thrown }) => expect(thrown).toThrow(new Error('foo')))
it('throw new Error("foo"); 2', ({ thrown }) => expect(thrown).toThrow(new Error('foo')))
it('throw "1"', ({ thrown }) => expect(thrown).toThrow('1'))
it('throw await Promise.resolve("1")', ({ thrown }) => expect(thrown).toThrow('1'))
it('try { throw 1 } catch (e) { e }', ({ value }) => expect(value).toBe(1))
it('try { throw await Promise.resolve(1) } catch (e) { e }', ({ value }) => expect(value).toBe(1))
