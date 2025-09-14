import { VariableDeclaration, VariableDeclarator } from 'acorn'
import { evaluateNode } from '.'
import { EMPTY } from '../constants'
import { defineVariable } from '../lib/defineVariable'
import { getVariableDeclaratorIdentifiers } from '../lib/bound-identifiers'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluatePattern } from './Pattern'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateVariableDeclaration(
  node: VariableDeclaration,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  for (const declaration of node.declarations) {
    declaration.parent = node
    yield* evaluateVariableDeclarator(declaration, scope, context)
  }

  const evaluated: EvaluatedNode = { value: EMPTY }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}

export function* evaluateVariableDeclarator(
  node: VariableDeclarator,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const { id, init } = node
  const declaration = node.parent as VariableDeclaration

  if (declaration.kind === 'var' && !init) {
    const evaluated: EvaluatedNode = { value: EMPTY }
    DEV: logEvaluated(evaluated, node, context)
    return yield evaluated
  }

  let value: unknown = undefined

  if (init) {
    init.parent = node
    const evaluated = yield* evaluateNode(init, scope, context)
    value = evaluated.value
  }

  id.parent = node
  yield* evaluatePattern(id, value, scope, context, { init: true })

  const evaluated: EvaluatedNode = { value: EMPTY }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}

export function hoistVariableDeclaration(
  node: VariableDeclaration,
  scope: Scope,
  context: Context,
  env: { var: boolean; lex: boolean },
) {
  const { kind, declarations } = node

  if (kind === 'var' && !env.var) {
    return
  }

  if ((kind === 'let' || kind === 'const') && !env.lex) {
    return
  }

  const targetScope = kind === 'var' ? (scope.kind === 'function' ? scope : null) : scope

  declarations.forEach((declarator) => {
    const identifiers = getVariableDeclaratorIdentifiers(declarator)
    identifiers.forEach((identifier) => {
      defineVariable(kind, identifier.name, targetScope, context)
    })
  })
}
