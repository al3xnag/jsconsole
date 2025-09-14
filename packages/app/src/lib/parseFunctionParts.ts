import { javascript } from '@codemirror/lang-javascript'
import { ValueContext } from './ValueContextContext'

type ParsedFunctionParts = {
  isAsync: boolean
  isGenerator: boolean
  isArrow: boolean
  name: string
  args: string
  body: string
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function parseFunctionParts(fn: Function, context: ValueContext): ParsedFunctionParts {
  const parts: ParsedFunctionParts = {
    isAsync: false,
    isGenerator: false,
    isArrow: false,
    name: fn.name,
    args: '',
    body: '',
  }

  try {
    const metadata = context.metadata.functions.get(fn)
    const code = metadata?.sourceCode ? metadata.sourceCode : Function.prototype.toString.call(fn)

    const language = javascript({ jsx: false, typescript: false })
    const tree = language.language.parser.parse(code)
    const cursor = tree.cursor()

    if (!cursor.firstChild()) return parts
    if (cursor.name === 'FunctionDeclaration') {
      if (!cursor.firstChild()) return parts
    } else if (cursor.name === 'ExpressionStatement') {
      if (!cursor.firstChild()) return parts
      // @ts-expect-error name is mutable
      if (cursor.name === 'ArrowFunction') {
        if (!cursor.firstChild()) return parts
      } else {
        return parts
      }
    }

    do {
      switch (cursor.name) {
        case 'async':
          parts.isAsync = true
          break
        case 'Star':
          parts.isGenerator = true
          break
        case 'Arrow':
          parts.isArrow = true
          if (cursor.nextSibling()) {
            parts.body = code.slice(cursor.from, cursor.to)
          }
          break
        case 'ParamList':
          parts.args = code.slice(cursor.from, cursor.to)
          break
        case 'Block':
          parts.body = code.slice(cursor.from, cursor.to)
          break
      }
    } while (cursor.nextSibling())
  } catch (error) {
    console.groupCollapsed('Failed to parse function parts')
    console.debug(fn)
    console.debug('fn metadata', context.metadata.functions.get(fn))
    console.warn(error)
    console.groupEnd()
  }

  return parts
}
