import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { QuizCreator } from './components/QuizCreator';
import { QuizGame } from './components/QuizGame';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const [view, setView] = useState('dashboard'); // dashboard, create, game

  useEffect(() => {
    // Intenta reconectar si hay sesión previa
    useAuthStore.getState().checkExistingAuth();
  }, []);

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <nav className="bg-black/40 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h1 className="text-xl font-bold text-white">Nostr Kahoot</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-purple-300 text-sm">{user?.name || 'Anónimo'}</span>
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-700 rounded-lg text-white transition"
            >
              Desconectar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'dashboard' && <Dashboard onCreateClick={() => setView('create')} onGameClick={() => setView('game')} />}
        {view === 'create' && <QuizCreator onBack={() => setView('dashboard')} />}
        {view === 'game' && <QuizGame onBack={() => setView('dashboard')} />}
      </main>
    </div>
  );
}

export default App;
