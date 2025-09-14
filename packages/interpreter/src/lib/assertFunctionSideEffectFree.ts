import { Context } from '../types'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import { SIDE_EFFECT_FREE } from './SideEffectInfo'
import { unbindFunction } from './unbindFunction'

export function assertFunctionSideEffectFree(fn: Function, context: Context): void {
  fn = unbindFunction(fn, context)
  if (
    !context.metadata.functions.has(fn) &&
    context.sideEffectInfo.functions.get(fn) !== SIDE_EFFECT_FREE
  ) {
    throw new PossibleSideEffectError()
  }
}
