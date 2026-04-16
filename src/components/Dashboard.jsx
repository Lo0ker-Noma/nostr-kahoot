import React, { useState, useEffect } from 'react';
import { useQuizStore } from '../store/quizStore';

export function Dashboard({ onCreateClick, onHostQuiz, onSoloQuiz, onJoinSession }) {
  const { quizzes, loadQuizzesFromNostr } = useQuizStore();
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    loadQuizzesFromNostr();
  }, []);

  const quizMeta = {
    'quiz-nostr-identity': { emoji: '🔑', color: '#B4F953' },
    'quiz-la-crypta':      { emoji: '🏴‍☠️', color: '#F7931A' },
    'quiz-bitcoin':        { emoji: '₿',   color: '#F7931A' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2
          className="text-2xl font-bold font-mono tracking-widest uppercase"
          style={{ color: '#B4F953', textShadow: '0 0 6px rgba(180,249,83,0.5)' }}
        >
          &gt; DASHBOARD
        </h2>
        <p className="text-xs font-mono text-gray-500">
          [ SELECCIONA UN QUIZ · INICIA COMO HOST O ÚNETE A UNA SESIÓN ]
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onCreateClick}
          className="font-mono font-bold py-5 text-sm tracking-widest uppercase transition-all text-left px-6"
          style={{ border: '2px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(180,249,83,0.08)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(180,249,83,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#0A0A0A';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="text-xl mb-1">✏</div>
          <div>CREAR QUIZ</div>
          <div className="text-xs text-gray-600 font-normal mt-1">Publica en Nostr relay</div>
        </button>

        <button
          onClick={onJoinSession}
          className="font-mono font-bold py-5 text-sm tracking-widest uppercase transition-all text-left px-6"
          style={{ border: '2px solid #F7931A', background: '#0A0A0A', color: '#F7931A' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(247,147,26,0.08)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(247,147,26,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#0A0A0A';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="text-xl mb-1">⚡</div>
          <div>UNIRSE CON PIN</div>
          <div className="text-xs text-gray-600 font-normal mt-1">Ingresa el PIN de una sesión activa</div>
        </button>
      </div>

      {/* Quiz list */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: '#B4F953' }}>▶</span>
          <h3 className="text-sm font-bold font-mono tracking-widest uppercase text-white">
            QUIZZES DISPONIBLES ({quizzes.length})
          </h3>
        </div>

        {quizzes.length === 0 ? (
          <div
            className="text-center py-10 font-mono"
            style={{ border: '1px solid rgba(180,249,83,0.15)', background: 'rgba(0,0,0,0.3)' }}
          >
            <p className="text-gray-600 text-xs">[ LOADING QUIZZES... ]</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => {
              const meta = quizMeta[quiz.id] || { emoji: '❓', color: '#B4F953' };
              return (
                <div
                  key={quiz.id}
                  className="p-5 cursor-pointer transition-all"
                  style={{ border: `1px solid ${meta.color}33`, background: 'rgba(0,0,0,0.4)' }}
                  onClick={() => setSelectedQuiz(quiz)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${meta.color}88`;
                    e.currentTarget.style.background = `${meta.color}08`;
                    e.currentTarget.style.boxShadow = `0 0 15px ${meta.color}15`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${meta.color}33`;
                    e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{meta.emoji}</span>
                        <h4 className="font-bold font-mono text-white text-base uppercase tracking-wide">
                          {quiz.title}
                        </h4>
                      </div>
                      <p className="text-gray-500 text-xs font-mono mb-3 ml-10">{quiz.description}</p>
                      <div className="flex gap-6 ml-10 text-xs font-mono">
                        <span style={{ color: meta.color }}>❓ {quiz.questions.length} preguntas</span>
                        <span style={{ color: '#F7931A' }}>⚡ {quiz.participants || 0} jugaron</span>
                      </div>
                    </div>
                    <div
                      className="text-xs font-mono px-3 py-1 flex-shrink-0 ml-4"
                      style={{ border: `1px solid ${meta.color}55`, color: meta.color }}
                    >
                      VER →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quiz detail modal */}
      {selectedQuiz && (() => {
        const meta = quizMeta[selectedQuiz.id] || { emoji: '❓', color: '#B4F953' };
        return (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ background: 'rgba(0,0,0,0.93)' }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedQuiz(null); }}
          >
            <div
              className="max-w-lg w-full relative"
              style={{ border: `2px solid ${meta.color}`, background: '#0A0A0A' }}
            >
              {/* Modal header */}
              <div className="p-6 pb-4" style={{ borderBottom: `1px solid ${meta.color}22` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-gray-600 mb-1">[ QUIZ DETAILS ]</p>
                    <h3
                      className="text-xl font-bold font-mono uppercase tracking-wider"
                      style={{ color: meta.color, textShadow: `0 0 6px ${meta.color}55` }}
                    >
                      {meta.emoji} {selectedQuiz.title}
                    </h3>
                    <p className="text-gray-500 text-xs font-mono mt-1">{selectedQuiz.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedQuiz(null)}
                    className="font-mono text-xs px-2 py-1 transition-all"
                    style={{ border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', background: '#0A0A0A' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}
                  >
                    [X]
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="px-6 py-3 flex gap-6 text-xs font-mono" style={{ borderBottom: `1px solid ${meta.color}15` }}>
                <span style={{ color: meta.color }}>❓ {selectedQuiz.questions.length} preguntas</span>
                <span style={{ color: '#F7931A' }}>⚡ {selectedQuiz.participants || 0} jugaron</span>
              </div>

              {/* Question preview */}
              <div className="p-6 space-y-3">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-gray-600">
                  // PREVIEW — primeras preguntas
                </p>
                <div className="space-y-1">
                  {selectedQuiz.questions.slice(0, 4).map((q, idx) => (
                    <div
                      key={q.id}
                      className="text-xs font-mono text-gray-400 py-1.5"
                      style={{ borderBottom: `1px solid ${meta.color}10` }}
                    >
                      <span style={{ color: '#F7931A' }}>#{idx + 1}</span>{' '}
                      {q.question}
                    </div>
                  ))}
                  {selectedQuiz.questions.length > 4 && (
                    <p className="text-xs font-mono text-gray-600 pt-1">
                      ... +{selectedQuiz.questions.length - 4} más
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-6 pt-2 flex gap-3">
                {/* HOST: creates a live session on Nostr relay */}
                <button
                  onClick={() => { setSelectedQuiz(null); onHostQuiz(selectedQuiz); }}
                  className="flex-1 py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all"
                  style={{ border: `2px solid ${meta.color}`, background: '#0A0A0A', color: meta.color }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${meta.color}12`;
                    e.currentTarget.style.boxShadow = `0 0 20px ${meta.color}40`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#0A0A0A';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  📡 INICIAR PARTIDA
                </button>

                {/* SOLO: play alone, no session */}
                <button
                  onClick={() => { setSelectedQuiz(null); onSoloQuiz(selectedQuiz); }}
                  className="flex-1 py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all"
                  style={{ border: '2px solid rgba(180,249,83,0.3)', background: '#0A0A0A', color: 'rgba(180,249,83,0.6)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(180,249,83,0.5)';
                    e.currentTarget.style.color = '#B4F953';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(180,249,83,0.3)';
                    e.currentTarget.style.color = 'rgba(180,249,83,0.6)';
                  }}
                >
                  👤 JUGAR SOLO
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
