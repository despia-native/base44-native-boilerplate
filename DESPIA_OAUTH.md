# Native Google OAuth for Base44 Apps in Despia

A complete guide for setting up native Google Sign-In in a [Base44](https://base44.com) web app wrapped with [Despia](https://despia.com) as a native mobile app.

---

## The Problem

When you wrap a web app in a native WebView (Despia), standard browser OAuth redirects break — the redirect from Google sends the user to an **external browser**, and the token never comes back to your app. This guide solves that using Despia's `oauth://` bridge and a static callback page.

---

## How It Works (Big Picture)

```
User taps "Sign in with Google"
        │
        ▼
[Login.jsx] detects Despia environment
        │
        ▼
Calls Base44 backend function → googleAuthUrl
(builds Google OAuth URL using GOOGLE_CLIENT_ID secret)
        │
        ▼
despia('oauth://?url=<google-oauth-url>')
(Despia opens secure in-app browser → Google Sign-In UI)
        │
        ▼
User signs in with Google
        │
        ▼
Google redirects to:
https://your-app.base44.app/native-callback.html
  ?deeplink_scheme=myapp
  #access_token=ya29...&token_type=Bearer
        │
        ▼
[native-callback.html] reads token from URL hash,
redirects to: myapp://oauth/auth?access_token=ya29...
        │
        ▼
Despia intercepts deeplink → navigates WebView to:
/auth?access_token=ya29...
        │
        ▼
[Auth.jsx] calls base44.auth.setToken(accessToken)
        │
        ▼
✅ User is authenticated, redirected to /
```

---

## File Overview

| File | Role |
|---|---|
| `src/pages/Login.jsx` | Detects Despia env, calls backend, triggers `oauth://` |
| `src/pages/Auth.jsx` | Receives token from deeplink params, sets Base44 session |
| `public/native-callback.html` | Static HTML bridge: reads Google token, fires deeplink |
| `base44/functions/googleAuthUrl/entry.ts` | Backend function: builds Google OAuth URL securely |

---

## Full Code

### 1. `public/native-callback.html`

Static file served at `/native-callback.html`. Google redirects here after sign-in. Reads the token from the URL hash and fires the Despia deeplink.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Completing sign in...</title>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fff;
      color: #888;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <p>Completing sign in...</p>
  <script>
    (function () {
      // deeplink_scheme is passed as a query param by the backend (e.g. "myapp")
      var params      = new URLSearchParams(window.location.search)
      var scheme      = params.get('deeplink_scheme')
      if (!scheme) { document.body.innerText = 'Error: missing deeplink_scheme'; return }

      // Google puts the access_token in the URL hash (implicit flow)
      var hash        = new URLSearchParams(window.location.hash.substring(1))
      var accessToken = hash.get('access_token')
      var error       = hash.get('error') || params.get('error')

      if (!accessToken) {
        window.location.href = scheme + '://oauth/auth?error=' + encodeURIComponent(error || 'no_access_token')
        return
      }

      // Fire the deeplink — Despia intercepts this and routes to /auth?access_token=...
      window.location.href =
        scheme + '://oauth/auth' +
        '?access_token=' + encodeURIComponent(accessToken)
    })()
  </script>
</body>
</html>
```

> **Important:** This file must be in your `public/` folder so it's served as a static asset at `/native-callback.html`. It does NOT go through React Router.

---

### 2. `base44/functions/googleAuthUrl/entry.ts`

Base44 backend function. Builds the Google OAuth URL using your `GOOGLE_CLIENT_ID` secret. Called by the frontend — the Client ID never lives in client-side code.

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, content-type'
        }
      });
    }

    const { deeplink_scheme } = await req.json();

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    if (!clientId) {
      return Response.json({ error: 'GOOGLE_CLIENT_ID secret not set' }, { status: 500 });
    }

    // The redirect URI must exactly match what's registered in Google Cloud Console
    // It points to your static native-callback.html, passing the deeplink scheme
    const redirectUri =
      `https://${req.headers.get('host')}/native-callback.html` +
      `?deeplink_scheme=${encodeURIComponent(deeplink_scheme)}`;

    // Build the Google OAuth URL (implicit flow — returns access_token in hash)
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',   // implicit flow: token comes back in the URL hash
      scope: 'openid email profile',
    });

    return Response.json({ url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

> **Deploy:** This file lives at `base44/functions/googleAuthUrl/entry.ts`. Base44 auto-deploys it when you save. Test it from the Base44 dashboard → Code → Functions.

---

### 3. `src/pages/Login.jsx`

Login page. Detects if running inside Despia (via User-Agent), and switches between the native OAuth flow and Base44's built-in web OAuth.

```jsx
import despia from 'despia-native'
import { base44 } from '@/api/base44Client'

// ✏️ TODO (template users): Replace with your own Google OAuth Client ID
// This is the fallback for web environments (non-Despia)
const GOOGLE_CLIENT_ID = 'YOUR-CLIENT-ID.apps.googleusercontent.com'

// Detect if running inside the Despia native wrapper
const isDespia = navigator.userAgent.toLowerCase().includes('despia')

export default function Login() {
  const handleGoogleSignIn = async () => {
    if (isDespia) {
      // NATIVE FLOW:
      // 1. Call our Base44 backend function to build the Google OAuth URL
      //    (keeps GOOGLE_CLIENT_ID off the frontend)
      const res = await base44.functions.invoke('googleAuthUrl', {
        deeplink_scheme: 'myapp'  // ✏️ Change to your Despia app's deeplink scheme
      });
      const { url } = res.data;

      // 2. Tell Despia to open this URL in a secure in-app browser
      //    After Google sign-in, Despia fires the deeplink back into the WebView
      despia(`oauth://?url=${encodeURIComponent(url)}`)
    } else {
      // WEB FLOW:
      // Base44's built-in Google OAuth — handles everything automatically
      base44.auth.loginWithProvider('google', window.location.origin + '/auth')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold">Welcome</h1>
          <p className="text-sm text-muted-foreground text-center">Sign in to continue</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 border border-border rounded-lg px-4 py-3 bg-background hover:bg-muted transition-colors text-sm font-medium"
        >
          {/* Google logo SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
```

---

### 4. `src/pages/Auth.jsx`

Callback page. Handles both the native deeplink (`?access_token=` query param) and the web OAuth redirect (token in URL `#hash`).

```jsx
import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { base44 } from '@/api/base44Client'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Native (Despia deeplink): token arrives as query param ?access_token=...
    // Web (Base44 loginWithProvider): token arrives in the URL hash #access_token=...
    const hash        = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = searchParams.get('access_token') || hash.get('access_token')
    const error       = searchParams.get('error')        || hash.get('error')

    if (error) {
      console.error('Auth error:', error)
      navigate('/login')
      return
    }

    if (accessToken) {
      // Establish the Base44 session with the received token
      base44.auth.setToken(accessToken)
      // Hard redirect to force re-initialization of the auth provider
      window.location.href = '/'
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
```

---

### 5. `src/App.jsx` — Required Routes

Make sure these routes exist in your router:

```jsx
import Login from '@/pages/Login'
import Auth  from '@/pages/Auth'
import Home  from '@/pages/Home'

// Inside <Routes>:
<Route path="/login" element={<Login />} />
<Route path="/auth"  element={<Auth />} />
<Route path="/"      element={<Home />} />
```

---

## Setup Checklist for Template Users

### Step 1 — Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-APP.base44.app/native-callback.html
   ```
   Replace `YOUR-APP` with your Base44 app subdomain (visible in your app's published URL).
5. Copy your **Client ID** and **Client Secret**

### Step 2 — Base44 Secrets

In Base44 dashboard → **Settings** → **Environment Variables**, add:

| Secret Name | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | `754083834914-xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxx` (needed if you upgrade to auth code flow) |

Or via CLI:
```bash
base44 secrets set GOOGLE_CLIENT_ID=your-client-id
base44 secrets set GOOGLE_CLIENT_SECRET=your-client-secret
```

### Step 3 — Update Your Deeplink Scheme

Replace `myapp` with your Despia app's actual scheme in **two places**:

**`src/pages/Login.jsx`:**
```js
base44.functions.invoke('googleAuthUrl', { deeplink_scheme: 'YOUR-SCHEME' })
```

### Step 4 — Register the Deeplink in Despia

In your Despia project settings, register:
- Scheme: `YOUR-SCHEME`
- Allowed path: `oauth/auth`

### Step 5 — Deploy

```bash
# Deploy everything
base44 deploy

# Or just the backend function
base44 functions deploy googleAuthUrl
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` from Google | Redirect URI in Google Console doesn't match exactly | Check for trailing slashes, http vs https, correct subdomain |
| Token received but app shows logged out | `setToken` called with a Google token, not a Base44 token | Make sure you're using Base44's own `loginWithProvider` on web — only use `setToken` for tokens issued by Base44 |
| `native-callback.html` returns 404 | File not in `public/` folder | Move the file to `public/native-callback.html` |
| Deeplink not firing on device | Scheme not registered in Despia | Add the scheme in Despia project settings |
| `GOOGLE_CLIENT_ID secret not set` | Secret not added to Base44 | Add it in dashboard → Settings → Environment Variables |

---

## Security Notes

- ✅ `GOOGLE_CLIENT_ID` is kept in Base44 secrets — only the backend function reads it
- ✅ `GOOGLE_CLIENT_SECRET` is never used in the frontend or the callback page
- ✅ `native-callback.html` only reads from the URL hash and immediately redirects — no storage, no network calls
- ⚠️ The implicit flow (`response_type=token`) is simpler but less secure than the auth code flow. For production apps with sensitive data, consider upgrading to the authorization code flow with PKCE.

---

## Key Dependency

Install the Despia native bridge package:

```bash
npm install despia-native
```

Usage in your frontend:
```js
import despia from 'despia-native'

// Open a URL in Despia's secure in-app browser
despia(`oauth://?url=${encodeURIComponent(oauthUrl)}`)
```

The `despia-native` package is a no-op when running outside the Despia WebView — safe to import unconditionally.