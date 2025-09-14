import type {
  Completion,
  CompletionResult,
  CompletionContext,
  CompletionSource,
} from '@codemirror/autocomplete'
import { SyntaxNode } from '@lezer/common'
import { syntaxTree } from '@codemirror/language'
import { getAllProperties, Property } from './getAllProperties'
import { CompletionSet } from './CompletionSet'
import { AutocompleteCache } from './AutocompleteCache'
import { type Metadata, type GlobalScope } from '@jsconsole/interpreter'
import { keywordCompletions } from './keywordCompletions'

export type AutocompleteOptions = {
  globalObject: unknown
  globalScope: GlobalScope
  metadata: Metadata
  evaluate: (expr: string) => unknown
  cache?: AutocompleteCache
}

type AutocompleteResult = CompletionResult | null | Promise<CompletionResult | null>
type ScriptSyntaxNode = SyntaxNode & { name: 'Script' }
type VariableNameSyntaxNode = SyntaxNode & { name: 'VariableName' }
type MemberExpressionDotSyntaxNode = SyntaxNode & {
  name: '.'
  parent: SyntaxNode & { name: 'MemberExpression' }
}
type PropertyNameSyntaxNode = SyntaxNode & {
  name: 'PropertyName'
  parent: SyntaxNode & { name: 'MemberExpression' }
  prevSibling: MemberExpressionDotSyntaxNode
}

const EVAL_ERROR = Symbol()

// https://github.com/ChromeDevTools/devtools-frontend/blob/79fce4a526aa9844ce1ef99718cdaf05938b42f3/front_end/ui/components/text_editor/javascript.ts#L227
const Identifier = /^#?(?:[$_\p{ID_Start}])(?:[$_\u200C\u200D\p{ID_Continue}])*$/u

// TODO: history completions (https://github.com/ChromeDevTools/devtools-frontend/blob/c6a205c777841ec476721047ac45bb335df727a0/front_end/panels/console/ConsolePrompt.ts#L139)
// TODO: optional chaining autocomplete (`console?.|`)
export function autocomplete(options: AutocompleteOptions): CompletionSource {
  return (context: CompletionContext) => {
    const tree = syntaxTree(context.state)
    const innerNode = tree.resolveInner(context.pos, -1).enterUnfinishedNodesBefore(context.pos)

    // Don't show autocomplete for whitespaces.
    if (innerNode.name === 'Script' && !context.explicit) {
      return null
    }

    if (isGlobalAutocompletion(innerNode) || isVariableAutocompletion(innerNode)) {
      return autocompleteGlobals(context, innerNode, options)
    }

    if (isPropertiesAutocompletion(innerNode) || isPropertyAutocompletion(innerNode)) {
      return autocompleteProperties(context, innerNode, options)
    }

    return null
  }
}

function isGlobalAutocompletion(node: SyntaxNode): node is ScriptSyntaxNode {
  return node.name === 'Script'
}

function isVariableAutocompletion(node: SyntaxNode): node is VariableNameSyntaxNode {
  return node.name === 'VariableName'
}

function isPropertiesAutocompletion(node: SyntaxNode): node is MemberExpressionDotSyntaxNode {
  return node.name === '.' && node.parent?.name === 'MemberExpression'
}

function isPropertyAutocompletion(node: SyntaxNode): node is PropertyNameSyntaxNode {
  return (
    node.name === 'PropertyName' &&
    node.parent?.name === 'MemberExpression' &&
    node.prevSibling?.name === '.'
  )
}

function autocompleteGlobals(
  context: CompletionContext,
  node: ScriptSyntaxNode | VariableNameSyntaxNode,
  { globalObject, globalScope, metadata, cache }: AutocompleteOptions,
): AutocompleteResult {
  const varNameInput = isVariableAutocompletion(node)
    ? context.state.doc.sliceString(node.from, node.to)
    : ''

  let props = cache?.getAllProperties.get(globalObject)
  if (!props) {
    props = getAllProperties(globalObject, metadata, {
      skipIndexedKeys: true,
      skipSymbolKeys: true,
    })
    cache?.getAllProperties.set(globalObject, props)
  }

  const propsCompletions: Completion[] = props.map((prop) => {
    return {
      label: String(prop.name),
      type: typeof prop.value === 'function' ? 'function' : 'variable',
      boost: getPropertyBoost(globalObject, prop),
    } satisfies Completion
  })

  const globalScopeCompletions: Completion[] = Array.from(globalScope.bindings.entries()).map(
    ([name]) => {
      return {
        label: name,
        type: 'variable',
        boost: 99,
      } satisfies Completion
    },
  )

  const completionSet = new CompletionSet([
    ...propsCompletions,
    ...globalScopeCompletions,
    ...keywordCompletions,
  ])

  return {
    from: context.pos - varNameInput.length,
    options: completionSet.completions,
    validFor: Identifier,
  }
}

function autocompleteProperties(
  context: CompletionContext,
  node: MemberExpressionDotSyntaxNode | PropertyNameSyntaxNode,
  { evaluate, metadata, cache }: AutocompleteOptions,
): AutocompleteResult {
  const expr = isPropertyAutocompletion(node)
    ? context.state.doc.sliceString(node.parent.from, node.prevSibling.from)
    : isPropertiesAutocompletion(node)
      ? context.state.doc.sliceString(node.parent.from, node.from)
      : ''

  if (!expr) {
    return null
  }

  const propNameInput = isPropertyAutocompletion(node)
    ? context.state.doc.sliceString(node.from, node.to)
    : ''

  let value: unknown
  if (cache?.evaluate.has(expr)) {
    value = cache.evaluate.get(expr)
  } else {
    try {
      value = evaluate(expr)
    } catch {
      value = EVAL_ERROR
    }

    cache?.evaluate.set(expr, value)
  }

  if (value === null || value === undefined || value === EVAL_ERROR) {
    return null
  }

  let props = cache?.getAllProperties.get(value)
  if (!props) {
    props = getAllProperties(value, metadata, {
      skipIndexedKeys: true,
      skipSymbolKeys: true,
    })
    cache?.getAllProperties.set(value, props)
  }

  const completionSet = new CompletionSet(
    props.map((prop) => {
      return {
        label: String(prop.name),
        type: typeof prop.value === 'function' ? 'method' : 'property',
        boost: getPropertyBoost(value, prop),
      } satisfies Completion
    }),
  )

  return {
    from: context.pos - propNameInput.length,
    options: completionSet.completions,
    validFor: Identifier,
  }
}

function getPropertyBoost(obj: unknown, prop: Property): number {
  const isOwn = prop.owner === obj
  const isEnumerable = prop.enumerable === true
  return 2 * Number(isOwn) + 1 * Number(isEnumerable)
}
