import { DebuggerStatement } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { EMPTY } from '../constants'
import { syncContext } from '../lib/syncContext'

export function* evaluateDebuggerStatement(
  _node: DebuggerStatement,
  _scope: Scope,
  _callStack: CallStack,
  _context: Context,
  _labels?: string[],
): EvaluateGenerator {
  if (!syncContext?.throwOnSideEffect) {
    // eslint-disable-next-line no-debugger
    debugger
  }

  return { value: EMPTY }
}
