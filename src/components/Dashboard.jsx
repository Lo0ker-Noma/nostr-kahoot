import React, { useState, useEffect } from 'react';
import { useQuizStore } from '../store/quizStore';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export function Dashboard({ onCreateClick, onGameClick }) {
  const { quizzes, loadQuizzesFromNostr } = useQuizStore();
  const [sharedQuiz, setSharedQuiz] = useState(null);

  useEffect(() => {
    loadQuizzesFromNostr();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-white">Bienvenido al Hackathon</h2>
        <p className="text-purple-300">Crear o jugar cuestionarios en Nostr</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onCreateClick}
          className="bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 rounded-xl transition transform hover:scale-105 active:scale-95 text-lg"
        >
          ✏️ Crear Quiz
        </button>
        <button
          onClick={onGameClick}
          className="bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-6 rounded-xl transition transform hover:scale-105 active:scale-95 text-lg"
        >
          🎮 Unirse a Quiz
        </button>
      </div>

      {/* Recent Quizzes */}
      <div className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-xl p-6">
        <h3 className="text-2xl font-bold text-white mb-4">📋 Cuestionarios Recientes</h3>

        {quizzes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-purple-300">No hay cuestionarios disponibles aún</p>
            <p className="text-purple-400 text-sm">Crea uno nuevo para comenzar 🚀</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/60 transition cursor-pointer"
                onClick={() => setSharedQuiz(quiz)}
              >
                <h4 className="font-bold text-white mb-2">{quiz.title}</h4>
                <p className="text-purple-300 text-sm mb-3">{quiz.description}</p>
                <div className="flex justify-between items-center text-xs text-purple-400">
                  <span>❓ {quiz.questions.length} preguntas</span>
                  <span>👥 {quiz.participants || 0} jugadores</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Quiz Modal */}
      {sharedQuiz && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black/90 border border-purple-500/30 rounded-xl p-8 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-white">{sharedQuiz.title}</h3>
            <p className="text-purple-300">{sharedQuiz.description}</p>

            <div className="bg-white p-4 rounded-lg flex justify-center">
              <QRCode
                value={`https://nostr-kahoot.vercel.app/?quiz=${sharedQuiz.id}`}
                size={200}
              />
            </div>

            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-300 text-xs">
                Comparte este código QR en Knoester para que otros jueguen
              </p>
            </div>

            <button
              onClick={() => setSharedQuiz(null)}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
