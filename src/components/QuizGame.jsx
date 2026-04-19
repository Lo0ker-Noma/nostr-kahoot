import React, { useState, useEffect } from 'react';
import { useQuizStore, shuffleQuiz } from '../store/quizStore';
import { useAuthStore } from '../store/authStore';
import { POINTS_PER_CORRECT } from '../store/gameStore';

export function QuizGame({ onBack, initialQuizId, initialQuiz }) {
  const [sessionId, setSessionId] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(initialQuiz ? shuffleQuiz(initialQuiz) : null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [sats, setSats] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const { getQuizById, saveAnswer } = useQuizStore();
  const { user } = useAuthStore();

  const inputStyle = {
    background: '#0A0A0A',
    border: '1px solid rgba(180,249,83,0.25)',
    color: '#F7F7F7',
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
  };

  const handleJoinSession = async () => {
    if (!sessionId.trim()) { alert('ERROR: Ingresa un ID valido'); return; }
    setLoading(true);
    try {
      const quiz = await getQuizById(sessionId);
      if (quiz) { setCurrentQuiz(shuffleQuiz(quiz)); } else { alert('ERROR: Quiz not found'); }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('ERROR: Connection failed');
    } finally { setLoading(false); }
  };

  const handleAnswer = (answerIndex) => {
    if (answered) return;
    setSelectedAnswer(answerIndex);
    const question = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = answerIndex === question.correct;
    if (isCorrect) {
      setScore(score + 1);
      setSats(sats + POINTS_PER_CORRECT);
    }
    setAnswered(true);
    saveAnswer({ quizId: currentQuiz.id, questionId: question.id, answer: answerIndex, correct: isCorrect, player: user.pubkey });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else { setGameFinished(true); }
  };

  if (!currentQuiz) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold font-mono tracking-widest uppercase" style={{ color: '#F7931A', textShadow: '0 0 6px rgba(247,147,26,0.5)' }}>&gt; JOIN_SESSION</h2>
            <p className="text-xs font-mono text-gray-600">[ ENTER QUIZ ID TO CONNECT ]</p>
          </div>
          <button onClick={onBack} className="px-4 py-2 font-mono text-xs tracking-widest uppercase" style={{ border: '1px solid rgba(180,249,83,0.3)', background: '#0A0A0A', color: '#B4F953' }}>&larr; BACK</button>
        </div>
        <div className="p-8 space-y-5" style={{ border: '1px solid rgba(247,147,26,0.3)', background: 'rgba(0,0,0,0.4)' }}>
          <div className="space-y-3">
            <label className="block text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#F7931A' }}>// SESSION ID</label>
            <input type="text" value={sessionId} onChange={(e) => setSessionId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleJoinSession()} placeholder="e.g. 1713000000000" className="w-full px-4 py-3 text-sm font-mono" style={inputStyle} />
            <button onClick={handleJoinSession} disabled={loading} className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-50" style={{ border: '2px solid #F7931A', background: loading ? 'rgba(247,147,26,0.1)' : '#0A0A0A', color: '#F7931A' }}>
              {loading ? 'CONNECTING...' : 'UNIRSE AL QUIZ'}
            </button>
          </div>
          <div className="p-3" style={{ border: '1px solid rgba(180,249,83,0.15)', background: 'rgba(180,249,83,0.03)' }}>
            <p className="text-xs font-mono text-gray-500">&gt; Scan a shared QR code to get the quiz ID automatically.</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    const pct = Math.round((score / currentQuiz.questions.length) * 100);
    const grade = pct >= 80 ? 'S' : pct >= 60 ? 'A' : pct >= 40 ? 'B' : 'C';
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-8 text-center space-y-5" style={{ border: '2px solid #B4F953', background: '#0A0A0A' }}>
          <p className="text-xs font-mono text-gray-500">[ SESSION COMPLETE ]</p>
          <h2 className="text-3xl font-bold font-mono tracking-widest uppercase" style={{ color: '#B4F953', textShadow: '0 0 12px rgba(180,249,83,0.6)' }}>QUIZ TERMINADO</h2>
          <div className="py-8 space-y-2" style={{ border: '1px solid rgba(180,249,83,0.2)', background: 'rgba(180,249,83,0.03)' }}>
            <p className="text-7xl font-bold font-mono" style={{ color: '#F7931A', textShadow: '0 0 20px rgba(247,147,26,0.6)' }}>⚡ {sats}</p>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">SATS GANADOS</p>
            <p className="text-sm font-mono text-gray-400 mt-3">{score}/{currentQuiz.questions.length} · {pct}% CORRECTO</p>
            <p className="text-2xl font-bold font-mono mt-2" style={{ color: '#B4F953' }}>GRADE: {grade}</p>
          </div>
          <button onClick={() => { setCurrentQuiz(null); setCurrentQuestionIndex(0); setScore(0); setSats(0); setGameFinished(false); onBack(); }} className="w-full py-4 font-mono font-bold text-sm tracking-widest uppercase" style={{ border: '2px solid #B4F953', background: '#0A0A0A', color: '#B4F953' }}>
            &larr; VOLVER AL DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  const question = currentQuiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
  const diffColor = question.difficulty === 'easy' ? '#B4F953' : question.difficulty === 'medium' ? '#F7931A' : '#FF4444';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold font-mono uppercase tracking-wider" style={{ color: '#B4F953' }}>{currentQuiz.title}</h2>
          <p className="text-xs font-mono text-gray-600">{currentQuiz.description}</p>
        </div>
        <button onClick={onBack} className="px-3 py-1 font-mono text-xs tracking-widest uppercase" style={{ border: '1px solid rgba(255,68,68,0.4)', background: '#0A0A0A', color: '#FF4444' }}>[X] EXIT</button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-gray-500">Q {currentQuestionIndex + 1}/{currentQuiz.questions.length}</span>
          <span style={{ color: '#F7931A' }} className="font-bold">⚡ {sats} SATS</span>
        </div>
        <div className="w-full h-1" style={{ background: 'rgba(180,249,83,0.1)' }}>
          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: '#B4F953', boxShadow: '0 0 8px rgba(180,249,83,0.5)' }} />
        </div>
      </div>

      <div className="p-6 space-y-5" style={{ border: '1px solid rgba(180,249,83,0.25)', background: 'rgba(0,0,0,0.5)' }}>
        <div>
          <p className="text-xs font-mono mb-2" style={{ color: diffColor }}>DIFFICULTY: [{question.difficulty.toUpperCase()}]</p>
          <h3 className="text-lg font-bold font-mono text-white leading-snug">{question.question}</h3>
        </div>
        <div className="space-y-3">
          {question.answers.map((answer, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === question.correct;
            let borderColor = 'rgba(180,249,83,0.2)';
            let bg = 'rgba(0,0,0,0)';
            let color = '#F7F7F7';
            let prefix = 'o';
            if (answered) {
              if (isCorrect) { borderColor = '#B4F953'; bg = 'rgba(180,249,83,0.1)'; color = '#B4F953'; prefix = 'V'; }
              else if (isSelected && !isCorrect) { borderColor = '#FF4444'; bg = 'rgba(255,68,68,0.1)'; color = '#FF4444'; prefix = 'X'; }
              else { borderColor = 'rgba(180,249,83,0.1)'; color = '#555'; }
            }
            return (
              <button key={idx} onClick={() => handleAnswer(idx)} disabled={answered} className="w-full p-4 font-mono text-sm text-left transition-all disabled:cursor-default" style={{ border: `2px solid ${borderColor}`, background: bg, color }}>
                <span style={{ color: '#F7931A', marginRight: '10px' }}>[{prefix}]</span>{answer}
              </button>
            );
          })}
        </div>
        {answered && (
          <button onClick={handleNextQuestion} className="w-full py-3 font-mono font-bold text-sm tracking-widest uppercase" style={{ border: '2px solid #F7931A', background: '#0A0A0A', color: '#F7931A' }}>
            {currentQuestionIndex < currentQuiz.questions.length - 1 ? 'SIGUIENTE PREGUNTA' : 'TERMINAR QUIZ'}
          </button>
        )}
      </div>
    </div>
  );
}
