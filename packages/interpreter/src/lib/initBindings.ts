import { AnyNode } from 'acorn'
import { Context, Scope } from '../types'
import { hoistVariableDeclaration } from '../nodes/VariableDeclaration'
import { hoistFunctionDeclaration } from '../nodes/FunctionDeclaration'
import { hoistClassDeclaration } from '../nodes/ClassDeclaration'

export function initBindings(
  node: AnyNode,
  scope: Scope,
  context: Context,
  env: { var: boolean; lex: boolean },
) {
  if (!env.var && !env.lex) {
    return
  }

  switch (node.type) {
    case 'Program':
    case 'BlockStatement': {
      for (const child of node.body) {
        const isDeclaration =
          child.type === 'VariableDeclaration' ||
          child.type === 'FunctionDeclaration' ||
          child.type === 'ClassDeclaration'
        const nextEnv = isDeclaration ? env : { var: env.var, lex: false }
        child.parent = node
        initBindings(child, scope, context, nextEnv)
      }
      break
    }
    case 'VariableDeclaration': {
      hoistVariableDeclaration(node, scope, context, env)
      break
    }
    case 'FunctionDeclaration': {
      hoistFunctionDeclaration(node, scope, context, env)
      break
    }
    case 'ClassDeclaration': {
      hoistClassDeclaration(node, scope, context, env)
      break
    }
    case 'TryStatement': {
      initBindings(node.block, scope, context, env)
      if (node.handler) {
        initBindings(node.handler.body, scope, context, env)
      }
      if (node.finalizer) {
        initBindings(node.finalizer, scope, context, env)
      }
      break
    }
    case 'IfStatement': {
      initBindings(node.consequent, scope, context, env)
      if (node.alternate) {
        initBindings(node.alternate, scope, context, env)
      }
      break
    }
    case 'WhileStatement':
    case 'DoWhileStatement': {
      initBindings(node.body, scope, context, env)
      break
    }
    case 'ForInStatement':
    case 'ForOfStatement': {
      initBindings(node.left, scope, context, env)
      initBindings(node.body, scope, context, env)
      break
    }

    case 'ForStatement': {
      if (node.init) {
        initBindings(node.init, scope, context, env)
      }
      initBindings(node.body, scope, context, env)
      break
    }
    case 'SwitchStatement': {
      for (const caseClause of node.cases) {
        for (const consequent of caseClause.consequent) {
          initBindings(consequent, scope, context, env)
        }
      }
      break
    }
    case 'LabeledStatement': {
      initBindings(node.body, scope, context, env)
      break
    }
  }
}
