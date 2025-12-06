import { CallStack } from '../types'

export let activeCalleeCallStack: CallStack | null = null

export function setActiveCalleeCallStack(callStack: CallStack | null) {
  activeCalleeCallStack = callStack
}

export function getNewCalleeCallStack(callee: Function, callStack?: CallStack) {
  const currentCallStack: CallStack | null = callStack ?? activeCalleeCallStack
  const isNativeCall = currentCallStack?.at(-1)?.fn !== callee

  const newCallStack: CallStack = currentCallStack ? [...currentCallStack] : []
  if (isNativeCall) {
    newCallStack.push({ fn: callee, loc: null })
  }

  return newCallStack
}
