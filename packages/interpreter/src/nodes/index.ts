import { AnonymousClassDeclaration, AnonymousFunctionDeclaration, AnyNode, Statement } from 'acorn'
import { logEvaluated, logEvaluating } from '../lib/log'
import { throwError } from '../lib/throwError'
import { throwIfTimedOut } from '../lib/throwIfTimedOut'
import { trackPromise } from '../lib/trackPromise'
import { CallStack, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateArrayExpression } from './ArrayExpression'
import { evaluateArrowFunctionExpression } from './ArrowFunctionExpression'
import { evaluateAssignmentExpression } from './AssignmentExpression'
import { evaluateAwaitExpression } from './AwaitExpression'
import { evaluateBinaryExpression } from './BinaryExpression'
import { evaluateBlockStatement } from './BlockStatement'
import { evaluateBreakStatement } from './BreakStatement'
import { evaluateCallExpression } from './CallExpression'
import { evaluateChainExpression } from './ChainExpression'
import { evaluateClassDeclaration } from './ClassDeclaration'
import { evaluateClassExpression } from './ClassExpression'
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
import { evaluateSuper } from './Super'
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
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'

type StatementFixed = Statement | AnonymousClassDeclaration | AnonymousFunctionDeclaration

type EvaluateStatement<T extends StatementFixed> = (
  node: T,
  scope: Scope,
  callStack: CallStack,
  context: Context,
  labels?: string[],
) => EvaluateGenerator

type EvaluateNode<T extends AnyNode> = (
  node: T,
  scope: Scope,
  callStack: CallStack,
  context: Context,
) => EvaluateGenerator

export function* evaluateStatement<T extends StatementFixed>(
  node: T,
  _scope: Scope,
  callStack: CallStack,
  context: Context,
  _labels?: string[],
): ReturnType<EvaluateStatement<T>> {
  const handler = statementHandlers[node.type] as EvaluateStatement<T> | undefined

  try {
    if (!handler) {
      throw new UnsupportedOperationError(`${node.type} is not supported`)
    }

    return yield* handler.apply(null, arguments as unknown as Parameters<EvaluateStatement<T>>)
  } catch (error) {
    throwError(error, node.loc, callStack, context, 'unsafe')
  }
}

export function* evaluateNode<T extends AnyNode>(
  node: T,
  _scope: Scope,
  callStack: CallStack,
  context: Context,
): ReturnType<EvaluateNode<T>> {
  DEBUG_INT && logEvaluating(node, context)

  const handler = handlers[node.type] as EvaluateNode<T> | undefined

  let evaluated: EvaluatedNode

  try {
    if (!handler) {
      throw new UnsupportedOperationError(`${node.type} is not supported`)
    }

    throwIfTimedOut()

    evaluated = yield* handler.apply(null, arguments as unknown as Parameters<EvaluateNode<T>>)
  } catch (error) {
    throwError(error, node.loc, callStack, context, 'unsafe')
  }

  if (evaluated.value instanceof context.metadata.globals.Promise) {
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
  ClassDeclaration: evaluateClassDeclaration,
}

const handlers: Partial<{
  [T in AnyNode['type']]: (
    node: Extract<AnyNode, { type: T }>,
    scope: Scope,
    callStack: CallStack,
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
  ClassExpression: evaluateClassExpression,
  Super: evaluateSuper,
}
