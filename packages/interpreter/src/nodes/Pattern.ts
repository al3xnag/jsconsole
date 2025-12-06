import { Pattern } from 'acorn'
import { evaluateNode } from '.'
import { assertNever } from '../lib/assert'
import { setPropertyValue } from '../lib/setPropertyValue'
import { setVariableValue } from '../lib/setVariableValue'
import { CallStack, Context, EvaluatedNode, Scope } from '../types'
import { evaluatePropertyReference } from './MemberExpression'
import { evaluatePropertyKey } from './Property'
import { syncContext } from '../lib/syncContext'
import {
  TYPE_ERROR_ARG_IS_NOT_ITERABLE,
  TYPE_ERROR_CANNOT_DESTRUCTURE_NULLISH,
} from '../lib/errorDefinitions'

const assign = Object.assign

// https://tc39.es/ecma262/#sec-runtime-semantics-destructuringassignmentevaluation
export function* evaluatePattern(
  node: Pattern,
  value: unknown,
  scope: Scope,
  callStack: CallStack,
  context: Context,
  { init = false }: { init?: boolean } = {},
): Generator<EvaluatedNode, void, EvaluatedNode> {
  switch (node.type) {
    case 'Identifier': {
      setVariableValue(node.name, value, scope, context, { init })
      break
    }
    case 'MemberExpression': {
      const ref = yield* evaluatePropertyReference(node, scope, callStack, context)
      setPropertyValue(ref.object, ref.propertyName, ref.thisValue, value, context)
      break
    }
    case 'ObjectPattern': {
      value = requireObjectCoercible(value)

      const seenKeys: unknown[] = []
      for (let i = 0; i < node.properties.length; i++) {
        const property = node.properties[i]
        property.parent = node

        if (property.type === 'Property') {
          const key = yield* evaluatePropertyKey(property, scope, callStack, context)
          seenKeys.push(key)
          const propValue = (value as any)[key as PropertyKey]
          yield* evaluatePattern(property.value, propValue, scope, callStack, context, { init })
        } else if (property.type === 'RestElement') {
          /*
            NOTE:
            var x = { a: 1, b: 2, get c() { delete x.d; return 3; }, d: 4 }
            var {...y} = x;
            console.log(y); // { a: 1, b: 2, c: 3 }

            var x = { a: 1, b: 2, get c() { delete x.d; return 3; }, d: 4 }
            var {d, c, ...y} = x;
            console.log(d, c, y); // 4, 3, { a: 1, b: 2 }

            var x = { a: 1, b: 2, get c() { delete x.d; return 3; }, d: 4 }
            var {c, d, ...y} = x;
            console.log(c, d, y); // 3, undefined, { a: 1, b: 2 }
          */
          const restValue = assign(context.metadata.globals.Object(), value)
          for (const key of seenKeys) {
            delete (restValue as any)[key as PropertyKey]
          }

          syncContext?.tmpRefs.add(restValue)

          yield* evaluatePattern(property, restValue, scope, callStack, context, { init })
        } else {
          assertNever(property, 'Unexpected property type')
        }
      }
      break
    }
    case 'ArrayPattern': {
      const iterator = getIterator(value)

      for (let i = 0; i < node.elements.length; i++) {
        const element = node.elements[i]
        if (!element) {
          // var [, b] = [1, 2]
          continue
        }

        element.parent = node

        let elValue: unknown
        if (element.type === 'RestElement') {
          const arr = iteratorToArray(iterator, context)
          syncContext?.tmpRefs.add(arr)
          elValue = arr
        } else {
          elValue = iterator.next().value
        }

        yield* evaluatePattern(element, elValue, scope, callStack, context, { init })
      }
      break
    }
    case 'RestElement': {
      node.argument.parent = node
      yield* evaluatePattern(node.argument, value, scope, callStack, context, { init })
      break
    }
    case 'AssignmentPattern': {
      /*
        var x;
        [x = foo()] = [undefined];
        function foo() { console.log('foo'); return 2; } // foo is called
        console.log(x); // 2
      */
      /*
        var x;
        [x = foo()] = [null];
        function foo() { console.log('foo'); return 2; } // foo is NOT called
        console.log(x); // null
      */
      node.right.parent = node
      node.left.parent = node
      value =
        value === undefined
          ? (yield* evaluateNode(node.right, scope, callStack, context)).value
          : value
      yield* evaluatePattern(node.left, value, scope, callStack, context, { init })
      break
    }
    default: {
      assertNever(node, 'Unexpected pattern type')
    }
  }
}

// https://tc39.es/ecma262/#sec-requireobjectcoercible
function requireObjectCoercible(value: unknown): NonNullable<unknown> {
  if (value == null) {
    throw TYPE_ERROR_CANNOT_DESTRUCTURE_NULLISH(value)
  }

  return value
}

// https://tc39.es/ecma262/#sec-getiterator
function getIterator(value: unknown): Iterator<unknown> {
  if (value == null) {
    throw TYPE_ERROR_ARG_IS_NOT_ITERABLE(value)
  }

  const iteratorMethod = (value as Partial<Iterable<unknown>>)[Symbol.iterator]
  if (typeof iteratorMethod !== 'function') {
    throw TYPE_ERROR_ARG_IS_NOT_ITERABLE(value)
  }

  return iteratorMethod.call(value)
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/toArray
function iteratorToArray(iterator: Iterator<unknown>, context: Context): unknown[] {
  const arr: unknown[] = context.metadata.globals.Array()

  while (true) {
    const { done, value } = iterator.next()
    if (done) {
      return arr
    }

    arr.push(value)
  }
}
