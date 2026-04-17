import React, { useEffect } from 'react';
import { useAudioStore } from '../store/audioStore';

/**
 * useBackgroundMusic — mount hook for screens where music should play.
 * Call inside a component; music starts on mount, pauses on unmount.
 */
export function useBackgroundMusic() {
  const mount = useAudioStore((s) => s.mount);
  const unmount = useAudioStore((s) => s.unmount);
  useEffect(() => {
    mount();
    return () => unmount();
  }, [mount, unmount]);
}

/**
 * BackgroundMusic — all-in-one: mounts music hook + renders the toggle.
 * Drop inside any screen that should have background music.
 */
export function BackgroundMusic({ position = 'top-right' }) {
  useBackgroundMusic();
  return <MusicToggle position={position} />;
}

/**
 * MusicToggle — fixed-position 🔊/🔇 button. Toggles music on/off.
 * Preference is persisted to localStorage via audioStore.
 */
export function MusicToggle({ position = 'top-right' }) {
  const isEnabled = useAudioStore((s) => s.isEnabled);
  const blocked = useAudioStore((s) => s.blocked);
  const toggle = useAudioStore((s) => s.toggle);

  const positionStyle = position === 'top-right'
    ? { top: '1rem', right: '1rem' }
    : { bottom: '1rem', right: '1rem' };

  const title = blocked
    ? 'Música bloqueada — click para activar'
    : isEnabled ? 'Silenciar música' : 'Activar música';

  return (
    <button
      onClick={toggle}
      title={title}
      aria-label={title}
      className="fixed font-mono text-xs transition-all"
      style={{
        ...positionStyle,
        zIndex: 60,
        border: `2px solid ${isEnabled ? '#B4F953' : '#F7931A'}`,
        background: 'rgba(10,10,10,0.85)',
        color: isEnabled ? '#B4F953' : '#F7931A',
        padding: '8px 12px',
        letterSpacing: '0.15em',
        boxShadow: isEnabled
          ? '0 0 12px rgba(180,249,83,0.3)'
          : '0 0 12px rgba(247,147,26,0.3)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isEnabled
          ? '0 0 18px rgba(180,249,83,0.6)'
          : '0 0 18px rgba(247,147,26,0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isEnabled
          ? '0 0 12px rgba(180,249,83,0.3)'
          : '0 0 12px rgba(247,147,26,0.3)';
      }}
    >
      <span style={{ marginRight: '0.45rem', fontSize: '1.05rem' }}>
        {isEnabled ? '🔊' : '🔇'}
      </span>
      <span>{isEnabled ? 'MUSIC ON' : 'MUSIC OFF'}</span>
    </button>
  );
}
