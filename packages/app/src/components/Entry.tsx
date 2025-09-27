import { ValueTreeView } from '@/components/ValueTreeView'
import { HOTKEY_CLEAR_CONSOLE } from '@/constants'
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
import { ComponentProps, useCallback } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { HighlightCode } from './HighlightCode'
import { ChevronLeftFromDot } from './icons/ChevronLeftFromDot'
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
  return (
    <div className="flex items-start">
      {showTimestamps && <TimestampPad value={entry.timestamp} className="mx-2" />}
      <ChevronRight
        className={cn(
          'mr-1 h-5 w-4 shrink-0 text-blue-600',
          entry.state === 'evaluating' && 'animate-pulse',
        )}
      />
      <HighlightCode lang="js" className="min-w-0 whitespace-pre-wrap">
        {entry.value}
      </HighlightCode>
    </div>
  )
}

function ResultEntry({ entry, showTimestamps }: EntryProps<ConsoleEntryResult>) {
  return (
    <div className="flex items-start whitespace-pre-wrap text-gray-800">
      {showTimestamps && <TimestampPad value={entry.timestamp} className="mx-2" />}
      <ChevronLeftFromDot className="mr-1 h-5 w-4 shrink-0 text-gray-400/50" />
      <span>
        {entry.severity === 'error' && <span>Uncaught&nbsp;</span>}
        <ErrorBoundary
          fallback={<span>⚠️</span>}
          onError={() => {
            console.warn('Error rendering value', entry.value)
          }}
        >
          <ValueTreeView value={entry.value} />
        </ErrorBoundary>
      </span>
    </div>
  )
}

function UserAgentEntry({ entry, showTimestamps }: EntryProps<ConsoleEntryUserAgent>) {
  return (
    <div className="flex items-start text-gray-800">
      {showTimestamps && <TimestampPad value={entry.timestamp} className="mx-2" />}
      <span className="ml-5 whitespace-pre-wrap">
        {entry.output.map((value, index) => (
          <span key={index}>
            {index > 0 && ' '}
            <ErrorBoundary
              fallback={<span>⚠️</span>}
              onError={() => {
                console.warn('Error rendering value', value)
              }}
            >
              <ValueTreeView value={value} renderStringAsPlainText />
            </ErrorBoundary>
          </span>
        ))}
      </span>
    </div>
  )
}

function SystemEntry({ entry, showTimestamps }: EntryProps<ConsoleEntrySystem>) {
  return (
    <div className="flex items-start text-gray-400 italic">
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
    <span className={cn('text-muted-foreground font-mono opacity-70 select-none', className)}>
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
