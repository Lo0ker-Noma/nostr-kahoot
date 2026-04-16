import { create } from 'zustand';
import { fetchNostrProfile } from '../lib/nostrRelay';

// Decode bech32 npub to hex pubkey
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
      while (bits >= 8) {
        bits -= 8;
        result.push((value >> bits) & 0xff);
      }
    }
    if (result.length !== 32) return null;
    return result.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
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

  // NIP-07 login (browser extension)
  initNostr: async () => {
    if (window.nostr) {
      try {
        const pubkey = await window.nostr.getPublicKey();
        set({ pubkey, isAuthenticated: true, nostrWindow: window.nostr, isReadOnly: false });
        // Fetch real Nostr profile (kind:0) with name + avatar
        const userData = await fetchNostrProfile(pubkey);
        set({ user: userData });
        return true;
      } catch (error) {
        console.error('Error connecting to Nostr:', error);
        return false;
      }
    }
    return false;
  },

  // Login with npub or hex pubkey — read-only mode
  loginWithPubkey: async (input) => {
    let hexPubkey = null;
    if (input.startsWith('npub1')) {
      hexPubkey = npubToHex(input.trim());
    } else if (isValidHexPubkey(input.trim())) {
      hexPubkey = input.trim().toLowerCase();
    }
    if (!hexPubkey) return false;

    // Fetch real Nostr profile (kind:0) with name + avatar
    const userData = await fetchNostrProfile(hexPubkey);
    set({
      pubkey: hexPubkey,
      user: userData,
      isAuthenticated: true,
      nostrWindow: null,
      isReadOnly: true,
    });
    return true;
  },

  // Sign a Nostr event (NIP-07 only)
  signEvent: async (event) => {
    if (get().isReadOnly) {
      console.warn('Cannot sign in read-only mode');
      return null;
    }
    if (!window.nostr) return null;
    try {
      return await window.nostr.signEvent(event);
    } catch (error) {
      console.error('Error signing event:', error);
      return null;
    }
  },

  // Check for existing NIP-07 session on app load
  checkExistingAuth: async () => {
    if (window.nostr) {
      try {
        const pubkey = await window.nostr.getPublicKey();
        const userData = await fetchNostrProfile(pubkey);
        set({
          pubkey,
          user: userData,
          isAuthenticated: true,
          nostrWindow: window.nostr,
          isReadOnly: false,
        });
      } catch {
        console.log('No existing NIP-07 auth');
      }
    }
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, pubkey: null, nostrWindow: null, isReadOnly: false });
  },
}));
