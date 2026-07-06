import { useLayoutEffect, useRef, useState } from 'react'

// Smoothly animates the drawer body's height when its inner content changes
// (e.g. step 1 → step 2, or an error message appearing) instead of jumping.
// A ResizeObserver tracks the natural content height; the wrapper animates
// to it with an iOS-style ease-out curve.
export default function DrawerHeightAnimator({ children }) {
  const innerRef = useRef(null)
  const [height, setHeight] = useState(null)

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    // Measure synchronously before first paint so opening never animates from 0.
    setHeight(el.offsetHeight)
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      style={{
        height: height ?? 'auto',
        overflow: 'hidden',
        transition: 'height .4s cubic-bezier(.3,1.1,.4,1)',
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  )
}