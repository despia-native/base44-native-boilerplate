// iOS-style edge swipe-back gesture. Wraps a page; a drag starting at the left
// screen edge tracks the finger, and releasing past the threshold (or a quick
// flick) navigates back — soft SPA navigation, no reload.
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const EDGE = 28 // gesture must start within this many px of the left edge

export default function SwipeBack({ enabled = true, children }) {
  const navigate = useNavigate()
  const ref = useRef(null)
  const gesture = useRef(null)

  const onTouchStart = (e) => {
    if (!enabled) return
    const t = e.touches[0]
    if (t.clientX > EDGE) return
    gesture.current = { x: t.clientX, y: t.clientY, start: Date.now(), active: false }
  }

  const onTouchMove = (e) => {
    const g = gesture.current
    if (!g) return
    const t = e.touches[0]
    const dx = t.clientX - g.x
    const dy = t.clientY - g.y
    if (!g.active) {
      if (Math.abs(dy) > Math.abs(dx)) { gesture.current = null; return } // vertical scroll wins
      if (dx < 8) return
      g.active = true
    }
    const el = ref.current
    if (el) {
      el.style.transition = 'none'
      el.style.transform = `translateX(${Math.max(0, dx)}px)`
    }
  }

  const onTouchEnd = (e) => {
    const g = gesture.current
    gesture.current = null
    if (!g?.active) return
    const dx = e.changedTouches[0].clientX - g.x
    const velocity = dx / Math.max(1, Date.now() - g.start) // px per ms
    const el = ref.current
    if (dx > window.innerWidth * 0.33 || velocity > 0.5) {
      // Commit: finish the slide off-screen, then go back.
      if (el) {
        el.style.transition = 'transform .18s ease-out'
        el.style.transform = `translateX(${window.innerWidth}px)`
      }
      setTimeout(() => navigate(-1), 160)
    } else if (el) {
      // Cancel: spring back into place.
      el.style.transition = 'transform .25s cubic-bezier(.3,1.1,.4,1)'
      el.style.transform = 'translateX(0)'
      setTimeout(() => { if (el) el.style.transition = '' }, 260)
    }
  }

  return (
    <div
      ref={ref}
      className="flex-1 min-h-0 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => { gesture.current = null }}
    >
      {children}
    </div>
  )
}