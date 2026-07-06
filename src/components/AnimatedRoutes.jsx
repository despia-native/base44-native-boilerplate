import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageNotFound from '@/lib/PageNotFound'
import ProtectedRoute from '@/components/ProtectedRoute'
import GlassHeader from '@/components/mobile/GlassHeader'
import GlassTabBar from '@/components/mobile/GlassTabBar'
import Login from '@/pages/Login'
import Auth from '@/pages/Auth'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Home from '@/pages/Home'
import Account from '@/pages/Account'
import LinkAccount from '@/pages/LinkAccount'
import AdminUsers from '@/pages/AdminUsers'
import AdminPush from '@/pages/AdminPush'
import Debug from '@/pages/Debug'

// Native iOS navigation transitions, direction-aware:
//  • push  — new page slides in from the right ON TOP; old page parallax-drifts
//    to -30% and dims underneath (UINavigationController push).
//  • back  — old page slides off to the right ON TOP; the previous page slides
//    back from -30% underneath (UINavigationController pop).
//  • tab   — switching between tab-bar roots crossfades (UITabBarController).
const pageVariants = {
  initial: (dir) =>
    dir === 'tab' ? { opacity: 0, x: 0, zIndex: 1 }
    : dir === 'back' ? { x: '-30%', opacity: 0.85, zIndex: 0 }
    : { x: '100%', opacity: 1, zIndex: 2 },
  animate: { x: 0, opacity: 1 },
  exit: (dir) =>
    dir === 'tab' ? { opacity: 0, x: 0, zIndex: 0 }
    : dir === 'back' ? { x: '100%', opacity: 1, zIndex: 2 }
    : { x: '-30%', opacity: 0.85, zIndex: 0 },
}

const TAB_TITLES = { '/': 'Home', '/account': 'Account' }

export default function AnimatedRoutes() {
  const location = useLocation()
  const navType = useNavigationType()
  // Tab pages share persistent chrome rendered OUTSIDE the route animation,
  // so the header and tab bar stay perfectly still while pages swipe under them.
  const tabPage = TAB_TITLES[location.pathname]

  // Direction: browser/gesture back = pop; tab-root ↔ tab-root = fade; else push.
  const prevPathRef = useRef(location.pathname)
  const prevPath = prevPathRef.current
  let direction = navType === 'POP' ? 'back' : 'push'
  if (TAB_TITLES[prevPath] && TAB_TITLES[location.pathname]) direction = 'tab'
  useEffect(() => { prevPathRef.current = location.pathname }, [location.pathname])

  return (
    <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 min-h-0 flex flex-col bg-background"
        style={{ boxShadow: '-0.75rem 0 2rem rgba(0,0,0,.18)', willChange: 'transform' }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/oauth/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route path="/" element={<Home />} />
            <Route path="/account" element={<Account />} />
            <Route path="/link-account" element={<LinkAccount />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/push" element={<AdminPush />} />
            <Route path="/debug" element={<Debug />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>

    {tabPage && <GlassHeader title={tabPage} />}
    {tabPage && <GlassTabBar />}
    </div>
  )
}