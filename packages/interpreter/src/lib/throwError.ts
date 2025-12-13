import { CallStack, Context } from '../types'
import { isAcornSyntaxError } from './acorn-tweaks'
import { assertNever } from './assert'
import { ErrorDefinition } from './errorDefinitions'
import { Location, rewriteErrorStack } from './errorStack'
import { InternalError } from './InternalError'

export function throwError(
  error: unknown | ErrorDefinition,
  loc: Location,
  callStack: CallStack,
  context: Context,
  flag?: 'unsafe',
): never {
  if (error instanceof ErrorDefinition) {
    const errorInst = constructError(error, context)
    rewriteErrorStack(errorInst, loc, callStack, context)
    throw errorInst
  }

  // InternalError, PossibleSideEffectError, TimeoutError, UnsupportedOperationError
  if (error instanceof InternalError) {
    rewriteErrorStack(error, loc, callStack, context)
    throw error
  }

  if (error instanceof TypeError && TypeError !== context.metadata.globals.TypeError) {
    Object.setPrototypeOf(error, context.metadata.globals.TypeError.prototype)
  }

  if (
    error instanceof ReferenceError &&
    ReferenceError !== context.metadata.globals.ReferenceError
  ) {
    Object.setPrototypeOf(error, context.metadata.globals.ReferenceError.prototype)
  }

  if (error instanceof RangeError && RangeError !== context.metadata.globals.RangeError) {
    Object.setPrototypeOf(error, context.metadata.globals.RangeError.prototype)
  }

  if (isAcornSyntaxError(error)) {
    loc = {
      file: context.name,
      line: error.loc.line,
      col: error.loc.column + 1,
    }
    error = new context.metadata.globals.SyntaxError(error.message)
  }

  if (error instanceof context.metadata.globals.Error) {
    rewriteErrorStack(error, loc, callStack, context, flag)
  }

  throw error
}

function constructError(errorDefinition: ErrorDefinition, context: Context): Error {
  const { type, message } = errorDefinition
  switch (type) {
    case 'TypeError':
      return new context.metadata.globals.TypeError(message)
    case 'ReferenceError':
      return new context.metadata.globals.ReferenceError(message)
    case 'SyntaxError':
      return new context.metadata.globals.SyntaxError(message)
    case 'RangeError':
      return new context.metadata.globals.RangeError(message)
    default:
      assertNever(type, 'Unexpected error type')
  }
}
