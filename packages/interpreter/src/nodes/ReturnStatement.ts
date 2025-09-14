import { ReturnStatement } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { TYPE_RETURN } from '../constants'
import { logEvaluated, logEvaluating } from '../lib/log'

// https://tc39.es/ecma262/#sec-return-statement
// TODO: generators: 3. If GetGeneratorKind() is async, set exprValue to ? Await(exprValue)
export function* evaluateReturnStatement(
  node: ReturnStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  let evaluated: EvaluatedNode

  if (node.argument) {
    node.argument.parent = node
    evaluated = yield* evaluateNode(node.argument, scope, context)
  } else {
    evaluated = { value: undefined }
  }

  evaluated = {
    ...evaluated,
    type: TYPE_RETURN,
  }

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
