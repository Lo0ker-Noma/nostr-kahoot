import React, { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore, QUESTION_SECONDS, POINTS_PER_CORRECT } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

const BTN_COLORS = ['#B4F953', '#F7931A', '#4FC3F7', '#E91E8C'];
const BTN_LABELS = ['A', 'B', 'C', 'D'];

function Timer({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);
  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);
  const pct = (remaining / QUESTION_SECONDS) * 100;
  const color = remaining > 10 ? '#B4F953' : remaining > 5 ? '#F7931A' : '#FF4444';
  return (
    <div className="flex items-center gap-3">
      <div className="text-3xl font-bold font-mono" style={{ color, textShadow: `0 0 10px ${color}66`, minWidth: '2.5rem', textAlign: 'right' }}>{remaining}</div>
      <div className="flex-1 h-2 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

export function QuizHost({ quiz, onBack }) {
  const {
    createSession, startGame, showResults, nextQuestion, resetGame,
    gameStatus, currentQuestionIndex, pin, players, answerCounts,
    questionResults, leaderboard,
  } = useGameStore();
  const { isReadOnly, user } = useAuthStore();

  const [creating, setCreating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // reset timer on new question

  useEffect(() => {
    if (isReadOnly) return;
    createSession(quiz).then(() => setCreating(false));
    return () => resetGame();
  }, []);

  // Reset timer when new question starts
  useEffect(() => {
    if (gameStatus === 'question') setTimerKey(k => k + 1);
  }, [currentQuestionIndex, gameStatus]);

  const copyPin = () => {
    navigator.clipboard.writeText(pin).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (isReadOnly) return (
    <div className="max-w-xl mx-auto p-8 text-center space-y-4" style={{ border: '2px solid #FF4444', background: '#0A0A0A' }}>
      <p className="font-mono font-bold text-lg uppercase tracking-widest" style={{ color: '#FF4444' }}>NECESITÁS NIP-07 PARA SER HOST</p>
      <p className="text-xs font-mono text-gray-500">Instalá Alby o una extensión NIP-07</p>
      <button onClick={onBack} className="px-6 py-2 font-mono text-xs uppercase" style={{ border: '1px solid #B4F953', color: '#B4F953', background: '#0A0A0A' }}>← VOLVER</button>
    </div>
  );

  if (creating) return (
    <div className="text-center py-16 font-mono animate-pulse" style={{ color: '#B4F953' }}>
      ▶ CREANDO SESIÓN EN NOSTR RELAY...
    </div>
  );

  const joinUrl = `${window.location.origin}?session=${pin}`;
  const playerCount = Object.keys(players).length;
  const question = quiz.questions[currentQuestionIndex];

  // ── LOBBY ──
  if (gameStatus === 'lobby') {
    const playerList = Object.values(players);
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-mono text-gray-600">[ HOST · {user?.name} ]</p>
            <h2
              className="text-2xl font-bold font-mono uppercase tracking-widest glitch-header"
              data-text="SALA DE ESPERA"
              style={{ color: '#B4F953' }}
            >SALA DE ESPERA</h2>
          </div>
          <button onClick={() => { resetGame(); onBack(); }} className="px-3 py-1 font-mono text-xs uppercase" style={{ border: '1px solid rgba(255,68,68,0.4)', color: '#FF4444', background: '#0A0A0A' }}>[X]</button>
        </div>

        {/* PIN */}
        <div className="p-5 text-center space-y-2" style={{ border: '2px solid #B4F953', background: 'rgba(180,249,83,0.04)', boxShadow: '0 0 20px rgba(180,249,83,0.08)' }}>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">// GAME PIN</p>
          <div className="text-6xl font-bold font-mono glitch-digits" data-text={pin} style={{ color: '#B4F953' }}>{pin}</div>
          <button onClick={copyPin} className="font-mono text-xs px-3 py-1" style={{ border: '1px solid rgba(180,249,83,0.4)', color: '#B4F953', background: copied ? 'rgba(180,249,83,0.12)' : '#0A0A0A' }}>
            {copied ? '✓ COPIADO' : '⎘ COPIAR PIN'}
          </button>
        </div>

        {/* QR + Players */}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#F7931A' }}>// SCAN TO JOIN</p>
            <div className="flex justify-center p-3 bg-white"><QRCodeSVG value={joinUrl} size={140} level="H" /></div>
            <p className="text-xs font-mono text-gray-600 text-center">?session={pin}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#B4F953' }}>
              // JUGADORES ({playerCount})
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto" style={{ border: '1px solid rgba(180,249,83,0.15)', background: 'rgba(0,0,0,0.4)', padding: '8px' }}>
              {playerCount === 0 ? (
                <p className="text-xs font-mono text-gray-600 text-center py-4 animate-pulse">Esperando jugadores...</p>
              ) : (
                playerList.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: '1px solid rgba(180,249,83,0.06)' }}>
                    {p.picture
                      ? <img src={p.picture} alt="" className="w-5 h-5 rounded-full" style={{ border: '1px solid rgba(180,249,83,0.3)' }} onError={e => { e.target.style.display='none'; }} />
                      : <div className="w-5 h-5 flex items-center justify-center text-xs" style={{ border: '1px solid rgba(180,249,83,0.3)', color: '#B4F953' }}>⚡</div>
                    }
                    <span className="text-xs font-mono text-white truncate">{p.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <button
          onClick={startGame}
          disabled={playerCount === 0}
          className="w-full py-5 font-mono font-bold text-xl tracking-widest uppercase transition-all disabled:opacity-40"
          style={{ border: '3px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
          onMouseEnter={e => { if (playerCount > 0) { e.currentTarget.style.background = 'rgba(180,249,83,0.1)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(180,249,83,0.4)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          ⚡ INICIAR PARTIDA {playerCount > 0 ? `(${playerCount} jugadores)` : ''}
        </button>
      </div>
    );
  }

  // ── RESULTS ──
  if (gameStatus === 'results' && questionResults) {
    const { correctAnswer, counts, playerResults, leaderboard: lb } = questionResults;
    const total = counts.reduce((a, b) => a + b, 0);
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-mono uppercase" style={{ color: '#B4F953' }}>
            RESULTADOS — Q{currentQuestionIndex + 1}/{quiz.questions.length}
          </h2>
          <span className="text-xs font-mono px-2 py-1" style={{ border: '1px solid rgba(180,249,83,0.3)', color: '#B4F953' }}>PIN: {pin}</span>
        </div>

        {/* Answer bar chart */}
        <div className="grid grid-cols-2 gap-3">
          {question.answers.map((ans, idx) => {
            const count = counts[idx] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isCorrect = idx === correctAnswer;
            const color = isCorrect ? '#B4F953' : BTN_COLORS[idx];
            return (
              <div key={idx} className="p-3 space-y-2" style={{ border: `2px solid ${isCorrect ? '#B4F953' : `${color}44`}`, background: isCorrect ? 'rgba(180,249,83,0.08)' : 'rgba(0,0,0,0.4)' }}>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color }}>[{BTN_LABELS[idx]}] {ans}</span>
                  <span style={{ color }}>{count} ({pct}%)</span>
                </div>
                <div className="w-full h-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                </div>
                {isCorrect && <p className="text-xs font-mono font-bold" style={{ color: '#B4F953' }}>✓ CORRECTA · +{POINTS_PER_CORRECT} pts</p>}
              </div>
            );
          })}
        </div>

        {/* Player results + Leaderboard side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Who got it right */}
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: '#F7931A' }}>// JUGADORES</p>
            <div className="space-y-1 max-h-48 overflow-y-auto" style={{ border: '1px solid rgba(247,147,26,0.2)', background: 'rgba(0,0,0,0.4)', padding: '8px' }}>
              {playerResults.length === 0
                ? <p className="text-xs font-mono text-gray-600 text-center py-2">Sin respuestas</p>
                : playerResults.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5 text-xs font-mono">
                    <span className={p.correct ? 'text-green-400' : p.answered ? 'text-red-400' : 'text-gray-600'}>
                      {p.correct ? '✓' : p.answered ? '✕' : '–'} {p.name}
                    </span>
                    <span style={{ color: p.correct ? '#B4F953' : '#555' }}>{p.correct ? `+${POINTS_PER_CORRECT}` : '0'}</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: '#B4F953' }}>// RANKING</p>
            <div className="space-y-1 max-h-48 overflow-y-auto" style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(0,0,0,0.4)', padding: '8px' }}>
              {lb.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 text-xs font-mono">
                  <span style={{ color: i === 0 ? '#F7931A' : i === 1 ? '#B4F953' : '#555', minWidth: '1.2rem' }}>
                    {i === 0 ? '🏆' : i === 1 ? '⚡' : `#${i+1}`}
                  </span>
                  <span className="flex-1 text-white truncate">{p.name}</span>
                  <span style={{ color: '#F7931A' }}>{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={nextQuestion}
          className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all"
          style={{ border: '3px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,249,83,0.1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(180,249,83,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {currentQuestionIndex < quiz.questions.length - 1 ? '→ SIGUIENTE PREGUNTA' : '✓ VER RESULTADO FINAL'}
        </button>
      </div>
    );
  }

  // ── FINISHED ──
  if (gameStatus === 'finished') {
    return (
      <div className="max-w-xl mx-auto text-center space-y-5">
        <div className="p-8 space-y-5" style={{ border: '2px solid #B4F953', background: '#0A0A0A' }}>
          <h2
            className="text-3xl font-bold font-mono uppercase tracking-widest glitch-header"
            data-text="¡QUIZ TERMINADO!"
            style={{ color: '#B4F953' }}
          >¡QUIZ TERMINADO!</h2>
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: '#F7931A' }}>// RANKING FINAL</p>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2 font-mono text-sm" style={{ border: `1px solid ${i < 3 ? 'rgba(247,147,26,0.3)' : 'rgba(180,249,83,0.1)'}`, background: i === 0 ? 'rgba(247,147,26,0.08)' : 'rgba(0,0,0,0.4)' }}>
                  <span className="font-bold" style={{ color: i === 0 ? '#F7931A' : i === 1 ? '#B4F953' : '#555', minWidth: '2rem' }}>
                    {i === 0 ? '🏆' : i === 1 ? '⚡' : i === 2 ? '🔑' : `#${i+1}`}
                  </span>
                  {p.picture && <img src={p.picture} alt="" className="w-6 h-6 rounded-full" style={{ border: '1px solid rgba(180,249,83,0.3)' }} onError={e => { e.target.style.display='none'; }} />}
                  <span className="flex-1 text-white text-left truncate">{p.name}</span>
                  <span className="font-bold" style={{ color: '#F7931A' }}>{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => { resetGame(); onBack(); }} className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase" style={{ border: '2px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}>
            ← VOLVER AL DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  // ── QUESTION ──
  const answeredCount = Object.values(players).filter(p => p.answers.find(a => a.q === currentQuestionIndex)).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-mono text-gray-600">[ HOST · {quiz.title} · PIN: {pin} ]</p>
          <h2 className="text-xl font-bold font-mono uppercase" style={{ color: '#B4F953' }}>
            PREGUNTA {currentQuestionIndex + 1} / {quiz.questions.length}
          </h2>
        </div>
        <div className="text-xs font-mono text-right">
          <p style={{ color: '#F7931A' }}>{answeredCount}/{playerCount} respondieron</p>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5" style={{ background: 'rgba(180,249,83,0.08)' }}>
        <div className="h-full" style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`, background: '#B4F953' }} />
      </div>

      {/* Timer */}
      <div className="px-4">
        <Timer key={timerKey} seconds={QUESTION_SECONDS} onExpire={showResults} />
      </div>

      {/* Question */}
      <div className="p-5" style={{ border: '2px solid rgba(180,249,83,0.3)', background: 'rgba(0,0,0,0.6)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono px-2 py-0.5" style={{ border: `1px solid ${question.difficulty === 'easy' ? '#B4F953' : question.difficulty === 'medium' ? '#F7931A' : '#FF4444'}`, color: question.difficulty === 'easy' ? '#B4F953' : question.difficulty === 'medium' ? '#F7931A' : '#FF4444' }}>
            {question.difficulty.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-gray-600">📡 enviada a todos los jugadores</span>
        </div>
        <h3 className="text-2xl font-bold font-mono text-white leading-snug">{question.question}</h3>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {question.answers.map((ans, idx) => {
            const color = BTN_COLORS[idx];
            const count = answerCounts[idx] || 0;
            return (
              <div key={idx} className="p-3 font-mono text-sm" style={{ border: `2px solid ${color}44`, background: 'rgba(0,0,0,0.4)', color }}>
                <div className="flex justify-between">
                  <span><span className="font-bold">[{BTN_LABELS[idx]}]</span> {ans}</span>
                  <span className="font-bold">{count}</span>
                </div>
                {count > 0 && (
                  <div className="mt-1 h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full" style={{ width: `${playerCount > 0 ? (count/playerCount)*100 : 0}%`, background: color }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center justify-center font-mono text-xs text-gray-600 p-3" style={{ border: '1px solid rgba(180,249,83,0.1)' }}>
          ⏱ El timer avanza automáticamente a resultados
        </div>
        <button
          onClick={showResults}
          className="flex-1 py-3 font-mono font-bold text-sm tracking-widest uppercase transition-all"
          style={{ border: '3px solid #F7931A', background: '#0A0A0A', color: '#F7931A' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,147,26,0.1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(247,147,26,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          ⚡ FORZAR RESULTADOS
        </button>
      </div>
    </div>
  );
}
