import { ForInStatement } from 'acorn'
import { evaluateNode } from '.'
import { BlockScope, Context, EvaluateGenerator, Scope } from '../types'
import { EMPTY } from '../constants'
import { evaluatePattern } from './Pattern'
import { initBindings } from '../lib/initBindings'
import { breakableStatementCompletion, loopContinues, updateEmpty } from '../lib/evaluation-utils'

// https://tc39.es/ecma262/#sec-for-in-and-for-of-statements
export function* evaluateForInStatement(
  node: ForInStatement,
  scope: Scope,
  context: Context,
  labels?: string[],
): EvaluateGenerator {
  let value: unknown = undefined

  const { left, right, body } = node
  left.parent = node
  right.parent = node
  body.parent = node

  const { value: object } = yield* evaluateNode(right, scope, context)

  for (const iterValue in object) {
    const forInScope: BlockScope = {
      kind: 'block',
      parent: scope,
      bindings: new Map(),
      name: 'ForIn',
    }

    if (left.type === 'VariableDeclaration') {
      initBindings(left, forInScope, context, { var: false, lex: true })

      // Only one declarator is allowed.
      const declarator = left.declarations[0]!
      declarator.parent = left
      yield* evaluatePattern(declarator.id, iterValue, forInScope, context, { init: true })
    } else {
      yield* evaluatePattern(left, iterValue, forInScope, context)
    }

    const evaluatedBody = yield* evaluateNode(body, forInScope, context)

    if (!loopContinues(evaluatedBody, labels)) {
      const evaluated = breakableStatementCompletion(updateEmpty(evaluatedBody, value))
      return evaluated
    }

    if (evaluatedBody.value !== EMPTY) {
      value = evaluatedBody.value
    }
  }

  return { value }
}
