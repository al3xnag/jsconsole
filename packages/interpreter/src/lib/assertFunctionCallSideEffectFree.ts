import { Context } from '../types'
import { assertPropertyReadSideEffectFree } from './assertPropertyReadSideEffectFree'
import { hasFlag } from './bitwiseFlags'
import { toNumber, toNumeric, toPrimitive, toString } from './evaluation-utils'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import {
  SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER,
  SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK,
  SIDE_EFFECT_CALL_CHECK_ARG0_TMP_OBJ,
  SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER,
  SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMERIC,
  SIDE_EFFECT_CALL_CHECK_ARG0_TO_PRIMITIVE,
  SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING,
  SIDE_EFFECT_CALL_CHECK_ARG1_TMP_OBJ,
  SIDE_EFFECT_CALL_CHECK_ARG1_TO_NUMBER,
  SIDE_EFFECT_CALL_CHECK_ARG2_TMP_OBJ,
  SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ,
  SIDE_EFFECT_CALL_FREE,
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

  if (!sideEffectFlags || !hasFlag(sideEffectFlags, SIDE_EFFECT_CALL_FREE)) {
    throw new PossibleSideEffectError()
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ)) {
    if (
      thisArg != null &&
      (typeof thisArg === 'object' || typeof thisArg === 'function') &&
      !syncContext?.tmpRefs.has(thisArg)
    ) {
      throw new PossibleSideEffectError()
    }
  }

  const checkArgTmpObjFlags = [
    SIDE_EFFECT_CALL_CHECK_ARG0_TMP_OBJ,
    SIDE_EFFECT_CALL_CHECK_ARG1_TMP_OBJ,
    SIDE_EFFECT_CALL_CHECK_ARG2_TMP_OBJ,
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

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER) && args.length > 0) {
    toNumber(args[0], context)
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CALL_CHECK_ARG1_TO_NUMBER) && args.length > 1) {
    toNumber(args[1], context)
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER)) {
    for (let i = 0; i < args.length; i++) {
      toNumber(args[i], context)
    }
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING) && args.length > 0) {
    toString(args[0], context)
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMERIC) && args.length > 0) {
    toNumeric(args[0], context)
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CALL_CHECK_ARG0_TO_PRIMITIVE) && args.length > 0) {
    toPrimitive(args[0], context)
  }

  if (hasFlag(sideEffectFlags, SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK) && args.length > 0) {
    if (Array.isArray(thisArg) && typeof args[0] === 'function') {
      for (let i = 0; i < thisArg.length; i++) {
        assertPropertyReadSideEffectFree(thisArg, i, context)
        assertFunctionCallSideEffectFree(args[0], undefined, [thisArg[i]], context)
      }
    }
  }
}
