import { expect } from 'vitest'
import { it } from '../test-utils'

it('try { 1 } catch { 2 }', 1)
it('try { 1 } finally { 2 }', 1)
it('try { 1 } catch { 2 } finally {}', 1)
it('try { 1 } catch { 2 } finally { 3 }', 1)
it('try { throw 1 } catch { 2 } finally { 3 }', 2)
it('try { throw 1 } catch (e) { e }', 1)
it('try { throw 1 } catch (e) {}; e', ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError('e is not defined'))
})
it('try { throw 1 } catch (e) {var e = 2}; e', undefined)
it('try { throw 1 } catch (e) {let e = 2}; e', ({ thrown }) => {
  expect(thrown).toThrow(new SyntaxError("Identifier 'e' has already been declared"))
})
it('(function() { try { return 1 } catch { 2 } })()', 1)
it('(function() { try { return 1 } finally { return 2 } })()', 2)
it('(function() { try { throw 1 } catch { return 2 } })()', 2)
it('(function() { try { throw 1 } catch { return 2 } finally { return 3 } })()', 3)
it('try { await 1 } catch { 2 }', 1)
it('try { await Promise.resolve(1) } catch { 2 }', 1)
it('try { await Promise.reject(1) } catch { 2 }', 2)
it('try { await Promise.reject(1) } catch { await Promise.resolve(2) }', 2)
it('try { await Promise.reject(1) } catch { await Promise.resolve(2) } finally { await 3 }', 2)
it('try {} catch {}', undefined)
it('1; try {} catch {}', undefined)
it('try { throw new Error("err") } catch ({message}) { message }', 'err')
it('try { throw new Error("err") } catch ({message}) {}; message', ({ thrown }) => {
  expect(thrown).toThrow(new ReferenceError('message is not defined'))
})
it('try { throw new Error("err") } catch ({message}) {var message = 0}', ({ thrown }) => {
  expect(thrown).toThrow(new SyntaxError("Identifier 'message' has already been declared"))
})
