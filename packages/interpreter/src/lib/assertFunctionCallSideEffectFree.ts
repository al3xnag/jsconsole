import { Context } from '../types'
import { assertFunctionSideEffectFree } from './assertFunctionSideEffectFree'
import { hasFlag } from './bitwiseFlags'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import {
  SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT,
  SIDE_EFFECT_CHECK_ARG0_TMP_OBJ,
  SIDE_EFFECT_CHECK_ARG1_FN_NO_SIDE_EFFECT,
  SIDE_EFFECT_CHECK_ARG1_TMP_OBJ,
  SIDE_EFFECT_CHECK_ARG2_FN_NO_SIDE_EFFECT,
  SIDE_EFFECT_CHECK_ARG2_TMP_OBJ,
  SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ,
  SIDE_EFFECT_FREE,
  SideEffectFlags,
} from './SideEffectInfo'
import { syncContext } from './syncContext'
import { unbindFunctionCall } from './unbindFunctionCall'

export function assertFunctionCallSideEffectFree(
  fn: Function,
  thisArg: unknown,
  args: unknown[],
  context: Context,
) {
  ;[fn, thisArg, args] = unbindFunctionCall(fn, thisArg, args, context)

  if (context.metadata.functions.has(fn)) {
    return
  }

  const sideEffectFlags: SideEffectFlags | undefined = context.sideEffectInfo.functions.get(fn)

  if (!sideEffectFlags || !hasFlag(sideEffectFlags, SIDE_EFFECT_FREE)) {
    throw new PossibleSideEffectError()
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ)) {
    if (
      thisArg != null &&
      (typeof thisArg === 'object' || typeof thisArg === 'function') &&
      !syncContext?.tmpRefs.has(thisArg)
    ) {
      throw new PossibleSideEffectError()
    }
  }

  const checkArgFnNoSideEffectFlags = [
    SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT,
    SIDE_EFFECT_CHECK_ARG1_FN_NO_SIDE_EFFECT,
    SIDE_EFFECT_CHECK_ARG2_FN_NO_SIDE_EFFECT,
  ]

  for (let i = 0; i < checkArgFnNoSideEffectFlags.length; i++) {
    if (
      hasFlag(sideEffectFlags, checkArgFnNoSideEffectFlags[i]) &&
      args.length > i &&
      typeof args[i] === 'function'
    ) {
      assertFunctionSideEffectFree(args[i] as Function, context)
    }
  }

  const checkArgTmpObjFlags = [
    SIDE_EFFECT_CHECK_ARG0_TMP_OBJ,
    SIDE_EFFECT_CHECK_ARG1_TMP_OBJ,
    SIDE_EFFECT_CHECK_ARG2_TMP_OBJ,
  ]

  for (let i = 0; i < checkArgTmpObjFlags.length; i++) {
    if (
      hasFlag(sideEffectFlags, checkArgTmpObjFlags[i]) &&
      args.length > i &&
      args[i] != null &&
      (typeof args[i] === 'object' || typeof args[i] === 'function') &&
      !syncContext?.tmpRefs.has(args[i] as object)
    ) {
      throw new PossibleSideEffectError()
    }
  }
}
