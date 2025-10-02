import { evaluateNode } from '../nodes'
import { AnyFunction, Context, EvaluateGenerator, FunctionScope, Scope } from '../types'
import { initBindings } from './initBindings'
import { getFunctionParamIdentifiers } from './bound-identifiers'
import { UnsupportedOperationError } from './UnsupportedOperationError'
import { run } from './run'
import { evaluatePattern } from '../nodes/Pattern'
import { EMPTY, UNINITIALIZED, TYPE_RETURN } from '../constants'
import { iterateAncestors } from './iterateAncestors'
import { getNodeText } from './getNodeText'
import { syncContext } from './syncContext'
import { hasDirective } from './directive'

const defineProperty = Object.defineProperty

type FunctionCallMeta = {
  type: 'function'
  callee: Function
  this: unknown
  arguments: IArguments
  newTarget: unknown
}

type ArrowFunctionCallMeta = {
  type: 'arrow-function'
  callee: Function
  args: unknown[]
}

/*
  TODO:
  function alert() {} - overrides globalThis.alert
    - in FF: same
  function document() {} - throws SyntaxError: Identifier 'document' has already been declared
    - in FF: TypeError: cannot declare global binding 'document': property must be configurable or both writable and enumerable
  FIXME: { function document() {} } - does not override globalThis.document
    - in FF: same
  { function alert() {} } - overrides globalThis.alert
    - in FF: same

  Object.getOwnPropertyDescriptor(globalThis, 'document')
    -> {set: undefined, enumerable: true, configurable: false, get: ƒ}

  Object.getOwnPropertyDescriptor(globalThis, 'alert')
    -> {writable: true, enumerable: true, configurable: true, value: ƒ}
  
  window.document = () => {} - does not override globalThis.document
  (function() { 'use strict'; window.document = () => {} })() - TypeError: Cannot set property document of #<Window> which has only a getter
  Object.defineProperty(window, 'document', { value: () => {} }) - TypeError: Cannot redefine property: document (both strict and non-strict modes)
*/

export function createFunction(node: AnyFunction, scope: Scope, context: Context): Function {
  if (node.generator) {
    throw new UnsupportedOperationError()
  }

  function* evaluateGenerator(meta: FunctionCallMeta | ArrowFunctionCallMeta): EvaluateGenerator {
    if (node.body.type === 'BlockStatement' && hasDirective(node.body.body, 'use strict')) {
      context = { ...context, strict: true }
    }

    const fnScope = yield* initScope(node, scope, context, meta)

    node.body.parent = node
    const evaluated = yield* evaluateNode(node.body, fnScope, context)

    if (node.body.type !== 'BlockStatement' || evaluated.type === TYPE_RETURN) {
      return evaluated
    }

    return { value: EMPTY }
  }

  function evaluateRunner(meta: FunctionCallMeta | ArrowFunctionCallMeta): unknown {
    const evaluated = run(evaluateGenerator(meta), context)

    if (evaluated instanceof Promise) {
      return evaluated.then((evaluated) => {
        const resultValue = evaluated.value !== EMPTY ? evaluated.value : undefined
        return resultValue
      })
    }

    const resultValue = evaluated.value !== EMPTY ? evaluated.value : undefined
    return resultValue
  }

  let fn: Function
  // NOTE: generator functions are not supported at the moment.
  const isArrow = isArrowFunction(node)
  if (isArrow) {
    function evaluate(...args: unknown[]) {
      return evaluateRunner({
        type: 'arrow-function',
        callee: fn,
        args,
      })
    }

    fn = node.async
      ? async (...args: unknown[]) => evaluate(...args)
      : (...args: unknown[]) => evaluate(...args)
  } else {
    function evaluate(this: unknown, _arguments: IArguments, newTarget: unknown) {
      return evaluateRunner({
        type: 'function',
        callee: fn,
        this: this,
        arguments: _arguments,
        newTarget,
      })
    }

    fn = node.async
      ? async function (this: unknown) {
          return evaluate.call(this, arguments, new.target)
        }
      : function (this: unknown) {
          return evaluate.call(this, arguments, new.target)
        }
  }

  const fnName = getFnName(node)
  defineProperty(fn, 'name', { value: fnName, configurable: true })

  // function foo (a, b) {}; foo.length // 2
  // function foo (a, b, ...c) {}; foo.length // 2
  // function foo (a, b = 1, ...c) {}; foo.length // 1
  const fnLength = node.params.filter((param) => param.type === 'Identifier').length
  defineProperty(fn, 'length', { value: fnLength, configurable: true })

  const originalFnCode = getFnSourceCode(node, context)
  context.metadata.functions.set(fn, {
    sourceCode: originalFnCode,
    arrow: isArrow,
    async: node.async,
    generator: node.generator,
    constructable: isConstructable(node),
  })

  syncContext?.tmpRefs.add(fn)

  return fn
}

function getFnName(node: AnyFunction): string {
  if (node.type === 'FunctionDeclaration') {
    return node.id ? node.id.name : ''
  }

  if (node.type === 'FunctionExpression' && node.id) {
    return node.id.name
  }

  for (const ancestor of iterateAncestors(node)) {
    // const a = (function() {})
    if (ancestor.type === 'ParenthesizedExpression') {
      continue
    }

    // const a = function() {}
    if (ancestor.type === 'VariableDeclarator') {
      return ancestor.id.type === 'Identifier' ? ancestor.id.name : ''
    }

    // a = function() {}
    if (ancestor.type === 'AssignmentExpression') {
      return ancestor.left.type === 'Identifier' ? ancestor.left.name : ''
    }

    // function foo(a = function bar() {}) { return a.name }
    if (ancestor.type === 'AssignmentPattern') {
      return ancestor.left.type === 'Identifier' ? ancestor.left.name : ''
    }

    // ({ fn() {} })
    if (ancestor.type === 'Property') {
      return ancestor.key.type === 'Identifier' ? ancestor.key.name : ''
    }

    return ''
  }

  return ''
}

function getFnSourceCode(node: AnyFunction, context: Context): string {
  const { parent } = node
  if (parent?.type === 'Property' && parent.method) {
    return getNodeText(parent, context.code)
  }

  return getNodeText(node, context.code)
}

function isConstructable(node: AnyFunction): boolean {
  if (node.async || node.generator || isArrowFunction(node)) {
    return false
  }

  if (node.parent?.type === 'Property' && node.parent.method) {
    return false
  }

  return true
}

function isArrowFunction(node: AnyFunction): boolean {
  return node.type === 'ArrowFunctionExpression'
}

function* initScope(
  node: AnyFunction,
  parentScope: Scope,
  context: Context,
  meta: FunctionCallMeta | ArrowFunctionCallMeta,
) {
  /*
      NOTE:
      function fn(a = 1, b = a, c = 3) { 
        var a = 2; 
        function foo() { return [a, b, c] }; 
        console.dir(foo) 
      }
      fn()
      // -> ƒ foo()
      // [[Scopes]]: Scopes[3]
      //   0: Block (fn) {a: 2}
      //   1: Closure (fn) {b: 1, c: 3}
      //   2: Global {window: Window, ...}
    */

  const scope: FunctionScope = {
    kind: 'function',
    parent: parentScope,
    bindings: new Map(),
    name: `Function (${meta.callee.name || 'anonymous'})`,
    hasThisBinding: false,
    thisValue: undefined,
    newTarget: undefined,
  }

  // https://tc39.es/ecma262/#sec-runtime-semantics-instantiateordinaryfunctionexpression
  // > NOTE: The BindingIdentifier in a FunctionExpression can be referenced from inside the FunctionExpression's
  // > FunctionBody to allow the function to call itself recursively. However, unlike in a FunctionDeclaration,
  // > the BindingIdentifier in a FunctionExpression cannot be referenced from and does not affect the scope
  // > enclosing the FunctionExpression.
  // Covered by `describe('accessing function by its name inside function expression')` in FunctionExpression.test.ts.
  if (node.type === 'FunctionExpression' && node.id) {
    scope.parent = {
      kind: 'block',
      bindings: new Map([[node.id.name, { value: meta.callee, kind: 'const' }]]),
      parent: parentScope,
      name: `Closure (${meta.callee.name || 'anonymous'})`,
    }
  }

  const paramIdentifiers = getFunctionParamIdentifiers(node)
  paramIdentifiers.forEach((identifier) => {
    scope.bindings.set(identifier.name, {
      value: UNINITIALIZED,
      kind: 'var',
    })
  })

  if (meta.type === 'function') {
    // NOTE: function foo(a, b = arguments[0], [c] = [], ...d) { console.log(a,b,c,d) }
    //       foo(1) // 1 1 undefined []
    // TODO: in non-strict mode, `arguments` (IArguments values) is in sync with argument values
    scope.bindings.set('arguments', { kind: 'var', value: meta.arguments })
    scope.hasThisBinding = true
    // https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarycallbindthis
    scope.thisValue = getThisValue(meta.this, context)
    scope.newTarget = meta.newTarget
  }

  const args: unknown[] = meta.type === 'function' ? [...meta.arguments] : meta.args

  // function foo(a, {b} = {}, [c] = [], ...d) {}
  // TODO: in non-strict mode, `arguments` (IArguments values) is in sync with argument values
  for (let i = 0; i < node.params.length; i++) {
    const param = node.params[i]

    let value: unknown
    if (param.type === 'RestElement') {
      value = args.slice(i)
    } else {
      value = args[i]
    }

    param.parent = node
    yield* evaluatePattern(param, value, scope, context, { init: true })
  }

  if (node.body.type === 'BlockStatement') {
    node.body.parent = node
    initBindings(node.body, scope, context, { var: true, lex: true })
  }

  return scope
}

// https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarycallbindthis
function getThisValue(thisArg: unknown, context: Context): unknown {
  if (context.strict) {
    return thisArg
  }

  if (thisArg == null) {
    return context.globalObject
  }

  if (typeof thisArg === 'object' || typeof thisArg === 'function') {
    return thisArg
  }

  return Object(thisArg)
}
