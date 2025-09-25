import { LabeledStatement } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { evaluateStatement } from '.'
import { logEvaluated, logEvaluating } from '../lib/log'
import { TYPE_BREAK } from '../constants'

export function* evaluateLabeledStatement(
  node: LabeledStatement,
  scope: Scope,
  context: Context,
  labels?: string[],
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const { label, body } = node
  label.parent = node
  body.parent = node

  labels = labels ? labels.concat(label.name) : [label.name]

  let evaluated = yield* evaluateStatement(body, scope, context, labels)

  if (evaluated.type === TYPE_BREAK && evaluated.label === label.name) {
    evaluated = { value: evaluated.value }
  }

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
