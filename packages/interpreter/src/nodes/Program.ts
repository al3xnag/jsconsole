import { Program } from 'acorn'
import { evaluateNode } from '.'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { initBindings } from '../lib/initBindings'
import { EMPTY, TYPE_BREAK, TYPE_CONTINUE, TYPE_RETURN } from '../constants'
import { hasDirective } from '../lib/directive'
import {
  SYNTAX_ERROR_ILLEGAL_RETURN,
  SYNTAX_ERROR_ILLEGAL_BREAK,
  SYNTAX_ERROR_ILLEGAL_CONTINUE,
} from '../lib/errorDefinitions'

export function* evaluateProgram(
  node: Program,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  if (hasDirective(node.body, 'use strict')) {
    context.strict = true
  }

  initBindings(node, scope, context, { var: true, lex: true })

  let result: unknown = EMPTY

  for (const child of node.body) {
    child.parent = node
    const evaluatedChild = yield* evaluateNode(child, scope, callStack, context)

    if (evaluatedChild.type === TYPE_RETURN) {
      throw SYNTAX_ERROR_ILLEGAL_RETURN()
    }

    if (evaluatedChild.type === TYPE_BREAK) {
      throw SYNTAX_ERROR_ILLEGAL_BREAK()
    }

    if (evaluatedChild.type === TYPE_CONTINUE) {
      throw SYNTAX_ERROR_ILLEGAL_CONTINUE()
    }

    if (evaluatedChild.value !== EMPTY) {
      result = evaluatedChild.value
    }
  }

  return { value: result }
}
