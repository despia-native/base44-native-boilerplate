import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Smoothly animates the drawer body's height whenever its inner content
// changes (step switches, error messages appearing…) instead of jumping.
// A ResizeObserver tracks the natural content height and framer-motion
// springs the wrapper to it — springs animate reliably even when React
// swaps the content in the same frame (CSS height transitions often skip).
export default function DrawerHeightAnimator({ children }) {
  const innerRef = useRef(null)
  const [height, setHeight] = useState('auto')

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      // Fractional height avoids 1px rounding oscillation
      setHeight(entries[0].contentRect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={{ type: 'spring', stiffness: 420, damping: 40 }}
      style={{ overflow: 'hidden' }}
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  )
}