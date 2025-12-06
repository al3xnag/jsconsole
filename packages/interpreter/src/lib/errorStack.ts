import { SourceLocation } from 'acorn'
import { CallStack, CallStackLocation, Context } from '../types'
import { findSetter } from './findSetter'
import { getPropertyDescriptor } from './getPropertyDescriptor'

const errorsWithRewrittenStack = new WeakSet<Error>()

export type Location = CallStackLocation | SourceLocation | null | undefined

export function rewriteErrorStack(
  error: Error,
  errorLocation: Location,
  callStack: CallStack,
  context: Context,
  flag?: 'unsafe',
) {
  if (errorsWithRewrittenStack.has(error)) {
    return
  }

  captureStackTrace(error, errorLocation, callStack, context, flag)
  errorsWithRewrittenStack.add(error)
}

export function captureStackTrace(
  obj: object,
  loc: Location,
  callStack: CallStack,
  context: Context,
  flag?: 'unsafe',
) {
  if (flag === 'unsafe') {
    const errorStackSetter = findSetter(obj, 'stack')
    if (
      typeof errorStackSetter === 'function' &&
      errorStackSetter === context.metadata.globals.ErrorStackSetter
    ) {
      const messageDescriptor = Object.getOwnPropertyDescriptor(obj, 'message')
      const message = typeof messageDescriptor?.value === 'string' ? messageDescriptor.value : ''
      const nameDescriptor = getPropertyDescriptor(obj, 'name')
      const name =
        typeof nameDescriptor?.value === 'string' && nameDescriptor.value !== ''
          ? nameDescriptor.value
          : obj.constructor.name
      const stackString = makeErrorStackString(name, message, loc, callStack, context)
      Reflect.apply(errorStackSetter, obj, [stackString])
    }
  } else {
    const error = obj as Error
    const stackString = makeErrorStackString(error.name, error.message, loc, callStack, context)
    error.stack = stackString
  }
}

function makeErrorStackString(
  errorName: string,
  errorMessage: string,
  errorLocation: Location,
  callStack: CallStack,
  context: Context,
): string {
  const errorStackData: Array<{
    at: string | null
    /** 1-based */
    line: number | undefined
    /** 1-based */
    col: number | undefined
    file: string | undefined
  }> = []

  let currentLoc: CallStackLocation | null = errorLocation
    ? 'start' in errorLocation
      ? { file: context.name, line: errorLocation.start.line, col: errorLocation.start.column + 1 }
      : errorLocation
    : null

  const callStackArray = Array.from(callStack)
  for (let i = callStackArray.length - 1; i >= 0; i--) {
    const { fn, loc, construct } = callStackArray[i]

    let at: string | null = null
    if (fn !== null) {
      const fnName = fn.name || '<anonymous>'
      at = construct ? `new ${fnName}` : fnName
    }

    errorStackData.push({
      at,
      line: currentLoc?.line,
      col: currentLoc?.col,
      file: currentLoc?.file,
    })

    currentLoc = loc
  }

  return `${errorName || 'Error'}${errorMessage ? `: ${errorMessage}` : ''}\n${errorStackData
    .map(({ at, line, col, file }) => {
      const locStr: string =
        line !== undefined && col !== undefined && file !== undefined
          ? `${file}:${line}:${col}`
          : (file ?? 'native')
      return at !== null ? `    at ${at} (${locStr})` : `    at ${locStr}`
    })
    .join('\n')}`
}
