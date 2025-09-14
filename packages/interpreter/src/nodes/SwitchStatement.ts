import { Expression, SwitchCase, SwitchStatement } from 'acorn'
import { BlockScope, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { initBindings } from '../lib/initBindings'
import { EMPTY } from '../constants'
import { logEvaluated, logEvaluating } from '../lib/log'
import {
  breakableStatementCompletion,
  isAbruptCompletion,
  updateEmpty,
} from '../lib/evaluation-utils'

type CaseClause = SwitchCase & { test: Expression }
type DefaultClause = SwitchCase & { test?: null }

// https://tc39.es/ecma262/#sec-switch-statement
export function* evaluateSwitchStatement(
  node: SwitchStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  let result: unknown = undefined

  node.discriminant.parent = node
  const { value: switchValue } = yield* evaluateNode(node.discriminant, scope, context)

  const switchScope: BlockScope = {
    kind: 'block',
    parent: scope,
    bindings: new Map(),
    name: 'Switch',
  }

  initBindings(node, switchScope, context, { var: false, lex: true })

  const { caseClausesHead, defaultClause, caseClausesTail } = splitCaseClauses(node.cases)
  let found = false

  for (const caseClause of caseClausesHead) {
    caseClause.parent = node

    if (!found) {
      found = yield* caseClauseIsSelected(caseClause, switchValue, switchScope, context)
    }

    if (found) {
      const evaluatedCase = yield* evaluateSwitchCase(caseClause, switchScope, context)

      if (evaluatedCase.value !== EMPTY) {
        result = evaluatedCase.value
      }

      if (isAbruptCompletion(evaluatedCase)) {
        const evaluated = breakableStatementCompletion(updateEmpty(evaluatedCase, result))
        DEV: logEvaluated(evaluated, node, context)
        return yield evaluated
      }
    }
  }

  if (!defaultClause) {
    const evaluated: EvaluatedNode = { value: result }
    DEV: logEvaluated(evaluated, node, context)
    return yield evaluated
  }

  let foundInTail = false

  if (!found) {
    for (const caseClause of caseClausesTail) {
      caseClause.parent = node

      if (!foundInTail) {
        foundInTail = yield* caseClauseIsSelected(caseClause, switchValue, switchScope, context)
      }

      if (foundInTail) {
        const evaluatedCase = yield* evaluateSwitchCase(caseClause, switchScope, context)

        if (evaluatedCase.value !== EMPTY) {
          result = evaluatedCase.value
        }

        if (isAbruptCompletion(evaluatedCase)) {
          const evaluated = breakableStatementCompletion(updateEmpty(evaluatedCase, result))
          DEV: logEvaluated(evaluated, node, context)
          return yield evaluated
        }
      }
    }
  }

  if (foundInTail) {
    const evaluated: EvaluatedNode = { value: result }
    DEV: logEvaluated(evaluated, node, context)
    return yield evaluated
  }

  const evaluatedDefault = yield* evaluateSwitchCase(defaultClause, switchScope, context)

  if (evaluatedDefault.value !== EMPTY) {
    result = evaluatedDefault.value
  }

  if (isAbruptCompletion(evaluatedDefault)) {
    const evaluated = breakableStatementCompletion(updateEmpty(evaluatedDefault, result))
    DEV: logEvaluated(evaluated, node, context)
    return yield evaluated
  }

  for (const caseClause of caseClausesTail) {
    caseClause.parent = node

    const evaluatedCase = yield* evaluateSwitchCase(caseClause, switchScope, context)

    if (evaluatedCase.value !== EMPTY) {
      result = evaluatedCase.value
    }

    if (isAbruptCompletion(evaluatedCase)) {
      const evaluated = breakableStatementCompletion(updateEmpty(evaluatedCase, result))
      DEV: logEvaluated(evaluated, node, context)
      return yield evaluated
    }
  }

  const evaluated: EvaluatedNode = { value: result }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}

// CaseBlock : { CaseClauses[opt] DefaultClause[opt] CaseClauses[opt] }
function splitCaseClauses(cases: SwitchCase[]): {
  caseClausesHead: CaseClause[]
  defaultClause: DefaultClause | null
  caseClausesTail: CaseClause[]
} {
  const defaultCaseIndex = cases.findIndex((caseClause) => !caseClause.test)
  if (defaultCaseIndex === -1) {
    return {
      caseClausesHead: cases as CaseClause[],
      defaultClause: null,
      caseClausesTail: [],
    }
  }

  return {
    caseClausesHead: cases.slice(0, defaultCaseIndex) as CaseClause[],
    defaultClause: cases[defaultCaseIndex]! as DefaultClause,
    caseClausesTail: cases.slice(defaultCaseIndex + 1) as CaseClause[],
  }
}

// https://tc39.es/ecma262/#sec-switch-statement-runtime-semantics-evaluation
function* evaluateSwitchCase(
  caseClause: SwitchCase,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  let value: unknown = EMPTY

  for (const statement of caseClause.consequent) {
    statement.parent = caseClause
    const evaluated = yield* evaluateNode(statement, scope, context)

    if (isAbruptCompletion(evaluated)) {
      return yield updateEmpty(evaluated, value)
    }

    if (evaluated.value !== EMPTY) {
      value = evaluated.value
    }
  }

  return yield { value }
}

// https://tc39.es/ecma262/#sec-runtime-semantics-caseclauseisselected
function* caseClauseIsSelected(
  caseClause: CaseClause,
  switchValue: unknown,
  switchScope: Scope,
  context: Context,
) {
  caseClause.test.parent = caseClause
  const { value: testValue } = yield* evaluateNode(caseClause.test, switchScope, context)
  return testValue === switchValue
}
