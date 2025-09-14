import { Context } from '../types'

export function unbindFunctionCall(
  fn: Function,
  thisArg: unknown,
  args: unknown[],
  context: Context,
): [fn: Function, thisArg: unknown, args: unknown[]] {
  const fnMetadata = context.metadata.functions.get(fn)
  if (fnMetadata?.bound) {
    const { boundThis, boundArgs, targetFunction } = fnMetadata
    return unbindFunctionCall(targetFunction!, boundThis!, [...boundArgs!, ...args], context)
  }

  return [fn, thisArg, args]
}
