import { AnonymousClassDeclaration, AnonymousFunctionDeclaration, AnyNode, Statement } from 'acorn'
import { logEvaluated, logEvaluating } from '../lib/log'
import { throwIfTimedOut } from '../lib/throwIfTimedOut'
import { trackPromise } from '../lib/trackPromise'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { Context, EvaluateGenerator, Scope } from '../types'
import { evaluateArrayExpression } from './ArrayExpression'
import { evaluateArrowFunctionExpression } from './ArrowFunctionExpression'
import { evaluateAssignmentExpression } from './AssignmentExpression'
import { evaluateAwaitExpression } from './AwaitExpression'
import { evaluateBinaryExpression } from './BinaryExpression'
import { evaluateBlockStatement } from './BlockStatement'
import { evaluateBreakStatement } from './BreakStatement'
import { evaluateCallExpression } from './CallExpression'
import { evaluateChainExpression } from './ChainExpression'
import { evaluateConditionalExpression } from './ConditionalExpression'
import { evaluateContinueStatement } from './ContinueStatement'
import { evaluateDebuggerStatement } from './DebuggerStatement'
import { evaluateDoWhileStatement } from './DoWhileStatement'
import { evaluateEmptyStatement } from './EmptyStatement'
import { evaluateExpressionStatement } from './ExpressionStatement'
import { evaluateForInStatement } from './ForInStatement'
import { evaluateForOfStatement } from './ForOfStatement'
import { evaluateForStatement } from './ForStatement'
import { evaluateFunctionDeclaration } from './FunctionDeclaration'
import { evaluateFunctionExpression } from './FunctionExpression'
import { evaluateIdentifier } from './Identifier'
import { evaluateIfStatement } from './IfStatement'
import { evaluateLabeledStatement } from './LabeledStatement'
import { evaluateLiteral } from './Literal'
import { evaluateLogicalExpression } from './LogicalExpression'
import { evaluateMemberExpression } from './MemberExpression'
import { evaluateMetaProperty } from './MetaProperty'
import { evaluateNewExpression } from './NewExpression'
import { evaluateObjectExpression } from './ObjectExpression'
import { evaluateProgram } from './Program'
import { evaluateReturnStatement } from './ReturnStatement'
import { evaluateSequenceExpression } from './SequenceExpression'
import { evaluateSpreadElement } from './SpreadElement'
import { evaluateSwitchStatement } from './SwitchStatement'
import { evaluateTaggedTemplateExpression } from './TaggedTemplateExpression'
import { evaluateTemplateLiteral } from './TemplateLiteral'
import { evaluateThisExpression } from './ThisExpression'
import { evaluateThrowStatement } from './ThrowStatement'
import { evaluateTryStatement } from './TryStatement'
import { evaluateUnaryExpression } from './UnaryExpression'
import { evaluateUpdateExpression } from './UpdateExpression'
import { evaluateVariableDeclaration } from './VariableDeclaration'
import { evaluateWhileStatement } from './WhileStatement'

type StatementFixed = Statement | AnonymousClassDeclaration | AnonymousFunctionDeclaration

type EvaluateStatement<T extends StatementFixed> = (
  node: T,
  scope: Scope,
  context: Context,
  labels?: string[],
) => EvaluateGenerator

type EvaluateNode<T extends AnyNode> = (
  node: T,
  scope: Scope,
  context: Context,
) => EvaluateGenerator

type DropFirst<T extends unknown[]> = T extends [any, ...infer U] ? U : never

export function* evaluateStatement<T extends StatementFixed>(
  node: T,
  ..._args: DropFirst<Parameters<EvaluateStatement<T>>>
): ReturnType<EvaluateStatement<T>> {
  const handler = statementHandlers[node.type] as EvaluateStatement<T> | undefined
  if (!handler) {
    throw new UnsupportedOperationError(`${node.type} is not supported`)
  }

  return yield* handler.apply(null, arguments as unknown as Parameters<EvaluateStatement<T>>)
}

export function* evaluateNode<T extends AnyNode>(
  node: T,
  _scope: Scope,
  context: Context,
): ReturnType<EvaluateNode<T>> {
  DEBUG_INT && logEvaluating(node, context)

  throwIfTimedOut()

  const handler = handlers[node.type] as EvaluateNode<T> | undefined
  if (!handler) {
    throw new UnsupportedOperationError(`${node.type} is not supported`)
  }

  const evaluated = yield* handler.apply(null, arguments as unknown as Parameters<EvaluateNode<T>>)

  const _Promise = context.metadata.globals.Promise
  if (_Promise && evaluated.value instanceof _Promise) {
    trackPromise(evaluated.value, context)
  }

  DEBUG_INT && logEvaluated(evaluated, node, context)
  return evaluated
}

const statementHandlers: Partial<{
  [T in StatementFixed['type']]: EvaluateStatement<Extract<StatementFixed, { type: T }>>
}> = {
  BlockStatement: evaluateBlockStatement,
  ReturnStatement: evaluateReturnStatement,
  BreakStatement: evaluateBreakStatement,
  ContinueStatement: evaluateContinueStatement,
  LabeledStatement: evaluateLabeledStatement,
  ExpressionStatement: evaluateExpressionStatement,
  EmptyStatement: evaluateEmptyStatement,
  TryStatement: evaluateTryStatement,
  ThrowStatement: evaluateThrowStatement,
  IfStatement: evaluateIfStatement,
  WhileStatement: evaluateWhileStatement,
  DoWhileStatement: evaluateDoWhileStatement,
  ForInStatement: evaluateForInStatement,
  ForOfStatement: evaluateForOfStatement,
  ForStatement: evaluateForStatement,
  SwitchStatement: evaluateSwitchStatement,
  VariableDeclaration: evaluateVariableDeclaration,
  FunctionDeclaration: evaluateFunctionDeclaration,
  DebuggerStatement: evaluateDebuggerStatement,
}

const handlers: Partial<{
  [T in AnyNode['type']]: (
    node: Extract<AnyNode, { type: T }>,
    scope: Scope,
    context: Context,
  ) => EvaluateGenerator
}> = {
  ...statementHandlers,
  Program: evaluateProgram,
  Identifier: evaluateIdentifier,
  ThisExpression: evaluateThisExpression,
  Literal: evaluateLiteral,
  UnaryExpression: evaluateUnaryExpression,
  TemplateLiteral: evaluateTemplateLiteral,
  AssignmentExpression: evaluateAssignmentExpression,
  ChainExpression: evaluateChainExpression,
  MemberExpression: evaluateMemberExpression,
  CallExpression: evaluateCallExpression,
  BinaryExpression: evaluateBinaryExpression,
  LogicalExpression: evaluateLogicalExpression,
  ArrayExpression: evaluateArrayExpression,
  ObjectExpression: evaluateObjectExpression,
  SpreadElement: evaluateSpreadElement,
  SequenceExpression: evaluateSequenceExpression,
  FunctionExpression: evaluateFunctionExpression,
  ArrowFunctionExpression: evaluateArrowFunctionExpression,
  NewExpression: evaluateNewExpression,
  AwaitExpression: evaluateAwaitExpression,
  UpdateExpression: evaluateUpdateExpression,
  TaggedTemplateExpression: evaluateTaggedTemplateExpression,
  ConditionalExpression: evaluateConditionalExpression,
  MetaProperty: evaluateMetaProperty,
}
