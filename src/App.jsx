import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { QuizCreator } from './components/QuizCreator';
import { QuizGame } from './components/QuizGame';
import { QuizHost } from './components/QuizHost';
import { QuizPlayer } from './components/QuizPlayer';

function App() {
  const { isAuthenticated, user, isReadOnly } = useAuthStore();

  // view: dashboard | create | game | host | join
  const [view, setView] = useState('dashboard');
  const [soloQuiz, setSoloQuiz] = useState(null);     // quiz object for solo play
  const [hostQuiz, setHostQuiz] = useState(null);     // quiz object for host
  const [sessionPin, setSessionPin] = useState(null); // PIN from ?session= or manual join

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    const joinParam = params.get('join');

    if (sessionParam) {
      // Player scanned QR — go straight to QuizPlayer, no auth required
      setSessionPin(sessionParam);
      setView('player');
    } else {
      useAuthStore.getState().checkExistingAuth();
      if (joinParam) {
        // Legacy ?join=quizId — solo play
        setSoloQuiz({ id: joinParam });
        setView('game');
      }
    }
  }, []);

  // ── Player mode: skip auth entirely ──
  if (view === 'player' && sessionPin) {
    return <QuizPlayer sessionPin={sessionPin} />;
  }

  // ── Auth gate ──
  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Scanline effect */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
          animation: 'scanline 8s linear infinite',
        }}
      />

      {/* Navbar */}
      <nav className="border-b-2 border-b-yellow-500 bg-black/60 backdrop-blur-sm relative z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-3xl bitcoin-accent">₿</span>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold crypta-accent tracking-wider">NOSTR KAHOOT</h1>
              <p className="text-xs text-gray-400">[ DECENTRALIZED QUIZ PROTOCOL ]</p>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-4 border-l-2 border-green-500 pl-6">
            {user?.picture && (
              <img
                src={user.picture}
                alt="avatar"
                className="w-9 h-9 rounded-full"
                style={{ border: '1px solid rgba(180,249,83,0.5)', boxShadow: '0 0 8px rgba(180,249,83,0.2)' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="text-right">
              <p className="text-xs text-gray-500">CONNECTED IDENTITY</p>
              <p className="font-mono text-green-400 text-sm tracking-wide">
                {user?.name || '[ ANONYMOUS ]'}
              </p>
              {user?.nip05 && (
                <p className="text-xs font-mono text-gray-600">{user.nip05}</p>
              )}
              {isReadOnly && (
                <p className="text-xs font-mono" style={{ color: '#F7931A' }}>[ READ-ONLY ]</p>
              )}
            </div>
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="crypto-btn text-yellow-500 border-yellow-500 hover:bg-yellow-500/10"
              style={{ borderWidth: '2px' }}
            >
              ⏻ EXIT
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-30">
        <div className="border-2 border-green-500/30 p-6 bg-black/40 backdrop-blur-sm">
          {/* Mode label */}
          <div className="text-xs text-green-500 mb-4 font-mono">
            &gt;{' '}
            {view === 'dashboard' ? 'DASHBOARD' :
             view === 'create'    ? 'QUIZ_CREATOR' :
             view === 'host'      ? 'HOST_MODE' :
             view === 'join'      ? 'JOIN_SESSION' :
                                    'QUIZ_GAME'} MODE
          </div>

          {view === 'dashboard' && (
            <Dashboard
              onCreateClick={() => setView('create')}
              onHostQuiz={(quiz) => { setHostQuiz(quiz); setView('host'); }}
              onSoloQuiz={(quiz) => { setSoloQuiz(quiz); setView('game'); }}
              onJoinSession={() => setView('join')}
            />
          )}

          {view === 'create' && (
            <QuizCreator onBack={() => setView('dashboard')} />
          )}

          {view === 'game' && (
            <QuizGame
              onBack={() => { setView('dashboard'); setSoloQuiz(null); }}
              initialQuizId={soloQuiz?.id || null}
            />
          )}

          {view === 'host' && hostQuiz && (
            <QuizHost
              quiz={hostQuiz}
              onBack={() => { setView('dashboard'); setHostQuiz(null); }}
            />
          )}

          {view === 'join' && (
            <JoinByPin
              onBack={() => setView('dashboard')}
              onJoin={(pin) => { setSessionPin(pin); setView('player'); }}
            />
          )}
        </div>
      </main>

      {/* Footer */}
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

// ── Manual PIN entry (for logged-in users joining without QR) ──
function JoinByPin({ onBack, onJoin }) {
  const [pin, setPin] = useState('');

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2
            className="text-xl font-bold font-mono uppercase tracking-widest"
            style={{ color: '#F7931A' }}
          >
            &gt; UNIRSE CON PIN
          </h2>
          <p className="text-xs font-mono text-gray-600">[ INGRESA EL PIN DE LA SESIÓN ]</p>
        </div>
        <button
          onClick={onBack}
          className="px-3 py-1 font-mono text-xs uppercase"
          style={{ border: '1px solid rgba(180,249,83,0.3)', color: '#B4F953', background: '#0A0A0A' }}
        >
          ← VOLVER
        </button>
      </div>

      <div
        className="p-6 space-y-4"
        style={{ border: '1px solid rgba(247,147,26,0.3)', background: 'rgba(0,0,0,0.4)' }}
      >
        <label
          className="block text-xs font-mono font-bold uppercase tracking-widest"
          style={{ color: '#F7931A' }}
        >
          // GAME PIN (6 dígitos)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && pin.length === 6 && onJoin(pin)}
          placeholder="123456"
          maxLength={6}
          autoFocus
          className="w-full px-4 py-4 text-3xl font-mono tracking-[0.5em] text-center"
          style={{
            background: '#0A0A0A',
            border: '1px solid rgba(247,147,26,0.35)',
            color: '#F7F7F7',
            outline: 'none',
          }}
        />
        <button
          onClick={() => pin.length === 6 && onJoin(pin)}
          disabled={pin.length !== 6}
          className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-40"
          style={{ border: '2px solid #F7931A', background: '#0A0A0A', color: '#F7931A' }}
          onMouseEnter={e => { if (pin.length === 6) e.currentTarget.style.background = 'rgba(247,147,26,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}
        >
          ⚡ UNIRSE A LA SESIÓN
        </button>
      </div>
    </div>
  );
}

export default App;
