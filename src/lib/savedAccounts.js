// iOS-style saved accounts: every account that signs in on this device is
// remembered here. The DATABASE Account id is the canonical key — a device can
// hold multiple accounts (guest + any linked/signed-in ones) and offer one-tap
// switching from the login screen, like Apple's account picker.
// Stored in localStorage and mirrored into the native Storage Vault so the
// list survives app updates and uninstall/reinstall.
import despia from 'despia-native';

const KEY = 'app_saved_accounts';
const MAX_ACCOUNTS = 5;

const isNative = () =>
  typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('despia');

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function writeLocal(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  if (isNative()) {
    // Best-effort vault mirror (survives reinstall).
    try {
      despia(`setvault://?key=${KEY}&value=${encodeURIComponent(JSON.stringify(list))}&locked=false`);
    } catch {
      // vault unavailable — localStorage copy still works
    }
  }
}

// Merge the vault copy into localStorage (newest per account id wins) and return the list.
export async function loadSavedAccounts() {
  let list = readLocal();
  if (isNative()) {
    try {
      const data = await despia(`readvault://?key=${KEY}`, [KEY]);
      if (data?.[KEY]) {
        const vaultList = JSON.parse(decodeURIComponent(data[KEY]));
        const byId = new Map();
        [...vaultList, ...list].forEach((a) => {
          if (!a?.id) return;
          const prev = byId.get(a.id);
          if (!prev || (a.saved_at || 0) > (prev.saved_at || 0)) byId.set(a.id, a);
        });
        list = [...byId.values()]
          .sort((x, y) => (y.saved_at || 0) - (x.saved_at || 0))
          .slice(0, MAX_ACCOUNTS);
        localStorage.setItem(KEY, JSON.stringify(list));
      }
    } catch {
      // no vault copy yet
    }
  }
  return list;
}

// Remember this account + its session token on the device (called on every successful sign-in).
export function saveAccountSession(account, token) {
  if (!account?.id || !token) return;
  const list = readLocal().filter((a) => a.id !== account.id);
  list.unshift({
    id: account.id,
    email: account.email || '',
    full_name: account.full_name || '',
    avatar_url: account.avatar_url || '',
    is_anonymous: !!account.is_anonymous,
    token,
    saved_at: Date.now(),
  });
  writeLocal(list.slice(0, MAX_ACCOUNTS));
}

export function removeSavedAccount(id) {
  writeLocal(readLocal().filter((a) => a.id !== id));
}