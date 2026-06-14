import { useCallback, useRef, useState } from 'react'

const DEFAULT_LOCK_MS = 2000

export function useSubmitLock(lockMs = DEFAULT_LOCK_MS) {
  const [locked, setLocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runLocked = useCallback(
    async (action: () => Promise<void>) => {
      if (locked) return
      setLocked(true)
      try {
        await action()
      } finally {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setLocked(false), lockMs)
      }
    },
    [locked, lockMs],
  )

  return { submitLocked: locked, runLocked }
}
