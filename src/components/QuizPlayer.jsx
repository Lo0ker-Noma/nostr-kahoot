import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { fetchNostrProfile } from '../lib/nostrRelay';

// Full-screen mobile-optimized player view — no auth required
export function QuizPlayer({ sessionPin }) {
  const {
    gameStatus, currentQuestion, currentQuestionIndex,
    myScore, myAnswers, submitAnswer,
    subscribeToSession, setPlayerName, resetGame,
  } = useGameStore();

  const [nameInput, setNameInput] = useState('');
  const [npubInput, setNpubInput] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [playerProfile, setPlayerProfile] = useState(null); // { name, picture }
  const [joined, setJoined] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const unsubRef = useRef(null);

  // Reset per-question state when a new question arrives
  useEffect(() => {
    if (gameStatus === 'question') {
      setAnswered(false);
      setSelectedAnswer(null);
      setStartTime(Date.now());
    }
  }, [currentQuestionIndex, gameStatus]);

  useEffect(() => {
    return () => {
      unsubRef.current?.();
      resetGame();
    };
  }, []);

  const handleFetchNpub = async () => {
    if (!npubInput.trim()) return;
    setLoadingProfile(true);
    try {
      // Derive hex pubkey from npub (same bech32 logic as authStore)
      const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
      const input = npubInput.trim();
      if (input.startsWith('npub1')) {
        const data = input.slice(5);
        const decoded = [];
        for (const c of data) {
          const idx = CHARSET.indexOf(c);
          if (idx !== -1) decoded.push(idx);
        }
        const payload = decoded.slice(0, decoded.length - 6);
        let bits = 0, value = 0;
        const result = [];
        for (const d of payload) {
          value = (value << 5) | d;
          bits += 5;
          while (bits >= 8) { bits -= 8; result.push((value >> bits) & 0xff); }
        }
        if (result.length === 32) {
          const hex = result.map(b => b.toString(16).padStart(2, '0')).join('');
          const profile = await fetchNostrProfile(hex);
          setPlayerProfile(profile);
          setNameInput(profile.name);
        }
      }
    } catch {}
    setLoadingProfile(false);
  };

  const handleJoin = () => {
    const name = nameInput.trim() || 'Anon';
    setPlayerName(name, playerProfile?.picture || null);
    const unsub = subscribeToSession(sessionPin);
    unsubRef.current = unsub;
    setJoined(true);
  };

  const handleAnswer = (idx) => {
    if (answered || !currentQuestion) return;
    const timeMs = Date.now() - (startTime || Date.now());
    const isCorrect = idx === currentQuestion.correct;
    setSelectedAnswer(idx);
    setAnswered(true);
    submitAnswer(currentQuestionIndex, idx, isCorrect, timeMs);
  };

  const btnColors = ['#B4F953', '#F7931A', '#4FC3F7', '#E91E8C'];
  const btnLabels = ['A', 'B', 'C', 'D'];

  // ── JOIN SCREEN ──
  if (!joined) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: '#0A0A0A',
          backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(180,249,83,0.04) 0%, transparent 60%)',
        }}
      >
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center space-y-1">
            <div className="text-5xl" style={{ color: '#F7931A', textShadow: '0 0 20px rgba(247,147,26,0.5)' }}>₿</div>
            <h1
              className="text-2xl font-bold font-mono tracking-widest uppercase"
              style={{ color: '#B4F953', textShadow: '0 0 10px rgba(180,249,83,0.5)' }}
            >
              NOSTR KAHOOT
            </h1>
            <p className="text-xs font-mono text-gray-600">[ SESIÓN: {sessionPin} ]</p>
          </div>

          <div
            className="p-6 space-y-5"
            style={{ border: '2px solid rgba(180,249,83,0.35)', background: 'rgba(0,0,0,0.6)' }}
          >
            {/* Optional: load from npub */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#F7931A' }}>
                // IDENTIDAD NOSTR (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={npubInput}
                  onChange={e => setNpubInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetchNpub()}
                  placeholder="npub1..."
                  className="flex-1 px-3 py-2 text-xs font-mono"
                  style={{
                    background: '#0A0A0A',
                    border: '1px solid rgba(247,147,26,0.25)',
                    color: '#F7F7F7',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleFetchNpub}
                  disabled={loadingProfile || !npubInput.trim()}
                  className="px-3 py-2 font-mono text-xs uppercase font-bold transition-all disabled:opacity-40"
                  style={{ border: '1px solid #F7931A', color: '#F7931A', background: '#0A0A0A' }}
                >
                  {loadingProfile ? '...' : 'OK'}
                </button>
              </div>
              {playerProfile && (
                <div className="flex items-center gap-3 p-2" style={{ border: '1px solid rgba(180,249,83,0.3)', background: 'rgba(180,249,83,0.05)' }}>
                  {playerProfile.picture && (
                    <img
                      src={playerProfile.picture}
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                      style={{ border: '1px solid rgba(180,249,83,0.4)' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="text-xs font-mono">
                    <p style={{ color: '#B4F953' }}>{playerProfile.name}</p>
                    {playerProfile.nip05 && <p className="text-gray-600">{playerProfile.nip05}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#B4F953' }}>
                // TU NICKNAME
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="SatoshiPlayer42"
                maxLength={20}
                autoFocus={!npubInput}
                className="w-full px-4 py-3 text-sm font-mono"
                style={{
                  background: '#0A0A0A',
                  border: '1px solid rgba(180,249,83,0.3)',
                  color: '#F7F7F7',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleJoin}
              className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all"
              style={{ border: '2px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(180,249,83,0.1)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(180,249,83,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#0A0A0A';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ⚡ UNIRSE AL JUEGO
            </button>
          </div>
        </div>
      </div>
    );
  }

  const playerName = useGameStore.getState().playerName;
  const playerPicture = useGameStore.getState().playerPicture;

  // ── WAITING ROOM ──
  if (gameStatus === 'idle' || gameStatus === 'lobby') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0A0A0A', backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(180,249,83,0.03) 0%, transparent 60%)' }}
      >
        <div className="text-center space-y-8 p-8">
          {/* Player identity */}
          <div className="flex flex-col items-center gap-3">
            {playerPicture ? (
              <img
                src={playerPicture}
                alt="avatar"
                className="w-16 h-16 rounded-full"
                style={{ border: '2px solid rgba(180,249,83,0.5)', boxShadow: '0 0 15px rgba(180,249,83,0.2)' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center text-2xl" style={{ border: '2px solid rgba(180,249,83,0.4)', background: 'rgba(180,249,83,0.08)' }}>
                ₿
              </div>
            )}
            <p className="font-mono font-bold text-lg tracking-wide" style={{ color: '#B4F953' }}>{playerName}</p>
          </div>

          <div className="space-y-2">
            <div className="text-5xl animate-pulse">⚡</div>
            <h2
              className="text-2xl font-bold font-mono uppercase tracking-widest"
              style={{ color: '#B4F953' }}
            >
              CONECTADO
            </h2>
            <p className="text-sm font-mono text-gray-500">Esperando que el host inicie la partida...</p>
          </div>

          <div className="space-y-1 text-xs font-mono text-gray-700">
            <p>📡 Suscripto a sesión: {sessionPin}</p>
            <p>📡 Nostr relay: relay.damus.io</p>
          </div>
        </div>
      </div>
    );
  }

  // ── FINISHED ──
  if (gameStatus === 'finished') {
    const total = myAnswers.length;
    const correct = myAnswers.filter(a => a.correct).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const grade =
      pct >= 80 ? '🏆 LEGEND' :
      pct >= 60 ? '⚡ CYPHERPUNK' :
      pct >= 40 ? '🔑 HODLER' : '📖 LEARNER';

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: '#0A0A0A' }}
      >
        <div className="w-full max-w-sm space-y-4 text-center">
          <div
            className="p-8 space-y-5"
            style={{ border: '2px solid #B4F953', background: '#0A0A0A', boxShadow: '0 0 30px rgba(180,249,83,0.1)' }}
          >
            {/* Identity */}
            <div className="flex flex-col items-center gap-2">
              {playerPicture && (
                <img
                  src={playerPicture}
                  alt="avatar"
                  className="w-14 h-14 rounded-full"
                  style={{ border: '2px solid rgba(180,249,83,0.5)' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <p className="text-xs font-mono text-gray-500">[ {playerName} ]</p>
            </div>

            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">GAME OVER</p>

            <div
              className="text-6xl font-bold font-mono"
              style={{ color: '#F7931A', textShadow: '0 0 20px rgba(247,147,26,0.6)' }}
            >
              {myScore.toLocaleString()}
            </div>
            <p className="text-sm font-mono text-gray-400 uppercase tracking-widest">PUNTOS</p>

            <div
              className="py-5 space-y-2"
              style={{ border: '1px solid rgba(180,249,83,0.25)', background: 'rgba(180,249,83,0.04)' }}
            >
              <p className="text-2xl font-bold font-mono" style={{ color: '#B4F953' }}>{grade}</p>
              <p className="text-sm font-mono text-gray-400">
                {correct} / {total} correctas · {pct}%
              </p>
            </div>

            <p className="text-xs font-mono text-gray-600">
              ₿ Powered by Nostr Protocol · relay.damus.io
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION ──
  if (gameStatus === 'question' && currentQuestion) {
    const lastAnswer = myAnswers[myAnswers.length - 1];
    const justAnswered = answered && lastAnswer?.questionIndex === currentQuestionIndex;
    const earnedPoints = justAnswered && lastAnswer?.correct
      ? Math.max(500, Math.round(1000 - ((Date.now() - startTime) / 20000) * 500))
      : 0;

    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: '#0A0A0A',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(180,249,83,0.04) 0%, transparent 50%)',
        }}
      >
        {/* Status bar */}
        <div
          className="flex justify-between items-center px-4 py-3 text-xs font-mono"
          style={{ borderBottom: '1px solid rgba(180,249,83,0.12)' }}
        >
          <div className="flex items-center gap-2">
            {playerPicture ? (
              <img
                src={playerPicture}
                alt="avatar"
                className="w-5 h-5 rounded-full"
                style={{ border: '1px solid rgba(180,249,83,0.4)' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : null}
            <span style={{ color: '#B4F953' }}>{playerName}</span>
          </div>
          <span className="text-gray-600">Q{currentQuestionIndex + 1}</span>
          <span style={{ color: '#F7931A' }}>⚡ {myScore.toLocaleString()} pts</span>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center px-4 py-6 space-y-5">
          <div
            className="p-5 text-center"
            style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(0,0,0,0.6)' }}
          >
            <p className="font-mono font-bold text-white text-lg leading-snug">
              {currentQuestion.question}
            </p>
          </div>

          {/* Answer buttons */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.answers.map((answer, idx) => {
              const color = btnColors[idx];
              const isCorrect = idx === currentQuestion.correct;
              const isSelected = selectedAnswer === idx;

              let border = `2px solid ${color}55`;
              let bg = `${color}08`;
              let textColor = color;

              if (answered) {
                if (isCorrect) {
                  border = '2px solid #B4F953';
                  bg = 'rgba(180,249,83,0.15)';
                  textColor = '#B4F953';
                } else if (isSelected) {
                  border = '2px solid #FF4444';
                  bg = 'rgba(255,68,68,0.12)';
                  textColor = '#FF4444';
                } else {
                  border = '1px solid rgba(255,255,255,0.06)';
                  bg = 'rgba(0,0,0,0.4)';
                  textColor = '#333';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className="p-4 font-mono text-sm font-bold text-left transition-all disabled:cursor-default"
                  style={{ border, background: bg, color: textColor, minHeight: '80px' }}
                  onMouseEnter={e => { if (!answered) e.currentTarget.style.background = `${color}18`; }}
                  onMouseLeave={e => { if (!answered) e.currentTarget.style.background = `${color}08`; }}
                >
                  <span className="text-xs opacity-50 block mb-1">[{btnLabels[idx]}]</span>
                  <span className="leading-snug">{answer}</span>
                  {answered && isCorrect && <span className="block text-xs mt-1 font-bold">✓ CORRECTO</span>}
                  {answered && isSelected && !isCorrect && <span className="block text-xs mt-1 font-bold">✕ INCORRECTO</span>}
                </button>
              );
            })}
          </div>

          {/* Feedback after answering */}
          {answered && (
            <div
              className="p-4 text-center"
              style={{
                border: `1px solid ${justAnswered && lastAnswer?.correct ? 'rgba(180,249,83,0.5)' : 'rgba(255,68,68,0.5)'}`,
                background: justAnswered && lastAnswer?.correct ? 'rgba(180,249,83,0.07)' : 'rgba(255,68,68,0.07)',
              }}
            >
              {justAnswered && lastAnswer?.correct ? (
                <p className="font-mono font-bold" style={{ color: '#B4F953' }}>
                  ✓ ¡CORRECTO! +{Math.max(500, Math.round(1000 - ((Date.now() - startTime) / 20000) * 500))} pts
                </p>
              ) : (
                <p className="font-mono font-bold" style={{ color: '#FF4444' }}>✕ INCORRECTO</p>
              )}
              <p className="text-xs font-mono text-gray-600 mt-1">
                Esperando la siguiente pregunta del host...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
      <p className="font-mono text-gray-600 animate-pulse">Conectando al relay...</p>
    </div>
  );
}
