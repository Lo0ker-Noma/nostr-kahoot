import { create } from 'zustand';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';
import { getRelay } from '../lib/nostrRelay';
import { useAuthStore } from './authStore';

const GAME_KIND = 30078;
export const POINTS_PER_CORRECT = 21;
export const QUESTION_SECONDS = 30;

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const useGameStore = create((set, get) => ({
  pin: null,
  quiz: null,
  gameStatus: 'idle',
  currentQuestionIndex: 0,
  players: {},
  answerCounts: [0,0,0,0],
  questionResults: null,
  leaderboard: [],
  _playerUnsub: null,
  ephemeralKey: null,
  ephemeralPubkey: null,
  playerName: '',
  playerPicture: null,
  myAnswers: [],
  myScore: 0,
  currentQuestion: null,
  questionStartTime: null,

  createSession: async (quiz) => {
    const { signEvent, pubkey, isReadOnly } = useAuthStore.getState();
    if (isReadOnly) return null;
    const pin = generatePin();
    const relay = getRelay();
    const event = {
      kind: GAME_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['d', pin], ['quiz', quiz.id], ['status', 'lobby'], ['title', quiz.title]],
      content: JSON.stringify({ title: quiz.title, description: quiz.description, questionCount: quiz.questions.length }),
      pubkey,
    };
    const signed = await signEvent(event);
    if (!signed) return null;
    relay.publish(signed);
    const playerUnsub = relay.subscribe(
      { kinds: [1], '#t': [`nk-${pin}`], limit: 500 },
      (ev) => get()._handlePlayerEvent(ev)
    );
    set({ pin, quiz, gameStatus: 'lobby', currentQuestionIndex: 0, players: {}, answerCounts: [0,0,0,0], leaderboard: [], questionResults: null, _playerUnsub: playerUnsub });
    return pin;
  },

  _handlePlayerEvent: (event) => {
    const action = event.tags.find(t => t[0] === 'action')?.[1];
    if (action === 'join') {
      const name    = event.tags.find(t => t[0] === 'name')?.[1]    || 'Anon';
      const picture = event.tags.find(t => t[0] === 'picture')?.[1] || null;
      set((state) => {
        if (state.players[event.pubkey]) return state;
        return { players: { ...state.players, [event.pubkey]: { name, picture, score: 0, answers: [] } } };
      });
    } else if (action === 'answer') {
      const qIdx    = parseInt(event.tags.find(t => t[0] === 'q')?.[1] || '0', 10);
      const aIdx    = parseInt(event.tags.find(t => t[0] === 'a')?.[1] || '0', 10);
      const correct = event.tags.find(t => t[0] === 'correct')?.[1] === 'true';
      set((state) => {
        const player = state.players[event.pubkey];
        if (!player || player.answers.find(a => a.q === qIdx)) return state;
        const newAnswers = [...player.answers, { q: qIdx, a: aIdx, correct }];
        const newCounts = [...state.answerCounts];
        if (aIdx >= 0 && aIdx < 4) newCounts[aIdx]++;
        const updatedPlayers = { ...state.players, [event.pubkey]: { ...player, answers: newAnswers, score: player.score + (correct ? POINTS_PER_CORRECT : 0) } };
        const leaderboard = Object.values(updatedPlayers).sort((a, b) => b.score - a.score).map(p => ({ name: p.name, picture: p.picture, score: p.score }));
        return { players: updatedPlayers, answerCounts: newCounts, leaderboard };
      });
    }
  },

  startGame: async () => {
    const { pin, quiz } = get();
    const { signEvent, pubkey } = useAuthStore.getState();
    const event = {
      kind: GAME_KIND, created_at: Math.floor(Date.now() / 1000),
      tags: [['d', pin], ['quiz', quiz.id], ['status', 'question'], ['q', '0']],
      content: JSON.stringify({ questionIndex: 0, question: quiz.questions[0] }), pubkey,
    };
    const signed = await signEvent(event);
    if (signed) { getRelay().publish(signed); set({ gameStatus: 'question', currentQuestionIndex: 0, answerCounts: [0,0,0,0] }); }
  },

  showResults: async () => {
    const { pin, quiz, currentQuestionIndex, answerCounts, players, leaderboard } = get();
    const { signEvent, pubkey } = useAuthStore.getState();
    const question = quiz.questions[currentQuestionIndex];
    const playerResults = Object.values(players).map(p => {
      const ans = p.answers.find(a => a.q === currentQuestionIndex);
      return { name: p.name, picture: p.picture, answered: !!ans, correct: ans?.correct || false, answerIndex: ans?.a ?? null };
    });
    const results = { questionIndex: currentQuestionIndex, correctAnswer: question.correct, counts: answerCounts, playerResults, leaderboard: leaderboard.slice(0, 10) };
    const event = {
      kind: GAME_KIND, created_at: Math.floor(Date.now() / 1000),
      tags: [['d', pin], ['quiz', quiz.id], ['status', 'results'], ['q', String(currentQuestionIndex)]],
      content: JSON.stringify(results), pubkey,
    };
    const signed = await signEvent(event);
    if (signed) { getRelay().publish(signed); set({ gameStatus: 'results', questionResults: results }); }
  },

  nextQuestion: async () => {
    const { pin, quiz, currentQuestionIndex } = get();
    const { signEvent, pubkey } = useAuthStore.getState();
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= quiz.questions.length) {
      const event = { kind: GAME_KIND, created_at: Math.floor(Date.now() / 1000), tags: [['d', pin], ['quiz', quiz.id], ['status', 'finished']], content: '', pubkey };
      const signed = await signEvent(event);
      if (signed) { getRelay().publish(signed); set({ gameStatus: 'finished' }); }
    } else {
      const event = {
        kind: GAME_KIND, created_at: Math.floor(Date.now() / 1000),
        tags: [['d', pin], ['quiz', quiz.id], ['status', 'question'], ['q', String(nextIdx)]],
        content: JSON.stringify({ questionIndex: nextIdx, question: quiz.questions[nextIdx] }), pubkey,
      };
      const signed = await signEvent(event);
      if (signed) { getRelay().publish(signed); set({ currentQuestionIndex: nextIdx, gameStatus: 'question', answerCounts: [0,0,0,0] }); }
    }
  },

  setPlayerName: (name, picture) => set({ playerName: name, playerPicture: picture || null }),

  _getOrCreateKey: () => {
    let sk = get().ephemeralKey;
    if (!sk) { sk = generateSecretKey(); set({ ephemeralKey: sk, ephemeralPubkey: getPublicKey(sk) }); }
    return sk;
  },

  publishJoin: (pin, name, picture) => {
    const sk = get()._getOrCreateKey();
    const tags = [['t', `nk-${pin}`], ['action', 'join'], ['name', name]];
    if (picture) tags.push(['picture', picture]);
    getRelay().publish(finalizeEvent({ kind: 1, created_at: Math.floor(Date.now() / 1000), tags, content: name }, sk));
  },

  publishAnswer: (pin, qIdx, aIdx, correct) => {
    const sk = get()._getOrCreateKey();
    getRelay().publish(finalizeEvent({
      kind: 1, created_at: Math.floor(Date.now() / 1000),
      tags: [['t', `nk-${pin}`], ['action', 'answer'], ['q', String(qIdx)], ['a', String(aIdx)], ['correct', correct ? 'true' : 'false']],
      content: '',
    }, sk));
  },

  subscribeToSession: (pin) => {
    const relay = getRelay();
    const unsub = relay.subscribe({ kinds: [GAME_KIND], '#d': [pin], limit: 20 }, (event) => {
      const tags = Object.fromEntries(event.tags.map(t => [t[0], t[1]]));
      let content = {};
      try { content = event.content ? JSON.parse(event.content) : {}; } catch {}
      if (tags.status === 'lobby') {
        set({ gameStatus: 'lobby', pin });
      } else if (tags.status === 'question') {
        set({ gameStatus: 'question', currentQuestion: content.question, currentQuestionIndex: parseInt(tags.q || '0', 10), questionStartTime: Date.now() });
      } else if (tags.status === 'results') {
        set({ gameStatus: 'results', questionResults: content, leaderboard: content.leaderboard || [] });
      } else if (tags.status === 'finished') {
        set({ gameStatus: 'finished' });
      }
    });
    return unsub;
  },

  submitAnswer: (qIdx, aIdx, correct) => {
    const { pin } = get();
    get().publishAnswer(pin, qIdx, aIdx, correct);
    set((state) => ({ myAnswers: [...state.myAnswers, { questionIndex: qIdx, answerIndex: aIdx, correct }], myScore: state.myScore + (correct ? POINTS_PER_CORRECT : 0) }));
  },

  resetGame: () => {
    get()._playerUnsub?.();
    set({ pin: null, quiz: null, gameStatus: 'idle', currentQuestionIndex: 0, players: {}, answerCounts: [0,0,0,0], leaderboard: [], questionResults: null, _playerUnsub: null, ephemeralKey: null, ephemeralPubkey: null, playerName: '', playerPicture: null, myAnswers: [], myScore: 0, currentQuestion: null, questionStartTime: null });
  },
}));
