#!/bin/bash
# Run this from inside your nostr-kahoot directory
# Usage: bash apply-updates.sh

set -e
echo "▶ Writing updated files..."

# ── src/store/authStore.js ──────────────────────────────────────────
cat > src/store/authStore.js << 'ENDOFFILE'
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
ENDOFFILE

# ── src/store/quizStore.js ──────────────────────────────────────────
cat > src/store/quizStore.js << 'ENDOFFILE'
import { create } from 'zustand';
import { useAuthStore } from './authStore';

const DEMO_QUIZZES = [
  {
    id: 'quiz-nostr-identity',
    title: 'Nostr & Identity',
    description: 'Identidad descentralizada en el protocolo Nostr — temática del hackathon',
    questions: [
      { id: 1, question: '¿Qué significa Nostr?', answers: ['Notes and Other Stuff Transmitted by Relays', 'Network Over String Transmission', 'New Open System for Text Relay', 'Neutral Open Source Transmission Relay'], correct: 0, difficulty: 'easy' },
      { id: 2, question: '¿Qué NIP define la verificación de identidad tipo "usuario@dominio.com"?', answers: ['NIP-05', 'NIP-01', 'NIP-07', 'NIP-19'], correct: 0, difficulty: 'medium' },
      { id: 3, question: '¿Qué formato usa Nostr para representar claves públicas de forma legible?', answers: ['npub (bech32)', 'Base58', 'PEM', 'Base64url'], correct: 0, difficulty: 'easy' },
      { id: 4, question: '¿Qué NIP permite firmar eventos desde el navegador sin exponer la clave privada?', answers: ['NIP-07', 'NIP-05', 'NIP-26', 'NIP-42'], correct: 0, difficulty: 'medium' },
      { id: 5, question: '¿Qué tipo de criptografía usa Nostr para la identidad de usuarios?', answers: ['Curva elíptica secp256k1 (la misma que Bitcoin)', 'RSA-2048', 'Ed25519', 'AES-256'], correct: 0, difficulty: 'hard' },
      { id: 6, question: '¿Qué NIP define los "badges" (insignias) verificables en Nostr?', answers: ['NIP-58', 'NIP-05', 'NIP-30', 'NIP-42'], correct: 0, difficulty: 'hard' },
      { id: 7, question: '¿Cómo se llama la delegación de identidad en Nostr?', answers: ['NIP-26 (Delegated Event Signing)', 'NIP-05', 'NIP-42', 'NIP-65'], correct: 0, difficulty: 'hard' },
      { id: 8, question: '¿Qué campo del evento Nostr identifica al autor?', answers: ['pubkey', 'id', 'sig', 'kind'], correct: 0, difficulty: 'easy' },
      { id: 9, question: '¿Qué ventaja tiene la identidad en Nostr frente a Twitter/X?', answers: ['Eres dueño de tu identidad (tu clave privada), nadie te puede censurar', 'Tu cuenta está verificada automáticamente', 'Tienes un nombre único garantizado', 'Tu identidad está ligada a tu email'], correct: 0, difficulty: 'medium' },
    ],
    creator: 'hackathon-demo', participants: 42,
  },
  {
    id: 'quiz-la-crypta',
    title: 'La Crypta',
    description: 'Comunidad cypherpunk y Bitcoin de Buenos Aires',
    questions: [
      { id: 101, question: '¿Qué es La Crypta?', answers: ['Una comunidad cypherpunk y espacio Bitcoin en Buenos Aires', 'Un exchange de criptomonedas argentino', 'Un wallet de Bitcoin', 'Una empresa de minería de Bitcoin'], correct: 0, difficulty: 'easy' },
      { id: 102, question: '¿Qué tipo de eventos organiza La Crypta principalmente?', answers: ['Hackathones, meetups y talleres sobre Bitcoin, Lightning y Nostr', 'Conferencias de trading', 'Cursos de finanzas tradicionales', 'Eventos de marketing digital'], correct: 0, difficulty: 'easy' },
      { id: 103, question: '¿Qué protocolo de pagos usa La Crypta para transacciones rápidas?', answers: ['Lightning Network', 'SWIFT', 'PayPal', 'Ethereum L2'], correct: 0, difficulty: 'medium' },
      { id: 104, question: '¿Cuál es la filosofía principal de La Crypta?', answers: ['Soberanía individual, privacidad y software libre — valores cypherpunk', 'Maximizar profits en DeFi', 'Promover regulación bancaria', 'Vender NFTs'], correct: 0, difficulty: 'medium' },
      { id: 105, question: '¿Qué temática tiene el hackathon 2026 de La Crypta?', answers: ['Identidad descentralizada y redes sociales (Identity & Social)', 'DeFi y yield farming', 'Metaverso y realidad virtual', 'Gaming blockchain'], correct: 0, difficulty: 'easy' },
    ],
    creator: 'hackathon-demo', participants: 21,
  },
  {
    id: 'quiz-bitcoin',
    title: 'Bitcoin Fundamentals',
    description: 'Conceptos fundamentales de Bitcoin para verdaderos cypherpunks',
    questions: [
      { id: 201, question: '¿Quién publicó el whitepaper de Bitcoin en 2008?', answers: ['Satoshi Nakamoto', 'Vitalik Buterin', 'Hal Finney', 'Nick Szabo'], correct: 0, difficulty: 'easy' },
      { id: 202, question: '¿Cuál es el suministro máximo de Bitcoin?', answers: ['21 millones', '100 millones', '18.5 millones', 'Ilimitado'], correct: 0, difficulty: 'easy' },
      { id: 203, question: '¿Qué es el "halving" de Bitcoin?', answers: ['La reducción a la mitad de la recompensa por bloque cada ~4 años', 'La división de la blockchain en dos', 'La reducción del tamaño de bloque', 'El proceso de quemar Bitcoin'], correct: 0, difficulty: 'medium' },
      { id: 204, question: '¿Qué mensaje dejó Satoshi en el bloque génesis?', answers: ['The Times 03/Jan/2009 Chancellor on brink of second bailout for banks', 'Hello World', 'In code we trust', 'The revolution will not be centralized'], correct: 0, difficulty: 'hard' },
      { id: 205, question: '¿Qué problema fundamental resuelve Bitcoin sin terceros?', answers: ['El problema del doble gasto (double-spending)', 'El problema de escalabilidad', 'El problema de interoperabilidad', 'El problema de almacenamiento'], correct: 0, difficulty: 'medium' },
    ],
    creator: 'hackathon-demo', participants: 69,
  },
];

export const useQuizStore = create((set, get) => ({
  quizzes: [],
  answers: [],

  createQuiz: async (quizData) => {
    try {
      const { signEvent, pubkey, isReadOnly } = useAuthStore.getState();
      if (isReadOnly) {
        set((state) => ({ quizzes: [...state.quizzes, { id: `quiz-${Date.now()}`, ...quizData }] }));
        return null;
      }
      const event = {
        kind: 30023,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', `quiz-${Date.now()}`], ['title', quizData.title], ['summary', quizData.description], ['type', 'kahoot-quiz']],
        content: JSON.stringify({ title: quizData.title, description: quizData.description, questions: quizData.questions, creator: pubkey, createdAt: quizData.createdAt, participants: 0 }),
        pubkey,
      };
      const signedEvent = await signEvent(event);
      if (!signedEvent) throw new Error('Could not sign event');
      set((state) => ({ quizzes: [...state.quizzes, { id: `quiz-${Date.now()}`, ...quizData }] }));
      return signedEvent;
    } catch (error) { console.error('Error creating quiz:', error); throw error; }
  },

  loadQuizzesFromNostr: async () => {
    try { set({ quizzes: DEMO_QUIZZES }); }
    catch (error) { console.error('Error loading quizzes:', error); }
  },

  getQuizById: async (quizId) => {
    const { quizzes } = get();
    return quizzes.find((q) => q.id === quizId) || null;
  },

  saveAnswer: async (answerData) => {
    try {
      const { signEvent, pubkey, isReadOnly } = useAuthStore.getState();
      if (isReadOnly) {
        set((state) => ({ answers: [...state.answers, { ...answerData, timestamp: new Date().toISOString() }] }));
        return null;
      }
      const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['quiz', answerData.quizId], ['question', String(answerData.questionId)], ['answer', answerData.answer.toString()]],
        content: JSON.stringify({ quizId: answerData.quizId, questionId: answerData.questionId, answer: answerData.answer, correct: answerData.correct, timestamp: new Date().toISOString() }),
        pubkey,
      };
      const signedEvent = await signEvent(event);
      if (!signedEvent) throw new Error('Could not sign answer');
      set((state) => ({ answers: [...state.answers, signedEvent] }));
      return signedEvent;
    } catch (error) { console.error('Error saving answer:', error); throw error; }
  },

  getQuizResults: async (quizId) => {
    const { answers } = get();
    return answers.filter((a) => a.tags ? a.tags.some((t) => t[0] === 'quiz' && t[1] === quizId) : a.quizId === quizId);
  },
}));
ENDOFFILE

# ── src/components/AuthModal.jsx ───────────────────────────────────
cat > src/components/AuthModal.jsx << 'ENDOFFILE'
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
ENDOFFILE

# ── src/components/Dashboard.jsx ───────────────────────────────────
cat > src/components/Dashboard.jsx << 'ENDOFFILE'
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQuizStore } from '../store/quizStore';

export function Dashboard({ onCreateClick, onGameClick, onPlayQuiz }) {
  const { quizzes, loadQuizzesFromNostr } = useQuizStore();
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => { loadQuizzesFromNostr(); }, []);

  const copySessionId = (id) => {
    navigator.clipboard.writeText(id).then(() => { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); });
  };

  const quizMeta = {
    'quiz-nostr-identity': { emoji: '🔑', color: '#B4F953' },
    'quiz-la-crypta':      { emoji: '🏴‍☠️', color: '#F7931A' },
    'quiz-bitcoin':        { emoji: '₿',  color: '#F7931A' },
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold font-mono tracking-widest uppercase" style={{ color: '#B4F953', textShadow: '0 0 6px rgba(180,249,83,0.5)' }}>&gt; DASHBOARD</h2>
        <p className="text-xs font-mono text-gray-500">[ SELECT A QUIZ · SHARE QR · PLAYERS JOIN ]</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={onCreateClick} className="font-mono font-bold py-5 text-sm tracking-widest uppercase transition-all text-left px-6"
          style={{ border: '2px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,249,83,0.08)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(180,249,83,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div className="text-xl mb-1">✏</div><div>CREAR QUIZ</div>
          <div className="text-xs text-gray-600 font-normal mt-1">Publica en Nostr relay</div>
        </button>
        <button onClick={onGameClick} className="font-mono font-bold py-5 text-sm tracking-widest uppercase transition-all text-left px-6"
          style={{ border: '2px solid #F7931A', background: '#0A0A0A', color: '#F7931A' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,147,26,0.08)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(247,147,26,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div className="text-xl mb-1">⚡</div><div>JOIN BY SESSION ID</div>
          <div className="text-xs text-gray-600 font-normal mt-1">Introduce un ID o escanea QR</div>
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: '#B4F953' }}>▶</span>
          <h3 className="text-sm font-bold font-mono tracking-widest uppercase text-white">AVAILABLE QUIZZES ({quizzes.length})</h3>
        </div>
        {quizzes.length === 0 ? (
          <div className="text-center py-10 font-mono" style={{ border: '1px solid rgba(180,249,83,0.15)', background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-gray-600 text-xs">[ LOADING QUIZZES... ]</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => {
              const meta = quizMeta[quiz.id] || { emoji: '❓', color: '#B4F953' };
              return (
                <div key={quiz.id} className="p-5 cursor-pointer transition-all" style={{ border: `1px solid ${meta.color}33`, background: 'rgba(0,0,0,0.4)' }}
                  onClick={() => setSelectedQuiz(quiz)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${meta.color}88`; e.currentTarget.style.background = `${meta.color}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${meta.color}33`; e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{meta.emoji}</span>
                        <h4 className="font-bold font-mono text-white text-base uppercase tracking-wide">{quiz.title}</h4>
                      </div>
                      <p className="text-gray-500 text-xs font-mono mb-3 ml-10">{quiz.description}</p>
                      <div className="flex gap-6 ml-10 text-xs font-mono">
                        <span style={{ color: meta.color }}>❓ {quiz.questions.length} PREGUNTAS</span>
                        <span style={{ color: '#F7931A' }}>⚡ {quiz.participants || 0} JUGARON</span>
                      </div>
                    </div>
                    <div className="text-xs font-mono px-3 py-1 flex-shrink-0 ml-4" style={{ border: `1px solid ${meta.color}55`, color: meta.color }}>ABRIR →</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedQuiz && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.92)' }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedQuiz(null); }}>
          <div className="max-w-lg w-full relative" style={{ border: '2px solid #B4F953', background: '#0A0A0A' }}>
            <div className="p-6 pb-4" style={{ borderBottom: '1px solid rgba(180,249,83,0.2)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono text-gray-600 mb-1">[ QUIZ SESSION ]</p>
                  <h3 className="text-xl font-bold font-mono uppercase tracking-wider" style={{ color: '#B4F953' }}>
                    {(quizMeta[selectedQuiz.id] || {}).emoji || '❓'} {selectedQuiz.title}
                  </h3>
                  <p className="text-gray-500 text-xs font-mono mt-1">{selectedQuiz.description}</p>
                </div>
                <button onClick={() => setSelectedQuiz(null)} className="font-mono text-xs px-2 py-1" style={{ border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', background: '#0A0A0A' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}>[X]</button>
              </div>
            </div>

            <div className="px-6 py-3 flex gap-6 text-xs font-mono" style={{ borderBottom: '1px solid rgba(180,249,83,0.1)' }}>
              <span style={{ color: '#B4F953' }}>❓ {selectedQuiz.questions.length} preguntas</span>
              <span style={{ color: '#F7931A' }}>⚡ {selectedQuiz.participants || 0} jugaron</span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-mono font-bold mb-2 uppercase tracking-widest" style={{ color: '#F7931A' }}>// SESSION ID — comparte para unirse</p>
                <div className="flex items-center gap-3 p-3" style={{ border: '1px solid rgba(247,147,26,0.4)', background: 'rgba(247,147,26,0.05)' }}>
                  <code className="flex-1 font-mono text-sm text-white tracking-wider select-all">{selectedQuiz.id}</code>
                  <button onClick={() => copySessionId(selectedQuiz.id)} className="font-mono text-xs px-3 py-1 flex-shrink-0"
                    style={{ border: '1px solid #F7931A', background: copiedId ? 'rgba(247,147,26,0.2)' : '#0A0A0A', color: '#F7931A' }}>
                    {copiedId ? '✓ COPIED' : 'COPY'}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-mono font-bold mb-2 uppercase tracking-widest" style={{ color: '#B4F953' }}>// SCAN QR TO JOIN</p>
                <div className="flex justify-center p-4 bg-white">
                  <QRCodeSVG value={`${window.location.origin}?join=${selectedQuiz.id}`} size={180} level="H" includeMargin={false} />
                </div>
                <p className="text-xs font-mono text-gray-600 text-center mt-2">&gt; Escanea para unirte a esta sesión</p>
              </div>

              <div>
                <p className="text-xs font-mono font-bold mb-2 uppercase tracking-widest text-gray-500">// PREVIEW</p>
                <div className="space-y-1">
                  {selectedQuiz.questions.slice(0, 3).map((q, idx) => (
                    <div key={q.id} className="text-xs font-mono text-gray-400 py-1" style={{ borderBottom: '1px solid rgba(180,249,83,0.06)' }}>
                      <span style={{ color: '#F7931A' }}>#{idx + 1}</span> {q.question}
                    </div>
                  ))}
                  {selectedQuiz.questions.length > 3 && <p className="text-xs font-mono text-gray-600">... +{selectedQuiz.questions.length - 3} more</p>}
                </div>
              </div>
            </div>

            <div className="p-6 pt-2">
              <button onClick={() => { setSelectedQuiz(null); onPlayQuiz(selectedQuiz.id); }}
                className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all"
                style={{ border: '2px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,249,83,0.1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(180,249,83,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.boxShadow = 'none'; }}>
                ⚡ JUGAR AHORA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
ENDOFFILE

# ── src/App.jsx ─────────────────────────────────────────────────────
cat > src/App.jsx << 'ENDOFFILE'
import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { QuizCreator } from './components/QuizCreator';
import { QuizGame } from './components/QuizGame';

function App() {
  const { isAuthenticated, user, isReadOnly } = useAuthStore();
  const [view, setView] = useState('dashboard');
  const [directQuizId, setDirectQuizId] = useState(null);

  useEffect(() => {
    useAuthStore.getState().checkExistingAuth();
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get('join');
    if (joinId) { setDirectQuizId(joinId); setView('game'); }
  }, []);

  const handlePlayQuiz = (quizId) => { setDirectQuizId(quizId); setView('game'); };

  if (!isAuthenticated) return <AuthModal />;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)', animation: 'scanline 8s linear infinite' }} />

      <nav className="border-b-2 border-b-yellow-500 bg-black/60 backdrop-blur-sm relative z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl bitcoin-accent">₿</span>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold crypta-accent tracking-wider">NOSTR KAHOOT</h1>
              <p className="text-xs text-gray-400">[ DECENTRALIZED QUIZ PROTOCOL ]</p>
            </div>
          </div>
          <div className="flex items-center gap-6 border-l-2 border-green-500 pl-6">
            <div className="text-right">
              <p className="text-xs text-gray-500">CONNECTED IDENTITY</p>
              <p className="font-mono text-green-400 text-sm tracking-wide">{user?.name || '[ ANONYMOUS ]'}</p>
              {isReadOnly && <p className="text-xs font-mono" style={{ color: '#F7931A' }}>[ READ-ONLY ]</p>}
            </div>
            <button onClick={() => useAuthStore.getState().logout()} className="crypto-btn text-yellow-500 border-yellow-500 hover:bg-yellow-500/10" style={{ borderWidth: '2px' }}>⏻ EXIT</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-30">
        <div className="border-2 border-green-500/30 p-6 bg-black/40 backdrop-blur-sm">
          <div className="text-xs text-green-500 mb-4 font-mono">
            &gt; {view === 'dashboard' ? 'DASHBOARD' : view === 'create' ? 'QUIZ_CREATOR' : 'QUIZ_GAME'} MODE
          </div>
          {view === 'dashboard' && <Dashboard onCreateClick={() => setView('create')} onGameClick={() => setView('game')} onPlayQuiz={handlePlayQuiz} />}
          {view === 'create' && <QuizCreator onBack={() => setView('dashboard')} />}
          {view === 'game' && <QuizGame onBack={() => { setView('dashboard'); setDirectQuizId(null); }} initialQuizId={directQuizId} />}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t-2 border-t-green-500 bg-black/60 text-xs text-gray-500 px-4 py-2 font-mono z-40">
        <div className="flex justify-between max-w-7xl mx-auto">
          <span>[ NOSTR PROTOCOL v1.0 ]</span>
          <span>⚡ POWERED BY LIGHTNING + NIP-07 ⚡</span>
          <span>[ CYPHERPUNK EDITION ]</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
ENDOFFILE

# ── QuizGame.jsx — add initialQuizId support ────────────────────────
# (only patch the top, rest stays the same)
python3 - << 'PYEOF'
import re

with open('src/components/QuizGame.jsx', 'r') as f:
    content = f.read()

old = "import React, { useState } from 'react';"
new = "import React, { useState, useEffect } from 'react';"
content = content.replace(old, new, 1)

old = "export function QuizGame({ onBack }) {"
new = "export function QuizGame({ onBack, initialQuizId }) {"
content = content.replace(old, new, 1)

# Add useEffect after const { getQuizById, saveAnswer } line
hook = """
  const { getQuizById, saveAnswer } = useQuizStore();"""
inject = """
  const { getQuizById, saveAnswer } = useQuizStore();

  useEffect(() => {
    if (initialQuizId && !currentQuiz) {
      (async () => {
        setLoading(true);
        const quiz = await getQuizById(initialQuizId);
        if (quiz) setCurrentQuiz(quiz);
        setLoading(false);
      })();
    }
  }, [initialQuizId]);"""

if hook in content and "useEffect" not in content:
    content = content.replace(hook, inject, 1)

with open('src/components/QuizGame.jsx', 'w') as f:
    f.write(content)
print("QuizGame.jsx patched")
PYEOF

echo ""
echo "✓ All files written."
echo ""
echo "▶ Committing and pushing..."
git add src/components/AuthModal.jsx src/components/Dashboard.jsx src/components/QuizGame.jsx src/store/authStore.js src/store/quizStore.js src/App.jsx
git commit -m "feat: pubkey login, 3 demo quizzes, QR join flow, remove auth QR"
git push origin main
echo ""
echo "✓ Done! Vercel will deploy in ~1 min."
