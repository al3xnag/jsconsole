import { BlockStatement } from 'acorn'
import { evaluateNode } from '.'
import { BlockScope, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { EMPTY } from '../constants'
import { initBindings } from '../lib/initBindings'
import { isAbruptCompletion, updateEmpty } from '../lib/evaluation-utils'
import { createScope } from '../lib/createScope'

export function* evaluateBlockStatement(
  node: BlockStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  if (!isFunctionBlock(node)) {
    const blockScope: BlockScope = createScope({
      kind: 'block',
      bindings: new Map(),
      parent: scope,
      name: 'Block',
    })

    initBindings(node, blockScope, context, { var: false, lex: true })
    scope = blockScope
  }

  let value: unknown = EMPTY

  for (const child of node.body) {
    child.parent = node
    const evaluatedBody = yield* evaluateNode(child, scope, context)

    if (isAbruptCompletion(evaluatedBody)) {
      const evaluated = updateEmpty(evaluatedBody, value)
      return evaluated
    }

    if (evaluatedBody.value !== EMPTY) {
      value = evaluatedBody.value
    }
  }

  const evaluated: EvaluatedNode = { value }
  return evaluated
}

function isFunctionBlock(node: BlockStatement): boolean {
  const prevType = node.parent?.type
  return (
    prevType === 'FunctionDeclaration' ||
    prevType === 'FunctionExpression' ||
    prevType === 'ArrowFunctionExpression'
  )
}
