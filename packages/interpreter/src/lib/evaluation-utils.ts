import { EMPTY, TYPE_BREAK, TYPE_CONTINUE, TYPE_RETURN } from '../constants'
import { EvaluatedNode } from '../types'
import { InternalError } from './InternalError'

// https://tc39.es/ecma262/#sec-completion-record-specification-type
export function isAbruptCompletion(evaluated: EvaluatedNode): boolean {
  return (
    evaluated.type === TYPE_BREAK ||
    evaluated.type === TYPE_CONTINUE ||
    evaluated.type === TYPE_RETURN
  )
}

// https://tc39.es/ecma262/#sec-updateempty
export function updateEmpty(evaluated: EvaluatedNode, value: unknown): EvaluatedNode {
  if (evaluated.type === TYPE_RETURN && evaluated.value === EMPTY) {
    throw new InternalError('Invalid return statement')
  }

  if (evaluated.value !== EMPTY) {
    return evaluated
  }

  return { ...evaluated, value }
}

// https://tc39.es/ecma262/#sec-runtime-semantics-labelledevaluation
export function breakableStatementCompletion(evaluated: EvaluatedNode): EvaluatedNode {
  const { type, label, value } = evaluated
  if (type === TYPE_BREAK && label === undefined) {
    return {
      ...evaluated,
      type: undefined,
      value: value === EMPTY ? undefined : value,
    }
  }

  return evaluated
}

// https://tc39.es/ecma262/#sec-loopcontinues
export function loopContinues(evaluated: EvaluatedNode, labels: string[] | undefined | null) {
  if (evaluated.type === undefined) {
    return true
  }

  if (evaluated.type !== TYPE_CONTINUE) {
    return false
  }

  if (evaluated.label === undefined) {
    return true
  }

  if (labels?.includes(evaluated.label)) {
    return true
  }

  return false
}
