// App lifecycle focus events for the native (Despia) shell.
//
// Despia calls the global window.focusin() when the app returns to the
// foreground and window.focusout() when it goes to the background. This hook
// registers your callbacks and cleans them up on unmount. No-op on web.
//
// Usage:
//   useFocusEvents({
//     onFocus: () => { checkUserAuth(); refetch(); },  // revalidate session + refresh data on resume
//     onBlur:  () => { saveDraft(); },                 // pause / persist before suspend
//   })
import { useEffect, useRef } from 'react'
import { isNative } from '@/lib/deviceAuth'

export function useFocusEvents({ onFocus, onBlur } = {}) {
  // Keep the latest callbacks in refs so re-renders don't re-register handlers.
  const focusRef = useRef(onFocus)
  const blurRef = useRef(onBlur)
  focusRef.current = onFocus
  blurRef.current = onBlur

  useEffect(() => {
    if (!isNative()) return

    // window.focusin / focusout are single global hooks Despia invokes directly.
    const prevIn = window.focusin
    const prevOut = window.focusout

    window.focusin = () => { focusRef.current?.() }
    window.focusout = () => { blurRef.current?.() }

    return () => {
      window.focusin = prevIn
      window.focusout = prevOut
    }
  }, [])
}