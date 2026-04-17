import React, { useEffect, useRef } from 'react';

/**
 * WaveBackground — animated dot-field flow wave.
 * Renders a grid of dots that oscillate with multi-frequency sine/cos
 * displacement based on their (x, y) coordinates + time, creating a
 * topographical "wave seen from above" effect.
 *
 * Colors subtly mix between Crypta green (#B4F953) and Bitcoin orange
 * (#F7931A) so it matches the cypherpunk palette.
 *
 * Absolute-fixed, pointer-events:none — drop it once behind your content
 * at z-index:0.
 */
export function WaveBackground({ density = 38, dotSize = 1.3, speed = 1, intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationId;
    let t = 0;
    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const spacing = density;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;

          // Multi-frequency wave displacement — looks like topographical flow
          const wave1 = Math.sin(i * 0.28 + t * 0.0018) * 7 * intensity;
          const wave2 = Math.cos(j * 0.24 + t * 0.0013) * 7 * intensity;
          const wave3 = Math.sin((i + j) * 0.18 + t * 0.0009) * 5 * intensity;
          const wave4 = Math.cos((i - j) * 0.14 + t * 0.0011) * 4 * intensity;

          const dx = wave1 + wave3;
          const dy = wave2 + wave4;

          // Radial "wake" pulse across the field
          const pulse = (Math.sin(i * 0.35 + j * 0.35 + t * 0.0025) + 1) / 2;
          const opacity = 0.08 + 0.28 * pulse;

          // Color mix green -> orange based on slow spatial wave
          const mix = (Math.sin(i * 0.08 + j * 0.08 + t * 0.0008) + 1) / 2;
          const r = Math.round(180 * (1 - mix) + 247 * mix);
          const g = Math.round(249 * (1 - mix) + 147 * mix);
          const b = Math.round(83 * (1 - mix) + 26 * mix);

          // Size modulates subtly with pulse
          const size = dotSize + pulse * 0.6;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      t += speed;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [density, dotSize, speed, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, background: '#0A0A0A' }}
      aria-hidden="true"
    />
  );
}
