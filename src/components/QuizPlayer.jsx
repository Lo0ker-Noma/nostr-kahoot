import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, POINTS_PER_CORRECT, QUESTION_SECONDS } from '../store/gameStore';
import { fetchNostrProfile } from '../lib/nostrRelay';

// ── Timer countdown ──
function Timer({ timerKey, onExpire }) {
  const [remaining, setRemaining] = useState(QUESTION_SECONDS);
  useEffect(() => {
    setRemaining(QUESTION_SECONDS);
  }, [timerKey]);
  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);
  const pct = (remaining / QUESTION_SECONDS) * 100;
  const color = remaining > 10 ? '#B4F953' : remaining > 5 ? '#F7931A' : '#FF4444';
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-9 h-9 flex items-center justify-center font-mono font-bold text-sm flex-shrink-0"
        style={{ color, border: `2px solid ${color}`, background: `${color}15`, transition: 'all 0.3s' }}
      >
        {remaining}
      </div>
      <div className="flex-1 h-1 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded transition-all duration-1000"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
    </div>
  );
}

const btnColors = ['#B4F953', '#F7931A', '#4FC3F7', '#E91E8C'];
const btnLabels = ['A', 'B', 'C', 'D'];

export function QuizPlayer({ sessionPin }) {
  const {
    gameStatus, currentQuestion, currentQuestionIndex,
    myScore, myAnswers, submitAnswer,
    subscribeToSession, setPlayerName, resetGame,
    publishJoin, players, questionResults, leaderboard,
  } = useGameStore();

  const [nameInput, setNameInput] = useState('');
  const [npubInput, setNpubInput] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [joined, setJoined] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);

  const unsubRef = useRef(null);

  // Reset per-question state on new question
  useEffect(() => {
    if (gameStatus === 'question') {
      setAnswered(false);
      setSelectedAnswer(null);
      setTimerExpired(false);
      setTimerKey(k => k + 1);
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
    const picture = playerProfile?.picture || null;
    setPlayerName(name, picture);
    publishJoin(sessionPin, name, picture);
    const unsub = subscribeToSession(sessionPin);
    unsubRef.current = unsub;
    setJoined(true);
  };

  const handleAnswer = (idx) => {
    if (answered || timerExpired || !currentQuestion) return;
    const isCorrect = idx === currentQuestion.correct;
    setSelectedAnswer(idx);
    setAnswered(true);
    submitAnswer(currentQuestionIndex, idx, isCorrect);
  };

  const handleTimerExpire = () => {
    setTimerExpired(true);
    if (!answered) {
      // Time's up — register as no-answer (wrong)
      setAnswered(true);
    }
  };

  const playerName = useGameStore.getState().playerName;
  const playerPicture = useGameStore.getState().playerPicture;
  const playerList = Object.values(players);

  // ──────────────────────────────
  // JOIN SCREEN
  // ──────────────────────────────
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
            <div className="text-5xl neon-bolt">⚡</div>
            <h1
              className="text-2xl font-bold font-mono tracking-widest uppercase glitch-title"
              data-text="NOSTR KAHOOT"
            >
              NOSTR KAHOOT
            </h1>
            <p className="text-xs font-mono text-gray-600">[ SESIÓN: {sessionPin} ]</p>
          </div>

          <div
            className="p-6 space-y-5"
            style={{ border: '2px solid rgba(180,249,83,0.35)', background: 'rgba(0,0,0,0.6)' }}
          >
            {/* Nostr identity (optional) */}
            <div className="space-y-2">
              <label
                className="block text-xs font-mono font-bold uppercase tracking-widest"
                style={{ color: '#F7931A' }}
              >
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
                <div
                  className="flex items-center gap-3 p-2"
                  style={{ border: '1px solid rgba(180,249,83,0.3)', background: 'rgba(180,249,83,0.05)' }}
                >
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
              <label
                className="block text-xs font-mono font-bold uppercase tracking-widest"
                style={{ color: '#B4F953' }}
              >
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
                e.currentTarget.style.boxShadow = '0 0 20px rgba(180,249,83,0.3)';
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

  // ──────────────────────────────
  // LOBBY / WAITING ROOM
  // ──────────────────────────────
  if (gameStatus === 'idle' || gameStatus === 'lobby') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0A0A0A', backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(180,249,83,0.03) 0%, transparent 60%)' }}
      >
        <div className="text-center space-y-6 p-6 w-full max-w-sm">
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
              <div
                className="w-16 h-16 flex items-center justify-center text-2xl"
                style={{ border: '2px solid rgba(180,249,83,0.4)', background: 'rgba(180,249,83,0.08)' }}
              >₿</div>
            )}
            <p className="font-mono font-bold text-lg tracking-wide" style={{ color: '#B4F953' }}>{playerName}</p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="text-4xl neon-bolt">⚡</div>
            <h2
              className="text-xl font-bold font-mono uppercase tracking-widest glitch-header"
              style={{ color: '#B4F953' }}
            >CONECTADO</h2>
            <p className="text-xs font-mono text-gray-500">Esperando que el host inicie la partida...</p>
          </div>

          {/* Live player list */}
          {playerList.length > 0 && (
            <div
              className="space-y-3 p-4"
              style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(180,249,83,0.03)' }}
            >
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                {playerList.length} jugador{playerList.length !== 1 ? 'es' : ''} en sala
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {playerList.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-mono"
                    style={{
                      background: p.name === playerName ? 'rgba(180,249,83,0.15)' : 'rgba(180,249,83,0.06)',
                      border: `1px solid ${p.name === playerName ? 'rgba(180,249,83,0.5)' : 'rgba(180,249,83,0.15)'}`,
                      color: '#B4F953',
                    }}
                  >
                    {p.picture && (
                      <img
                        src={p.picture}
                        alt=""
                        className="w-4 h-4 rounded-full"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span>{p.name}</span>
                    {p.name === playerName && <span className="opacity-50"> ◄</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs font-mono text-gray-700">📡 sesión: {sessionPin} · relay.damus.io</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────
  // RESULTS SCREEN (after each question)
  // ──────────────────────────────
  if (gameStatus === 'results') {
    const myLastAnswer = myAnswers[myAnswers.length - 1];
    const iGotItRight = myLastAnswer?.correct || false;
    const myRank = leaderboard.findIndex(p => p.name === playerName) + 1;
    const results = questionResults || {};
    const counts = results.counts || [0, 0, 0, 0];
    const correctAnswer = results.correctAnswer ?? -1;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
        {/* Top bar */}
        <div
          className="flex justify-between items-center px-4 py-3 text-xs font-mono"
          style={{ borderBottom: '1px solid rgba(180,249,83,0.12)' }}
        >
          <div className="flex items-center gap-2">
            {playerPicture && (
              <img
                src={playerPicture}
                alt=""
                className="w-5 h-5 rounded-full"
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <span style={{ color: '#B4F953' }}>{playerName}</span>
          </div>
          <span style={{ color: '#F7931A' }}>⚡ {myScore} pts</span>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-8">
          {/* My result card */}
          <div
            className="p-4 text-center"
            style={{
              border: `2px solid ${iGotItRight ? '#B4F953' : '#FF4444'}`,
              background: iGotItRight ? 'rgba(180,249,83,0.06)' : 'rgba(255,68,68,0.06)',
            }}
          >
            <p
              className="text-2xl font-bold font-mono tracking-wider"
              style={{ color: iGotItRight ? '#B4F953' : '#FF4444' }}
            >
              {iGotItRight ? '✓ CORRECTO' : '✕ INCORRECTO'}
            </p>
            {iGotItRight && (
              <p className="text-sm font-mono mt-1" style={{ color: '#F7931A' }}>+{POINTS_PER_CORRECT} pts</p>
            )}
          </div>

          {/* Answer breakdown */}
          {counts.some(c => c > 0) && (
            <div style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.4)' }}>
              <p className="text-xs font-mono uppercase tracking-widest text-center py-2 text-gray-500" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                RESPUESTAS
              </p>
              {counts.map((count, idx) => {
                const total = counts.reduce((s, c) => s + c, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const isCorrect = idx === correctAnswer;
                const color = isCorrect ? '#B4F953' : btnColors[idx];
                return (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 text-xs font-mono" style={{ borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span className="w-5 font-bold" style={{ color }}>[{btnLabels[idx]}]</span>
                    <div className="flex-1 h-2 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="w-10 text-right" style={{ color: '#F7F7F7' }}>{pct}%</span>
                    {isCorrect && <span style={{ color: '#B4F953' }}>✓</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div style={{ border: '1px solid rgba(247,147,26,0.3)', background: 'rgba(0,0,0,0.4)' }}>
              <p
                className="text-xs font-mono uppercase tracking-widest text-center py-2"
                style={{ color: '#F7931A', borderBottom: '1px solid rgba(247,147,26,0.2)' }}
              >
                🏆 RANKING ACTUAL
              </p>
              {leaderboard.slice(0, 6).map((p, i) => {
                const isMe = p.name === playerName;
                const medal = i === 0 ? '🏆' : i === 1 ? '⚡' : i === 2 ? '🔑' : `${i + 1}.`;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-mono"
                    style={{
                      background: isMe ? 'rgba(180,249,83,0.08)' : 'transparent',
                      borderBottom: i < leaderboard.slice(0, 6).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                  >
                    <span className="w-6 text-center" style={{ color: '#F7931A' }}>{medal}</span>
                    {p.picture && (
                      <img
                        src={p.picture}
                        alt=""
                        className="w-5 h-5 rounded-full flex-shrink-0"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span
                      className="flex-1 truncate"
                      style={{ color: isMe ? '#B4F953' : '#F7F7F7' }}
                    >
                      {p.name}{isMe ? ' ◄' : ''}
                    </span>
                    <span style={{ color: '#F7931A' }}>{p.score} pts</span>
                  </div>
                );
              })}
              {myRank > 6 && (
                <div
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono"
                  style={{ borderTop: '1px solid rgba(180,249,83,0.15)', background: 'rgba(180,249,83,0.05)' }}
                >
                  <span className="w-6 text-center" style={{ color: '#F7931A' }}>{myRank}.</span>
                  <span className="flex-1" style={{ color: '#B4F953' }}>{playerName} ◄</span>
                  <span style={{ color: '#F7931A' }}>{myScore} pts</span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs font-mono text-gray-600 text-center">Esperando la siguiente pregunta...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────
  // GAME OVER
  // ──────────────────────────────
  if (gameStatus === 'finished') {
    const total = myAnswers.length;
    const correct = myAnswers.filter(a => a.correct).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const myRank = leaderboard.findIndex(p => p.name === playerName) + 1;
    const grade =
      pct >= 80 ? '🏆 LEGEND' :
      pct >= 60 ? '⚡ CYPHERPUNK' :
      pct >= 40 ? '🔑 HODLER' : '📖 LEARNER';

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: '#0A0A0A' }}
      >
        <div className="w-full max-w-sm space-y-4">
          <div
            className="p-6 space-y-5 text-center"
            style={{ border: '2px solid #B4F953', background: '#0A0A0A', boxShadow: '0 0 30px rgba(180,249,83,0.1)' }}
          >
            {/* Identity */}
            <div className="flex flex-col items-center gap-2">
              {playerPicture ? (
                <img
                  src={playerPicture}
                  alt="avatar"
                  className="w-14 h-14 rounded-full"
                  style={{ border: '2px solid rgba(180,249,83,0.5)' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-14 h-14 flex items-center justify-center text-2xl" style={{ border: '2px solid rgba(180,249,83,0.4)', background: 'rgba(180,249,83,0.08)' }}>₿</div>
              )}
              <p className="text-xs font-mono text-gray-500">[ {playerName} ]</p>
            </div>

            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">GAME OVER</p>

            {/* Final score */}
            <div>
              <div
                className="text-6xl font-bold font-mono"
                style={{ color: '#F7931A', textShadow: '0 0 20px rgba(247,147,26,0.6)' }}
              >
                {myScore}
              </div>
              <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-widest">PUNTOS TOTALES</p>
            </div>

            {/* Grade */}
            <div
              className="py-4 space-y-2"
              style={{ border: '1px solid rgba(180,249,83,0.25)', background: 'rgba(180,249,83,0.04)' }}
            >
              <p className="text-xl font-bold font-mono" style={{ color: '#B4F953' }}>{grade}</p>
              <p className="text-sm font-mono text-gray-400">
                {correct} / {total} correctas · {pct}%
              </p>
              {myRank > 0 && (
                <p className="text-xs font-mono" style={{ color: '#F7931A' }}>
                  Posición final: #{myRank}
                </p>
              )}
            </div>

            {/* Final leaderboard */}
            {leaderboard.length > 0 && (
              <div style={{ border: '1px solid rgba(247,147,26,0.2)', background: 'rgba(0,0,0,0.4)' }}>
                <p className="text-xs font-mono uppercase tracking-widest text-center py-2 text-gray-500" style={{ borderBottom: '1px solid rgba(247,147,26,0.15)' }}>
                  RANKING FINAL
                </p>
                {leaderboard.slice(0, 5).map((p, i) => {
                  const isMe = p.name === playerName;
                  const medal = i === 0 ? '🏆' : i === 1 ? '⚡' : i === 2 ? '🔑' : `${i + 1}.`;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-mono"
                      style={{
                        background: isMe ? 'rgba(180,249,83,0.08)' : 'transparent',
                        borderBottom: i < Math.min(leaderboard.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <span className="w-5" style={{ color: '#F7931A' }}>{medal}</span>
                      {p.picture && <img src={p.picture} alt="" className="w-4 h-4 rounded-full" onError={e => { e.target.style.display = 'none'; }} />}
                      <span className="flex-1 truncate" style={{ color: isMe ? '#B4F953' : '#F7F7F7' }}>{p.name}{isMe ? ' ◄' : ''}</span>
                      <span style={{ color: '#F7931A' }}>{p.score} pts</span>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs font-mono text-gray-600">₿ Powered by Nostr Protocol</p>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────
  // QUESTION SCREEN
  // ──────────────────────────────
  if (gameStatus === 'question' && currentQuestion) {
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
            {playerPicture && (
              <img
                src={playerPicture}
                alt=""
                className="w-5 h-5 rounded-full"
                style={{ border: '1px solid rgba(180,249,83,0.4)' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <span style={{ color: '#B4F953' }}>{playerName}</span>
          </div>
          <span className="text-gray-600">Q{currentQuestionIndex + 1}</span>
          <span style={{ color: '#F7931A' }}>⚡ {myScore} pts</span>
        </div>

        {/* Timer */}
        <div className="px-4 pt-3">
          <Timer
            timerKey={timerKey}
            onExpire={handleTimerExpire}
          />
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center px-4 py-4 space-y-4">
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

              if (answered || timerExpired) {
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
                  disabled={answered || timerExpired}
                  className="p-4 font-mono text-sm font-bold text-left transition-all disabled:cursor-default"
                  style={{ border, background: bg, color: textColor, minHeight: '80px' }}
                  onMouseEnter={e => { if (!answered && !timerExpired) e.currentTarget.style.background = `${color}18`; }}
                  onMouseLeave={e => { if (!answered && !timerExpired) e.currentTarget.style.background = `${color}08`; }}
                >
                  <span className="text-xs opacity-50 block mb-1">[{btnLabels[idx]}]</span>
                  <span className="leading-snug">{answer}</span>
                  {(answered || timerExpired) && isCorrect && (
                    <span className="block text-xs mt-1 font-bold">✓ CORRECTO</span>
                  )}
                  {answered && isSelected && !isCorrect && (
                    <span className="block text-xs mt-1 font-bold">✕ INCORRECTO</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback after answering */}
          {(answered || timerExpired) && (
            <div
              className="p-3 text-center"
              style={{
                border: `1px solid ${answered && myAnswers[myAnswers.length - 1]?.correct ? 'rgba(180,249,83,0.4)' : 'rgba(255,68,68,0.4)'}`,
                background: answered && myAnswers[myAnswers.length - 1]?.correct
                  ? 'rgba(180,249,83,0.06)'
                  : 'rgba(255,68,68,0.06)',
              }}
            >
              {timerExpired && !answered ? (
                <p className="font-mono font-bold text-sm" style={{ color: '#FF4444' }}>⏱ TIEMPO AGOTADO</p>
              ) : myAnswers[myAnswers.length - 1]?.correct ? (
                <p className="font-mono font-bold text-sm" style={{ color: '#B4F953' }}>
                  ✓ ¡CORRECTO! +{POINTS_PER_CORRECT} pts
                </p>
              ) : (
                <p className="font-mono font-bold text-sm" style={{ color: '#FF4444' }}>✕ INCORRECTO</p>
              )}
              <p className="text-xs font-mono text-gray-600 mt-1">
                Esperando resultados del host...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback connecting screen
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
      <div className="text-center space-y-4">
        <div className="text-4xl animate-pulse" style={{ color: '#B4F953' }}>⚡</div>
        <p className="font-mono text-gray-600 text-sm animate-pulse">Conectando al relay...</p>
        <p className="font-mono text-gray-700 text-xs">📡 relay.damus.io · sesión {sessionPin}</p>
      </div>
    </div>
  );
}
