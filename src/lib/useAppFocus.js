// App foreground/background lifecycle.
//
// On Despia the native runtime calls window.focusin() / window.focusout() when the
// app resumes / is backgrounded. On the web we fall back to the standard
// visibilitychange event so the same hook works everywhere.
//
// Usage:
//   useAppFocus({
//     onForeground: () => { /* refresh session, refetch data */ },
//     onBackground: () => { /* pause timers, save drafts */ },
//   })
import { useEffect, useRef } from 'react'
import { isNative } from '@/lib/deviceAuth'

export function useAppFocus({ onForeground, onBackground } = {}) {
  const fgRef = useRef(onForeground)
  const bgRef = useRef(onBackground)
  fgRef.current = onForeground
  bgRef.current = onBackground

  useEffect(() => {
    const foreground = () => fgRef.current?.()
    const background = () => bgRef.current?.()

    if (isNative()) {
      const prevIn = window.focusin
      const prevOut = window.focusout
      window.focusin = foreground
      window.focusout = background
      return () => {
        window.focusin = prevIn
        window.focusout = prevOut
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') foreground()
      else background()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])
}