import { DoWhileStatement } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { EMPTY } from '../constants'
import { logEvaluated, logEvaluating } from '../lib/log'
import { breakableStatementCompletion, loopContinues, updateEmpty } from '../lib/evaluation-utils'

// https://tc39.es/ecma262/#sec-do-while-statement
export function* evaluateDoWhileStatement(
  node: DoWhileStatement,
  scope: Scope,
  context: Context,
  labels?: string[],
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  let value: unknown = undefined

  node.body.parent = node
  node.test.parent = node

  while (true) {
    const evaluatedBody = yield* evaluateNode(node.body, scope, context)

    if (!loopContinues(evaluatedBody, labels)) {
      const evaluated = breakableStatementCompletion(updateEmpty(evaluatedBody, value))
      DEV: logEvaluated(evaluated, node, context)
      return yield evaluated
    }

    if (evaluatedBody.value !== EMPTY) {
      value = evaluatedBody.value
    }

    const evaluatedTest = yield* evaluateNode(node.test, scope, context)

    if (!evaluatedTest.value) {
      const evaluated: EvaluatedNode = { value }
      DEV: logEvaluated(evaluated, node, context)
      return yield evaluated
    }
  }
}
