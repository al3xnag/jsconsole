import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  HOTKEY_CLEAR_CONSOLE,
  HOTKEY_RELOAD,
  HOTKEY_RESTART,
  HOTKEY_TOGGLE_PREVIEW,
} from '@/constants'
import { useActions } from '@/hooks/useActions'
import { useConsole } from '@/hooks/useConsole'
import { useHotkey } from '@/hooks/useHotkey'
import { usePreview } from '@/hooks/usePreview'
import { useTheme } from '@/hooks/useTheme'
import { Theme } from '@/lib/ThemeContext'
import { ArrowUpRightIcon, MenuIcon } from 'lucide-react'
import { useCallback } from 'react'

export function Header() {
  const { focusPrompt, scrollToBottom } = useConsole()
  const { restart, clear, reload } = useActions()
  const { togglePreview } = usePreview()

  const handleRestart = useCallback(() => {
    restart({ what: 'all-sessions', awaitTopLevelAwait: true })
    requestAnimationFrame(focusPrompt)
  }, [restart, focusPrompt])

  const handleClear = useCallback(() => {
    clear({ withEntry: false })
    requestAnimationFrame(focusPrompt)
  }, [clear, focusPrompt])

  const handleReload = useCallback(() => {
    reload().then(() => {
      requestAnimationFrame(scrollToBottom)
    })

    requestAnimationFrame(focusPrompt)
  }, [reload, scrollToBottom, focusPrompt])

  useHotkey(HOTKEY_CLEAR_CONSOLE.test, handleClear)
  useHotkey(HOTKEY_RESTART.test, handleRestart)
  useHotkey(HOTKEY_RELOAD.test, handleReload)
  useHotkey(HOTKEY_TOGGLE_PREVIEW.test, togglePreview)

  return (
    <header>
      <h1 className="fixed right-3 bottom-3 z-10 flex items-center gap-1 opacity-20 select-none hover:opacity-80">
        <img
          src={import.meta.env.BASE_URL + 'jslogo.svg'}
          width={24}
          height={24}
          className="rounded"
          alt="JavaScript logo"
        />
        <span className="pt-[9px] text-[15px] leading-none font-bold" aria-label="JS Console">
          Console
        </span>
      </h1>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed top-2 right-2 z-10 opacity-40 hover:opacity-100 focus:opacity-100 aria-expanded:opacity-100"
          >
            <MenuIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56"
          align="end"
          onCloseAutoFocus={(e) => {
            e.preventDefault()
          }}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleRestart}>
              Rerun
              <DropdownMenuShortcut>{HOTKEY_RESTART.shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReload}>
              New Session
              <DropdownMenuShortcut>{HOTKEY_RELOAD.shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClear}>
              Clear
              <DropdownMenuShortcut>{HOTKEY_CLEAR_CONSOLE.shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <PreviewToggleMenuItem />
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <ThemeMenuSub />
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href="https://github.com/al3xnag/jsconsole" target="_blank">
              GitHub <ArrowUpRightIcon className="size-4 opacity-60" />
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

function PreviewToggleMenuItem() {
  const { togglePreview, previewShown } = usePreview()

  return (
    <DropdownMenuItem onClick={() => togglePreview()}>
      {previewShown ? 'Hide Preview' : 'Show Preview'}
      <DropdownMenuShortcut>{HOTKEY_TOGGLE_PREVIEW.shortcut}</DropdownMenuShortcut>
    </DropdownMenuItem>
  )
}

function ThemeMenuSub() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme as (value: string) => void}>
            <DropdownMenuRadioItem value={'system' satisfies Theme}>System</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={'light' satisfies Theme}>Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={'dark' satisfies Theme}>Dark</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}
