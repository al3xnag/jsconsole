import { INTERPRETER } from '@/constants'
import type { PreviewWindowRaw } from '@/types'
import {
  evaluate,
  InternalError,
  PossibleSideEffectError,
  TimeoutError,
  UnsupportedOperationError,
} from '@jsconsole/interpreter'

const _this = globalThis as PreviewWindowRaw
_this[INTERPRETER] = {
  evaluate,
  TimeoutError,
  InternalError,
  PossibleSideEffectError,
  UnsupportedOperationError,
}
