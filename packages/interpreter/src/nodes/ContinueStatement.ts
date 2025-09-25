import { ContinueStatement } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { EMPTY, TYPE_CONTINUE } from '../constants'
import { logEvaluated, logEvaluating } from '../lib/log'

// https://tc39.es/ecma262/#sec-continue-statement
export function* evaluateContinueStatement(
  node: ContinueStatement,
  _scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const evaluated: EvaluatedNode = {
    type: TYPE_CONTINUE,
    label: node.label?.name,
    value: EMPTY,
  }

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
