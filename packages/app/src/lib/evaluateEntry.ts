import { ConsoleEntryInput, ConsoleEntryResult, ConsoleSession } from '@/types'
import type { EvaluateOptions, EvaluateResult } from '@jsconsole/interpreter'
import { evaluate } from '@jsconsole/interpreter'
import { nextId } from './nextId'

export function evaluateEntry(
  inputEntry: ConsoleEntryInput,
  session: ConsoleSession,
): ConsoleEntryResult | Promise<ConsoleEntryResult> {
  if (!session.previewWindow) {
    throw new Error('Session is not initialized')
  }

  const id = nextId()
  const contextName = `vm:///VM${id}`

  const options: EvaluateOptions = {
    contextName,
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
      id,
      severity: 'error',
      value: error,
      timestamp: Date.now(),
      inputId: inputEntry.id,
    }
  }

  if (result instanceof Promise) {
    return result.then<ConsoleEntryResult, ConsoleEntryResult>(
      (result) => {
        return {
          type: 'result',
          id,
          value: result.value,
          timestamp: Date.now(),
          inputId: inputEntry.id,
        }
      },
      (error) => {
        return {
          type: 'result',
          id,
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
      id,
      value: result.value,
      timestamp: Date.now(),
      inputId: inputEntry.id,
    }
  }
}
