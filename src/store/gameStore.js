import { create } from 'zustand';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';
import { getRelay } from '../lib/nostrRelay';
import { useAuthStore } from './authStore';
import { shuffleQuiz } from './quizStore';

const DEV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

const GAME_KIND = 30078;
export const POINTS_PER_CORRECT = 21;
export const QUESTION_SECONDS = 30;
const ANSWER_GRACE_MS = 2000; // network latency buffer for late answers

// CSPRNG 6-digit PIN. Uses Web Crypto to get uniform randomness.
function generatePin() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // 2^32 / 1_000_000 ≈ 4294, so bias is negligible for a 6-digit PIN
  const n = buf[0] % 900000 + 100000;
  return n.toString();
}

// Sanitize a player-supplied string (name) — cap length, strip controls.
function sanitizeName(raw) {
  if (typeof raw !== 'string') return 'Anon';
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // strip control chars
    .replace(/\s+/g, ' ')                          // collapse whitespace
    .trim()
    .slice(0, 24);
  return cleaned || 'Anon';
}

function sanitizePictureUrl(raw) {
  if (typeof raw !== 'string' || raw.length > 500) return null;
  try {
    const u = new URL(raw);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : null;
  } catch { return null; }
}

export const useGameStore = create((set, get) => ({
  pin: null,
  quiz: null,
  hostPubkey: null,        // pinned on first verified lobby event
  gameStatus: 'idle',
  currentQuestionIndex: 0,
  players: {},
  answerCounts: [0,0,0,0],
  questionResults: null,
  leaderboard: [],
  _playerUnsub: null,
  _seenAnswers: new Set(), // dedupe answer events by `${pubkey}-${qIdx}`
  _questionPublishedAt: 0, // host's local ms-timestamp for current question
  ephemeralKey: null,
  ephemeralPubkey: null,
  playerName: '',
  playerPicture: null,
  myAnswers: [],
  myScore: 0,
  currentQuestion: null,
  questionStartTime: null,

  createSession: async (rawQuiz) => {
    const { signEvent, pubkey, isReadOnly } = useAuthStore.getState();
    if (isReadOnly) return null;
    const quiz = shuffleQuiz(rawQuiz);
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
    // Player events are authored by ephemeral keys, so we cannot filter by
    // author. We still verify signatures (relay layer) + dedupe + sanitize.
    const playerUnsub = relay.subscribe(
      { kinds: [1], '#t': [`nk-${pin}`], limit: 500 },
      (ev) => get()._handlePlayerEvent(ev)
    );
    set({ pin, quiz, hostPubkey: pubkey, gameStatus: 'lobby', currentQuestionIndex: 0, players: {}, answerCounts: [0,0,0,0], leaderboard: [], questionResults: null, _playerUnsub: playerUnsub, _seenAnswers: new Set(), _questionPublishedAt: 0 });
    return pin;
  },

  _handlePlayerEvent: (event) => {
    // Defensive: require pubkey (the relay layer verified the signature)
    if (!event || typeof event.pubkey !== 'string') return;
    const action = event.tags.find(t => t[0] === 'action')?.[1];

    if (action === 'join') {
      const name    = sanitizeName(event.tags.find(t => t[0] === 'name')?.[1]);
      const picture = sanitizePictureUrl(event.tags.find(t => t[0] === 'picture')?.[1]);
      set((state) => {
        if (state.players[event.pubkey]) return state;
        return { players: { ...state.players, [event.pubkey]: { name, picture, score: 0, answers: [] } } };
      });
      return;
    }

    if (action === 'answer') {
      const qIdx = parseInt(event.tags.find(t => t[0] === 'q')?.[1] || '-1', 10);
      const aIdx = parseInt(event.tags.find(t => t[0] === 'a')?.[1] || '-1', 10);
      if (!Number.isInteger(qIdx) || !Number.isInteger(aIdx)) return;
      if (aIdx < 0 || aIdx > 3) return;

      const state = get();
      const quiz = state.quiz;
      if (!quiz || qIdx < 0 || qIdx >= quiz.questions.length) return;

      // Reject answers for the wrong question (must be current one)
      if (qIdx !== state.currentQuestionIndex) return;

      // Reject answers received after the time limit + small grace
      if (state._questionPublishedAt === 0) return;
      const elapsedMs = Date.now() - state._questionPublishedAt;
      if (elapsedMs > QUESTION_SECONDS * 1000 + ANSWER_GRACE_MS) return;

      // Dedupe — one answer per (pubkey, qIdx)
      const key = `${event.pubkey}-${qIdx}`;
      if (state._seenAnswers.has(key)) return;
      state._seenAnswers.add(key);

      // HOST computes correctness from its local quiz data — never trust the
      // client's `correct` tag (removed in publishAnswer)
      const correct = quiz.questions[qIdx].correct === aIdx;

      set((s) => {
        const player = s.players[event.pubkey];
        if (!player) return s; // unknown player — they never joined
        if (player.answers.find(a => a.q === qIdx)) return s;
        const newAnswers = [...player.answers, { q: qIdx, a: aIdx, correct }];
        const newCounts = [...s.answerCounts];
        newCounts[aIdx]++;
        const updatedPlayers = {
          ...s.players,
          [event.pubkey]: { ...player, answers: newAnswers, score: player.score + (correct ? POINTS_PER_CORRECT : 0) },
        };
        const leaderboard = Object.values(updatedPlayers)
          .sort((a, b) => b.score - a.score)
          .map(p => ({ name: p.name, picture: p.picture, score: p.score }));
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
    if (signed) {
      getRelay().publish(signed);
      set({ gameStatus: 'question', currentQuestionIndex: 0, answerCounts: [0,0,0,0], _questionPublishedAt: Date.now() });
    }
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
      if (signed) {
        getRelay().publish(signed);
        set({ currentQuestionIndex: nextIdx, gameStatus: 'question', answerCounts: [0,0,0,0], _questionPublishedAt: Date.now() });
      }
    }
  },

  setPlayerName: (name, picture) => set({
    playerName: sanitizeName(name),
    playerPicture: sanitizePictureUrl(picture),
  }),

  _getOrCreateKey: () => {
    let sk = get().ephemeralKey;
    if (!sk) { sk = generateSecretKey(); set({ ephemeralKey: sk, ephemeralPubkey: getPublicKey(sk) }); }
    return sk;
  },

  publishJoin: (pin, rawName, rawPicture) => {
    const name = sanitizeName(rawName);
    const picture = sanitizePictureUrl(rawPicture);
    const sk = get()._getOrCreateKey();
    const tags = [['t', `nk-${pin}`], ['action', 'join'], ['name', name]];
    if (picture) tags.push(['picture', picture]);
    getRelay().publish(finalizeEvent({ kind: 1, created_at: Math.floor(Date.now() / 1000), tags, content: name }, sk));
  },

  // Player → host answer. Note: `correct` is NOT sent. The host computes
  // correctness from its own quiz data to prevent score-tampering clients.
  publishAnswer: (pin, qIdx, aIdx) => {
    if (!Number.isInteger(qIdx) || !Number.isInteger(aIdx) || aIdx < 0 || aIdx > 3) return;
    const sk = get()._getOrCreateKey();
    getRelay().publish(finalizeEvent({
      kind: 1, created_at: Math.floor(Date.now() / 1000),
      tags: [['t', `nk-${pin}`], ['action', 'answer'], ['q', String(qIdx)], ['a', String(aIdx)]],
      content: '',
    }, sk));
  },

  subscribeToSession: (pin) => {
    const relay = getRelay();
    const unsub = relay.subscribe({ kinds: [GAME_KIND], '#d': [pin], limit: 20 }, (event) => {
      // Host-pubkey binding: the first verified session event pins the host.
      // Subsequent events from a different pubkey are rejected, blocking
      // replay/injection attacks from other relay users.
      const state = get();
      if (!state.hostPubkey) {
        set({ hostPubkey: event.pubkey });
      } else if (event.pubkey !== state.hostPubkey) {
        if (DEV) console.warn('[gameStore] dropping event from non-host pubkey');
        return;
      }

      const tags = Object.fromEntries(event.tags.map(t => [t[0], t[1]]));
      let content = {};
      if (event.content) {
        try {
          const parsed = JSON.parse(event.content);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) content = parsed;
        } catch {}
      }

      if (tags.status === 'lobby') {
        set({ gameStatus: 'lobby', pin });
      } else if (tags.status === 'question') {
        const qIdx = parseInt(tags.q || '0', 10);
        const q = content.question;
        if (!q || typeof q !== 'object') return;
        set({ gameStatus: 'question', currentQuestion: q, currentQuestionIndex: qIdx, questionStartTime: Date.now() });
      } else if (tags.status === 'results') {
        const lb = Array.isArray(content.leaderboard) ? content.leaderboard : [];
        set({ gameStatus: 'results', questionResults: content, leaderboard: lb });
      } else if (tags.status === 'finished') {
        set({ gameStatus: 'finished' });
      }
    });
    return unsub;
  },

  // Player-local submission record — the host authoritatively decides scoring.
  // Local `correct` is only for immediate UI feedback; leaderboard comes from
  // host's signed results event.
  submitAnswer: (qIdx, aIdx) => {
    const { pin, currentQuestion } = get();
    if (!Number.isInteger(qIdx) || !Number.isInteger(aIdx) || aIdx < 0 || aIdx > 3) return;
    get().publishAnswer(pin, qIdx, aIdx);
    const localCorrect = !!currentQuestion && currentQuestion.correct === aIdx;
    set((s) => ({
      myAnswers: [...s.myAnswers, { questionIndex: qIdx, answerIndex: aIdx, correct: localCorrect }],
      myScore: s.myScore + (localCorrect ? POINTS_PER_CORRECT : 0),
    }));
  },

  resetGame: () => {
    get()._playerUnsub?.();
    set({
      pin: null, quiz: null, hostPubkey: null, gameStatus: 'idle', currentQuestionIndex: 0,
      players: {}, answerCounts: [0,0,0,0], leaderboard: [], questionResults: null,
      _playerUnsub: null, _seenAnswers: new Set(), _questionPublishedAt: 0,
      ephemeralKey: null, ephemeralPubkey: null, playerName: '', playerPicture: null,
      myAnswers: [], myScore: 0, currentQuestion: null, questionStartTime: null,
    });
  },
}));
