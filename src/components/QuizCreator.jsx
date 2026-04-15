import React, { useState } from 'react';
import { useQuizStore } from '../store/quizStore';
import { useAuthStore } from '../store/authStore';

export function QuizCreator({ onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswers, setCurrentAnswers] = useState(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);

  const { createQuiz } = useQuizStore();
  const { pubkey } = useAuthStore();

  const addQuestion = () => {
    if (!currentQuestion.trim() || currentAnswers.some(a => !a.trim())) {
      alert('Por favor completa todos los campos');
      return;
    }

    setQuestions([
      ...questions,
      {
        id: Date.now(),
        question: currentQuestion,
        answers: currentAnswers,
        correct: correctAnswerIndex,
        difficulty: difficulty
      }
    ]);

    // Reset
    setCurrentQuestion('');
    setCurrentAnswers(['', '', '', '']);
    setCorrectAnswerIndex(0);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handlePublish = async () => {
    if (!title.trim() || questions.length === 0) {
      alert('Necesitas título y al menos una pregunta');
      return;
    }

    setLoading(true);
    try {
      await createQuiz({
        title,
        description,
        questions,
        creator: pubkey,
        createdAt: new Date().toISOString(),
        participants: 0
      });
      alert('¡Quiz publicado en Nostr! 🎉');
      onBack();
    } catch (error) {
      console.error('Error publishing quiz:', error);
      alert('Error al publicar el quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">✏️ Crear Quiz</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition"
        >
          ← Volver
        </button>
      </div>

      {/* Quiz Info */}
      <div className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-purple-300 font-semibold mb-2">Título del Quiz</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Conceptos de Nostr"
            className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-purple-300 font-semibold mb-2">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu quiz..."
            className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none h-20 resize-none"
          />
        </div>
      </div>

      {/* Question Creator */}
      <div className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-bold text-white">Agregar Pregunta ({questions.length})</h3>

        <div>
          <label className="block text-purple-300 font-semibold mb-2">Pregunta</label>
          <input
            type="text"
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="¿Cuál es tu pregunta?"
            className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-purple-300 font-semibold mb-2">Dificultad</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Medio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>

        <div>
          <label className="block text-purple-300 font-semibold mb-2">Respuestas</label>
          <div className="space-y-2">
            {currentAnswers.map((answer, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correctAnswerIndex === idx}
                  onChange={() => setCorrectAnswerIndex(idx)}
                  className="mt-3"
                />
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => {
                    const newAnswers = [...currentAnswers];
                    newAnswers[idx] = e.target.value;
                    setCurrentAnswers(newAnswers);
                  }}
                  placeholder={`Opción ${idx + 1}`}
                  className="flex-1 bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                />
              </div>
            ))}
          </div>
          <p className="text-purple-400 text-xs mt-2">Selecciona el radio button para marcar la respuesta correcta</p>
        </div>

        <button
          onClick={addQuestion}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
        >
          ➕ Agregar Pregunta
        </button>
      </div>

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-white">Preguntas Añadidas</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-white">{idx + 1}. {q.question}</p>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-purple-300 text-xs mb-1">Dificultad: {q.difficulty}</p>
                <p className="text-purple-300 text-xs">Respuesta correcta: {q.answers[q.correct]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publish Button */}
      <button
        onClick={handlePublish}
        disabled={loading || !title || questions.length === 0}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition text-lg"
      >
        {loading ? '⏳ Publicando en Nostr...' : '🚀 Publicar Quiz en Nostr'}
      </button>
    </div>
  );
}
