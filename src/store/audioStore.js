import { create } from 'zustand';

/**
 * audioStore — manages a single background music HTMLAudio instance.
 *
 * Design:
 *  - isEnabled: user's mute preference (persisted to localStorage)
 *  - screenCount: how many "music screens" are currently mounted
 *  - Music plays iff (isEnabled && screenCount > 0)
 *  - If the browser blocks autoplay (no user gesture yet) the first
 *    toggle click counts as a gesture and unlocks playback.
 */

const TRACK_SRC = '/clubbed-to-death.mp3';
const STORAGE_KEY = 'nostr-kahoot-music-enabled';

const hasWindow = typeof window !== 'undefined';

// Strict tri-state: only '1' → on, '0' → off, anything else → default (on).
// This defends against a hostile extension / XSS poisoning the value.
const loadPreference = () => {
  if (!hasWindow) return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
    return true; // default: music ON
  } catch { return true; }
};

const savePreference = (enabled) => {
  if (!hasWindow) return;
  try { window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch {}
};

let audioEl = null;
const getAudio = () => {
  if (!hasWindow) return null;
  if (!audioEl) {
    audioEl = new Audio(TRACK_SRC);
    audioEl.loop = true;
    audioEl.volume = 0.45;
    audioEl.preload = 'auto';
    audioEl.crossOrigin = 'anonymous';
  }
  return audioEl;
};

export const useAudioStore = create((set, get) => ({
  isEnabled: loadPreference(),
  screenCount: 0,
  isPlaying: false,
  blocked: false, // true when browser blocked autoplay

  mount: () => {
    set((s) => ({ screenCount: s.screenCount + 1 }));
    if (get().isEnabled) {
      const a = getAudio();
      if (!a) return;
      try {
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.then(() => set({ isPlaying: true, blocked: false }))
           .catch(() => set({ isPlaying: false, blocked: true }));
        }
      } catch { set({ isPlaying: false, blocked: true }); }
    }
  },

  unmount: () => {
    set((s) => ({ screenCount: Math.max(0, s.screenCount - 1) }));
    // If nobody needs music anymore, pause it
    if (get().screenCount === 0) {
      const a = getAudio();
      if (!a) return;
      try { a.pause(); } catch {}
      set({ isPlaying: false });
    }
  },

  toggle: () => {
    const next = !get().isEnabled;
    savePreference(next);
    set({ isEnabled: next });
    const a = getAudio();
    if (!a) return;
    if (next && get().screenCount > 0) {
      try {
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.then(() => set({ isPlaying: true, blocked: false }))
           .catch(() => set({ isPlaying: false, blocked: true }));
        }
      } catch { set({ isPlaying: false, blocked: true }); }
    } else {
      try { a.pause(); } catch {}
      set({ isPlaying: false });
    }
  },
}));
