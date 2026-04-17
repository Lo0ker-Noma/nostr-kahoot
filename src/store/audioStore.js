import { create } from 'zustand';

/**
 * audioStore — manages a single background music HTMLAudio instance.
 *
 * Design:
 *  - Music is GLOBAL: once started it plays continuously across all screens
 *    until the user toggles it off. No per-screen mount/unmount lifecycle.
 *  - isEnabled: user's mute preference (persisted to localStorage)
 *  - `start()` is idempotent — safe to call on every screen mount. If the
 *    browser blocks autoplay (no user gesture yet) the first toggle click
 *    counts as a gesture and unlocks playback.
 *  - `toggle()` flips isEnabled and immediately plays or pauses.
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
  isPlaying: false,
  blocked: false, // true when browser blocked autoplay

  // Idempotent: safe to call from every screen. If disabled, does nothing.
  // If already playing, does nothing. Otherwise tries to start playback.
  start: () => {
    if (!get().isEnabled) return;
    const a = getAudio();
    if (!a) return;
    if (!a.paused) return;
    try {
      const p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(() => set({ isPlaying: true, blocked: false }))
         .catch(() => set({ isPlaying: false, blocked: true }));
      }
    } catch { set({ isPlaying: false, blocked: true }); }
  },

  toggle: () => {
    const next = !get().isEnabled;
    savePreference(next);
    set({ isEnabled: next });
    const a = getAudio();
    if (!a) return;
    if (next) {
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
