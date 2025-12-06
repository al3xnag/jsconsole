import { parseStack } from 'error-stack-parser-es/lite'
import { describe, expect, test } from 'vitest'
import { evaluate, Metadata } from '..'
import { getTestGlobalObject, it } from '../test-utils'
import { PublicGlobalScope } from '../types'

describe('Error call expression', () => {
  it('Error()', ({ value, globalObject }) => {
    expect(value).toEqual(new globalObject.Error())
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 1, col: 1 }])
  })

  it('Error("test")', ({ value, globalObject }) => {
    expect(value).toEqual(new globalObject.Error('test'))
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 1, col: 1 }])
  })

  it(`function fn() { throw Error('test') }; fn()`, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))

    const stack = parseStack(error.stack)

    expect(stack).toMatchObject([
      { function: 'fn', line: 1, col: 23 },
      { function: undefined, line: 1, col: 40 },
    ])

    expect(stack[0].file).toMatch(/^vm:\/\/\/VM\d+$/)
    expect(stack[1].file).toBe(stack[0].file)
  })

  it(`
  function fn() { 
    throw Error('test') 
  }
  fn()
    `, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))

    const stack = parseStack(error.stack)

    expect(stack).toMatchObject([
      { function: 'fn', line: 3, col: 11 },
      { function: undefined, line: 5, col: 3 },
    ])
  })

  it(`
  function fn() { 
    throw Error.bind(null, 'test')()
  }
  fn()
    `, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))

    const stack = parseStack(error.stack)

    expect(stack).toMatchObject([
      { function: 'fn', line: 3, col: 35 },
      { function: undefined, line: 5, col: 3 },
    ])
  })

  it(`
  function fn() { 
    throw Error.bind(null, 'test')()
  }
  fn.bind(1)()
    `, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))

    const stack = parseStack(error.stack)

    expect(stack).toMatchObject([
      { function: 'fn', line: 3, col: 35 },
      { function: undefined, line: 5, col: 13 },
    ])
  })

  it(`
  function fn(i) { 
    if (i < 3) { 
      fn(i + 1)
    } else { 
      throw Error('test')
    }
  }
  fn(0)
    `, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))

    const stack = parseStack(error.stack)

    expect(stack).toMatchObject([
      { function: 'fn', line: 6, col: 13 },
      { function: 'fn', line: 4, col: 7 },
      { function: 'fn', line: 4, col: 7 },
      { function: 'fn', line: 4, col: 7 },
      { function: undefined, line: 9, col: 3 },
    ])
  })

  it(`
  async function fn(i) { 
    if (i < 3) { 
      await fn(i + 1)
    } else { 
      throw Error('test')
    }
  }
  await fn(0)
    `, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))

    const stack = parseStack(error.stack)

    expect(stack).toMatchObject([
      { function: 'fn', line: 6, col: 13 },
      { function: 'fn', line: 4, col: 13 },
      { function: 'fn', line: 4, col: 13 },
      { function: 'fn', line: 4, col: 13 },
      { function: undefined, line: 9, col: 9 },
    ])
  })

  it(`
  async function fn(i) { 
    if (i < 3) { 
      fn(i + 1)
    } else { 
      throw Error('test')
    }
  }
  await fn(0)
    `, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))

    const stack = parseStack(error.stack)

    expect(stack).toMatchObject([
      { function: 'fn', line: 6, col: 13 },
      { function: 'fn', line: 4, col: 7 },
      { function: 'fn', line: 4, col: 7 },
      { function: 'fn', line: 4, col: 7 },
      { function: undefined, line: 9, col: 9 },
    ])
  })

  test('fn is from previous context', () => {
    const globalObject = getTestGlobalObject()
    const globalScope: PublicGlobalScope = { bindings: new Map() }
    const metadata = new Metadata(globalObject)

    evaluate(
      `
        function fn() { 
          throw Error("test") 
        }
      `,
      { globalObject, globalScope, metadata },
    )

    let error: any

    try {
      evaluate('fn()', { globalObject, globalScope, metadata })
    } catch (e) {
      error = e
    }

    expect(error).toEqual(new globalObject.Error('test'))

    const stack = parseStack(error.stack)

    expect(stack).toMatchObject([
      {
        col: 17,
        function: 'fn',
        line: 3,
      },
      {
        col: 1,
        function: undefined,
        line: 1,
      },
    ])

    expect(stack[0].file).toMatch(/^vm:\/\/\/VM\d+$/)
    expect(stack[1].file).toMatch(/^vm:\/\/\/VM\d+$/)
    expect(stack[0].file).not.toEqual(stack[1].file)
  })

  it(`
function foo() {
  function fn() { 
    var e = Error('test');
    throw e;
  }; 
  [1].forEach(
    fn
  )
}
foo()
`, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: 'fn', line: 4, col: 13 },
      { function: 'forEach', line: undefined, col: undefined, file: '(native)' },
      { function: 'foo', line: 7, col: 7 },
      { function: undefined, line: 11, col: 1 },
    ])
  })

  it(`
async function fn() {
  e = Error('test')
}
fn()
    `, async ({ value, globalObject }) => {
    await value
    expect(globalObject.e).toEqual(new globalObject.Error('test'))
    const stack = parseStack(globalObject.e.stack)
    expect(stack).toMatchObject([
      { function: 'fn', line: 3, col: 7 },
      { function: undefined, line: 5, col: 1 },
    ])
  })

  it(`
void setTimeout(() => {
  e = Error('test')
})
    `, async ({ globalObject }) => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(globalObject.e).toEqual(new globalObject.Error('test'))
    const stack = parseStack(globalObject.e.stack)
    expect(stack).toMatchObject([{ function: '<anonymous>', line: 3, col: 7 }])
  })

  it(`
function fn() { e = Error('test') }
void setTimeout(fn)
    `, async ({ globalObject }) => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(globalObject.e).toEqual(new globalObject.Error('test'))
    const stack = parseStack(globalObject.e.stack)
    expect(stack).toMatchObject([{ function: 'fn', line: 2, col: 21 }])
  })

  it(`
e = Error('test')
function fn() { return e }
fn()
    `, ({ globalObject, value }) => {
    expect(value).toEqual(new globalObject.Error('test'))
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 2, col: 5 }])
  })

  it(`
e = Error('test')
async function fn() { return e }
await fn()
    `, ({ globalObject, value }) => {
    expect(value).toEqual(new globalObject.Error('test'))
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 2, col: 5 }])
  })

  it(`
e = Error('test')
async function fn() { return e }
fn()
    `, async ({ globalObject, value }) => {
    const error = await value
    expect(error).toEqual(new globalObject.Error('test'))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 2, col: 5 }])
  })
})

describe('Error new expression', () => {
  it('new Error()', ({ value, globalObject }) => {
    expect(value).toEqual(new globalObject.Error())
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 1, col: 1 }])
  })

  it('new Error("test")', ({ value, globalObject }) => {
    expect(value).toEqual(new globalObject.Error('test'))
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 1, col: 1 }])
  })

  it(`
function fn() {
  throw new Error('test')
}
new fn()
    `, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: 'new fn', line: 3, col: 9 },
      { function: undefined, line: 5, col: 1 },
    ])
  })

  it(`function fn() { throw new Error('test') }; fn()`, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: 'fn', line: 1, col: 23 },
      { function: undefined, line: 1, col: 44 },
    ])
  })

  it(`function fn() { throw new Error('test') }; [1].forEach(fn)`, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: 'fn', line: 1, col: 23 },
      { function: 'forEach', line: undefined, col: undefined, file: '(native)' },
      { function: undefined, line: 1, col: 48 },
    ])
  })

  it(`function fn() { throw new Error('test') }; [1].forEach(() => fn())`, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: 'fn', line: 1, col: 23 },
      { function: '<anonymous>', line: 1, col: 62 },
      { function: 'forEach', line: undefined, col: undefined, file: '(native)' },
      { function: undefined, line: 1, col: 48 },
    ])
  })

  it(`
      async function foo() { 
        // await Promise.resolve(1); 
        [1].forEach(() => { throw new Error('test') }) 
      }
  
      await foo()
    `, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: '<anonymous>', line: 4, col: 35 },
      { function: 'forEach', line: undefined, col: undefined, file: '(native)' },
      { function: 'foo', line: 4, col: 13 },
      { function: undefined, line: 7, col: 13 },
    ])
  })

  it(`
      async function foo() { 
        await Promise.resolve(1); 
        [1].forEach(() => { throw new Error('test') }) 
      }
  
      await foo()
    `, ({ thrown, error }) => {
    expect(thrown).toThrow(new Error('test'))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: '<anonymous>', line: 4, col: 35 },
      { function: 'forEach', line: undefined, col: undefined, file: '(native)' },
      { function: 'foo', line: 4, col: 13 },
      { function: undefined, line: 7, col: 13 },
    ])
  })

  it(`
      async function foo() { 
        await Promise.resolve(1); 
        [1].forEach(() => { throw new Error('test') }) 
      }
  
      foo()
    `, async ({ value }) => {
    let error: any = null
    try {
      await value
    } catch (e) {
      error = e
    }

    expect(error).toEqual(new Error('test'))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: '<anonymous>', line: 4, col: 35 },
      { function: 'forEach', line: undefined, col: undefined, file: '(native)' },
      { function: 'foo', line: 4, col: 13 },
      { function: undefined, line: 7, col: 7 },
    ])
  })

  it(`
class A extends TypeError {}
new A('test')
    `, ({ value, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.TypeError)
    expect(value.name).toBe('TypeError')
    expect(value.message).toBe('test')
    expect(value.stack).toMatch(/^TypeError: test\n.*$/m)
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 3, col: 1 }])
  })

  it(`
class A extends TypeError { name = '' }
new A('test')
    `, ({ value, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.TypeError)
    expect(value.name).toBe('')
    expect(value.message).toBe('test')
    expect(value.stack).toMatch(/^A: test\n.*$/m)
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 3, col: 1 }])
  })

  it(`
class A extends TypeError { 
  constructor() { 
    super('test'); 
  } 
}
new A()
    `, ({ value, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.TypeError)
    expect(value.name).toBe('TypeError')
    expect(value.message).toBe('test')
    expect(value.stack).toMatch(/^TypeError: test\n.*$/m)
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([
      { function: 'new A', line: 4, col: 10 },
      { function: undefined, line: 7, col: 1 },
    ])
  })

  it(`
class A extends TypeError { 
  constructor() { 
    super('test'); 
    this.name = '';
  } 
}
new A()
    `, ({ value, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.TypeError)
    expect(value.name).toBe('')
    expect(value.message).toBe('test')
    expect(value.stack).toMatch(/^TypeError: test\n.*$/m)
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([
      { function: 'new A', line: 4, col: 10 },
      { function: undefined, line: 8, col: 1 },
    ])
  })

  it(`
class A extends TypeError { 
  constructor() { 
    super('test'); 
    this.name = '';
    throw new EvalError('test2');
  } 
}
new A()
    `, ({ error, globalObject }) => {
    expect(error).toBeInstanceOf(globalObject.EvalError)
    expect(error.name).toBe('EvalError')
    expect(error.message).toBe('test2')
    expect(error.stack).toMatch(/^EvalError: test2\n.*$/m)
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: 'new A', line: 6, col: 11 },
      { function: undefined, line: 9, col: 1 },
    ])
  })

  it('class A extends TypeError {}; new A()', ({ value, globalObject }) => {
    expect(value).toBeInstanceOf(globalObject.TypeError)
    expect(value.stack).toMatch(/^TypeError\n.*$/m)
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 1, col: 31 }])
  })

  it(`
class A { 
  constructor() { 
    throw new Error('test') 
  }
}

class B extends A {
  constructor() {
    super()
  }
}

new B()
    `, ({ error, globalObject }) => {
    expect(error).toBeInstanceOf(globalObject.Error)
    expect(error.message).toBe('test')
    expect(error.stack).toMatch(/^Error: test\n.*$/m)
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([
      { function: 'new A', line: 4, col: 11 },
      { function: 'new B', line: 10, col: 5 },
      { function: undefined, line: 14, col: 1 },
    ])
  })

  it(`
let arr = []

async function f1() {
  await new Promise((resolve) => setTimeout(resolve, 5))
  arr.push(new Error('test 1'))
}

async function f2() {
  await new Promise((resolve) => setTimeout(resolve, 10))
  arr.push(new Error('test 2'))
}

f1();
f2();
arr;
    `, async ({ value }) => {
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(value.length).toBe(2)
    const errStack1 = parseStack(value[0].stack)
    const errStack2 = parseStack(value[1].stack)
    expect(errStack1).toMatchObject([
      { function: 'f1', line: 6, col: 12 },
      { function: undefined, line: 14, col: 1 },
    ])
    expect(errStack2).toMatchObject([
      { function: 'f2', line: 11, col: 12 },
      { function: undefined, line: 15, col: 1 },
    ])
  })

  it(`
let arr = []

async function f1() {
  arr.push(new Error('test 1'))
}

async function f2() {
  arr.push(new Error('test 2'))
}

f1();
f2();
arr;
    `, async ({ value }) => {
    expect(value.length).toBe(2)
    const errStack1 = parseStack(value[0].stack)
    const errStack2 = parseStack(value[1].stack)
    expect(errStack1).toMatchObject([
      { function: 'f1', line: 5, col: 12 },
      { function: undefined, line: 12, col: 1 },
    ])
    expect(errStack2).toMatchObject([
      { function: 'f2', line: 9, col: 12 },
      { function: undefined, line: 13, col: 1 },
    ])
  })
})

describe('native interpreter errors', () => {
  it('"use strict"; false.false = false', ({ thrown, error, globalObject }) => {
    expect(thrown).toThrow(globalObject.TypeError)
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 1, col: 15 }])
  })

  it('"use strict"; delete [].length', ({ thrown, error }) => {
    expect(thrown).toThrow(new TypeError("Cannot delete property 'length' of #<Array>"))
    const stack = parseStack(error.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 1, col: 15 }])
  })
})

describe('Error.captureStackTrace', () => {
  it('let a = {}; Error.captureStackTrace(a); a', ({ value }) => {
    expect(value.stack).toMatch(/^Object\n.*$/m)
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 1, col: 19 }])
  })

  it('let a = {}; function fn() { Error.captureStackTrace(a); return a; }; fn()', ({ value }) => {
    expect(value.stack).toMatch(/^Object\n.*$/m)
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([
      { function: 'fn', line: 1, col: 35 },
      { function: undefined, line: 1, col: 70 },
    ])
  })

  it('let a = {}; function fn() { Error.captureStackTrace(a, fn); return a; }; fn()', ({
    value,
  }) => {
    expect(value.stack).toMatch(/^Object\n.*$/m)
    const stack = parseStack(value.stack)
    expect(stack).toMatchObject([{ function: undefined, line: 1, col: 74 }])
  })
})
