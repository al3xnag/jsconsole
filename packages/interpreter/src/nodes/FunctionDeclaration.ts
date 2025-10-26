import { AnonymousFunctionDeclaration, FunctionDeclaration } from 'acorn'
import { Context, EvaluateGenerator, FunctionScope, Scope } from '../types'
import { createFunction } from '../lib/createFunction'
import { defineVariable } from '../lib/defineVariable'
import { closestScope } from '../lib/scopes'
import { InternalError } from '../lib/InternalError'
import { EMPTY } from '../constants'
import { PossibleSideEffectError } from '../lib/PossibleSideEffectError'
import { syncContext } from '../lib/syncContext'

export function* evaluateFunctionDeclaration(
  node: FunctionDeclaration | AnonymousFunctionDeclaration,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  // https://dev.to/rkirsling/tales-from-ecma-s-crypt-annex-b-3-3-56go
  // https://262.ecma-international.org/6.0/#sec-block-level-function-declarations-web-legacy-compatibility-semantics
  // https://tc39.es/ecma262/#sec-web-compat-functiondeclarationinstantiation
  if (node.id !== null && !context.strict && scope.kind === 'block') {
    const fnName = node.id.name
    const letIdentifier = scope.bindings.get(fnName)
    if (letIdentifier === undefined || letIdentifier.kind !== 'let') {
      throw new InternalError('Function declaration inside block scope must exist and be a let')
    }

    const closestFnScope = closestScope(scope, 'function')
    if (closestFnScope) {
      const varIdentifier = closestFnScope.bindings.get(fnName)
      if (!varIdentifier || varIdentifier.kind !== 'var') {
        throw new InternalError(
          'In non-strict mode, function declaration inside block scope must have var declaration in the closest function scope',
        )
      }

      varIdentifier.value = letIdentifier.value
    } else {
      if (syncContext?.throwOnSideEffect) {
        throw new PossibleSideEffectError()
      }

      context.globalObject[fnName] = letIdentifier.value
    }
  }

  return { value: EMPTY }
}

export function hoistFunctionDeclaration(
  node: FunctionDeclaration | AnonymousFunctionDeclaration,
  scope: Scope,
  context: Context,
  env: { var: boolean; lex: boolean },
): void {
  // NOTE: AnonymousFunctionDeclaration (id === null): `export default function() {}`
  if (node.id === null) {
    return
  }

  const fnName = node.id.name

  if (context.strict) {
    if (isInsideBlock(node)) {
      if (env.lex) {
        const fn = createFunction(node, scope, context)
        defineVariable('let', fnName, scope, context, fn)
      }
    } else {
      if (env.var) {
        const fn = createFunction(node, scope, context)
        const varScope: FunctionScope | null = scope.kind === 'function' ? scope : null
        defineVariable('var', fnName, varScope, context, fn)
      }
    }
  } else {
    // https://dev.to/rkirsling/tales-from-ecma-s-crypt-annex-b-3-3-56go
    // https://262.ecma-international.org/6.0/#sec-block-level-function-declarations-web-legacy-compatibility-semantics
    // https://tc39.es/ecma262/#sec-web-compat-functiondeclarationinstantiation
    if (isInsideBlock(node)) {
      if (env.lex) {
        // Fn redeclaration inside block is allowed in non-strict mode.
        // However, `var` can't be redeclared with function declaration
        // inside block even in non-strict mode (but allowed in global or function scope).
        scope.bindings.delete(fnName)

        const fn = createFunction(node, scope, context)
        defineVariable('let', fnName, scope, context, fn)
      }

      if (env.var) {
        const varScope: FunctionScope | null = scope.kind === 'function' ? scope : null
        // Initializes with undefined, it's not a typo.
        defineVariable('var', fnName, varScope, context)
      }
    } else {
      if (env.var) {
        const fn = createFunction(node, scope, context)
        const varScope: FunctionScope | null = scope.kind === 'function' ? scope : null
        defineVariable('var', fnName, varScope, context, fn)
      }
    }
  }
}

function isInsideBlock(node: FunctionDeclaration | AnonymousFunctionDeclaration): boolean {
  const prevType = node.parent?.type
  const prevPrevType = node.parent?.parent?.type

  return (
    prevType === 'BlockStatement' &&
    prevPrevType !== 'FunctionDeclaration' &&
    prevPrevType !== 'FunctionExpression' &&
    prevPrevType !== 'ArrowFunctionExpression'
  )
}
