import React, { useState, useEffect } from 'react';
import { useQuizStore } from '../store/quizStore';
import { QRCodeSVG } from 'qrcode.react';

export function Dashboard({ onCreateClick, onGameClick }) {
  const { quizzes, loadQuizzesFromNostr } = useQuizStore();
  const [sharedQuiz, setSharedQuiz] = useState(null);

  useEffect(() => {
    loadQuizzesFromNostr();
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2
          className="text-2xl font-bold font-mono tracking-widest uppercase"
          style={{ color: '#B4F953', textShadow: '0 0 6px rgba(180,249,83,0.5)' }}
        >
          &gt; DASHBOARD
        </h2>
        <p className="text-xs font-mono text-gray-500">
          [ CREATE OR JOIN DECENTRALIZED QUIZZES ON NOSTR ]
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onCreateClick}
          className="font-mono font-bold py-6 text-sm tracking-widest uppercase transition-all text-left px-6 hover:shadow-lg"
          style={{ border: '2px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}
        >
          <div className="text-2xl mb-2">&#9998;</div>
          <div>CREAR QUIZ</div>
          <div className="text-xs text-gray-500 font-normal mt-1">Publica en Nostr</div>
        </button>

        <button
          onClick={onGameClick}
          className="font-mono font-bold py-6 text-sm tracking-widest uppercase transition-all text-left px-6 hover:shadow-lg"
          style={{ border: '2px solid #F7931A', background: '#0A0A0A', color: '#F7931A' }}
        >
          <div className="text-2xl mb-2">&#9889;</div>
          <div>JUGAR QUIZ</div>
          <div className="text-xs text-gray-500 font-normal mt-1">Unete con ID o QR</div>
        </button>
      </div>

      <div className="p-5" style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: '#B4F953' }}>&#9654;</span>
          <h3 className="text-sm font-bold font-mono tracking-widest uppercase text-white">
            QUIZZES RECIENTES
          </h3>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-8 font-mono">
            <p className="text-gray-600 text-xs">[ NO QUIZ DATA IN NOSTR RELAY ]</p>
            <p className="text-gray-700 text-xs mt-1">Create one to broadcast &gt;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-4 cursor-pointer transition-all hover:shadow-md"
                style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(180,249,83,0.03)' }}
                onClick={() => setSharedQuiz(quiz)}
              >
                <h4 className="font-bold font-mono text-white text-sm mb-1 uppercase">{quiz.title}</h4>
                <p className="text-gray-500 text-xs font-mono mb-3">{quiz.description}</p>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span style={{ color: '#B4F953' }}>{quiz.questions.length} Q</span>
                  <span style={{ color: '#F7931A' }}>{quiz.participants || 0} PLAYERS</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sharedQuiz && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full p-8 space-y-5" style={{ border: '2px solid #B4F953', background: '#0A0A0A' }}>
            <div>
              <p className="text-xs font-mono text-gray-500">[ QUIZ BROADCAST ]</p>
              <h3 className="text-lg font-bold font-mono uppercase" style={{ color: '#B4F953' }}>
                {sharedQuiz.title}
              </h3>
            </div>
            <p className="text-gray-500 text-xs font-mono">{sharedQuiz.description}</p>
            <div className="flex justify-center p-4 bg-white">
              <QRCodeSVG
                value={`https://nostr-kahoot-git-main-lo0ker-nomas-projects.vercel.app/?quiz=${sharedQuiz.id}`}
                size={180}
              />
            </div>
            <p className="text-xs font-mono text-gray-600 text-center">&gt; SCAN QR TO JOIN THIS SESSION</p>
            <button
              onClick={() => setSharedQuiz(null)}
              className="w-full py-3 font-mono font-bold text-sm tracking-widest uppercase transition-all"
              style={{ border: '2px solid rgba(247,147,26,0.5)', background: '#0A0A0A', color: '#F7931A' }}
            >
              CERRAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
