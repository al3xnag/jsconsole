import { DoWhileStatement } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { EMPTY } from '../constants'
import { breakableStatementCompletion, loopContinues, updateEmpty } from '../lib/evaluation-utils'

// https://tc39.es/ecma262/#sec-do-while-statement
export function* evaluateDoWhileStatement(
  node: DoWhileStatement,
  scope: Scope,
  context: Context,
  labels?: string[],
): EvaluateGenerator {
  let value: unknown = undefined

  node.body.parent = node
  node.test.parent = node

  while (true) {
    const evaluatedBody = yield* evaluateNode(node.body, scope, context)

    if (!loopContinues(evaluatedBody, labels)) {
      const evaluated = breakableStatementCompletion(updateEmpty(evaluatedBody, value))
      return evaluated
    }

    if (evaluatedBody.value !== EMPTY) {
      value = evaluatedBody.value
    }

    const evaluatedTest = yield* evaluateNode(node.test, scope, context)

    if (!evaluatedTest.value) {
      return { value }
    }
  }
}
