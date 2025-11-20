import { Context } from '../types'
import { hasFlag } from './bitwiseFlags'
import { toNumber, toNumeric } from './evaluation-utils'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import {
  SIDE_EFFECT_CONSTRUCT_CHECK_ALL_ARGS_TO_NUMBER,
  SIDE_EFFECT_CONSTRUCT_CHECK_ARG0_TO_NUMERIC,
  SIDE_EFFECT_CONSTRUCT_FREE,
  SideEffectFlags,
} from './SideEffectInfo'
import { unbindFunctionCall } from './unbindFunctionCall'

export function assertFunctionConstructSideEffectFree(
  fn: Function,
  args: unknown[],
  context: Context,
) {
  ;[fn, , args] = unbindFunctionCall(fn, undefined, args, context)

  if (context.metadata.functions.has(fn)) {
    return
  }

  const sideEffectFlags: SideEffectFlags | undefined = context.sideEffectInfo.functions.get(fn)

  if (!sideEffectFlags || !hasFlag(sideEffectFlags, SIDE_EFFECT_CONSTRUCT_FREE)) {
    throw new PossibleSideEffectError()
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CONSTRUCT_CHECK_ARG0_TO_NUMERIC) && args.length > 0) {
    toNumeric(args[0], context)
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CONSTRUCT_CHECK_ALL_ARGS_TO_NUMBER)) {
    for (let i = 0; i < args.length; i++) {
      toNumber(args[i], context)
    }
  }
}
