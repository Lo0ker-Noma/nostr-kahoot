import React, { useEffect } from 'react';
import { useAudioStore } from '../store/audioStore';

/**
 * useBackgroundMusic — call inside any screen to ensure music is playing.
 * No cleanup: music is global and persists across screens by design.
 */
export function useBackgroundMusic() {
  const start = useAudioStore((s) => s.start);
  useEffect(() => { start(); }, [start]);
}

/**
 * BackgroundMusic — mounts the music hook + renders the toggle button.
 * Drop once at the app root so music plays continuously across views.
 */
export function BackgroundMusic({ position = 'top-right' }) {
  useBackgroundMusic();
  return <MusicToggle position={position} />;
}

/**
 * MusicToggle — fixed-position 🔊/🔇 button. Toggles music on/off.
 * On mobile (< sm) shows icon only so it doesn't overlap header text.
 * On ≥ sm it shows icon + MUSIC ON/OFF label.
 */
export function MusicToggle({ position = 'top-right' }) {
  const isEnabled = useAudioStore((s) => s.isEnabled);
  const blocked = useAudioStore((s) => s.blocked);
  const toggle = useAudioStore((s) => s.toggle);

  const positionStyle = position === 'top-right'
    ? { top: '0.75rem', right: '0.75rem' }
    : { bottom: '0.75rem', right: '0.75rem' };

  const title = blocked
    ? 'Música bloqueada — click para activar'
    : isEnabled ? 'Silenciar música' : 'Activar música';

  const color = isEnabled ? '#B4F953' : '#F7931A';
  const glow = isEnabled ? 'rgba(180,249,83,0.3)' : 'rgba(247,147,26,0.3)';
  const glowHover = isEnabled ? 'rgba(180,249,83,0.6)' : 'rgba(247,147,26,0.6)';

  return (
    <button
      onClick={toggle}
      title={title}
      aria-label={title}
      className="fixed font-mono transition-all flex items-center gap-1.5 text-[10px] sm:text-xs px-2 py-1.5 sm:px-3 sm:py-2"
      style={{
        ...positionStyle,
        zIndex: 60,
        border: `2px solid ${color}`,
        background: 'rgba(10,10,10,0.85)',
        color,
        letterSpacing: '0.15em',
        boxShadow: `0 0 12px ${glow}`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 18px ${glowHover}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 12px ${glow}`; }}
    >
      <span className="text-sm sm:text-base leading-none">
        {isEnabled ? '🔊' : '🔇'}
      </span>
      <span className="hidden sm:inline">{isEnabled ? 'MUSIC ON' : 'MUSIC OFF'}</span>
    </button>
  );
}
