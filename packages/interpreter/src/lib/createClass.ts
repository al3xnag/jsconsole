import { FunctionExpression } from 'acorn'
import { evaluateNode } from '../nodes'
import {
  AnyClass,
  BlockScope,
  ClassFieldDefinitionRecord,
  ClassStaticBlockDefinitionRecord,
  Constructor,
  Context,
  EvaluatedNode,
  FunctionScope,
  PrivateElementMap,
  Scope,
} from '../types'
import { initializeInstanceElements, isConstructor, isObject } from './evaluation-utils'
import { toShortStringTag } from './toShortStringTag'
import { createFunction, getFnLength, getFnName } from './createFunction'
import { syncContext } from './syncContext'
import { getNodeText } from './getNodeText'
import { UNINITIALIZED } from '../constants'
import { InternalError } from './InternalError'
import { FunctionMetadata, getOrCreatePrivateElements } from './Metadata'
import { assertNever } from './assert'

const defineProperty = Object.defineProperty

export function* createClass(
  node: AnyClass,
  parentScope: Scope,
  context: Context,
): Generator<EvaluatedNode, Function, EvaluatedNode> {
  context = { ...context, strict: true }

  const { id, body } = node
  body.parent = node

  const classScope = getClassScope(node, parentScope)

  const { protoParent, constructorParent, superClass } = yield* getClassHeritage(
    node,
    parentScope,
    context,
  )

  const constructorExpression = getClassConstructor(node)

  let klass: Function
  if (constructorExpression) {
    function evaluate(this: object, args: unknown[], newTarget: Constructor) {
      if (superClass === undefined) {
        const gen = initializeInstanceElements(this, klass, context)
        while (!gen.next().done);
      }

      const { result, scope } = callInternal.call(
        superClass !== undefined ? UNINITIALIZED : this,
        args,
        newTarget,
        klass,
      )

      if (isObject(result)) {
        return result
      }

      if (superClass === undefined) {
        return this
      }

      if (result !== undefined) {
        throw new context.metadata.globals.TypeError(
          'Derived constructors may only return object or undefined',
        )
      }

      const { thisValue } = scope
      if (thisValue === UNINITIALIZED) {
        throw new context.metadata.globals.ReferenceError(
          "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
        )
      }

      if (!isObject(thisValue)) {
        throw new InternalError('thisValue must be an object')
      }

      return thisValue
    }

    klass = class {
      // https://tc39.es/ecma262/#sec-ecmascript-function-objects-construct-argumentslist-newtarget
      constructor(...args: unknown[]) {
        return evaluate.call(this, args, new.target)
      }
    }

    const fnMetadata: FunctionMetadata = {
      // constructable: true,
      // isClassConstructor: true,
      // sourceCode: getNodeText(node, context.code),
      // homeObject: klass.prototype,
      // privateMethods: instancePrivateMethods,
      // fields: instanceFields,
    }

    const { callInternal } = createFunction(constructorExpression, classScope, context, fnMetadata)
  } else {
    function evaluate(this: object, args: unknown[], newTarget: Constructor) {
      const inst = superClass !== undefined ? callSuper(superClass, args, newTarget, context) : this

      const gen = initializeInstanceElements(inst, klass, context)
      while (!gen.next().done);

      // https://tc39.es/ecma262/#sec-ecmascript-function-objects-construct-argumentslist-newtarget
      return inst
    }

    klass = class {
      constructor(...args: unknown[]) {
        return evaluate.call(this, args, new.target)
      }
    }
  }

  Object.setPrototypeOf(klass.prototype, protoParent)
  Object.setPrototypeOf(klass, constructorParent)

  const fnName = getFnName(node)
  defineProperty(klass, 'name', { value: fnName, configurable: true })

  // class A { constructor(a, b) {} }; A.length // 2
  // class A { constructor(a, b, ...c) {} }; A.length // 2
  // class A { constructor(a, b = 1, ...c) {} }; A.length // 1
  // class A extends Array {}; A.length // 0 (note that Array.length is 1)
  const fnLength = constructorExpression ? getFnLength(constructorExpression) : 0
  defineProperty(klass, 'length', { value: fnLength, configurable: true })

  if (id?.name) {
    classScope.bindings.set(id.name, { kind: 'const', value: klass })
  }

  const instancePrivateMethods: PrivateElementMap = Object.create(null)
  const instanceFields: ClassFieldDefinitionRecord[] = []
  const staticPrivateMethods: PrivateElementMap = Object.create(null)
  const staticElements: (ClassFieldDefinitionRecord | ClassStaticBlockDefinitionRecord)[] = []

  context.metadata.functions.set(klass, {
    constructable: true,
    isClassConstructor: true,
    sourceCode: getNodeText(node, context.code),
    homeObject: klass.prototype,
    privateMethods: instancePrivateMethods,
    fields: instanceFields,
  })

  syncContext?.tmpRefs.add(klass)

  for (let i = 0; i < body.body.length; i++) {
    const child = body.body[i]
    child.parent = body

    if (child.type === 'MethodDefinition') {
      if (child.kind === 'constructor') {
        continue
      }

      const obj = child.static ? klass : klass.prototype

      const { fn } = createFunction(child.value, classScope, context, {
        sourceCode: getNodeText(child, context.code),
        async: child.value.async,
        generator: child.value.generator,
        constructable: false,
        homeObject: obj,
      })

      if (child.kind === 'method') {
        if (child.key.type === 'PrivateIdentifier') {
          const name: string = child.key.name
          if (child.static) {
            staticPrivateMethods[name] = { value: fn, kind: 'method' }
          } else {
            instancePrivateMethods[name] = { value: fn, kind: 'method' }
          }
        } else {
          child.key.parent = child
          const name =
            child.key.type === 'Identifier'
              ? child.key.name
              : (yield* evaluateNode(child.key, classScope, context)).value

          const success = Reflect.defineProperty(obj, name, {
            value: fn,
            writable: true,
            enumerable: false,
            configurable: true,
          })

          if (!success) {
            throw new context.metadata.globals.TypeError(
              `Cannot set property '${toShortStringTag(name)}' of ${toShortStringTag(obj)}`,
            )
          }
        }
      } else if (child.kind === 'get') {
        if (child.key.type === 'PrivateIdentifier') {
          const name: string = child.key.name
          if (child.static) {
            staticPrivateMethods[name] = {
              kind: 'accessor',
              get: fn as () => any,
              set: staticPrivateMethods[name]?.set,
            }
          } else {
            instancePrivateMethods[name] = {
              kind: 'accessor',
              get: fn as () => any,
              set: instancePrivateMethods[name]?.set,
            }
          }
        } else {
          child.key.parent = child
          const name =
            child.key.type === 'Identifier'
              ? child.key.name
              : (yield* evaluateNode(child.key, classScope, context)).value

          Object.defineProperty(obj, name, {
            get: fn as () => any,
            enumerable: false,
            configurable: true,
          })
        }
      } else if (child.kind === 'set') {
        if (child.key.type === 'PrivateIdentifier') {
          const name: string = child.key.name
          if (child.static) {
            staticPrivateMethods[name] = {
              kind: 'accessor',
              get: staticPrivateMethods[name]?.get,
              set: fn as (v: any) => void,
            }
          } else {
            instancePrivateMethods[name] = {
              kind: 'accessor',
              get: instancePrivateMethods[name]?.get,
              set: fn as (v: any) => void,
            }
          }
        } else {
          child.key.parent = child
          const name =
            child.key.type === 'Identifier'
              ? child.key.name
              : (yield* evaluateNode(child.key, classScope, context)).value

          Object.defineProperty(obj, name, {
            set: fn as (v: any) => void,
            enumerable: false,
            configurable: true,
          })
        }
      }
    } else if (child.type === 'PropertyDefinition') {
      const obj = child.static ? klass : klass.prototype

      let name: string
      let initializer: Function | undefined

      if (child.key.type === 'Identifier' || child.key.type === 'PrivateIdentifier') {
        name = child.key.name
      } else {
        child.key.parent = child
        name = (yield* evaluateNode(child.key, classScope, context)).value
      }

      if (child.value) {
        child.value.parent = child
        const childValue = child.value

        initializer = function* initializer(this: any) {
          const subScope: FunctionScope = {
            kind: 'function',
            bindings: new Map(),
            parent: classScope,
            name: `Property initializer (${name})`,
            hasThisBinding: true,
            thisValue: this,
            newTarget: undefined,
            functionObject: initializer,
          }

          const value = (yield* evaluateNode(childValue, subScope, context)).value
          return value
        }

        context.metadata.functions.set(initializer, {
          homeObject: obj,
        })
      }

      const classFieldDefinitionRecord: ClassFieldDefinitionRecord = {
        type: 'field',
        name,
        isPrivate: child.key.type === 'PrivateIdentifier',
        initializer,
      }

      if (child.static) {
        staticElements.push(classFieldDefinitionRecord)
      } else {
        instanceFields.push(classFieldDefinitionRecord)
      }
    } else if (child.type === 'StaticBlock') {
      const obj = klass

      const initializer = function* initializer(this: any) {
        const subScope: FunctionScope = {
          kind: 'function',
          bindings: new Map(),
          parent: classScope,
          name: `Static block initializer`,
          hasThisBinding: true,
          thisValue: this,
          newTarget: undefined,
          functionObject: initializer,
        }

        for (const statement of child.body) {
          yield* evaluateNode(statement, subScope, context)
        }
      }

      context.metadata.functions.set(initializer, {
        homeObject: obj,
      })

      const classStaticBlockDefinitionRecord: ClassStaticBlockDefinitionRecord = {
        type: 'static-block',
        bodyFunction: initializer,
      }

      staticElements.push(classStaticBlockDefinitionRecord)
    } else {
      assertNever(child, 'Unexpected node type in class body')
    }
  }

  const privateElements = getOrCreatePrivateElements(klass, context)

  for (const name in staticPrivateMethods) {
    if (name in privateElements) {
      throw new context.metadata.globals.TypeError(
        `Private method '${name}' has already been declared`,
      )
    }

    const entry = staticPrivateMethods[name]
    privateElements[name] = entry
  }

  for (const record of staticElements) {
    if (record.type === 'field') {
      const { name, isPrivate, initializer } = record
      const value = initializer ? yield* initializer.call(klass) : undefined
      if (isPrivate) {
        if (name in privateElements) {
          throw new context.metadata.globals.TypeError(
            `Private field '${name}' has already been declared`,
          )
        }

        privateElements[name] = { value, kind: 'field' }
      } else {
        const success = Reflect.defineProperty(klass, name, {
          value,
          writable: true,
          enumerable: false,
          configurable: true,
        })

        if (!success) {
          throw new context.metadata.globals.TypeError(
            `Cannot set property '${toShortStringTag(name)}' of ${toShortStringTag(klass)}`,
          )
        }
      }
    } else if (record.type === 'static-block') {
      const { bodyFunction } = record
      yield* bodyFunction.call(klass)
    } else {
      assertNever(record, 'Unexpected class field definition record type')
    }
  }

  return klass
}

function getClassScope(node: AnyClass, parentScope: Scope): BlockScope {
  const classScope: BlockScope = {
    kind: 'block',
    parent: parentScope,
    bindings: new Map(),
    name: `Class block (${node.id?.name || 'anonymous'})`,
  }

  return classScope
}

type ClassHeritage = {
  // Object.getPrototypeOf(<class>.prototype)
  protoParent: object | null
  // Object.getPrototypeOf(<class>)
  constructorParent: Function
  // superClass !== undefined ? <class> extends superClass : <class>
  superClass: Constructor | null | undefined
}

function* getClassHeritage(
  node: AnyClass,
  scope: Scope,
  context: Context,
): Generator<EvaluatedNode, ClassHeritage, EvaluatedNode> {
  if (!node.superClass) {
    return {
      protoParent: context.metadata.globals.ObjectPrototype,
      constructorParent: context.metadata.globals.FunctionPrototype,
      superClass: undefined,
    }
  }

  node.superClass.parent = node
  const { value: superClass } = yield* evaluateNode(node.superClass, scope, context)

  if (superClass === null) {
    return {
      protoParent: null,
      constructorParent: context.metadata.globals.FunctionPrototype,
      superClass,
    }
  }

  if (!isConstructor(superClass, context)) {
    throw new context.metadata.globals.TypeError(
      `Class extends value ${toShortStringTag(superClass)} is not a constructor or null`,
    )
  }

  const protoParent = superClass.prototype

  // ii. If protoParent is not an Object and protoParent is not null, throw a TypeError exception.
  // NOTE: typeof null === 'object' is taken into account here.
  if (typeof protoParent !== 'object') {
    throw new context.metadata.globals.TypeError(
      `Class extends value does not have valid prototype property ${toShortStringTag(protoParent)}`,
    )
  }

  return {
    protoParent,
    constructorParent: superClass,
    superClass,
  }
}

function getClassConstructor(node: AnyClass): FunctionExpression | null {
  for (const statement of node.body.body) {
    if (statement.type === 'MethodDefinition' && statement.kind === 'constructor') {
      return statement.value
    }
  }

  return null
}

function callSuper(
  superClass: Constructor | null,
  args: unknown[],
  newTarget: Constructor,
  context: Context,
) {
  if (!superClass) {
    throw new context.metadata.globals.TypeError(
      `Super constructor ${toShortStringTag(superClass)} of ${toShortStringTag(newTarget)} is not a constructor`,
    )
  }

  return Reflect.construct(superClass, args, newTarget)
}
