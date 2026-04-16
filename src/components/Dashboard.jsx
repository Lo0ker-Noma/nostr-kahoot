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
