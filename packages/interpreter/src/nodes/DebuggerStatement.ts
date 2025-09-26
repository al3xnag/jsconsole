import { DebuggerStatement } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { EMPTY } from '../constants'
import { syncContext } from '../lib/syncContext'

export function* evaluateDebuggerStatement(
  _node: DebuggerStatement,
  _scope: Scope,
  _context: Context,
  _labels?: string[],
): EvaluateGenerator {
  if (!syncContext?.throwOnSideEffect) {
    // eslint-disable-next-line no-debugger
    debugger
  }

  return yield { value: EMPTY }
}
