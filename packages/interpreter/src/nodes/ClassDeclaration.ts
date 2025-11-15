import { AnonymousClassDeclaration, ClassDeclaration } from 'acorn'
import { EMPTY } from '../constants'
import { Context, EvaluateGenerator, Scope } from '../types'
import { createClass } from '../lib/createClass'
import { defineVariable } from '../lib/defineVariable'
import { setVariableValue } from '../lib/setVariableValue'

// https://tc39.es/ecma262/#sec-runtime-semantics-bindingclassdeclarationevaluation
export function* evaluateClassDeclaration(
  node: ClassDeclaration | AnonymousClassDeclaration,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const klass = yield* createClass(node, scope, context)

  // NOTE: AnonymousClassDeclaration only occurs as part of an ExportDeclaration.
  if (node.id) {
    setVariableValue(node.id.name, klass, scope, context, { init: true })
  }

  return { value: EMPTY }
}

export function hoistClassDeclaration(
  node: ClassDeclaration | AnonymousClassDeclaration,
  scope: Scope,
  context: Context,
  env: { var: boolean; lex: boolean },
): void {
  // NOTE: AnonymousClassDeclaration only occurs as part of an ExportDeclaration.
  if (env.lex && node.id) {
    defineVariable('const', node.id.name, scope, context)
  }
}
