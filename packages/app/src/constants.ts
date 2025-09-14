export const INTERPRETER = Symbol.for('<interpreter>')

export const HOTKEY_CLEAR_CONSOLE = {
  shortcut: '⌘K',
  test: (e: KeyboardEvent) => e.key === 'k' && e.metaKey,
} as const

export const HOTKEY_RESTART = {
  shortcut: '⌘G',
  test: (e: KeyboardEvent) => e.key === 'g' && e.metaKey,
} as const

export const HOTKEY_RELOAD = {
  shortcut: '⌘B',
  test: (e: KeyboardEvent) => e.key === 'b' && e.metaKey,
} as const

export const HOTKEY_TOGGLE_PREVIEW = {
  shortcut: '⌘O',
  test: (e: KeyboardEvent) => e.key === 'o' && e.metaKey,
} as const

export const HELP_ENTRY_TEXT = `This is a JavaScript console, powered by its own JavaScript interpreter, written in JavaScript.

The interpreter enables some nice features, such as autocomplete, eager evaluation, and displaying object metadata, which would not be possible using \`eval\`. This console transparently works within the current browser realm, reusing existing browser APIs, global objects and prototypes.

It's very experimental and a work in progress.

In addition to the standard JavaScript stuff and browser APIs, you can use the following global commands:

  - \`clear()\` - clear the console (same as \`console.clear()\`)
  - \`help()\` - show this help

There is also a menu in the top right corner where you can find other commands.
Console log is preserved between reloads – it's serialized to the URL, so you can share a link with your colleagues.

This project is open source and available on GitHub: https://github.com/al3xnag/jsconsole
Carefully (not really) crafted by @al3xnag.
`
