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
