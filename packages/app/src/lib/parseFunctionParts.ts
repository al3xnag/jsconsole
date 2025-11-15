import { ArrowFunctionExpression, ClassExpression, FunctionExpression, parse } from 'acorn'
import { ValueContext } from './ValueContextContext'

type ParsedFunctionParts = {
  isAsync: boolean
  isGenerator: boolean
  isArrow: boolean
  name: string
  // For classes `args` is null
  args: string | null
  body: string
  isClassConstructor: boolean
}

type ParsedExpression = {
  expression: FunctionExpression | ArrowFunctionExpression | ClassExpression
  parsedSource: string
} | null

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function parseFunctionParts(fn: Function, context: ValueContext): ParsedFunctionParts {
  const metadata = context.metadata.functions.get(fn)

  let isNative = false
  let source: string

  if (metadata?.sourceCode) {
    source = metadata.sourceCode
  } else {
    source = Function.prototype.toString.call(fn)
    isNative = isNativeFunction(source)
  }

  const parsed = !isNative ? parseExpression(source) : null
  const expression = parsed ? parsed.expression : null

  const parts: ParsedFunctionParts = {
    isAsync: metadata?.async ?? (isFunctionExpression(expression) ? expression.async : false),
    isGenerator:
      metadata?.generator ?? (isFunctionExpression(expression) ? expression.generator : false),
    isArrow: metadata?.arrow ?? expression?.type === 'ArrowFunctionExpression',
    name: fn.name,
    args: getArgsString(parsed, isNative),
    body: getBodyString(parsed, isNative),
    isClassConstructor: metadata?.isClassConstructor ?? isClassExpression(expression),
  }

  return parts
}

function isNativeFunction(source: string): boolean {
  // NOTE: (async function foo /*asd*/(a, /*asdas*/) {}).bind().toString()
  //  - Chrome:  function () { [native code] }
  //  - Firefox: function() {\n  [native code]\n}
  //  - Safari:  function foo() {\n  [native code]\n}
  return /^function\s?(?:(?:[$_\p{ID_Start}])(?:[$_\u200C\u200D\p{ID_Continue}])*)?\s*\(\)\s*\{\s*\[native code\]\s*\}$/u.test(
    source,
  )
}

function parseExpression(source: string): ParsedExpression {
  try {
    const parsedSource = `(${source})`
    const ast = parse(parsedSource, { ecmaVersion: 'latest' })
    if (ast.body[0]?.type !== 'ExpressionStatement') return null
    const expression = ast.body[0].expression
    return expression.type === 'FunctionExpression' ||
      expression.type === 'ArrowFunctionExpression' ||
      expression.type === 'ClassExpression'
      ? { expression, parsedSource }
      : null
  } catch {
    /* ignore */
  }

  try {
    const parsedSource = `({${source}})`
    const ast = parse(parsedSource, { ecmaVersion: 'latest' })
    if (ast.body[0]?.type !== 'ExpressionStatement') return null
    const expression = ast.body[0].expression
    if (expression.type !== 'ObjectExpression') return null
    const property = expression.properties[0]
    return property?.type === 'Property' &&
      property.method &&
      property.value.type === 'FunctionExpression'
      ? { expression: property.value, parsedSource }
      : null
  } catch {
    /* ignore */
  }

  return null
}

function isFunctionExpression(
  expression: FunctionExpression | ArrowFunctionExpression | ClassExpression | null,
): expression is FunctionExpression | ArrowFunctionExpression {
  const type = expression?.type
  return type === 'FunctionExpression' || type === 'ArrowFunctionExpression'
}

function isClassExpression(
  expression: FunctionExpression | ArrowFunctionExpression | ClassExpression | null,
): expression is ClassExpression {
  return expression?.type === 'ClassExpression'
}

function getArgsString(parsed: ParsedExpression, isNative: boolean): string | null {
  if (parsed) {
    if (isFunctionExpression(parsed.expression)) {
      const { params } = parsed.expression
      if (params.length === 0) return ''
      const firstParam = params[0]
      const lastParam = params[params.length - 1]
      return parsed.parsedSource.substring(firstParam.start, lastParam.end)
    }

    // ClassExpression:
    return null
  } else if (isNative) {
    return ''
  } else {
    return null
  }
}

function getBodyString(parsed: ParsedExpression, isNative: boolean): string {
  if (parsed) {
    const { body } = parsed.expression
    return parsed.parsedSource.substring(body.start, body.end)
  } else if (isNative) {
    return '{ [native code] }'
  } else {
    return ''
  }
}
