import { useEffect, useRef } from 'react'
import { POLL_INTERVAL_MS } from '@/lib/utils'

export function usePolling(callback: () => void | Promise<void>, deps: unknown[] = []) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    void callbackRef.current()
    const interval = setInterval(() => {
      void callbackRef.current()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
