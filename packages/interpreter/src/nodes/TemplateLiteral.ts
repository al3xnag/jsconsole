import { TemplateLiteral } from 'acorn'
import { evaluateNode } from '.'
import { toString } from '../lib/evaluation-utils'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'

// The string conversion semantics applied to the Expression value are like
// String.prototype.concat rather than the + operator.
// (https://tc39.es/ecma262/#sec-template-literals-runtime-semantics-evaluation)
const concat = String.prototype.concat

// https://tc39.es/ecma262/#sec-template-literals-runtime-semantics-evaluation
export function* evaluateTemplateLiteral(
  node: TemplateLiteral,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  let result = ''

  const { quasis, expressions } = node
  for (let i = 0; i < quasis.length; i++) {
    const templateElement = quasis[i]

    // `cooked` is null if the template literal is tagged and the text has an invalid escape sequence.
    // Acorn raises SyntaxError if text contains an invalid escape sequence and the template literal is not tagged.
    // `evaluateTemplateLiteral` is used only for evaluating non-tagged template literals,
    // so we can safely assume that `cooked` is not null here.
    // https://github.com/estree/estree/blob/master/es2018.md#template-literals
    const cooked = templateElement.value.cooked!

    if (templateElement.tail) {
      result = concat.call(result, cooked)
    } else {
      const expression = expressions[i]!
      expression.parent = node
      const { value: exprValue } = yield* evaluateNode(expression, scope, callStack, context)
      const exprValueStr = toString(exprValue, context)
      result = concat.call(result, cooked, exprValueStr)
    }
  }

  return { value: result }
}
