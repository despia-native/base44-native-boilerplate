// Our own JWT auth client — talks to the custom auth backend functions.
// Base44 is used only for storage/email; this owns the session.
import { base44 } from '@/api/base44Client';

const TOKEN_KEY = 'app_auth_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Invoke a backend function, passing our token so the backend can authorize.
async function invoke(fn, payload = {}) {
  const token = getToken();
  const res = await base44.functions.invoke(fn, { ...payload, token });
  return res.data;
}

export async function register({ email, password, full_name }) {
  const data = await invoke('authRegister', { email, password, full_name });
  setToken(data.token);
  return data.account;
}

export async function login({ email, password }) {
  const data = await invoke('authLogin', { email, password });
  setToken(data.token);
  return data.account;
}

// Google: exchange the Google access token for our own JWT.
export async function loginWithGoogleToken(google_token) {
  const data = await invoke('googleSignIn', { google_token });
  setToken(data.token);
  return data.account;
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
  const token = getToken();
  if (!token) return null;
  try {
    const data = await invoke('authMe', {});
    return data.account;
  } catch {
    clearToken();
    return null;
  }
}

export function logout() {
  clearToken();
}