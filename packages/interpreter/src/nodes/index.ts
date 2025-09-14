import { AnyNode } from 'acorn'
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

export function* evaluateNode(node: AnyNode, scope: Scope, context: Context): EvaluateGenerator {
  const handler = handlers[node.type]
  if (!handler) {
    throw new UnsupportedOperationError(`${node.type} is not supported`)
  }

  const evaluated = yield* handler(node, scope, context)
  return evaluated
}

const handlers: Partial<
  Record<AnyNode['type'], (node: any, scope: Scope, context: Context) => EvaluateGenerator>
> = {
  Program: evaluateProgram,
  BlockStatement: evaluateBlockStatement,
  ReturnStatement: evaluateReturnStatement,
  BreakStatement: evaluateBreakStatement,
  ContinueStatement: evaluateContinueStatement,
  ExpressionStatement: evaluateExpressionStatement,
  Identifier: evaluateIdentifier,
  ThisExpression: evaluateThisExpression,
  Literal: evaluateLiteral,
  UnaryExpression: evaluateUnaryExpression,
  TemplateLiteral: evaluateTemplateLiteral,
  VariableDeclaration: evaluateVariableDeclaration,
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
  FunctionDeclaration: evaluateFunctionDeclaration,
  EmptyStatement: evaluateEmptyStatement,
  AwaitExpression: evaluateAwaitExpression,
  TryStatement: evaluateTryStatement,
  ThrowStatement: evaluateThrowStatement,
  IfStatement: evaluateIfStatement,
  WhileStatement: evaluateWhileStatement,
  DoWhileStatement: evaluateDoWhileStatement,
  ForInStatement: evaluateForInStatement,
  ForOfStatement: evaluateForOfStatement,
  ForStatement: evaluateForStatement,
  UpdateExpression: evaluateUpdateExpression,
  SwitchStatement: evaluateSwitchStatement,
  TaggedTemplateExpression: evaluateTaggedTemplateExpression,
  ConditionalExpression: evaluateConditionalExpression,
  MetaProperty: evaluateMetaProperty,
}
