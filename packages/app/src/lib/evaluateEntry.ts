import { ConsoleEntryResult, ConsoleSession } from '@/types'
import { INTERPRETER } from '@/constants'
import type { EvaluateOptions, EvaluateResult } from '@jsconsole/interpreter'

export function evaluateEntry(
  input: string,
  session: ConsoleSession,
): ConsoleEntryResult | Promise<ConsoleEntryResult> {
  if (!session.previewWindow) {
    throw new Error('Session is not initialized')
  }

  const { evaluate } = session.previewWindow[INTERPRETER]
  const options: EvaluateOptions = {
    globalObject: session.previewWindow,
    globalScope: session.globalScope,
    metadata: session.metadata,
    sideEffectInfo: session.sideEffectInfo,
    throwOnSideEffect: false,
    wrapObjectLiteral: true,
    stripTypes: true,
    debug: console.debug,
  }

  let result: EvaluateResult | Promise<EvaluateResult>

  try {
    result = evaluate(input, options)
  } catch (error) {
    console.error(error)

    return {
      type: 'result',
      id: crypto.randomUUID(),
      severity: 'error',
      value: error,
      timestamp: Date.now(),
    }
  }

  if (result instanceof session.globals.Promise) {
    return Promise.resolve(result).then<ConsoleEntryResult, ConsoleEntryResult>(
      (result) => {
        return {
          type: 'result',
          id: crypto.randomUUID(),
          value: result.value,
          timestamp: Date.now(),
        }
      },
      (error) => {
        return {
          type: 'result',
          id: crypto.randomUUID(),
          severity: 'error',
          value: error,
          timestamp: Date.now(),
        }
      },
    )
  } else {
    return {
      type: 'result',
      id: crypto.randomUUID(),
      value: result.value,
      timestamp: Date.now(),
    }
  }
}
