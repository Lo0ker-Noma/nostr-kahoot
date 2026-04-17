import React, { useState } from 'react';
import { useQuizStore } from '../store/quizStore';
import { useAuthStore } from '../store/authStore';

// Input caps — defend against huge-payload DoS and malformed Nostr events.
const MAX_TITLE = 120;
const MAX_DESC = 500;
const MAX_QUESTION = 300;
const MAX_ANSWER = 120;
const MAX_QUESTIONS = 50;

// Strip C0/C1 control chars (incl. null bytes / ANSI escapes) and cap length.
function clean(raw, maxLen) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').slice(0, maxLen);
}

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

  const inputStyle = {
    background: '#0A0A0A',
    border: '1px solid rgba(180,249,83,0.25)',
    color: '#F7F7F7',
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
  };

  const addQuestion = () => {
    const q = clean(currentQuestion, MAX_QUESTION).trim();
    const answers = currentAnswers.map(a => clean(a, MAX_ANSWER).trim());
    if (!q || answers.some(a => !a)) {
      alert('Por favor completa todos los campos');
      return;
    }
    if (questions.length >= MAX_QUESTIONS) {
      alert(`Máximo ${MAX_QUESTIONS} preguntas por quiz`);
      return;
    }
    const correctIdx = Math.max(0, Math.min(3, correctAnswerIndex | 0));
    const diff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
    setQuestions([
      ...questions,
      { id: Date.now(), question: q, answers, correct: correctIdx, difficulty: diff },
    ]);
    setCurrentQuestion('');
    setCurrentAnswers(['', '', '', '']);
    setCorrectAnswerIndex(0);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handlePublish = async () => {
    const cleanTitle = clean(title, MAX_TITLE).trim();
    const cleanDesc = clean(description, MAX_DESC).trim();
    if (!cleanTitle || questions.length === 0) {
      alert('Necesitas titulo y al menos una pregunta');
      return;
    }
    setLoading(true);
    try {
      await createQuiz({
        title: cleanTitle,
        description: cleanDesc,
        questions: questions.slice(0, MAX_QUESTIONS),
        creator: pubkey,
        createdAt: new Date().toISOString(),
        participants: 0,
      });
      alert('Quiz publicado en Nostr');
      onBack();
    } catch (error) {
      if (import.meta.env && import.meta.env.DEV) console.error('Error publishing quiz:', error);
      alert('ERROR: Failed to publish quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-widest uppercase" style={{ color: '#B4F953', textShadow: '0 0 6px rgba(180,249,83,0.5)' }}>
            &gt; QUIZ_CREATOR
          </h2>
          <p className="text-xs font-mono text-gray-600">[ BROADCAST TO NOSTR RELAY ]</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 font-mono text-xs tracking-widest uppercase transition-all" style={{ border: '1px solid rgba(180,249,83,0.3)', background: '#0A0A0A', color: '#B4F953' }}>
          &larr; BACK
        </button>
      </div>

      <div className="p-5 space-y-4" style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(0,0,0,0.4)' }}>
        <p className="text-xs font-mono text-gray-500">&#9654; QUIZ_METADATA</p>
        <div>
          <label className="block text-xs font-mono font-bold mb-2 uppercase tracking-widest" style={{ color: '#F7931A' }}>// TITULO</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NOSTR FUNDAMENTALS" maxLength={MAX_TITLE} className="w-full px-4 py-2 text-sm font-mono" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-mono font-bold mb-2 uppercase tracking-widest" style={{ color: '#F7931A' }}>// DESCRIPCION</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe tu quiz..." maxLength={MAX_DESC} className="w-full px-4 py-2 text-sm font-mono h-20 resize-none" style={inputStyle} />
        </div>
      </div>

      <div className="p-5 space-y-4" style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(0,0,0,0.4)' }}>
        <p className="text-xs font-mono text-gray-500">&#9654; ADD_QUESTION [ {questions.length} ADDED ]</p>
        <div>
          <label className="block text-xs font-mono font-bold mb-2 uppercase tracking-widest" style={{ color: '#F7931A' }}>// PREGUNTA</label>
          <input type="text" value={currentQuestion} onChange={(e) => setCurrentQuestion(e.target.value)} placeholder="Que es un relay de Nostr?" maxLength={MAX_QUESTION} className="w-full px-4 py-2 text-sm font-mono" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-mono font-bold mb-2 uppercase tracking-widest" style={{ color: '#F7931A' }}>// DIFICULTAD</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-4 py-2 text-sm font-mono" style={inputStyle}>
            <option value="easy">[ EASY ]</option>
            <option value="medium">[ MEDIUM ]</option>
            <option value="hard">[ HARD ]</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono font-bold mb-2 uppercase tracking-widest" style={{ color: '#F7931A' }}>// RESPUESTAS</label>
          <div className="space-y-2">
            {currentAnswers.map((answer, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <button type="button" onClick={() => setCorrectAnswerIndex(idx)} className="w-5 h-5 font-mono text-xs flex items-center justify-center flex-shrink-0 transition-all" style={{ border: correctAnswerIndex === idx ? '2px solid #B4F953' : '2px solid rgba(180,249,83,0.3)', background: correctAnswerIndex === idx ? '#B4F953' : 'transparent', color: correctAnswerIndex === idx ? '#0A0A0A' : '#B4F953' }}>
                  {correctAnswerIndex === idx ? '&#10003;' : ''}
                </button>
                <input type="text" value={answer} onChange={(e) => { const n = [...currentAnswers]; n[idx] = e.target.value; setCurrentAnswers(n); }} placeholder={`OPCION ${idx + 1}`} maxLength={MAX_ANSWER} className="flex-1 px-4 py-2 text-sm font-mono" style={{ ...inputStyle, borderColor: correctAnswerIndex === idx ? 'rgba(180,249,83,0.5)' : 'rgba(180,249,83,0.2)' }} />
              </div>
            ))}
          </div>
        </div>
        <button onClick={addQuestion} className="w-full py-3 font-mono font-bold text-sm tracking-widest uppercase transition-all" style={{ border: '2px solid rgba(247,147,26,0.6)', background: '#0A0A0A', color: '#F7931A' }}>
          + AGREGAR PREGUNTA
        </button>
      </div>

      {questions.length > 0 && (
        <div className="p-5 space-y-3" style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(0,0,0,0.4)' }}>
          <p className="text-xs font-mono text-gray-500">&#9654; QUESTION_STACK [ {questions.length} ]</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-3 flex justify-between items-start" style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(180,249,83,0.03)' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-white font-bold"><span style={{ color: '#F7931A' }}>#{idx + 1}</span> {q.question}</p>
                  <p className="text-xs font-mono text-gray-600 mt-1">DIFF: [{q.difficulty.toUpperCase()}] | ANS: {q.answers[q.correct]}</p>
                </div>
                <button onClick={() => removeQuestion(q.id)} className="ml-3 text-red-500 hover:text-red-400 font-mono text-xs flex-shrink-0">[X]</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={handlePublish} disabled={loading || !title || questions.length === 0} className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-30" style={{ border: '2px solid #B4F953', background: loading ? 'rgba(180,249,83,0.15)' : '#0A0A0A', color: '#B4F953' }}>
        {loading ? '&#9654; BROADCASTING TO NOSTR...' : '&#9889; PUBLICAR QUIZ EN NOSTR'}
      </button>
    </div>
  );
}
