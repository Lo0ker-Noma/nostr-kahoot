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

const loadPreference = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true; // default: music ON
    return stored === '1';
  } catch { return true; }
};

const savePreference = (enabled) => {
  try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch {}
};

let audioEl = null;
const getAudio = () => {
  if (!audioEl) {
    audioEl = new Audio(TRACK_SRC);
    audioEl.loop = true;
    audioEl.volume = 0.45;
    audioEl.preload = 'auto';
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
      a.play()
        .then(() => set({ isPlaying: true, blocked: false }))
        .catch(() => set({ isPlaying: false, blocked: true }));
    }
  },

  unmount: () => {
    set((s) => ({ screenCount: Math.max(0, s.screenCount - 1) }));
    // If nobody needs music anymore, pause it
    if (get().screenCount === 0) {
      const a = getAudio();
      a.pause();
      set({ isPlaying: false });
    }
  },

  toggle: () => {
    const next = !get().isEnabled;
    savePreference(next);
    set({ isEnabled: next });
    const a = getAudio();
    if (next && get().screenCount > 0) {
      // Turning ON and on a music screen — play
      a.play()
        .then(() => set({ isPlaying: true, blocked: false }))
        .catch(() => set({ isPlaying: false, blocked: true }));
    } else {
      // Turning OFF
      a.pause();
      set({ isPlaying: false });
    }
  },
}));
