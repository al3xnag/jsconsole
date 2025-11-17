import { evaluateNode } from '../nodes'
import {
  AnyClass,
  AnyFunction,
  Constructor,
  Context,
  EvaluateGenerator,
  FunctionScope,
  Scope,
} from '../types'
import { initBindings } from './initBindings'
import { getFunctionParamIdentifiers } from './bound-identifiers'
import { UnsupportedOperationError } from './UnsupportedOperationError'
import { run } from './run'
import { evaluatePattern } from '../nodes/Pattern'
import { EMPTY, UNINITIALIZED, TYPE_RETURN } from '../constants'
import { getNodeText } from './getNodeText'
import { syncContext } from './syncContext'
import { hasDirective } from './directive'
import { FunctionMetadata } from './Metadata'
import { throwError } from './throwError'
import { createScope } from './createScope'

const defineProperty = Object.defineProperty

type FunctionCallMeta = {
  type: 'function'
  callee: Function
  this: unknown
  args: unknown[]
  newTarget: Constructor | undefined
  scope?: FunctionScope
}

type ArrowFunctionCallMeta = {
  type: 'arrow-function'
  callee: Function
  args: unknown[]
  scope?: FunctionScope
}

export type CreateFunctionResult = {
  fn: Function
  callInternal: (
    this: unknown,
    args: unknown[],
    newTarget?: Constructor,
    callee?: Function,
  ) => { result: unknown; scope: FunctionScope }
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

export function createFunction(
  node: AnyFunction,
  parentScope: Scope,
  context: Context,
  metadata?: FunctionMetadata,
): CreateFunctionResult {
  if (node.generator) {
    throw new UnsupportedOperationError('Generator function is not supported')
  }

  function* evaluateGenerator(meta: FunctionCallMeta | ArrowFunctionCallMeta): EvaluateGenerator {
    if (node.body.type === 'BlockStatement' && hasDirective(node.body.body, 'use strict')) {
      context = { ...context, strict: true }
    }

    const scope = yield* initScope(node, parentScope, context, meta)

    node.body.parent = node
    const evaluated = yield* evaluateNode(node.body, scope, context)

    if (node.body.type !== 'BlockStatement' || evaluated.type === TYPE_RETURN) {
      return evaluated
    }

    return { value: EMPTY }
  }

  function evaluateRunner(meta: FunctionCallMeta | ArrowFunctionCallMeta): unknown {
    try {
      const evaluated = run(evaluateGenerator(meta), context)

      if (evaluated instanceof Promise) {
        return evaluated.then(
          (evaluated) => {
            const resultValue = evaluated.value !== EMPTY ? evaluated.value : undefined
            return resultValue
          },
          (error) => {
            throwError(error, context)
          },
        )
      }

      const resultValue = evaluated.value !== EMPTY ? evaluated.value : undefined
      return resultValue
    } catch (error) {
      throwError(error, context)
    }
  }

  let fn: Function
  let evaluate: CreateFunctionResult['callInternal']

  // NOTE: generator functions are not supported at the moment.
  const isArrow = isArrowFunction(node)
  if (isArrow) {
    if (node.async) {
      evaluate = function evaluate(args: unknown[], _newTarget?: unknown, callee?: Function) {
        const meta: ArrowFunctionCallMeta = {
          type: 'arrow-function',
          callee: callee ?? fn,
          args,
        }

        const result = context.metadata.globals.PromiseResolve.call(
          context.metadata.globals.Promise,
          evaluateRunner(meta),
        )

        return { result, scope: meta.scope! }
      }

      fn = (...args: unknown[]) => evaluate(args).result
    } else {
      evaluate = function evaluate(args: unknown[], _newTarget?: unknown, callee?: Function) {
        const meta: ArrowFunctionCallMeta = {
          type: 'arrow-function',
          callee: callee ?? fn,
          args,
        }

        const result = evaluateRunner(meta)
        return { result, scope: meta.scope! }
      }

      fn = (...args: unknown[]) => evaluate(args).result
    }
  } else {
    if (node.async) {
      evaluate = function evaluate(
        this: unknown,
        args: unknown[],
        newTarget: Constructor | undefined,
        callee?: Function,
      ) {
        const meta: FunctionCallMeta = {
          type: 'function',
          callee: callee ?? fn,
          this: this,
          args,
          newTarget,
        }

        const result = context.metadata.globals.PromiseResolve.call(
          context.metadata.globals.Promise,
          evaluateRunner(meta),
        )

        return { result, scope: meta.scope! }
      }

      // NOTE: fn defined as "async" will return a Promise from the current realm,
      // but `context.metadata.globals.Promise` is expected:
      // `async function foo() { return 1 }; foo() instanceof Promise` must be true.
      // NOTE: async function must not have a "prototype" property, so that's why we define it
      // as a property of an object here.
      fn = {
        fn(this: unknown, ...args: unknown[]) {
          return evaluate.call(this, args, undefined).result
        },
      }.fn
    } else {
      evaluate = function evaluate(
        this: unknown,
        args: unknown[],
        newTarget: Constructor | undefined,
        callee?: Function,
      ) {
        const meta: FunctionCallMeta = {
          type: 'function',
          callee: callee ?? fn,
          this: this,
          args,
          newTarget,
        }

        const result = evaluateRunner(meta)
        return { result, scope: meta.scope! }
      }

      fn = function (this: unknown, ...args: unknown[]) {
        return evaluate.call(this, args, new.target as any).result
      }

      const fnPrototype = context.metadata.globals.ObjectCreate(
        context.metadata.globals.ObjectPrototype,
        {
          constructor: {
            configurable: true,
            enumerable: false,
            value: fn,
            writable: true,
          },
        },
      )

      Object.defineProperty(fn, 'prototype', { value: fnPrototype, writable: true })
    }
  }

  const fnName = getFnName(node)
  defineProperty(fn, 'name', { value: fnName, configurable: true })

  const fnLength = getFnLength(node)
  defineProperty(fn, 'length', { value: fnLength, configurable: true })

  if (node.async) {
    Object.setPrototypeOf(fn, context.metadata.globals.AsyncFunctionPrototype)
  } else {
    Object.setPrototypeOf(fn, context.metadata.globals.FunctionPrototype)
  }

  metadata ??= {
    sourceCode: getFnSourceCode(node, context),
    arrow: isArrow,
    async: node.async,
    generator: node.generator,
    constructable: isConstructable(node),
  }

  context.metadata.functions.set(fn, metadata)
  syncContext?.tmpRefs.add(fn)

  return { fn, callInternal: evaluate }
}

// function foo (a, b) {}; foo.length // 2
// function foo (a, b, ...c) {}; foo.length // 2
// function foo (a, b = 1, ...c) {}; foo.length // 1
export function getFnLength(node: AnyFunction): number {
  return node.params.filter((param) => param.type === 'Identifier').length
}

export function getFnName(node: AnyFunction | AnyClass): string {
  if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
    return node.id ? node.id.name : ''
  }

  if ((node.type === 'FunctionExpression' || node.type === 'ClassExpression') && node.id) {
    return node.id.name
  }

  const ancestor = node.parent
  if (!ancestor) {
    return ''
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

  // class A { fn() {} }
  if (ancestor.type === 'MethodDefinition') {
    return ancestor.key.type === 'Identifier' ? ancestor.key.name : ''
  }

  return ''
}

function getFnSourceCode(node: AnyFunction, context: Context): string {
  const { parent } = node
  if (parent?.type === 'Property' && parent.method) {
    return getNodeText(parent, context.code)
  }

  if (parent?.type === 'MethodDefinition') {
    return getNodeText(
      parent.kind === 'constructor' ? parent.parent!.parent! : parent,
      context.code,
    )
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

  if (node.parent?.type === 'MethodDefinition' && node.parent.kind !== 'constructor') {
    return false
  }

  return true
}

function isArrowFunction(node: AnyFunction): boolean {
  return node.type === 'ArrowFunctionExpression'
}

// https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-functiondeclarationinstantiation
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

  const isClassConstructor =
    context.metadata.functions.get(meta.callee)?.isClassConstructor ?? false

  const scope: FunctionScope = createScope({
    kind: 'function',
    parent: resolveParentScope(node, parentScope, meta),
    bindings: new Map(),
    name: `${isClassConstructor ? 'Class' : 'Function'} (${meta.callee.name || 'anonymous'})`,
    hasThisBinding: meta.type === 'function',
    thisValue: meta.type === 'function' ? getThisValue(meta.this, context) : undefined,
    newTarget: meta.type === 'function' ? meta.newTarget : undefined,
    functionObject: meta.callee,
  })

  meta.scope = scope

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
    // TODO: in non-strict mode, `arguments` (IArguments values) is in sync with argument values (https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-createmappedargumentsobject)
    scope.bindings.set('arguments', {
      kind: context.strict ? 'const' : 'var',
      value: createArgumentsObject(node, meta, context),
    })
  }

  const args: unknown[] = context.metadata.globals.ArrayFrom(meta.args)

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

function resolveParentScope(
  node: AnyFunction,
  parentScope: Scope,
  meta: FunctionCallMeta | ArrowFunctionCallMeta,
): Scope {
  // https://tc39.es/ecma262/#sec-runtime-semantics-instantiateordinaryfunctionexpression
  // > NOTE: The BindingIdentifier in a FunctionExpression can be referenced from inside the FunctionExpression's
  // > FunctionBody to allow the function to call itself recursively. However, unlike in a FunctionDeclaration,
  // > the BindingIdentifier in a FunctionExpression cannot be referenced from and does not affect the scope
  // > enclosing the FunctionExpression.
  // Covered by `describe('accessing function by its name inside function expression')` in FunctionExpression.test.ts.
  if (node.type === 'FunctionExpression' && node.id) {
    return {
      kind: 'block',
      bindings: new Map([[node.id.name, { value: meta.callee, kind: 'const' }]]),
      parent: parentScope,
      name: `Closure (${meta.callee.name || 'anonymous'})`,
    }
  }

  return parentScope
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

  return context.metadata.globals.Object(thisArg)
}

// https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-functiondeclarationinstantiation
// 22. If argumentsObjectNeeded is true, then
function createArgumentsObject(node: AnyFunction, meta: FunctionCallMeta, context: Context) {
  if (context.strict || !isSimpleParameterList(node)) {
    return createUnmappedArgumentsObject(meta, context)
  } else {
    return createMappedArgumentsObject(meta, context)
  }
}

// https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-createunmappedargumentsobject
function createUnmappedArgumentsObject(meta: FunctionCallMeta, context: Context) {
  const props: PropertyDescriptorMap = {
    length: {
      value: meta.args.length,
      writable: true,
      enumerable: false,
      configurable: true,
    },
    [Symbol.iterator]: {
      value: context.metadata.globals.ArrayPrototypeValues,
      writable: true,
      enumerable: false,
      configurable: true,
    },
    callee: {
      get() {
        throw new context.metadata.globals.TypeError(
          `'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them`,
        )
      },
      set() {
        throw new context.metadata.globals.TypeError(
          `'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them`,
        )
      },
      enumerable: false,
      configurable: false,
    },
    // Instead of [[ParameterMap]].
    // https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.prototype.tostring
    // 6. Else if O has a [[ParameterMap]] internal slot, let builtinTag be "Arguments".
    // `Object.prototype.toString.call(arguments)` -> "[object Arguments]"
    [Symbol.toStringTag]: {
      value: 'Arguments',
    },
  }

  Object.setPrototypeOf(props.callee.get, context.metadata.globals.FunctionPrototype)
  Object.setPrototypeOf(props.callee.set, context.metadata.globals.FunctionPrototype)

  for (let i = 0; i < meta.args.length; i++) {
    props[i] = {
      value: meta.args[i],
      writable: true,
      enumerable: true,
      configurable: true,
    }
  }

  return context.metadata.globals.ObjectCreate(context.metadata.globals.ObjectPrototype, props)
}

// https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-createmappedargumentsobject
function createMappedArgumentsObject(meta: FunctionCallMeta, context: Context) {
  const props: PropertyDescriptorMap = {
    length: {
      value: meta.args.length,
      writable: true,
      enumerable: false,
      configurable: true,
    },
    [Symbol.iterator]: {
      value: context.metadata.globals.ArrayPrototypeValues,
      writable: true,
      enumerable: false,
      configurable: true,
    },
    callee: {
      value: meta.callee,
      writable: true,
      enumerable: false,
      configurable: true,
    },
    // Instead of [[ParameterMap]].
    // https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.prototype.tostring
    // 6. Else if O has a [[ParameterMap]] internal slot, let builtinTag be "Arguments".
    // `Object.prototype.toString.call(arguments)` -> "[object Arguments]"
    [Symbol.toStringTag]: {
      value: 'Arguments',
    },
  }

  for (let i = 0; i < meta.args.length; i++) {
    props[i] = {
      value: meta.args[i],
      writable: true,
      enumerable: true,
      configurable: true,
    }
  }

  return context.metadata.globals.ObjectCreate(context.metadata.globals.ObjectPrototype, props)
}

// https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-static-semantics-issimpleparameterlist
function isSimpleParameterList(node: AnyFunction) {
  return node.params.every((param) => param.type === 'Identifier')
}
