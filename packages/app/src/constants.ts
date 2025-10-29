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

export const SPECIAL_RESULTS = {
  HIDDEN: Symbol(),
  HELP: Symbol(),
} as const
