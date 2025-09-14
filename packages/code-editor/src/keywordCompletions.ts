import type { Completion } from '@codemirror/autocomplete'

// CodeMirror's default keywords list is not complete (for autocomplete), so we add some extra keywords.
// Also, some keywords are defined as snippets with type=keyword (e.g. `for` and `for-of`), so we add plain keywords as well.
const extraKeywords = [
  'async',
  'await',
  // 'break',
  // 'case',
  'catch',
  'class',
  // 'const',
  // 'continue',
  'debugger',
  // 'default',
  // 'delete',
  'do',
  'else',
  // 'export',
  // 'extends',
  // 'false',
  // 'finally',
  'for',
  'function',
  'if',
  'import',
  // 'in',
  // 'instanceof',
  // 'let',
  // 'new',
  'null',
  'of',
  // 'return',
  // 'static',
  // 'super',
  // 'switch',
  // 'this',
  // 'throw',
  // 'true',
  'try',
  // 'typeof',
  // 'var',
  'void',
  'while',
  'with',
  // 'yield',
]

export const keywordCompletions: Completion[] = extraKeywords.map((keyword) => ({
  label: keyword,
  type: 'keyword',
  // Display above built-in snippets, like `for` and `for-of`.
  boost: 1,
}))
