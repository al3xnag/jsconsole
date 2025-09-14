import { ForStatement } from 'acorn'
import { BlockScope, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { EMPTY } from '../constants'
import { evaluateNode } from '.'
import { initBindings } from '../lib/initBindings'
import { logEvaluated, logEvaluating } from '../lib/log'
import { breakableStatementCompletion, loopContinues, updateEmpty } from '../lib/evaluation-utils'

// https://tc39.es/ecma262/#sec-for-statement
export function* evaluateForStatement(
  node: ForStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  let value: unknown = undefined

  const { init, test, update, body } = node
  if (init) init.parent = node
  if (test) test.parent = node
  if (update) update.parent = node
  body.parent = node

  let forScope: BlockScope = {
    kind: 'block',
    parent: scope,
    bindings: new Map(),
    name: 'For',
  }

  if (init) {
    initBindings(init, forScope, context, { var: false, lex: true })
  }

  const nextForScope = () => {
    if (!init || forScope.bindings.size === 0) {
      return
    }

    forScope = {
      kind: 'block',
      parent: scope,
      bindings: new Map(Array.from(forScope.bindings).map(([key, value]) => [key, { ...value }])),
      name: 'For',
    }
  }

  if (init) {
    yield* evaluateNode(init, forScope, context)
  }

  while (true) {
    if (test) {
      const evaluatedTest = yield* evaluateNode(test, forScope, context)
      if (!evaluatedTest.value) {
        const evaluated: EvaluatedNode = { value }
        DEV: logEvaluated(evaluated, node, context)
        return yield evaluated
      }
    }

    const evaluatedBody = yield* evaluateNode(body, forScope, context)

    if (!loopContinues(evaluatedBody)) {
      const evaluated = breakableStatementCompletion(updateEmpty(evaluatedBody, value))
      DEV: logEvaluated(evaluated, node, context)
      return yield evaluated
    }

    if (evaluatedBody.value !== EMPTY) {
      value = evaluatedBody.value
    }

    nextForScope()

    if (update) {
      yield* evaluateNode(update, forScope, context)
    }
  }
}
