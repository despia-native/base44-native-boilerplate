// Push notifications (OneSignal via Despia). See PUSH_NOTIFICATIONS.md.
// Despia registers the device with OneSignal at app launch; we link that device
// to our Account id so the backend can target users with include_external_user_ids.
import despia from 'despia-native'
import { invokeAuth } from '@/lib/customAuth'

const ua = navigator.userAgent.toLowerCase()
export const isDespia = ua.includes('despia')

// Link the current device to a user. Called on every authenticated load (AuthContext).
export function linkPushUser(userId) {
  if (isDespia && userId) despia(`setonesignalplayerid://?user_id=${encodeURIComponent(userId)}`)
}

// true / false on native; null on web (push only works in the native app).
export async function checkPushPermission() {
  if (!isDespia) return null
  const result = await despia('checkNativePushPermissions://', ['nativePushEnabled'])
  return !!result?.nativePushEnabled
}

// Open the device settings app so the user can enable notifications.
export function openDeviceSettings() {
  if (isDespia) despia('settingsapp://')
}

// Send a push through the sendPush backend function.
// target: 'self' (any user — test push), 'user' (admin, needs userId), 'all' (admin).
// path: optional in-app route opened when the notification is tapped.
export async function sendPush({ target = 'self', userId, title, message, path }) {
  return invokeAuth('sendPush', { target, user_id: userId, title, message, path })
}