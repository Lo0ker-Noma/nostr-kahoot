import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/authStore';

export function AuthModal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { initNostr } = useAuthStore();

  const handleConnectWithNostr = async () => {
    setLoading(true);
    setError('');
    const success = await initNostr();
    if (!success) {
      setError('ERROR: NIP-07 extension not detected. Install Alby or Nos2x.');
    }
    setLoading(false);
  };

  const nostrAuthUri = 'https://nostr-kahoot-git-main-lo0ker-nomas-projects.vercel.app';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: '#0A0A0A',
        backgroundImage:
          'linear-gradient(0deg, rgba(180,249,83,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(180,249,83,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)',
        }}
      />

      <div className="max-w-md w-full relative z-20">
        <div className="text-xs font-mono text-green-500 mb-2 flex justify-between">
          <span>[ SYS: NOSTR_AUTH ]</span>
          <span className="text-yellow-500">NIP-07</span>
        </div>

        <div
          className="border-2 border-green-500 p-8 space-y-6"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl" style={{ color: '#F7931A', textShadow: '0 0 12px rgba(247,147,26,0.7)' }}>B</span>
              <span className="text-5xl">&#9889;</span>
            </div>
            <h1
              className="text-3xl font-bold font-mono tracking-widest uppercase"
              style={{ color: '#B4F953', textShadow: '0 0 8px rgba(180,249,83,0.6)' }}
            >
              NOSTR KAHOOT
            </h1>
            <p className="text-xs font-mono text-gray-500 tracking-wider">
              [ DECENTRALIZED QUIZ PROTOCOL ]
            </p>
          </div>

          {error && (
            <div className="border border-red-500 p-3 bg-red-500/10">
              <p className="text-red-400 text-xs font-mono">&gt; {error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleConnectWithNostr}
              disabled={loading}
              className="w-full font-mono font-bold py-4 text-sm tracking-widest uppercase transition-all disabled:opacity-50"
              style={{
                border: '2px solid #B4F953',
                background: loading ? 'rgba(180,249,83,0.1)' : '#0A0A0A',
                color: '#B4F953',
                boxShadow: loading ? '0 0 20px rgba(180,249,83,0.4)' : 'none',
              }}
            >
              {loading ? 'AUTHENTICATING...' : 'CONNECT WITH NIP-07'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-green-500/20" />
              <span className="text-xs font-mono text-gray-600">OR SCAN QR</span>
              <div className="flex-1 border-t border-green-500/20" />
            </div>

            <div
              className="flex justify-center p-4"
              style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'white' }}
            >
              <QRCodeSVG value={nostrAuthUri} size={180} level="H" includeMargin={false} />
            </div>

            <p className="text-center text-gray-600 text-xs font-mono">
              &gt; SCAN WITH KNOSTR / ALBY TO AUTHENTICATE
            </p>
          </div>

          <div
            className="p-4 space-y-2"
            style={{ border: '1px solid rgba(247,147,26,0.3)', background: 'rgba(247,147,26,0.05)' }}
          >
            <p className="text-xs font-mono font-bold" style={{ color: '#F7931A' }}>
              SYSTEM REQUIREMENTS:
            </p>
            <div className="space-y-1 text-xs font-mono text-gray-400">
              <p>Alby / Nos2x / Knostr extension</p>
              <p>Active Nostr keypair (nsec)</p>
              <p>Event signing permission</p>
            </div>
          </div>
        </div>

        <div className="border-t border-green-500/30 text-xs font-mono text-gray-600 flex justify-between mt-2 pt-1">
          <span>[ NOSTR PROTOCOL v1.0 ]</span>
          <span style={{ color: '#F7931A' }}>LA CRYPTA HACKATHON 2026</span>
        </div>
      </div>
    </div>
  );
}
