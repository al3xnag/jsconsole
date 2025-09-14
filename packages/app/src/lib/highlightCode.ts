// https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/ui/components/code_highlighter/CodeHighlighter.ts

import { LanguageSupport } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
// import { css } from '@codemirror/lang-css'
// import { html } from '@codemirror/lang-html'
import { Tree } from '@lezer/common'
import { highlightCode } from '@lezer/highlight'
import { highlightStyle } from './highlightStyle'

export type HighlightCodeLang = 'js' | 'ts' | 'jsx' | 'tsx' | 'css' | 'html'

export async function highlightCodeInHTMLElement(el: HTMLElement, lang: HighlightCodeLang) {
  const code = el.textContent || ''
  const language = await getLanguage(lang)
  const tree = getTree(code, language)

  const putText = (text: string, classes: string) => {
    const textNode = document.createTextNode(text)
    if (classes) {
      const span = document.createElement('span')
      span.className = classes
      span.appendChild(textNode)
      el.appendChild(span)
    } else {
      el.appendChild(textNode)
    }
  }

  const putBreak = () => {
    const textNode = document.createTextNode('\n')
    el.appendChild(textNode)
  }

  el.textContent = ''
  highlightCode(code, tree, highlightStyle, putText, putBreak)
}

async function getLanguage(lang: HighlightCodeLang): Promise<LanguageSupport | null> {
  switch (lang) {
    case 'js':
      return javascript({ jsx: false, typescript: false })
    case 'ts':
      return javascript({ jsx: false, typescript: true })
    case 'jsx':
      return javascript({ jsx: true, typescript: false })
    case 'tsx':
      return javascript({ jsx: true, typescript: true })
    // case 'html':
    //   return html({ autoCloseTags: false, selfClosingTags: true })
    // case 'css':
    //   return css()
    default:
      return null
  }
}

function getTree(code: string, language: LanguageSupport | null) {
  return language ? language.language.parser.parse(code) : Tree.empty
}
