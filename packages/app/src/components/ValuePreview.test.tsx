// @vitest-environment happy-dom

import { expect, test, describe } from 'vitest'
import { render } from '@testing-library/react'
import { ValuePreview, ValuePreviewProps } from './ValuePreview'
import { ValueContextProvider } from './ValueContextProvider'
import { ValueContext } from '@/lib/ValueContextContext'
import { getGlobals } from '@/lib/globals'
import { Metadata, SideEffectInfo } from '@jsconsole/interpreter'

// [props, expected innerHTML]
type TestCase = [ValuePreviewProps, string]

describe('string', () => {
  runTestCases([
    // string
    [
      { value: `Hello, world!`, placement: 'top' },
      `<span><span class="token-string">'Hello, world!'</span></span>`,
    ],
    [
      { value: `Hello, world!`, placement: 'item' },
      `<span><span class="token-string">"Hello, world!"</span></span>`,
    ],
    [
      { value: `Hello, world!`, placement: 'inner' },
      `<span><span class="token-string">'Hello, world!'</span></span>`,
    ],

    // string with single quote
    [
      { value: `Hello, 'world'!`, placement: 'top' },
      `<span><span class="token-string">"Hello, 'world'!"</span></span>`,
    ],
    [
      { value: `Hello, 'world'!`, placement: 'item' },
      `<span><span class="token-string">"Hello, 'world'!"</span></span>`,
    ],
    [
      { value: `Hello, 'world'!`, placement: 'inner' },
      `<span><span class="token-string">"Hello, 'world'!"</span></span>`,
    ],

    // string with double quote
    [
      { value: `Hello, "world"!`, placement: 'top' },
      `<span><span class="token-string">'Hello, "world"!'</span></span>`,
    ],
    [
      { value: `Hello, "world"!`, placement: 'item' },
      `<span><span class="token-string">"Hello, \\"world\\"!"</span></span>`,
    ],
    [
      { value: `Hello, "world"!`, placement: 'inner' },
      `<span><span class="token-string">'Hello, "world"!'</span></span>`,
    ],

    // multi-line string
    [
      { value: `Hello,\nworld!`, placement: 'top' },
      `<span><span class="token-string">'Hello,\\nworld!'</span></span>`,
    ],
    [
      { value: `Hello,\nworld!`, placement: 'item' },
      `<span><span class="token-string">"Hello,\\nworld!"</span></span>`,
    ],
    [
      { value: `Hello,\nworld!`, placement: 'inner' },
      `<span><span class="token-string">'Hello,\\nworld!'</span></span>`,
    ],
  ])
})

function runTestCases(cases: TestCase[]) {
  const valueContext: ValueContext = {
    globals: getGlobals(globalThis),
    metadata: new Metadata(globalThis),
    sideEffectInfo: new SideEffectInfo(),
  }

  test.each(cases)('%#. %o should render %s', (props, expectedInnerHTML) => {
    const { container } = render(
      <ValueContextProvider value={valueContext}>
        <ValuePreview {...props} />
      </ValueContextProvider>,
    )
    expect(container.innerHTML).toBe(expectedInnerHTML)
  })
}
