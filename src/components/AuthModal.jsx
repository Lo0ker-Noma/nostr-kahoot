import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function AuthModal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualPubkey, setManualPubkey] = useState('');
  const [showManual, setShowManual] = useState(false);
  const { initNostr, loginWithPubkey } = useAuthStore();

  const handleConnectWithNostr = async () => {
    setLoading(true); setError('');
    const success = await initNostr();
    if (!success) setError('ERROR: NIP-07 extension not detected. Install Alby or Nos2x.');
    setLoading(false);
  };

  const handleManualLogin = async () => {
    if (!manualPubkey.trim()) { setError('ERROR: Paste your npub or hex pubkey'); return; }
    setLoading(true); setError('');
    try {
      const success = await loginWithPubkey(manualPubkey.trim());
      if (!success) setError('ERROR: Invalid public key format. Use npub1... or 64-char hex.');
    } catch (e) { setError('ERROR: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0A0A', backgroundImage: 'linear-gradient(0deg, rgba(180,249,83,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(180,249,83,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      <div className="fixed inset-0 pointer-events-none z-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)' }} />
      <div className="max-w-md w-full relative z-20">
        <div className="text-xs font-mono text-green-500 mb-2 flex justify-between">
          <span>[ SYS: NOSTR_AUTH ]</span>
          <span className="text-yellow-500">▶ NIP-07 / PUBKEY</span>
        </div>
        <div className="border-2 border-green-500 p-8 space-y-6" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl" style={{ color: '#F7931A', textShadow: '0 0 12px rgba(247,147,26,0.7)' }}>₿</span>
              <span className="text-5xl">⚡</span>
            </div>
            <h1 className="text-3xl font-bold font-mono tracking-widest uppercase" style={{ color: '#B4F953', textShadow: '0 0 8px rgba(180,249,83,0.6)' }}>NOSTR KAHOOT</h1>
            <p className="text-xs font-mono text-gray-500 tracking-wider">[ DECENTRALIZED QUIZ PROTOCOL — CYPHERPUNK EDITION ]</p>
          </div>

          {error && <div className="border border-red-500 p-3 bg-red-500/10"><p className="text-red-400 text-xs font-mono">&gt; {error}</p></div>}

          <div className="space-y-4">
            <button onClick={handleConnectWithNostr} disabled={loading} className="w-full font-mono font-bold py-4 text-sm tracking-widest uppercase transition-all disabled:opacity-50"
              style={{ border: '2px solid #B4F953', background: loading ? 'rgba(180,249,83,0.1)' : '#0A0A0A', color: '#B4F953', boxShadow: loading ? '0 0 20px rgba(180,249,83,0.4)' : 'none' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(180,249,83,0.1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(180,249,83,0.4)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.boxShadow = 'none'; } }}>
              {loading ? '▶ AUTHENTICATING...' : '⚡ CONNECT WITH NIP-07'}
            </button>
            <p className="text-center text-gray-700 text-xs font-mono">Alby · Nos2x · Knostr · Nostr Connect</p>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-green-500/20" />
              <span className="text-xs font-mono text-gray-600">OR</span>
              <div className="flex-1 border-t border-green-500/20" />
            </div>

            <button onClick={() => setShowManual(!showManual)} className="w-full font-mono font-bold py-3 text-xs tracking-widest uppercase transition-all"
              style={{ border: '2px solid #F7931A', background: '#0A0A0A', color: '#F7931A' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,147,26,0.08)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(247,147,26,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.boxShadow = 'none'; }}>
              🔑 {showManual ? 'HIDE' : 'LOGIN WITH PUBLIC KEY (NPUB)'}
            </button>

            {showManual && (
              <div className="space-y-3">
                <label className="block text-xs font-mono font-bold mb-2 uppercase tracking-widest" style={{ color: '#F7931A' }}>// YOUR PUBLIC KEY</label>
                <input type="text" value={manualPubkey} onChange={(e) => setManualPubkey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualLogin()} placeholder="npub1... or hex pubkey" className="w-full px-4 py-3 text-sm font-mono" style={{ background: '#0A0A0A', border: '1px solid rgba(247,147,26,0.4)', color: '#F7F7F7', outline: 'none' }} />
                <p className="text-xs font-mono text-gray-700">&gt; Read-only mode — play quizzes without publishing to relays.</p>
                <button onClick={handleManualLogin} disabled={loading || !manualPubkey.trim()} className="w-full font-mono font-bold py-3 text-xs tracking-widest uppercase transition-all disabled:opacity-30"
                  style={{ border: '2px solid #F7931A', background: '#0A0A0A', color: '#F7931A' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,147,26,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}>
                  ▶ IDENTIFY WITH PUBKEY
                </button>
              </div>
            )}
          </div>

          <div className="p-4 space-y-2" style={{ border: '1px solid rgba(247,147,26,0.3)', background: 'rgba(247,147,26,0.05)' }}>
            <p className="text-xs font-mono font-bold" style={{ color: '#F7931A' }}>⚙ AUTH METHODS:</p>
            <div className="space-y-1 text-xs font-mono text-gray-400">
              <p>⚡ NIP-07 extension — full access (sign + publish events)</p>
              <p>🔑 Public key (npub) — play quizzes in read-only mode</p>
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
