import { VariableDeclaration, VariableDeclarator } from 'acorn'
import { evaluateNode } from '.'
import { EMPTY } from '../constants'
import { defineVariable } from '../lib/defineVariable'
import { getVariableDeclaratorIdentifiers } from '../lib/bound-identifiers'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { evaluatePattern } from './Pattern'

export function* evaluateVariableDeclaration(
  node: VariableDeclaration,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  for (const declaration of node.declarations) {
    declaration.parent = node
    yield* evaluateVariableDeclarator(declaration, scope, callStack, context)
  }

  return { value: EMPTY }
}

export function* evaluateVariableDeclarator(
  node: VariableDeclarator,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const { id, init } = node
  const declaration = node.parent as VariableDeclaration

  if (declaration.kind === 'var' && !init) {
    return { value: EMPTY }
  }

  let value: unknown = undefined

  if (init) {
    init.parent = node
    const evaluated = yield* evaluateNode(init, scope, callStack, context)
    value = evaluated.value
  }

  id.parent = node
  yield* evaluatePattern(id, value, scope, callStack, context, { init: true })

  return { value: EMPTY }
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
