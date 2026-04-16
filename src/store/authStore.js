import { create } from 'zustand';

function npubToHex(npub) {
  if (!npub.startsWith('npub1')) return null;
  try {
    const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const data = npub.slice(5);
    const decoded = [];
    for (const c of data) {
      const idx = CHARSET.indexOf(c);
      if (idx === -1) return null;
      decoded.push(idx);
    }
    const payload = decoded.slice(0, decoded.length - 6);
    let bits = 0, value = 0;
    const result = [];
    for (const d of payload) {
      value = (value << 5) | d;
      bits += 5;
      while (bits >= 8) { bits -= 8; result.push((value >> bits) & 0xff); }
    }
    if (result.length !== 32) return null;
    return result.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch { return null; }
}

function isValidHexPubkey(str) {
  return /^[0-9a-f]{64}$/i.test(str);
}

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,
  pubkey: null,
  nostrWindow: null,
  isReadOnly: false,

  initNostr: async () => {
    if (window.nostr) {
      try {
        const pubkey = await window.nostr.getPublicKey();
        set({ pubkey, isAuthenticated: true, nostrWindow: window.nostr, isReadOnly: false });
        const userData = await get().fetchUserMetadata(pubkey);
        set({ user: userData });
        return true;
      } catch (error) {
        console.error('Error connecting to Nostr:', error);
        return false;
      }
    }
    return false;
  },

  loginWithPubkey: async (input) => {
    let hexPubkey = null;
    if (input.startsWith('npub1')) { hexPubkey = npubToHex(input); }
    else if (isValidHexPubkey(input)) { hexPubkey = input.toLowerCase(); }
    if (!hexPubkey) return false;
    const userData = await get().fetchUserMetadata(hexPubkey);
    set({ pubkey: hexPubkey, user: userData, isAuthenticated: true, nostrWindow: null, isReadOnly: true });
    return true;
  },

  fetchUserMetadata: async (pubkey) => {
    try {
      return { pubkey, name: `User ${pubkey.slice(0, 8)}`, picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pubkey}` };
    } catch { return { pubkey, name: 'Anonymous', picture: '' }; }
  },

  signEvent: async (event) => {
    if (get().isReadOnly) return null;
    if (!window.nostr) return null;
    try { return await window.nostr.signEvent(event); }
    catch (error) { console.error('Error signing event:', error); return null; }
  },

  checkExistingAuth: async () => {
    if (window.nostr) {
      try {
        const pubkey = await window.nostr.getPublicKey();
        const userData = await get().fetchUserMetadata(pubkey);
        set({ pubkey, user: userData, isAuthenticated: true, nostrWindow: window.nostr, isReadOnly: false });
      } catch { console.log('No existing auth'); }
    }
  },

  logout: () => set({ isAuthenticated: false, user: null, pubkey: null, nostrWindow: null, isReadOnly: false }),
}));
