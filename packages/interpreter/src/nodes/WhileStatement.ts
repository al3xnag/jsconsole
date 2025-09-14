import { WhileStatement } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { EMPTY } from '../constants'
import { logEvaluated, logEvaluating } from '../lib/log'
import { breakableStatementCompletion, loopContinues, updateEmpty } from '../lib/evaluation-utils'

// https://tc39.es/ecma262/#sec-while-statement
export function* evaluateWhileStatement(
  node: WhileStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  let value: unknown = undefined

  node.test.parent = node
  node.body.parent = node

  while (true) {
    const evaluatedTest = yield* evaluateNode(node.test, scope, context)

    if (!evaluatedTest.value) {
      const evaluated: EvaluatedNode = { value }
      DEV: logEvaluated(evaluated, node, context)
      return yield evaluated
    }

    const evaluatedBody = yield* evaluateNode(node.body, scope, context)

    if (!loopContinues(evaluatedBody)) {
      const evaluated = breakableStatementCompletion(updateEmpty(evaluatedBody, value))
      DEV: logEvaluated(evaluated, node, context)
      return yield evaluated
    }

    if (evaluatedBody.value !== EMPTY) {
      value = evaluatedBody.value
    }
  }
}
