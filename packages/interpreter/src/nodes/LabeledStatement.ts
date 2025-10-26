import { LabeledStatement } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { evaluateStatement } from '.'
import { TYPE_BREAK } from '../constants'

export function* evaluateLabeledStatement(
  node: LabeledStatement,
  scope: Scope,
  context: Context,
  labels?: string[],
): EvaluateGenerator {
  const { label, body } = node
  label.parent = node
  body.parent = node

  labels = labels ? labels.concat(label.name) : [label.name]

  let evaluated = yield* evaluateStatement(body, scope, context, labels)

  if (evaluated.type === TYPE_BREAK && evaluated.label === label.name) {
    evaluated = { value: evaluated.value }
  }

  return evaluated
}
