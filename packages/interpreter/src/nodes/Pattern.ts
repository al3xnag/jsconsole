import { Pattern } from 'acorn'
import { evaluateNode } from '.'
import { assertNever } from '../lib/assert'
import { setPropertyValue } from '../lib/setPropertyValue'
import { setVariableValue } from '../lib/setVariableValue'
import { Context, EvaluatedNode, Scope } from '../types'
import { evaluateMemberExpressionParts } from './MemberExpression'
import { evaluatePropertyKey } from './Property'
import { syncContext } from '../lib/syncContext'

const assign = Object.assign
const ObjectToString = Object.prototype.toString

// https://tc39.es/ecma262/#sec-runtime-semantics-destructuringassignmentevaluation
export function* evaluatePattern(
  node: Pattern,
  value: unknown,
  scope: Scope,
  context: Context,
  { init = false }: { init?: boolean } = {},
): Generator<EvaluatedNode, void, EvaluatedNode> {
  switch (node.type) {
    case 'Identifier': {
      setVariableValue(node.name, value, scope, context, { init })
      break
    }
    case 'MemberExpression': {
      const parts = yield* evaluateMemberExpressionParts(node, scope, context)
      setPropertyValue(parts.object, parts.propertyKey, value, context)
      break
    }
    case 'ObjectPattern': {
      value = requireObjectCoercible(value)

      const seenKeys: unknown[] = []
      for (let i = 0; i < node.properties.length; i++) {
        const property = node.properties[i]
        property.parent = node

        if (property.type === 'Property') {
          const key = yield* evaluatePropertyKey(property, scope, context)
          seenKeys.push(key)
          const propValue = (value as any)[key as PropertyKey]
          yield* evaluatePattern(property.value, propValue, scope, context, { init })
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
          const restValue = assign({}, value)
          for (const key of seenKeys) {
            delete (restValue as any)[key as PropertyKey]
          }

          syncContext?.tmpRefs.add(restValue)

          yield* evaluatePattern(property, restValue, scope, context, { init })
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
          const arr = iteratorToArray(iterator)
          syncContext?.tmpRefs.add(arr)
          elValue = arr
        } else {
          elValue = iterator.next().value
        }

        yield* evaluatePattern(element, elValue, scope, context, { init })
      }
      break
    }
    case 'RestElement': {
      node.argument.parent = node
      yield* evaluatePattern(node.argument, value, scope, context, { init })
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
      value = value === undefined ? (yield* evaluateNode(node.right, scope, context)).value : value
      yield* evaluatePattern(node.left, value, scope, context, { init })
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
    throw new TypeError(`Cannot destructure '${value}' as it is ${value}`)
  }

  return value
}

// https://tc39.es/ecma262/#sec-getiterator
function getIterator(value: unknown): Iterator<unknown> {
  if (value == null) {
    throw new TypeError(`${value} is not iterable`)
  }

  const iteratorMethod = (value as Partial<Iterable<unknown>>)[Symbol.iterator]
  if (typeof iteratorMethod !== 'function') {
    const valueStr =
      (typeof value === 'object' && value !== null) || typeof value === 'function'
        ? ObjectToString.call(value)
        : String(value)
    throw new TypeError(`${valueStr} is not iterable`)
  }

  return iteratorMethod.call(value)
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/toArray
function iteratorToArray(iterator: Iterator<unknown>): unknown[] {
  const arr: unknown[] = []

  while (true) {
    const { done, value } = iterator.next()
    if (done) {
      return arr
    }

    arr.push(value)
  }
}
