import { cn } from '@/lib/utils'

export function WelcomeEntry({ className }: { className?: string }) {
  return (
    <div className={cn('border-border/30 border-b p-2 font-mono', className)} data-type="welcome">
      <div className="px-2 text-xs whitespace-pre-wrap text-gray-800">
        Welcome to JavaScript Console, version {APP_VERSION}
        <br />
        Type <code className="text-blue-600">help()</code> to get started.
      </div>
    </div>
  )
}
