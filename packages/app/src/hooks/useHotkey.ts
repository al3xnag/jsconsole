import { useEffect } from 'react'

export function useHotkey(keyCheck: (e: KeyboardEvent) => boolean, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (keyCheck(e)) {
        e.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [keyCheck, callback])
}
