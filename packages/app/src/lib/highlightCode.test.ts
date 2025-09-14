// @vitest-environment happy-dom

import { expect, test, describe } from 'vitest'
import { highlightCodeInHTMLElement, HighlightCodeLang } from './highlightCode'

describe('highlightCodeInHTMLElement', () => {
  type TestCase = [HighlightCodeLang, string, string]

  // [lang, code, expected innerHTML]
  const cases: TestCase[] = [
    [
      'js',
      'console.log("Hello, world!");',
      '<span class="token-variable">console</span>.<span class="token-property">log</span>(<span class="token-string">"Hello, world!"</span>);',
    ],
    [
      'js',
      `if (true) {
  return 1 + 2;
}`,
      `<span class="token-keyword">if</span> (<span class="token-atom">true</span>) {
  <span class="token-keyword">return</span> <span class="token-number">1</span> + <span class="token-number">2</span>;
}`,
    ],
  ]

  test.each(cases)('%s: %s', async (lang, code, expectedInnerHTML) => {
    const el = document.createElement('div')
    el.textContent = code
    await highlightCodeInHTMLElement(el, lang)
    expect(el.innerHTML).toBe(expectedInnerHTML)
  })
})
