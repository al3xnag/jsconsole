import { ForStatement } from 'acorn'
import { BlockScope, CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { EMPTY } from '../constants'
import { evaluateNode } from '.'
import { initBindings } from '../lib/initBindings'
import { breakableStatementCompletion, loopContinues, updateEmpty } from '../lib/evaluation-utils'
import { createScope } from '../lib/createScope'

// https://tc39.es/ecma262/#sec-for-statement
export function* evaluateForStatement(
  node: ForStatement,
  scope: Scope,
  callStack: CallStack,
  context: Context,
  labels?: string[],
): EvaluateGenerator {
  let value: unknown = undefined

  const { init, test, update, body } = node
  if (init) init.parent = node
  if (test) test.parent = node
  if (update) update.parent = node
  body.parent = node

  let forScope: BlockScope = createScope({
    kind: 'block',
    parent: scope,
    bindings: new Map(),
    name: 'For',
  })

  if (init) {
    initBindings(init, forScope, context, { var: false, lex: true })
  }

  const nextForScope = () => {
    if (!init || forScope.bindings.size === 0) {
      return
    }

    forScope = createScope({
      kind: 'block',
      parent: scope,
      bindings: new Map(Array.from(forScope.bindings).map(([key, value]) => [key, { ...value }])),
      name: 'For',
    })
  }

  if (init) {
    yield* evaluateNode(init, forScope, callStack, context)
  }

  while (true) {
    if (test) {
      const evaluatedTest = yield* evaluateNode(test, forScope, callStack, context)
      if (!evaluatedTest.value) {
        return { value }
      }
    }

    const evaluatedBody = yield* evaluateNode(body, forScope, callStack, context)

    if (!loopContinues(evaluatedBody, labels)) {
      const evaluated = breakableStatementCompletion(updateEmpty(evaluatedBody, value))
      return evaluated
    }

    if (evaluatedBody.value !== EMPTY) {
      value = evaluatedBody.value
    }

    nextForScope()

    if (update) {
      yield* evaluateNode(update, forScope, callStack, context)
    }
  }
}
