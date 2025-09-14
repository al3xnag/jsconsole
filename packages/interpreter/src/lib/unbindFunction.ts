import { Context } from '../types'

export function unbindFunction(fn: Function, context: Context): Function {
  const fnMetadata = context.metadata.functions.get(fn)
  if (fnMetadata?.bound) {
    const { targetFunction } = fnMetadata
    return unbindFunction(targetFunction!, context)
  }

  return fn
}
