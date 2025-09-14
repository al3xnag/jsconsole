import { TaggedTemplateExpression } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { assertFunctionSideEffectFree } from '../lib/assertFunctionSideEffectFree'
import { syncContext } from '../lib/syncContext'
import { logEvaluated, logEvaluating } from '../lib/log'

const defineProperty = Object.defineProperty
const freeze = Object.freeze

export function* evaluateTaggedTemplateExpression(
  node: TaggedTemplateExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const { tag, quasi } = node
  tag.parent = node
  quasi.parent = node

  const { value: fn } = yield* evaluateNode(tag, scope, context)

  const templateObject = quasi.quasis.map(
    (el) => el.value.cooked ?? undefined /* string | undefined by spec, can't be null */,
  ) as unknown as TemplateStringsArray

  defineProperty(templateObject, 'raw', {
    value: quasi.quasis.map((el) => el.value.raw),
  })

  freeze(templateObject)
  freeze(templateObject.raw)

  const exprValues: unknown[] = []
  for (const expr of quasi.expressions) {
    expr.parent = quasi
    const { value } = yield* evaluateNode(expr, scope, context)
    exprValues.push(value)
  }

  if (syncContext?.throwOnSideEffect && typeof fn === 'function') {
    assertFunctionSideEffectFree(fn, context)
  }

  const result = fn(templateObject, ...exprValues)

  const evaluated: EvaluatedNode = { value: result }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
