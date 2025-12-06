import { TaggedTemplateExpression } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { syncContext } from '../lib/syncContext'
import { assertFunctionCallSideEffectFree } from '../lib/assertFunctionCallSideEffectFree'

const defineProperty = Object.defineProperty
const freeze = Object.freeze

export function* evaluateTaggedTemplateExpression(
  node: TaggedTemplateExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const { tag, quasi } = node
  tag.parent = node
  quasi.parent = node

  const { value: fn } = yield* evaluateNode(tag, scope, callStack, context)

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
    const { value } = yield* evaluateNode(expr, scope, callStack, context)
    exprValues.push(value)
  }

  if (syncContext?.throwOnSideEffect && typeof fn === 'function') {
    assertFunctionCallSideEffectFree(fn, undefined, [templateObject, ...exprValues], context)
  }

  const result = fn(templateObject, ...exprValues)
  return { value: result }
}
