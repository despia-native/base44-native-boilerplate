// Our own JWT auth client — talks to the custom auth backend functions.
// Base44 is used only for storage/email; this owns the session.
import { base44 } from '@/api/base44Client';
import { saveVaultToken, readVaultToken, clearVaultToken } from '@/lib/tokenVault';
import { saveAccountSession } from '@/lib/savedAccounts';

const TOKEN_KEY = 'app_auth_token';
const SIGNED_OUT_KEY = 'app_signed_out';

// True after an explicit sign-out — blocks every silent session restore
// (vault token, native auto guest sign-in) until the user signs in again.
export function wasSignedOut() {
  return localStorage.getItem(SIGNED_OUT_KEY) === '1';
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.removeItem(SIGNED_OUT_KEY); // any successful sign-in clears the signed-out state
    localStorage.setItem(TOKEN_KEY, token);
    saveVaultToken(token); // fire-and-forget — persists the session in the native Storage Vault
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  clearVaultToken(); // fire-and-forget
}

// Invoke a backend function, passing our token so the backend can authorize.
async function invoke(fn, payload = {}) {
  const token = getToken();
  const res = await base44.functions.invoke(fn, { ...payload, token });
  return res.data;
}

// Exposed for other auth helpers (e.g. deviceAuth) that need to hit auth functions.
export const invokeAuth = invoke;

// Store the session AND remember the account on this device's account list
// (iOS-style switcher — the DB account id is the canonical key).
function establishSession(data) {
  setToken(data.token);
  saveAccountSession(data.account, data.token);
  return data.account;
}

export async function register({ email, password, full_name }) {
  const data = await invoke('authRegister', { email, password, full_name });
  return establishSession(data);
}

export async function login({ email, password }) {
  const data = await invoke('authLogin', { email, password });
  return establishSession(data);
}

// Google: exchange the one-time OAuth authorization code for our own JWT.
// The code is single-use and useless without the server-held client secret.
export async function loginWithGoogleCode(google_code) {
  const data = await invoke('googleSignIn', { google_code });
  return establishSession(data);
}

// Apple: exchange the verified Apple id_token for our own JWT.
export async function loginWithAppleToken(apple_id_token, full_name = '') {
  const data = await invoke('appleSignIn', { apple_id_token, full_name });
  return establishSession(data);
}

// Link an anonymous device account to email/password — keeps all account data.
export async function linkAccount({ email, password, full_name }) {
  const data = await invoke('authLinkAccount', { email, password, full_name });
  return establishSession(data);
}

// Link an anonymous device account to a Google identity — keeps all account data.
export async function linkWithGoogleCode(google_code) {
  const data = await invoke('authLinkAccount', { google_code });
  return establishSession(data);
}

// Request a password reset email. Always resolves (backend hides whether the email exists).
export async function requestPasswordReset(email) {
  await invoke('authRequestReset', { email, app_url: window.location.origin });
}

// Reset the password using the token from the emailed link.
export async function resetPassword({ reset_token, new_password }) {
  await invoke('authResetPassword', { reset_token, new_password });
}

// Verify the stored token and return the current account, or null.
export async function fetchMe() {
  let token = getToken();
  if (!token) {
    if (wasSignedOut()) return null; // explicit sign-out — never silently restore
    // Native: restore a session persisted in the Storage Vault
    // (survives uninstall/reinstall — the token comes back after re-download).
    token = await readVaultToken();
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }
  if (!token) return null;
  try {
    const data = await invoke('authMe', {});
    return data.account;
  } catch {
    clearToken();
    return null;
  }
}

// Re-verify the user's password (throws on mismatch) without changing the session.
export async function verifyPassword(email, password) {
  await invoke('authLogin', { email, password });
}

// Permanently delete the current account (call only after in-app confirmation).
export async function deleteAccount() {
  await invoke('authDeleteAccount', {});
}

export function logout() {
  // Sign out of a REAL account (guests can't sign out — the UI hides the option,
  // because the guest device account IS the logged-out state). Mark the device
  // signed-out FIRST so the signed-out account is never silently restored, then
  // clear the active token (localStorage + native vault). On native, the login
  // screen then drops straight back into the automatic guest session — unless the
  // device account was linked to the account just signed out of, in which case
  // the user must pick an account explicitly. Saved accounts stay for one-tap re-entry.
  localStorage.setItem(SIGNED_OUT_KEY, '1');
  clearToken();
}