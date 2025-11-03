import { Program } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluateGenerator, Scope } from '../types'
import { initBindings } from '../lib/initBindings'
import { EMPTY, TYPE_BREAK, TYPE_CONTINUE, TYPE_RETURN } from '../constants'
import { hasDirective } from '../lib/directive'

export function* evaluateProgram(node: Program, scope: Scope, context: Context): EvaluateGenerator {
  if (hasDirective(node.body, 'use strict')) {
    context.strict = true
  }

  initBindings(node, scope, context, { var: true, lex: true })

  let result: unknown = EMPTY

  for (const child of node.body) {
    child.parent = node
    const evaluatedChild = yield* evaluateNode(child, scope, context)

    if (evaluatedChild.type === TYPE_RETURN) {
      throw new context.metadata.globals.SyntaxError('Illegal return statement')
    }

    if (evaluatedChild.type === TYPE_BREAK) {
      throw new context.metadata.globals.SyntaxError('Illegal break statement')
    }

    if (evaluatedChild.type === TYPE_CONTINUE) {
      throw new context.metadata.globals.SyntaxError('Illegal continue statement')
    }

    if (evaluatedChild.value !== EMPTY) {
      result = evaluatedChild.value
    }
  }

  return { value: result }
}
