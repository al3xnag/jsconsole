import { ValueTreeView } from '@/components/ValueTreeView'
import { HOTKEY_CLEAR_CONSOLE, SPECIAL_RESULTS } from '@/constants'
import { useActions } from '@/hooks/useActions'
import { useHighlightedEntry } from '@/hooks/useHighlightedEntry'
import { useStoreDispatch } from '@/hooks/useStoreDispatch'
import { cn } from '@/lib/utils'
import {
  ConsoleEntry,
  ConsoleEntryInput,
  ConsoleEntryResult,
  ConsoleEntrySystem,
  ConsoleEntryUserAgent,
  ConsoleSession,
} from '@/types'
import { ChevronRight } from 'lucide-react'
import { ComponentProps, useCallback, useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { HighlightCode } from './HighlightCode'
import { ChevronLeftFromDot } from './icons/ChevronLeftFromDot'
import { Button } from './ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from './ui/context-menu'

type EntryProps<T extends ConsoleEntry> = {
  entry: T
  session: ConsoleSession
  isStale: boolean
  isPaired: boolean
  showTimestamps: boolean
}

export function Entry<T extends ConsoleEntry>(props: EntryProps<T>) {
  const { entry, session, isStale, isPaired } = props

  const { isHighlighted, highlight, unhighlight } = useHighlightedEntry(entry)

  const onContextMenuOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        highlight(true)
      } else {
        unhighlight(true)
      }
    },
    [highlight, unhighlight],
  )

  if (entry.type === 'result' && entry.value === SPECIAL_RESULTS.HIDDEN) {
    return null
  }

  if (
    entry.type === 'user-agent' &&
    entry.output.every((value) => value === SPECIAL_RESULTS.HIDDEN)
  ) {
    return null
  }

  return (
    <EntryContextMenu entry={entry} session={session} onOpenChange={onContextMenuOpenChange}>
      <div
        className={cn(
          'entry border-border/30 border-b p-2 font-mono',
          entry.type === 'input' && isPaired && 'border-b-0 pb-0',
          entry.type === 'result' && isPaired && 'pt-0',
          isStale && 'bg-muted opacity-90',
          entry.type === 'input' && entry.state === 'not-evaluated' && 'opacity-50',
          entry.severity === 'error' && 'bg-red-500/20',
          entry.severity === 'warning' && 'bg-yellow-500/20',
          isHighlighted && 'bg-selection text-selection-foreground',
        )}
        data-type={entry.type}
      >
        {entry.type === 'input' && <InputEntry {...props} entry={entry} />}
        {entry.type === 'result' && <ResultEntry {...props} entry={entry} />}
        {entry.type === 'user-agent' && <UserAgentEntry {...props} entry={entry} />}
        {entry.type === 'system' && <SystemEntry {...props} entry={entry} />}
      </div>
    </EntryContextMenu>
  )
}

function InputEntry({ entry, showTimestamps }: EntryProps<ConsoleEntryInput>) {
  const [isExpanded, setIsExpanded] = useState(false)

  const maxLength = 1500
  const isExceeded = entry.value.length > maxLength
  const displayValue =
    isExceeded && !isExpanded ? entry.value.slice(0, maxLength) + '… ' : entry.value

  return (
    <div className="flex items-start">
      {showTimestamps && <TimestampPad value={entry.timestamp} className="mx-2" />}
      <ChevronRight
        className={cn(
          'mr-1 h-5 w-4 shrink-0 text-blue-600 dark:text-blue-400',
          entry.state === 'evaluating' && 'animate-pulse',
        )}
      />
      <div className="min-w-0">
        <HighlightCode lang="js" className="whitespace-pre-wrap">
          {displayValue}
        </HighlightCode>
        {isExceeded && (
          <Button
            variant="outline"
            size="sm"
            className="h-auto rounded-sm px-1 italic"
            onClick={() => setIsExpanded((x) => !x)}
          >
            {isExpanded ? 'Show Less' : `Show More (${entry.value.length} chars)`}
          </Button>
        )}
      </div>
    </div>
  )
}

function ResultEntry({ entry, showTimestamps }: EntryProps<ConsoleEntryResult>) {
  return (
    <div className="flex items-start whitespace-pre-wrap">
      {showTimestamps && <TimestampPad value={entry.timestamp} className="mx-2" />}
      <ChevronLeftFromDot className="mr-1 h-5 w-4 shrink-0 text-gray-400/50" />
      <ResultEntryValue entry={entry} />
    </div>
  )
}

function ResultEntryValue({ entry }: Pick<EntryProps<ConsoleEntryResult>, 'entry'>) {
  if (entry.value === SPECIAL_RESULTS.HELP) {
    return <SpecialResultHelp />
  }

  return (
    <span>
      <ErrorBoundary
        fallback={<span>⚠️</span>}
        onError={() => {
          console.warn('Error rendering value', entry.value)
        }}
      >
        <ValueTreeView value={entry.value} exception={entry.exception} />
      </ErrorBoundary>
    </span>
  )
}

function UserAgentEntry({ entry, showTimestamps }: EntryProps<ConsoleEntryUserAgent>) {
  return (
    <div className="flex items-start">
      {showTimestamps && <TimestampPad value={entry.timestamp} className="mx-2" />}
      <span className="ml-5 whitespace-pre-wrap">
        {entry.output
          .filter((value) => value !== SPECIAL_RESULTS.HIDDEN)
          .map((value, index) => (
            <span key={index}>
              {index > 0 && ' '}
              <ErrorBoundary
                fallback={<span>⚠️</span>}
                onError={() => {
                  console.warn('Error rendering value', value)
                }}
              >
                <ValueTreeView value={value} renderStringAsPlainText exception={entry.exception} />
              </ErrorBoundary>
            </span>
          ))}
      </span>
    </div>
  )
}

function SystemEntry({ entry, showTimestamps }: EntryProps<ConsoleEntrySystem>) {
  return (
    <div className="text-muted-foreground/70 flex items-start italic">
      {showTimestamps && <TimestampPad value={entry.timestamp} className="mx-2" />}
      <span className="ml-5 whitespace-pre-wrap">
        {entry.kind === 'user-agent-reloaded' && 'Preview window was reloaded'}
        {entry.kind === 'console-cleared' && 'Console was cleared'}
      </span>
    </div>
  )
}

function TimestampPad({
  value,
  className,
}: {
  value: number | string | Date | undefined | null
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-muted-foreground font-mono opacity-70 select-none max-sm:hidden',
        className,
      )}
    >
      {value != null ? <Timestamp value={value} /> : '\xa0'.repeat(12)}
    </span>
  )
}

function Timestamp({ value }: { value: number | string | Date }) {
  const date = new Date(value)
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
  })

  return (
    <time dateTime={date.toISOString()} title={date.toLocaleDateString() + ' ' + timeStr}>
      {timeStr}
    </time>
  )
}

function EntryContextMenu({
  entry,
  session,
  children,
  ...contextMenuProps
}: { entry: ConsoleEntry; session: ConsoleSession } & ComponentProps<typeof ContextMenu>) {
  const storeDispatch = useStoreDispatch()
  const { clear } = useActions()

  return (
    <ContextMenu {...contextMenuProps}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          onClick={() => {
            storeDispatch({
              type: 'removeConsoleEntry',
              payload: { session: session, consoleEntry: entry },
            })
          }}
        >
          Remove entry
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => clear({ withEntry: false })}>
          Clear console
          <ContextMenuShortcut>{HOTKEY_CLEAR_CONSOLE.shortcut}</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function SpecialResultHelp() {
  return (
    <div className="prose prose-h1:text-base dark:prose-invert prose-sm prose-code:text-sm max-w-[100ch] flex-1 [&_summary]:cursor-pointer [&_summary]:font-bold">
      <details>
        <summary>
          <span className="px-1">Help</span>
        </summary>

        <section className="mt-2">
          <h1>About</h1>
          <p>
            This is a JavaScript console, powered by its own JavaScript interpreter, written in
            JavaScript.
          </p>
          <p>
            The interpreter enables some nice features, such as <b>autocomplete</b>,{' '}
            <b>eager evaluation</b>, and displaying <b>object metadata</b>, which would not be
            possible using <code>eval</code>. This console transparently works within the current
            browser realm, reusing existing browser APIs, global objects and prototypes.
          </p>
          <p>
            <b>It is very experimental and a work in progress.</b>
          </p>
        </section>

        <section>
          <h1>Commands</h1>
          <p>
            In addition to the standard JavaScript stuff and browser APIs, you can use the following
            global commands:
          </p>
          <ul>
            <li>
              <code>clear()</code> - clear the console (same as <code>console.clear()</code>)
            </li>
            <li>
              <code>help()</code> - show this help
            </li>
          </ul>
        </section>

        <section>
          <h1>Usage</h1>
          <p>
            Use the <b>menu</b> in the top-right corner and the <b>context menu</b> for additional
            commands.
          </p>
          <p>
            The code you submit is evaluated in the context of a dedicated iframe. You can open the{' '}
            <b>Preview window</b> to view this iframe, which is useful when working with the DOM.
          </p>
          <p>
            Console log is preserved between reloads – it is serialized to the URL, so you can{' '}
            <b>share</b> a link with your colleagues.
          </p>
        </section>

        <section>
          <h1>Credits</h1>
          <p>
            This project is open source and available on GitHub:{' '}
            <a href="https://github.com/al3xnag/jsconsole" target="_blank">
              https://github.com/al3xnag/jsconsole
            </a>
          </p>
          <p>Carefully (not really) crafted by @al3xnag.</p>
        </section>
      </details>
    </div>
  )
}
