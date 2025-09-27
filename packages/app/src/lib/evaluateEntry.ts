import { ConsoleEntryInput, ConsoleEntryResult, ConsoleSession } from '@/types'
import { INTERPRETER } from '@/constants'
import type { EvaluateOptions, EvaluateResult } from '@jsconsole/interpreter'
import { nextId } from './nextId'

export function evaluateEntry(
  inputEntry: ConsoleEntryInput,
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
    result = evaluate(inputEntry.value, options)
  } catch (error) {
    console.error(error)

    return {
      type: 'result',
      id: nextId(),
      severity: 'error',
      value: error,
      timestamp: Date.now(),
      inputId: inputEntry.id,
    }
  }

  if (result instanceof session.globals.Promise) {
    return Promise.resolve(result).then<ConsoleEntryResult, ConsoleEntryResult>(
      (result) => {
        return {
          type: 'result',
          id: nextId(),
          value: result.value,
          timestamp: Date.now(),
          inputId: inputEntry.id,
        }
      },
      (error) => {
        return {
          type: 'result',
          id: nextId(),
          severity: 'error',
          value: error,
          timestamp: Date.now(),
          inputId: inputEntry.id,
        }
      },
    )
  } else {
    return {
      type: 'result',
      id: nextId(),
      value: result.value,
      timestamp: Date.now(),
      inputId: inputEntry.id,
    }
  }
}
