import { Expression } from 'acorn'
import { Context, PrivateName } from '../types'
import { toShortStringTag } from './toShortStringTag'
import { getNodeText } from './getNodeText'

export type ErrorDefinition = {
  type: 'TypeError' | 'ReferenceError' | 'SyntaxError' | 'RangeError'
  message: string
}

export const ErrorDefinition = function ErrorDefinition(
  this: any,
  type: ErrorDefinition['type'],
  message: ErrorDefinition['message'],
) {
  this.type = type
  this.message = message
} as unknown as {
  new (type: ErrorDefinition['type'], message: ErrorDefinition['message']): ErrorDefinition
}

export function TYPE_ERROR_CANNOT_DELETE_PROPERTY(
  object: unknown,
  propertyKey: PropertyKey,
): ErrorDefinition {
  return new ErrorDefinition(
    'TypeError',
    `Cannot delete property '${propertyKey.toString()}' of ${toShortStringTag(object)}`,
  )
}

export function SYNTAX_ERROR_DELETE_IDENTIFIER_IN_STRICT_MODE() {
  return new ErrorDefinition('SyntaxError', 'Delete of an unqualified identifier in strict mode.')
}

export function TYPE_ERROR_CANNOT_SET_PROPERTY(object: unknown, propertyKey: PropertyKey) {
  return new ErrorDefinition(
    'TypeError',
    `Cannot set properties of ${toShortStringTag(object)} (setting '${propertyKey.toString()}')`,
  )
}

export function TYPE_ERROR_CANNOT_SET_PROPERTIES(object: unknown) {
  return new ErrorDefinition('TypeError', `Cannot set properties of ${toShortStringTag(object)}`)
}

export function TYPE_ERROR_CANNOT_ACCESS_PRIVATE_NAME(object: unknown, privateName: PrivateName) {
  return new ErrorDefinition(
    'TypeError',
    `Cannot access private name #${privateName.name} from ${toShortStringTag(object)}`,
  )
}

export function TYPE_ERROR_PRIVATE_MEMBER_NOT_DECLARED(object: unknown, privateName: PrivateName) {
  return new ErrorDefinition(
    'TypeError',
    `Private member '#${privateName.name}' is not declared in ${toShortStringTag(object)}`,
  )
}

export function TYPE_ERROR_PRIVATE_METHOD_NOT_WRITABLE(privateName: PrivateName) {
  return new ErrorDefinition('TypeError', `Private method '#${privateName.name}' is not writable`)
}

export function TYPE_ERROR_PRIVATE_MEMBER_HAS_NO_GETTER(privateName: PrivateName) {
  return new ErrorDefinition('TypeError', `'#${privateName.name}' was defined without a getter`)
}

export function TYPE_ERROR_PRIVATE_MEMBER_HAS_NO_SETTER(privateName: PrivateName) {
  return new ErrorDefinition('TypeError', `'#${privateName.name}' was defined without a setter`)
}

export function TYPE_ERROR_SET_FAILURE_READ_ONLY(object: unknown, propertyKey: PropertyKey) {
  return new ErrorDefinition(
    'TypeError',
    `Cannot assign to read only property '${propertyKey.toString()}' of ${toShortStringTag(object)}`,
  )
}

export function TYPE_ERROR_SET_FAILURE_GETTER_ONLY(object: unknown, propertyKey: PropertyKey) {
  return new ErrorDefinition(
    'TypeError',
    `Cannot set property '${propertyKey.toString()}' of ${toShortStringTag(object)} which has only a getter`,
  )
}

export function TYPE_ERROR_DEFINE_OWN_PROPERTY_FAILURE_NOT_EXTENSIBLE(
  object: unknown,
  propertyKey: PropertyKey,
) {
  return new ErrorDefinition(
    'TypeError',
    `Cannot add property '${propertyKey.toString()}', ${toShortStringTag(object)} is not extensible`,
  )
}

export function SYNTAX_ERROR_INVALID_LEFT_HAND_SIDE() {
  return new ErrorDefinition(
    'SyntaxError',
    'Invalid left-hand side expression in postfix operation',
  )
}

export function REFERENCE_ERROR_CLASS_CTOR_MUST_CALL_SUPER() {
  return new ErrorDefinition(
    'ReferenceError',
    "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
  )
}

export function REFERENCE_ERROR_SUPER_MAY_ONLY_BE_CALLED_ONCE() {
  return new ErrorDefinition('ReferenceError', 'Super constructor may only be called once')
}

export function TYPE_ERROR_ARG_IS_NOT_CONSTRUCTOR(obj: unknown) {
  return new ErrorDefinition('TypeError', `${toShortStringTag(obj)} is not a constructor`)
}

export function TYPE_ERROR_EXPR_IS_NOT_CONSTRUCTOR(expr: Expression, context: Context) {
  const exprStr = getNodeText(expr, context.code)
  return new ErrorDefinition('TypeError', `${exprStr} is not a constructor`)
}

export function TYPE_ERROR_METHOD_NOT_CALLABLE(
  object: unknown,
  propertyName: PropertyKey,
  method: unknown,
) {
  return new ErrorDefinition(
    'TypeError',
    `${toShortStringTag(method)} returned for property "${propertyName.toString()}" of ${toShortStringTag(object)} is not a function`,
  )
}

export function SYNTAX_ERROR_ILLEGAL_RETURN() {
  return new ErrorDefinition('SyntaxError', 'Illegal return statement')
}

export function SYNTAX_ERROR_ILLEGAL_BREAK() {
  return new ErrorDefinition('SyntaxError', 'Illegal break statement')
}

export function SYNTAX_ERROR_ILLEGAL_CONTINUE() {
  return new ErrorDefinition('SyntaxError', 'Illegal continue statement')
}

export function TYPE_ERROR_CANNOT_DESTRUCTURE_NULLISH(value: null | undefined) {
  return new ErrorDefinition('TypeError', `Cannot destructure '${value}' as it is ${value}`)
}

export function TYPE_ERROR_ARG_IS_NOT_ITERABLE(value: unknown) {
  const valueStr =
    (typeof value === 'object' && value !== null) || typeof value === 'function'
      ? Object.prototype.toString.call(value)
      : String(value)
  return new ErrorDefinition('TypeError', `${valueStr} is not iterable`)
}

export function TYPE_ERROR_EXPR_IS_NOT_ITERABLE(expr: Expression, context: Context) {
  return new ErrorDefinition('TypeError', `${getNodeText(expr, context.code)} is not iterable`)
}

export function SYNTAX_ERROR_ILLEGAL_NEW_TARGET() {
  return new ErrorDefinition('SyntaxError', 'new.target expression is not allowed here')
}

export function TYPE_ERROR_CANNOT_USE_IN_IN_NON_OBJECT(left: unknown, right: unknown) {
  return new ErrorDefinition(
    'TypeError',
    `Cannot use 'in' operator to search for '${toShortStringTag(left)}' in ${toShortStringTag(right)}`,
  )
}

export function TYPE_ERROR_EXPR_IS_NOT_FUNCTION(expr: Expression, context: Context) {
  return new ErrorDefinition('TypeError', `${getNodeText(expr, context.code)} is not a function`)
}

export function REFERENCE_ERROR_VAR_IS_UNINITIALIZED(name: string) {
  return new ErrorDefinition('ReferenceError', `Cannot access '${name}' before initialization`)
}

export function REFERENCE_ERROR_VAR_IS_NOT_DEFINED(name: string) {
  return new ErrorDefinition('ReferenceError', `${name} is not defined`)
}

export function TYPE_ERROR_FN_RESTRICTED_PROPS_STRICT_MODE() {
  return new ErrorDefinition(
    'TypeError',
    `'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them`,
  )
}

export function SYNTAX_ERROR_VAR_ALREADY_DECLARED(name: string) {
  return new ErrorDefinition('SyntaxError', `Identifier '${name}' has already been declared`)
}

export function TYPE_ERROR_PRIVATE_METHOD_ALREADY_DECLARED(name: string) {
  return new ErrorDefinition('TypeError', `Private method '${name}' has already been declared`)
}

export function TYPE_ERROR_PRIVATE_FIELD_ALREADY_DECLARED(name: string) {
  return new ErrorDefinition('TypeError', `Private field '${name}' has already been declared`)
}

export function TYPE_ERROR_VAR_ASSIGNMENT_TO_CONST() {
  return new ErrorDefinition('TypeError', `Assignment to constant variable.`)
}

export function TYPE_ERROR_CANNOT_READ_PROPERTY(object: unknown, propertyKey: PropertyKey) {
  return new ErrorDefinition(
    'TypeError',
    `Cannot read properties of ${object} (reading '${propertyKey.toString()}')`,
  )
}

export function TYPE_ERROR_CANNOT_READ_PROPERTIES(object: unknown) {
  return new ErrorDefinition('TypeError', `Cannot read properties of ${toShortStringTag(object)}`)
}

export function TYPE_ERROR_CANNOT_CONVERT_NULLISH_TO_OBJECT() {
  return new ErrorDefinition('TypeError', 'Cannot convert undefined or null to object')
}

export function TYPE_ERROR_CANNOT_CONVERT_SYMBOL_TO_STRING() {
  return new ErrorDefinition('TypeError', 'Cannot convert a Symbol value to a string')
}

export function TYPE_ERROR_CANNOT_CONVERT_SYMBOL_TO_NUMBER() {
  return new ErrorDefinition('TypeError', 'Cannot convert a Symbol value to a number')
}

export function TYPE_ERROR_CANNOT_CONVERT_BIGINT_TO_NUMBER() {
  return new ErrorDefinition('TypeError', 'Cannot convert a BigInt value to a number')
}

export function TYPE_ERROR_CANNOT_CONVERT_OBJECT_TO_PRIMITIVE() {
  return new ErrorDefinition('TypeError', 'Cannot convert object to primitive value')
}

export function TYPE_ERROR_INSTANCEOF_RIGHT_ARG_IS_NOT_OBJECT() {
  return new ErrorDefinition('TypeError', `Right-hand side of 'instanceof' is not an object`)
}

export function TYPE_ERROR_INSTANCEOF_RIGHT_ARG_IS_NOT_CALLABLE() {
  return new ErrorDefinition('TypeError', `Right-hand side of 'instanceof' is not callable`)
}

export function TYPE_ERROR_INSTANCEOF_RIGHT_ARG_NON_OBJECT_PROTOTYPE(prototype: unknown) {
  return new ErrorDefinition(
    'TypeError',
    `Function has non-object prototype '${toShortStringTag(prototype)}' in instanceof check`,
  )
}

export function TYPE_ERROR_DERIVED_CTOR_MAY_ONLY_RETURN_OBJECT_OR_UNDEFINED() {
  return new ErrorDefinition(
    'TypeError',
    'Derived constructors may only return object or undefined',
  )
}

export function TYPE_ERROR_CLASS_EXTENDS_NOT_A_CONSTRUCTOR_OR_NULL(superClass: unknown) {
  return new ErrorDefinition(
    'TypeError',
    `Class extends value ${toShortStringTag(superClass)} is not a constructor or null`,
  )
}

export function TYPE_ERROR_CLASS_EXTENDS_INVALID_PROTOTYPE(superClassPrototype: unknown) {
  return new ErrorDefinition(
    'TypeError',
    `Class extends value does not have valid prototype property ${toShortStringTag(superClassPrototype)}`,
  )
}

export function TYPE_ERROR_SUPER_CONSTRUCTOR_IS_NOT_A_CONSTRUCTOR(
  superClass: null,
  newTarget: unknown,
) {
  return new ErrorDefinition(
    'TypeError',
    `Super constructor ${toShortStringTag(superClass)} of ${toShortStringTag(newTarget)} is not a constructor`,
  )
}
