import { ForOfStatement } from 'acorn'
import { evaluateNode } from '.'
import { BlockScope, CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { EMPTY, TYPE_AWAIT } from '../constants'
import { evaluatePattern } from './Pattern'
import { initBindings } from '../lib/initBindings'
import { breakableStatementCompletion, loopContinues, updateEmpty } from '../lib/evaluation-utils'
import { createScope } from '../lib/createScope'
import { TYPE_ERROR_EXPR_IS_NOT_ITERABLE } from '../lib/errorDefinitions'

// https://tc39.es/ecma262/#sec-for-in-and-for-of-statements
export function* evaluateForOfStatement(
  node: ForOfStatement,
  scope: Scope,
  callStack: CallStack,
  context: Context,
  labels?: string[],
): EvaluateGenerator {
  let value: unknown = undefined

  const { left, right, body } = node
  left.parent = node
  right.parent = node
  body.parent = node

  const { value: object } = yield* evaluateNode(right, scope, callStack, context)
  const { iterable, isAsyncIterator } = getIterable(node, object, context)

  for (let iterValue of iterable) {
    if (node.await) {
      const awaited = yield { type: TYPE_AWAIT, value: iterValue }
      if (isAsyncIterator) {
        const iteratorResult = awaited.value as IteratorResult<unknown>
        if (iteratorResult.done) {
          break
        }

        iterValue = iteratorResult.value
      } else {
        iterValue = awaited.value
      }
    }

    const forOfScope: BlockScope = createScope({
      kind: 'block',
      parent: scope,
      bindings: new Map(),
      name: 'ForOf',
    })

    if (left.type === 'VariableDeclaration') {
      initBindings(left, forOfScope, context, { var: false, lex: true })

      // Only one declarator is allowed.
      const declarator = left.declarations[0]!
      declarator.parent = left
      yield* evaluatePattern(declarator.id, iterValue, forOfScope, callStack, context, {
        init: true,
      })
    } else {
      yield* evaluatePattern(left, iterValue, forOfScope, callStack, context)
    }

    const evaluatedBody = yield* evaluateNode(body, forOfScope, callStack, context)

    if (!loopContinues(evaluatedBody, labels)) {
      const evaluated = breakableStatementCompletion(updateEmpty(evaluatedBody, value))
      return evaluated
    }

    if (evaluatedBody.value !== EMPTY) {
      value = evaluatedBody.value
    }
  }

  return { value }
}

function getIterable(
  node: ForOfStatement,
  object: Partial<AsyncIterable<unknown>> | Partial<Iterable<unknown>>,
  context: Context,
): { iterable: Iterable<unknown>; isAsyncIterator: boolean } {
  if (node.await && object != null && Symbol.asyncIterator in object) {
    if (typeof object[Symbol.asyncIterator] !== 'function') {
      throw TYPE_ERROR_EXPR_IS_NOT_ITERABLE(node.right, context)
    }

    const asyncIterator = (object as AsyncIterable<unknown>)[Symbol.asyncIterator]()

    return {
      iterable: {
        *[Symbol.iterator]() {
          while (true) {
            yield asyncIterator.next()
          }
        },
      },
      isAsyncIterator: true,
    }
  }

  return {
    // Actually it's not necessarily iterable, so it might be thrown in runtime.
    iterable: object as Iterable<unknown>,
    isAsyncIterator: false,
  }
}
