// Biometric confirmation via the Despia LOCKED Storage Vault.
// A vault entry stored with locked=true can only be read back after a
// successful Face ID / Touch ID / device-passcode prompt — so we write a
// one-time nonce locked, then read it: a matching read IS the confirmation.
import despia from 'despia-native'

const KEY = 'confirm_action_nonce'

export async function confirmWithLockedVault() {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  try {
    await despia(`setvault://?key=${KEY}&value=${encodeURIComponent(nonce)}&locked=true`)
    // Reading a locked key triggers the system biometric prompt.
    const data = await despia(`readvault://?key=${KEY}`, [KEY])
    const value = data?.[KEY] ? decodeURIComponent(data[KEY]) : null
    return value === nonce
  } catch {
    return false // cancelled, failed, or biometrics unavailable
  }
}