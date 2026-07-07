# Push Notifications (OneSignal via Despia)

Native push to iOS/Android devices, targeted by our own Account ids. Despia bundles
the native OneSignal SDK; we never touch Player IDs — devices are linked to users
via `external_id` (our Account id).

## Architecture

```
App launch (native)          Despia registers device with OneSignal
Authenticated load           AuthContext → linkPushUser(account.id)
                             → despia('setonesignalplayerid://?user_id=<id>')
Send (any use case)          sendPush backend function
                             → POST onesignal.com/api/v1/notifications
                             → include_external_user_ids: [<account id>]  (or Subscribed Users segment)
Notification tap             data.path → Despia updates the URL via History API → router navigates
```

## Files

| File | Purpose |
|---|---|
| `base44/functions/sendPush/entry.ts` | The one send function. Verifies our JWT. `target: 'self'` (any user), `'user'`/`'all'` (admin only). |
| `src/lib/push.js` | Client helpers: `linkPushUser`, `checkPushPermission`, `openDeviceSettings`, `sendPush`. |
| `src/lib/AuthContext.jsx` | Calls `linkPushUser(account.id)` on every authenticated load. |
| `src/pages/AdminPush.jsx` (`/admin/push`) | Admin dashboard: broadcast to all users, or look a user up and push to them. |
| `src/pages/Debug.jsx` (`/debug`) | User-facing panel: permission status + "send myself a test push". |

## One-time setup (🔧 TEMPLATE)

1. OneSignal: create app with **Native iOS** + **Native Android** platforms
   (Apple `.p8` push key + Firebase server key — see setup.despia.com/native-features/onesignal).
2. Copy **App ID** and **REST API Key** from OneSignal → Settings → Keys & IDs.
3. Set them in this app: secrets `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY`
   (Base44 dashboard → settings → environment variables), or edit the 🔧 TEMPLATE
   fallbacks in `base44/functions/sendPush/entry.ts`.
4. Despia Editor → App → Settings → Integrations → OneSignal → paste the App ID.
5. **Rebuild the app in Despia** — the SDK compiles into the binary; no rebuild = silent failure.

## Adding a new push use case

**From the frontend** (`src/lib/push.js` wrappers; self is any user, the rest admin only):

```js
import { sendPushToSelf, sendPushToUser, sendPushToUsers, sendPushToAll, sendPushToTag, setPushTags } from '@/lib/push'

await sendPushToSelf({ title: 'Hi', message: 'Body', path: '/somewhere' })
await sendPushToUser(accountId, { title: 'Hi', message: 'Body' })
await sendPushToUsers([id1, id2], { title: 'Hi', message: 'Body' })
await sendPushToAll({ title: 'Hi', message: 'Body', deliveryTimeOfDay: '9:00AM' })   // each user's local 9am
await sendPushToTag({ key: 'plan', value: 'premium' }, { title: 'Hi', message: 'Body' })
await setPushTags({ plan: 'premium' })            // tag yourself (segments); admins can pass a userId

// Shared options: title, message, path (in-app route on tap), url (full reload),
// metadata (delivered to window.onNotificationEvent), sendAfter (UTC),
// deliveryTimeOfDay (local time), badge ({ type: 'Increase'|'SetTo'|'None', count }).
```

**From another backend function** (server-triggered, any user) — call OneSignal directly:

```js
await fetch('https://onesignal.com/api/v1/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}` },
  body: JSON.stringify({
    app_id: Deno.env.get('ONESIGNAL_APP_ID'),
    include_external_user_ids: [accountId],   // our Account id
    headings: { en: 'Title' },
    contents: { en: 'Message' },
    data: { path: '/route/to/open' },         // optional deep link on tap
  }),
})
```

Useful extras (see OneSignal Create Notification API):
`send_after` (scheduling), `ios_badgeType/ios_badgeCount`, `priority: 10` +
`android_channel_id` (Android urgent), `ios_critical_alert: 1` (needs Apple entitlement).

## Testing

- `/debug` in the app → "Send myself a test push" (native build only).
- Delivery failures usually mean: no rebuild after enabling OneSignal in Despia,
  notification permission denied, or the device was never linked (user opened the
  app before this feature shipped — any authenticated load re-links).