import { HighlightStyle } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

export const highlightStyle: HighlightStyle = HighlightStyle.define([
  { tag: t.variableName, class: 'token-variable' },
  { tag: t.definition(t.variableName), class: 'token-definition' },
  { tag: t.propertyName, class: 'token-property' },
  { tag: [t.typeName, t.className, t.namespace, t.macroName], class: 'token-type' },
  { tag: [t.special(t.name), t.constant(t.className)], class: 'token-variable-special' },
  { tag: t.standard(t.variableName), class: 'token-builtin' },

  { tag: [t.number, t.literal, t.unit], class: 'token-number' },
  { tag: t.string, class: 'token-string' },
  { tag: [t.special(t.string), t.regexp, t.escape], class: 'token-string-special' },
  { tag: [t.atom, t.labelName, t.bool], class: 'token-atom' },

  { tag: t.keyword, class: 'token-keyword' },
  { tag: [t.comment, t.quote], class: 'token-comment' },
  { tag: t.meta, class: 'token-meta' },
  { tag: t.invalid, class: 'token-invalid' },

  { tag: t.tagName, class: 'token-tag' },
  { tag: t.attributeName, class: 'token-attribute' },
  { tag: t.attributeValue, class: 'token-attribute-value' },

  { tag: t.inserted, class: 'token-inserted' },
  { tag: t.deleted, class: 'token-deleted' },
  { tag: t.heading, class: 'token-heading' },
  { tag: t.link, class: 'token-link' },
  { tag: t.strikethrough, class: 'token-strikethrough' },
  { tag: t.strong, class: 'token-strong' },
  { tag: t.emphasis, class: 'token-emphasis' },
])

// For reference:
// node_modules/@codemirror/language/dist/index.js
//
// /**
// A default highlight style (works well with light themes).
// */
// const defaultHighlightStyle = HighlightStyle.define([
//   { tag: tags.meta,
//       color: "#404740" },
//   { tag: tags.link,
//       textDecoration: "underline" },
//   { tag: tags.heading,
//       textDecoration: "underline",
//       fontWeight: "bold" },
//   { tag: tags.emphasis,
//       fontStyle: "italic" },
//   { tag: tags.strong,
//       fontWeight: "bold" },
//   { tag: tags.strikethrough,
//       textDecoration: "line-through" },
//   { tag: tags.keyword,
//       color: "#708" },
//   { tag: [tags.atom, tags.bool, tags.url, tags.contentSeparator, tags.labelName],
//       color: "#219" },
//   { tag: [tags.literal, tags.inserted],
//       color: "#164" },
//   { tag: [tags.string, tags.deleted],
//       color: "#a11" },
//   { tag: [tags.regexp, tags.escape, /*@__PURE__*/tags.special(tags.string)],
//       color: "#e40" },
//   { tag: /*@__PURE__*/tags.definition(tags.variableName),
//       color: "#00f" },
//   { tag: /*@__PURE__*/tags.local(tags.variableName),
//       color: "#30a" },
//   { tag: [tags.typeName, tags.namespace],
//       color: "#085" },
//   { tag: tags.className,
//       color: "#167" },
//   { tag: [/*@__PURE__*/tags.special(tags.variableName), tags.macroName],
//       color: "#256" },
//   { tag: /*@__PURE__*/tags.definition(tags.propertyName),
//       color: "#00c" },
//   { tag: tags.comment,
//       color: "#940" },
//   { tag: tags.invalid,
//       color: "#f00" }
// ]);
//
// const baseTheme = EditorView.baseTheme({
//   "&.cm-focused .cm-matchingBracket": { backgroundColor: "#328c8252" },
//   "&.cm-focused .cm-nonmatchingBracket": { backgroundColor: "#bb555544" }
// });

// For reference:
// https://github.com/ChromeDevTools/devtools-frontend/blob/30c312b312fa1d0c7b19a42f2f2024e2a4bbd447/front_end/ui/legacy/components/object_ui/objectValue.css#L39
// https://github.com/ChromeDevTools/devtools-frontend/blob/30c312b312fa1d0c7b19a42f2f2024e2a4bbd447/front_end/ui/legacy/components/object_ui/ObjectPropertiesSection.ts#L395
// https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/ui/components/code_highlighter/CodeHighlighter.ts
// https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/ui/components/code_highlighter/codeHighlighter.css
