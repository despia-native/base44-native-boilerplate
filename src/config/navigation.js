// ── App navigation config — the ONLY file to touch for routing/menu ──
// Routing is folder-driven: every file in src/pages/ automatically becomes a
// route (see src/lib/pageRoutes.js). New page = drop a file in the folder:
//   src/pages/Settings.jsx        → /settings
//   src/pages/admin/Reports.jsx   → /admin/reports
// Every page gets native push animation + edge swipe-back automatically,
// EXCEPT the menu-bar (tab) pages below, which crossfade with no swipe.

import { Home, UserCircle } from 'lucide-react'

// Menu-bar (tab) pages — persistent header/tab-bar chrome, excluded from swipe.
export const TABS = [
  { path: '/', title: 'Home', icon: Home },
  { path: '/account', title: 'Account', icon: UserCircle },
]

// Pages reachable without being signed in — everything else is protected.
export const PUBLIC_PATHS = ['/login', '/login/email', '/auth', '/oauth/auth', '/forgot-password', '/reset-password']

// Filename → custom URL (default is kebab-case of the file path).
export const PATH_OVERRIDES = {
  Home: '/',
  EmailLogin: '/login/email',
  AdminUsers: '/admin/users',
  AdminPush: '/admin/push',
}

// Extra URLs that render an existing page (alias → canonical path).
export const ALIASES = { '/oauth/auth': '/auth' }