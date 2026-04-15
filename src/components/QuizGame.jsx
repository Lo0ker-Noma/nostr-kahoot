import React, { useState, useEffect } from 'react';
import { useQuizStore } from '../store/quizStore';
import { useAuthStore } from '../store/authStore';

export function QuizGame({ onBack }) {
  const [sessionId, setSessionId] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const { getQuizById, saveAnswer } = useQuizStore();
  const { user } = useAuthStore();

  const handleJoinSession = async () => {
    if (!sessionId.trim()) {
      alert('Ingresa un ID de sesión válido');
      return;
    }

    setLoading(true);
    try {
      const quiz = await getQuizById(sessionId);
      if (quiz) {
        setCurrentQuiz(quiz);
      } else {
        alert('Quiz no encontrado');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Error al unirse a la sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex) => {
    if (answered) return;

    setSelectedAnswer(answerIndex);
    const question = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = answerIndex === question.correct;

    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswered(true);

    // Guardar respuesta en Nostr
    saveAnswer({
      quizId: currentQuiz.id,
      questionId: question.id,
      answer: answerIndex,
      correct: isCorrect,
      player: user.pubkey
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setGameFinished(true);
    }
  };

  // Session Join View
  if (!currentQuiz) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white">🎮 Jugar Quiz</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition"
          >
            ← Volver
          </button>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-purple-300">Ingresa el ID del quiz o escanea el código QR compartido</p>
          </div>

          <div className="space-y-3">
            <label className="block text-purple-300 font-semibold">ID de la Sesión</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Ej: 1713000000000"
              className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none text-lg"
            />

            <button
              onClick={handleJoinSession}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition text-lg"
            >
              {loading ? '⏳ Conectando...' : '🔗 Unirse al Quiz'}
            </button>
          </div>

          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              💡 Si alguien comparte un código QR contigo, escanéalo para obtener el ID automáticamente
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Game Finished View
  if (gameFinished) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-8 text-center space-y-4">
          <p className="text-5xl">🎉</p>
          <h2 className="text-3xl font-bold text-white">¡Quiz Completado!</h2>
          <div className="bg-black/30 rounded-lg p-6">
            <p className="text-6xl font-bold text-white">{score}/{currentQuiz.questions.length}</p>
            <p className="text-green-200 mt-2">
              {Math.round((score / currentQuiz.questions.length) * 100)}% Correcto
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentQuiz(null);
              setCurrentQuestionIndex(0);
              setScore(0);
              setGameFinished(false);
              onBack();
            }}
            className="w-full bg-white hover:bg-gray-100 text-green-600 font-bold py-3 rounded-lg transition mt-4"
          >
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Game View
  const question = currentQuiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white">{currentQuiz.title}</h2>
          <p className="text-purple-300 text-sm">{currentQuiz.description}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition"
        >
          ✕ Salir
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-purple-300">Pregunta {currentQuestionIndex + 1}/{currentQuiz.questions.length}</span>
          <span className="text-green-400 font-bold">Puntuación: {score}</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-2 border border-purple-500/20">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-xl p-8 space-y-6">
        <div>
          <p className="text-purple-400 text-sm mb-2">
            Dificultad: <span className="capitalize font-semibold">{question.difficulty}</span>
          </p>
          <h3 className="text-2xl font-bold text-white">{question.question}</h3>
        </div>

        {/* Answers */}
        <div className="space-y-3">
          {question.answers.map((answer, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={answered}
              className={`w-full p-4 rounded-lg font-semibold text-left transition transform hover:scale-105 active:scale-95 disabled:hover:scale-100 ${
                selectedAnswer === idx
                  ? idx === question.correct
                    ? 'bg-green-600 border-2 border-green-400 text-white'
                    : 'bg-red-600 border-2 border-red-400 text-white'
                  : answered && idx === question.correct
                  ? 'bg-green-600/50 border-2 border-green-400 text-white'
                  : 'bg-purple-600/20 border-2 border-purple-500/30 text-white hover:border-purple-500/60'
              }`}
            >
              <span className="mr-3">
                {answered
                  ? idx === question.correct
                    ? '✓'
                    : selectedAnswer === idx
                    ? '✕'
                    : ''
                  : '○'}
              </span>
              {answer}
            </button>
          ))}
        </div>

        {/* Next Button */}
        {answered && (
          <button
            onClick={handleNextQuestion}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition"
          >
            {currentQuestionIndex < currentQuiz.questions.length - 1 ? '→ Siguiente Pregunta' : '✓ Terminar Quiz'}
          </button>
        )}
      </div>
    </div>
  );
}
