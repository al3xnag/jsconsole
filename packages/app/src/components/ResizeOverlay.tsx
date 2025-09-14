import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

export function ResizeOverlay({ className }: { className?: string }) {
  const [show, setShow] = useState(false)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const resizeObserverFirstCallSkipped = useRef(false)

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!resizeObserverFirstCallSkipped.current) {
        resizeObserverFirstCallSkipped.current = true
        return
      }

      const entry = entries[0]
      setWidth(entry.contentRect.width)
      setHeight(entry.contentRect.height)
      setShow(true)

      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setShow(false), 1000)
    })

    resizeObserver.observe(ref.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-none flex items-center justify-center',
        className,
      )}
    >
      {show && (
        <span className="bg-muted text-muted-foreground rounded-2xl px-2 py-1">
          {Math.round(width * 100) / 100}
          &nbsp;x&nbsp;
          {Math.round(height * 100) / 100}
        </span>
      )}
    </div>
  )
}
