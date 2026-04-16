import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

export function QuizHost({ quiz, onBack }) {
  const {
    createSession, startGame, nextQuestion, resetGame,
    gameStatus, currentQuestionIndex, pin,
  } = useGameStore();
  const { isReadOnly, user } = useAuthStore();

  const [creating, setCreating] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isReadOnly) return;
    (async () => {
      await createSession(quiz);
      setCreating(false);
    })();
    return () => resetGame();
  }, []);

  // Reset showAnswer when question changes
  useEffect(() => {
    setShowAnswer(false);
  }, [currentQuestionIndex]);

  const copyPin = () => {
    navigator.clipboard.writeText(pin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── No NIP-07 ──
  if (isReadOnly) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4" style={{ border: '2px solid #FF4444', background: '#0A0A0A' }}>
        <p className="text-xs font-mono text-gray-500">[ ERROR ]</p>
        <h3 className="text-lg font-bold font-mono uppercase tracking-widest" style={{ color: '#FF4444' }}>
          NECESITÁS NIP-07 PARA SER HOST
        </h3>
        <p className="text-xs font-mono text-gray-500">
          Para crear una sesión en vivo necesitás firmar eventos Nostr.<br />
          Instalá Alby o una extensión NIP-07 y logueate con ella.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2 font-mono text-xs uppercase tracking-widest transition-all"
          style={{ border: '1px solid #B4F953', color: '#B4F953', background: '#0A0A0A' }}
        >
          ← VOLVER
        </button>
      </div>
    );
  }

  // ── Creating session ──
  if (creating) {
    return (
      <div className="text-center py-16 font-mono">
        <div className="text-2xl animate-pulse" style={{ color: '#B4F953' }}>▶ CREANDO SESIÓN EN NOSTR RELAY...</div>
        <p className="text-xs text-gray-600 mt-3">Firmando evento kind:30078 con NIP-07</p>
      </div>
    );
  }

  const joinUrl = `${window.location.origin}?session=${pin}`;
  const question = quiz.questions[currentQuestionIndex];
  const btnColors = ['#B4F953', '#F7931A', '#4FC3F7', '#E91E8C'];
  const btnLabels = ['A', 'B', 'C', 'D'];

  // ── LOBBY ──
  if (gameStatus === 'lobby') {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-mono text-gray-600">[ HOST MODE · {user?.name} ]</p>
            <h2
              className="text-2xl font-bold font-mono uppercase tracking-widest"
              style={{ color: '#B4F953', textShadow: '0 0 8px rgba(180,249,83,0.5)' }}
            >
              SALA DE ESPERA
            </h2>
          </div>
          <button
            onClick={() => { resetGame(); onBack(); }}
            className="px-3 py-1 font-mono text-xs uppercase tracking-widest"
            style={{ border: '1px solid rgba(255,68,68,0.4)', color: '#FF4444', background: '#0A0A0A' }}
          >
            [X] CANCELAR
          </button>
        </div>

        {/* PIN big display */}
        <div
          className="p-6 text-center space-y-3"
          style={{ border: '2px solid #B4F953', background: 'rgba(180,249,83,0.04)', boxShadow: '0 0 30px rgba(180,249,83,0.1)' }}
        >
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500">// GAME PIN — comparte con los jugadores</p>
          <div
            className="text-7xl font-bold font-mono tracking-[0.3em]"
            style={{ color: '#B4F953', textShadow: '0 0 25px rgba(180,249,83,0.7)' }}
          >
            {pin}
          </div>
          <button
            onClick={copyPin}
            className="font-mono text-xs px-4 py-1.5 transition-all"
            style={{
              border: '1px solid rgba(180,249,83,0.5)',
              background: copied ? 'rgba(180,249,83,0.15)' : '#0A0A0A',
              color: '#B4F953',
            }}
          >
            {copied ? '✓ COPIADO' : '⎘ COPIAR PIN'}
          </button>
        </div>

        {/* QR + info */}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#F7931A' }}>
              // SCAN TO JOIN
            </p>
            <div className="flex justify-center p-4 bg-white">
              <QRCodeSVG value={joinUrl} size={150} level="H" includeMargin={false} />
            </div>
            <p className="text-xs font-mono text-gray-600 text-center">
              nostr-kahoot.vercel.app?session={pin}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#B4F953' }}>
              // QUIZ
            </p>
            <div className="p-3 space-y-1 text-xs font-mono" style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(0,0,0,0.4)' }}>
              <p className="text-white font-bold uppercase">{quiz.title}</p>
              <p className="text-gray-500">{quiz.description}</p>
              <p style={{ color: '#B4F953' }}>❓ {quiz.questions.length} preguntas</p>
            </div>
            <div className="p-3 text-xs font-mono space-y-1" style={{ border: '1px solid rgba(247,147,26,0.2)', background: 'rgba(0,0,0,0.4)' }}>
              <p style={{ color: '#F7931A' }}>📡 Sesión publicada en Nostr</p>
              <p className="text-gray-600">Los jugadores escanean el QR y esperan en el lobby</p>
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startGame}
          className="w-full py-5 font-mono font-bold text-xl tracking-widest uppercase transition-all"
          style={{ border: '3px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(180,249,83,0.1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(180,249,83,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#0A0A0A';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ⚡ INICIAR PARTIDA
        </button>
      </div>
    );
  }

  // ── FINISHED ──
  if (gameStatus === 'finished') {
    return (
      <div className="max-w-xl mx-auto text-center space-y-5">
        <div className="p-8 space-y-4" style={{ border: '2px solid #B4F953', background: '#0A0A0A' }}>
          <p className="text-xs font-mono text-gray-500">[ SESSION COMPLETE ]</p>
          <h2
            className="text-3xl font-bold font-mono uppercase tracking-widest"
            style={{ color: '#B4F953', textShadow: '0 0 15px rgba(180,249,83,0.6)' }}
          >
            ¡QUIZ TERMINADO!
          </h2>
          <p className="text-sm font-mono text-gray-400">
            {quiz.questions.length} preguntas completadas · PIN: {pin}
          </p>
          <p className="text-xs font-mono text-gray-600">
            Los jugadores ven su puntaje final en su pantalla
          </p>
          <button
            onClick={() => { resetGame(); onBack(); }}
            className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all"
            style={{ border: '2px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,249,83,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}
          >
            ← VOLVER AL DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  // ── QUESTION CONTROL ──
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-mono text-gray-600">[ HOST CONTROL · {quiz.title} · PIN: {pin} ]</p>
          <h2 className="text-xl font-bold font-mono uppercase tracking-wider" style={{ color: '#B4F953' }}>
            PREGUNTA {currentQuestionIndex + 1} / {quiz.questions.length}
          </h2>
        </div>
        <div
          className="text-xs font-mono px-3 py-1.5 font-bold tracking-widest"
          style={{ border: '1px solid rgba(180,249,83,0.4)', color: '#B4F953', background: 'rgba(180,249,83,0.05)' }}
        >
          PIN: {pin}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5" style={{ background: 'rgba(180,249,83,0.1)', border: '1px solid rgba(180,249,83,0.05)' }}>
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
            background: '#B4F953',
            boxShadow: '0 0 8px rgba(180,249,83,0.6)',
          }}
        />
      </div>

      {/* Question display */}
      <div className="p-6 space-y-4" style={{ border: '2px solid rgba(180,249,83,0.35)', background: 'rgba(0,0,0,0.6)' }}>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-mono px-2 py-0.5 font-bold"
            style={{
              border: `1px solid ${question.difficulty === 'easy' ? '#B4F953' : question.difficulty === 'medium' ? '#F7931A' : '#FF4444'}`,
              color: question.difficulty === 'easy' ? '#B4F953' : question.difficulty === 'medium' ? '#F7931A' : '#FF4444',
            }}
          >
            {question.difficulty.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-gray-600">
            📡 Enviada a todos los jugadores vía Nostr relay
          </span>
        </div>
        <h3 className="text-2xl font-bold font-mono text-white leading-snug">
          {question.question}
        </h3>

        {/* Answer grid */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {question.answers.map((answer, idx) => {
            const color = btnColors[idx];
            const isCorrect = idx === question.correct;
            return (
              <div
                key={idx}
                className="p-3 font-mono text-sm transition-all"
                style={{
                  border: `2px solid ${showAnswer && isCorrect ? '#B4F953' : `${color}44`}`,
                  background: showAnswer && isCorrect ? 'rgba(180,249,83,0.12)' : 'rgba(0,0,0,0.4)',
                  color: showAnswer && isCorrect ? '#B4F953' : color,
                }}
              >
                <span className="font-bold mr-2 opacity-70">[{btnLabels[idx]}]</span>
                {answer}
                {showAnswer && isCorrect && (
                  <span className="ml-2 text-xs font-bold">✓ CORRECTA</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Host controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex-1 py-3 font-mono font-bold text-sm tracking-widest uppercase transition-all"
          style={{
            border: `2px solid ${showAnswer ? '#FF4444' : '#F7931A'}`,
            background: '#0A0A0A',
            color: showAnswer ? '#FF4444' : '#F7931A',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = showAnswer ? 'rgba(255,68,68,0.1)' : 'rgba(247,147,26,0.1)';
          }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}
        >
          {showAnswer ? '🙈 OCULTAR' : '👁 REVELAR RESPUESTA'}
        </button>

        <button
          onClick={() => nextQuestion()}
          className="flex-1 py-3 font-mono font-bold text-sm tracking-widest uppercase transition-all"
          style={{ border: '3px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(180,249,83,0.1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(180,249,83,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#0A0A0A';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {currentQuestionIndex < quiz.questions.length - 1
            ? '→ SIGUIENTE PREGUNTA'
            : '✓ TERMINAR QUIZ'}
        </button>
      </div>
    </div>
  );
}
