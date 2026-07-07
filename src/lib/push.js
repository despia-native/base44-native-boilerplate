// Push notifications (OneSignal via Despia). See PUSH_NOTIFICATIONS.md.
// Despia registers the device with OneSignal at app launch; we link that device
// to our Account id so the backend can target users with include_external_user_ids.
import despia from 'despia-native'
import { raceTimeout } from '@/lib/antiFreeze'
import { invokeAuth } from '@/lib/customAuth'

const ua = navigator.userAgent.toLowerCase()
export const isDespia = ua.includes('despia')

// ── Device linking & permissions ────────────────────────────────────────────

// Link the current device to a user. Called on every authenticated load (AuthContext).
export function linkPushUser(userId) {
  if (isDespia && userId) despia(`setonesignalplayerid://?user_id=${encodeURIComponent(userId)}`)
}

// true / false on native; null on web (push only works in the native app).
export async function checkPushPermission() {
  if (!isDespia) return null
  // Anti-freeze: resolves null (unknown) after 2s if the bridge never answers.
  const result = await raceTimeout(despia('checkNativePushPermissions://', ['nativePushEnabled']), null)
  return result ? !!result.nativePushEnabled : null
}

// Open the device settings app so the user can enable notifications.
export function openDeviceSettings() {
  if (isDespia) despia('settingsapp://')
}

// ── Sending (via the sendPush backend function) ─────────────────────────────
//
// All senders share the same options object:
//   title, message      — required
//   path                — in-app route opened on tap (no reload, History API)
//   url                 — full URL opened on tap (forces a WebView reload)
//   metadata            — arbitrary JSON delivered to window.onNotificationEvent
//   sendAfter           — schedule: absolute UTC time, e.g. '2026-01-01T09:00:00Z'
//   deliveryTimeOfDay   — schedule: each user's LOCAL time, e.g. '9:00AM'
//   badge               — iOS app-icon badge: { type: 'Increase'|'SetTo'|'None', count }

function buildPayload(opts) {
  const { title, message, path, url, metadata, sendAfter, deliveryTimeOfDay, badge } = opts
  return {
    title, message, path, url, metadata,
    send_after: sendAfter,
    delivery_time_of_day: deliveryTimeOfDay,
    badge,
  }
}

// Send to yourself (any logged-in user — test pushes).
export async function sendPushToSelf(opts) {
  return invokeAuth('sendPush', { target: 'self', ...buildPayload(opts) })
}

// Send to one user by Account id (admin only).
export async function sendPushToUser(userId, opts) {
  return invokeAuth('sendPush', { target: 'user', user_id: userId, ...buildPayload(opts) })
}

// Send to several users by Account ids (admin only).
export async function sendPushToUsers(userIds, opts) {
  return invokeAuth('sendPush', { target: 'users', user_ids: userIds, ...buildPayload(opts) })
}

// Broadcast to every subscribed device (admin only).
export async function sendPushToAll(opts) {
  return invokeAuth('sendPush', { target: 'all', ...buildPayload(opts) })
}

// Send to a tag-based segment (admin only), e.g. { key: 'plan', value: 'premium' }.
// relation defaults to '=' ('>', '<', '!=', 'exists', 'not_exists' also supported).
export async function sendPushToTag(tag, opts) {
  return invokeAuth('sendPush', { target: 'tag', tag, ...buildPayload(opts) })
}

// ── Tagging (segments) ──────────────────────────────────────────────────────

// Set OneSignal tags on a user for segment targeting (sendPushToTag).
// Omit userId to tag yourself; tagging others is admin only.
export async function setPushTags(tags, userId) {
  return invokeAuth('pushTags', { tags, user_id: userId })
}

// ── Legacy generic sender (kept for existing callers) ───────────────────────
export async function sendPush({ target = 'self', userId, title, message, path }) {
  return invokeAuth('sendPush', { target, user_id: userId, title, message, path })
}