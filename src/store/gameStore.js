import { create } from 'zustand';
import { getRelay } from '../lib/nostrRelay';
import { useAuthStore } from './authStore';

// kind 30078 = parameterized replaceable application-specific event
// The 'd' tag is the game PIN — unique per session
const GAME_KIND = 30078;

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const useGameStore = create((set, get) => ({
  // ── Shared ──
  pin: null,
  quiz: null,
  gameStatus: 'idle', // idle | lobby | question | finished

  // ── Host ──
  currentQuestionIndex: 0,

  // ── Player ──
  playerName: '',
  playerPicture: null,
  myAnswers: [],   // [{ questionIndex, answerIndex, correct, timeMs }]
  myScore: 0,
  currentQuestion: null,  // question object pushed from host event
  questionStartTime: null,

  // ─────────────────────────────────────────
  // HOST: create a live game session on Nostr
  // ─────────────────────────────────────────
  createSession: async (quiz) => {
    const { signEvent, pubkey, isReadOnly } = useAuthStore.getState();
    if (isReadOnly) return null; // needs NIP-07

    const pin = generatePin();
    const relay = getRelay();

    const event = {
      kind: GAME_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', pin],
        ['quiz', quiz.id],
        ['status', 'lobby'],
        ['title', quiz.title],
      ],
      content: JSON.stringify({
        title: quiz.title,
        description: quiz.description,
        questionCount: quiz.questions.length,
      }),
      pubkey,
    };

    const signed = await signEvent(event);
    if (!signed) return null;

    relay.publish(signed);
    set({ pin, quiz, gameStatus: 'lobby', currentQuestionIndex: 0, myAnswers: [], myScore: 0 });
    return pin;
  },

  // HOST: start the game — push question 0
  startGame: async () => {
    const { pin, quiz } = get();
    const { signEvent, pubkey } = useAuthStore.getState();
    const question = quiz.questions[0];

    const event = {
      kind: GAME_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['d', pin], ['quiz', quiz.id], ['status', 'question'], ['q', '0']],
      content: JSON.stringify({ questionIndex: 0, question }),
      pubkey,
    };
    const signed = await signEvent(event);
    if (signed) {
      getRelay().publish(signed);
      set({ gameStatus: 'question', currentQuestionIndex: 0 });
    }
  },

  // HOST: advance to next question (or finish)
  nextQuestion: async () => {
    const { pin, quiz, currentQuestionIndex } = get();
    const { signEvent, pubkey } = useAuthStore.getState();
    const nextIdx = currentQuestionIndex + 1;

    if (nextIdx >= quiz.questions.length) {
      const event = {
        kind: GAME_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', pin], ['quiz', quiz.id], ['status', 'finished']],
        content: '',
        pubkey,
      };
      const signed = await signEvent(event);
      if (signed) { getRelay().publish(signed); set({ gameStatus: 'finished' }); }
    } else {
      const question = quiz.questions[nextIdx];
      const event = {
        kind: GAME_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', pin], ['quiz', quiz.id], ['status', 'question'], ['q', String(nextIdx)]],
        content: JSON.stringify({ questionIndex: nextIdx, question }),
        pubkey,
      };
      const signed = await signEvent(event);
      if (signed) {
        getRelay().publish(signed);
        set({ currentQuestionIndex: nextIdx, gameStatus: 'question' });
      }
    }
  },

  // ─────────────────────────────────────────
  // PLAYER: subscribe to a game session PIN
  // ─────────────────────────────────────────
  setPlayerName: (name, picture) => set({ playerName: name, playerPicture: picture || null }),

  subscribeToSession: (pin) => {
    const relay = getRelay();
    const unsub = relay.subscribe(
      { kinds: [GAME_KIND], '#d': [pin], limit: 5 },
      (event) => {
        const tagsMap = Object.fromEntries(event.tags.map(t => [t[0], t[1]]));
        const status = tagsMap.status;
        let content = {};
        try { content = event.content ? JSON.parse(event.content) : {}; } catch {}

        if (status === 'lobby') {
          set({ gameStatus: 'lobby', pin });
        } else if (status === 'question') {
          const qIdx = parseInt(tagsMap.q || '0', 10);
          set({
            gameStatus: 'question',
            currentQuestion: content.question,
            currentQuestionIndex: qIdx,
            questionStartTime: Date.now(),
          });
        } else if (status === 'finished') {
          set({ gameStatus: 'finished' });
        }
      }
    );
    return unsub;
  },

  // PLAYER: record a local answer with speed-based scoring
  submitAnswer: (questionIndex, answerIndex, correct, timeMs) => {
    // Kahoot-style: max 1000 pts, decreasing with time (20s window)
    const points = correct ? Math.max(500, Math.round(1000 - (timeMs / 20000) * 500)) : 0;
    set((state) => ({
      myAnswers: [...state.myAnswers, { questionIndex, answerIndex, correct, timeMs }],
      myScore: state.myScore + points,
    }));
  },

  resetGame: () => set({
    pin: null,
    quiz: null,
    gameStatus: 'idle',
    currentQuestionIndex: 0,
    myAnswers: [],
    myScore: 0,
    currentQuestion: null,
    questionStartTime: null,
    playerName: '',
    playerPicture: null,
  }),
}));
