import { FunctionExpression } from 'acorn'
import { evaluateNode } from '../nodes'
import {
  AnyClass,
  BlockScope,
  CallStack,
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
import { createFunction, getFnLength, getFnName } from './createFunction'
import { syncContext } from './syncContext'
import { getNodeText } from './getNodeText'
import { UNINITIALIZED } from '../constants'
import { InternalError } from './InternalError'
import { FunctionMetadata, getOrCreatePrivateElements } from './Metadata'
import { assertNever } from './assert'
import { createScope } from './createScope'
import { getNewCalleeCallStack } from './callStack'
import { throwError } from './throwError'
import {
  REFERENCE_ERROR_CLASS_CTOR_MUST_CALL_SUPER,
  TYPE_ERROR_CANNOT_SET_PROPERTY,
  TYPE_ERROR_CLASS_EXTENDS_INVALID_PROTOTYPE,
  TYPE_ERROR_CLASS_EXTENDS_NOT_A_CONSTRUCTOR_OR_NULL,
  TYPE_ERROR_DERIVED_CTOR_MAY_ONLY_RETURN_OBJECT_OR_UNDEFINED,
  TYPE_ERROR_PRIVATE_FIELD_ALREADY_DECLARED,
  TYPE_ERROR_PRIVATE_METHOD_ALREADY_DECLARED,
  TYPE_ERROR_SUPER_CONSTRUCTOR_IS_NOT_A_CONSTRUCTOR,
} from './errorDefinitions'

const defineProperty = Object.defineProperty

export function* createClass(
  node: AnyClass,
  parentScope: Scope,
  callStack: CallStack,
  context: Context,
): Generator<EvaluatedNode, Function, EvaluatedNode> {
  context = { ...context, strict: true }

  const { id, body } = node
  body.parent = node

  const classScope = getClassScope(node, parentScope)

  const { protoParent, constructorParent, superClass } = yield* getClassHeritage(
    node,
    parentScope,
    callStack,
    context,
  )

  const constructorExpression = getClassConstructor(node)

  let klass: Function
  if (constructorExpression) {
    const loc = constructorExpression.loc

    function evaluate(this: object, args: unknown[], newTarget: Constructor) {
      const callStack = getNewCalleeCallStack(klass)

      if (superClass === undefined) {
        try {
          const gen = initializeInstanceElements(this, klass, context)
          while (!gen.next().done);
        } catch (e) {
          throwError(e, loc, callStack, context)
        }
      }

      const { result, scope } = callInternal.call(
        superClass !== undefined ? UNINITIALIZED : this,
        args,
        newTarget,
        klass,
        callStack,
      )

      if (isObject(result)) {
        return result
      }

      if (superClass === undefined) {
        return this
      }

      if (result !== undefined) {
        throw TYPE_ERROR_DERIVED_CTOR_MAY_ONLY_RETURN_OBJECT_OR_UNDEFINED()
      }

      const { thisValue } = scope
      if (thisValue === UNINITIALIZED) {
        throw REFERENCE_ERROR_CLASS_CTOR_MUST_CALL_SUPER()
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
    const loc = node.loc

    function evaluate(this: object, args: unknown[], newTarget: Constructor) {
      const callStack = getNewCalleeCallStack(klass)
      try {
        const inst = superClass !== undefined ? callSuper(superClass, args, newTarget) : this

        const gen = initializeInstanceElements(inst, klass, context)
        while (!gen.next().done);

        // https://tc39.es/ecma262/#sec-ecmascript-function-objects-construct-argumentslist-newtarget
        return inst
      } catch (e) {
        throwError(e, loc, callStack, context)
      }
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
              : // TODO: toPropertyKey?
                (yield* evaluateNode(child.key, classScope, callStack, context)).value

          const success = Reflect.defineProperty(obj, name, {
            value: fn,
            writable: true,
            enumerable: false,
            configurable: true,
          })

          if (!success) {
            throw TYPE_ERROR_CANNOT_SET_PROPERTY(obj, name)
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
              : (yield* evaluateNode(child.key, classScope, callStack, context)).value

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
              : (yield* evaluateNode(child.key, classScope, callStack, context)).value

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
        name = (yield* evaluateNode(child.key, classScope, callStack, context)).value
      }

      if (child.value) {
        child.value.parent = child
        const childValue = child.value

        initializer = function* initializer(this: any) {
          const subScope: FunctionScope = createScope({
            kind: 'function',
            bindings: new Map(),
            parent: classScope,
            name: `Property initializer (${name})`,
            hasThisBinding: true,
            thisValue: this,
            newTarget: undefined,
            functionObject: initializer,
          })

          const value = (yield* evaluateNode(childValue, subScope, callStack, context)).value
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
        const subScope: FunctionScope = createScope({
          kind: 'function',
          bindings: new Map(),
          parent: classScope,
          name: `Static block initializer`,
          hasThisBinding: true,
          thisValue: this,
          newTarget: undefined,
          functionObject: initializer,
        })

        for (const statement of child.body) {
          yield* evaluateNode(statement, subScope, callStack, context)
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
      throw TYPE_ERROR_PRIVATE_METHOD_ALREADY_DECLARED(name)
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
          throw TYPE_ERROR_PRIVATE_FIELD_ALREADY_DECLARED(name)
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
          throw TYPE_ERROR_CANNOT_SET_PROPERTY(klass, name)
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
  const classScope: BlockScope = createScope({
    kind: 'block',
    parent: parentScope,
    bindings: new Map(),
    name: `Class block (${node.id?.name || 'anonymous'})`,
  })

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
  callStack: CallStack,
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
  const { value: superClass } = yield* evaluateNode(node.superClass, scope, callStack, context)

  if (superClass === null) {
    return {
      protoParent: null,
      constructorParent: context.metadata.globals.FunctionPrototype,
      superClass,
    }
  }

  if (!isConstructor(superClass, context)) {
    throw TYPE_ERROR_CLASS_EXTENDS_NOT_A_CONSTRUCTOR_OR_NULL(superClass)
  }

  const protoParent = superClass.prototype

  // ii. If protoParent is not an Object and protoParent is not null, throw a TypeError exception.
  // NOTE: typeof null === 'object' is taken into account here.
  if (typeof protoParent !== 'object') {
    throw TYPE_ERROR_CLASS_EXTENDS_INVALID_PROTOTYPE(protoParent)
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

function callSuper(superClass: Constructor | null, args: unknown[], newTarget: Constructor) {
  if (!superClass) {
    throw TYPE_ERROR_SUPER_CONSTRUCTOR_IS_NOT_A_CONSTRUCTOR(superClass, newTarget)
  }

  return Reflect.construct(superClass, args, newTarget)
}
