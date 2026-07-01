import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { captureIncomingToken, hasPendingToken } from '@/lib/deeplinkToken'

// A native deep-link can reopen the app with the OAuth token on ANY path.
// Capture it before React mounts, then make sure we land on /auth to process it.
captureIncomingToken()
if (hasPendingToken() && window.location.pathname !== '/auth') {
  window.history.replaceState(null, '', '/auth')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)