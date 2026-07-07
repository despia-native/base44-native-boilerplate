// Loginless / anonymous auth for the native (Despia) app.
//
// Flow:
//   1. Read (or create) a stable device UUID from the Despia Storage Vault.
//      The vault survives uninstall/reinstall, so the guest account is stable.
//   2. Exchange that UUID for our own JWT via the `deviceSignIn` backend function.
//
// Optionally the vault key can be Face ID / Touch ID locked, so reading the device
// id (and therefore restoring the session) requires a biometric prompt.
import despia from 'despia-native';
import { raceTimeout } from '@/lib/antiFreeze';
import * as customAuth from '@/lib/customAuth';
import { saveAccountSession } from '@/lib/savedAccounts';

const DEVICE_KEY = 'app_device_id';

export const isNative = () =>
  typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('despia');

// Read the device id from the vault, or create + persist a fresh UUID on first run.
// `locked=true` gates the value behind Face ID / Touch ID.
export async function getOrCreateDeviceId({ biometric = false } = {}) {
  try {
    // Anti-freeze: a dead bridge falls through to a fresh id after 2s instead
    // of hanging the auto sign-in spinner (see ANTI_FREEZE.md).
    const data = await raceTimeout(despia(`readvault://?key=${DEVICE_KEY}`, [DEVICE_KEY]), null);
    if (data?.[DEVICE_KEY]) return data[DEVICE_KEY];
  } catch {
    // Key not found (first run) or biometric cancelled — fall through to create.
  }

  const id = crypto.randomUUID();
  await raceTimeout(despia(`setvault://?key=${DEVICE_KEY}&value=${id}&locked=${biometric ? 'true' : 'false'}`));
  return id;
}

// Full loginless sign-in: get the device id, then mint our JWT for the anonymous account.
// `biometric` gates the stored device id behind Face ID / Touch ID.
export async function signInWithDevice({ biometric = false } = {}) {
  const deviceId = await getOrCreateDeviceId({ biometric });
  const data = await customAuth.invokeAuth('deviceSignIn', { device_id: deviceId });
  customAuth.setToken(data.token);
  saveAccountSession(data.account, data.token); // guest shows in the device's account picker too
  return data.account;
}