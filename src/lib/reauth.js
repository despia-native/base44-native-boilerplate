// Re-authentication with the account's ORIGINAL sign-in provider, used before
// account deletion. Google (and Apple on Android) needs an OAuth round-trip:
// we set a flag, run the normal OAuth flow, and Auth.jsx sees the flag and
// confirms identity + deletes instead of signing in.
import despia from 'despia-native'
import { base44 } from '@/api/base44Client'
import { appConfig } from '@/config/app-config'
import { isNative } from '@/lib/deviceAuth'
import { signInWithApple } from '@/lib/appleAuth'

export const REAUTH_DELETE_KEY = 'reauth_delete'

// Kick off the Google OAuth round-trip in re-auth-and-delete mode.
export async function startGoogleReauth(accountId) {
  localStorage.setItem(REAUTH_DELETE_KEY, accountId)
  const res = await base44.functions.invoke('googleAuthUrl', { deeplink_scheme: isNative() ? appConfig.deeplinkScheme : '' })
  if (isNative()) despia(`oauth://?url=${encodeURIComponent(res.data.url)}`)
  else window.location.href = res.data.url
}

// Apple: iOS/web popup returns the id_token directly ({ idToken }) — the caller
// completes the deletion inline. Android returns null and continues via the
// deeplink → /auth flow (the flag stays set for Auth.jsx).
export async function startAppleReauth(accountId) {
  localStorage.setItem(REAUTH_DELETE_KEY, accountId)
  const result = await signInWithApple()
  if (result) localStorage.removeItem(REAUTH_DELETE_KEY) // handled inline, no round-trip
  return result
}