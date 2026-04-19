import { create } from 'zustand';
import { useAuthStore } from './authStore';

// Fisher-Yates shuffle of quiz answers — correct index follows its answer
export function shuffleQuiz(quiz) {
  if (!quiz) return quiz;
  return {
    ...quiz,
    questions: quiz.questions.map((q) => {
      const indices = [0, 1, 2, 3].slice(0, q.answers.length);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      return {
        ...q,
        answers: indices.map((i) => q.answers[i]),
        correct: indices.indexOf(q.correct),
      };
    }),
  };
}

const DEMO_QUIZZES = [
  {
    id: 'quiz-nostr-identity',
    title: 'Nostr & Identity',
    description: 'Identidad descentralizada en el protocolo Nostr — temática del hackathon',
    questions: [
      { id: 1, question: '¿Qué significa Nostr?', answers: ['Notes and Other Stuff Transmitted by Relays', 'Network Over String Transmission', 'New Open System for Text Relay', 'Neutral Open Source Transmission Relay'], correct: 0, difficulty: 'easy' },
      { id: 2, question: '¿Qué NIP define la verificación de identidad tipo "usuario@dominio.com"?', answers: ['NIP-05', 'NIP-01', 'NIP-07', 'NIP-19'], correct: 0, difficulty: 'medium' },
      { id: 3, question: '¿Qué formato usa Nostr para representar claves públicas de forma legible?', answers: ['npub (bech32)', 'Base58', 'PEM', 'Base64url'], correct: 0, difficulty: 'easy' },
      { id: 4, question: '¿Qué NIP permite firmar eventos desde el navegador sin exponer la clave privada?', answers: ['NIP-07', 'NIP-05', 'NIP-26', 'NIP-42'], correct: 0, difficulty: 'medium' },
      { id: 5, question: '¿Qué tipo de criptografía usa Nostr para la identidad de usuarios?', answers: ['Curva elíptica secp256k1 (la misma que Bitcoin)', 'RSA-2048', 'Ed25519', 'AES-256'], correct: 0, difficulty: 'hard' },
      { id: 6, question: '¿Qué NIP define los "badges" (insignias) verificables en Nostr?', answers: ['NIP-58', 'NIP-05', 'NIP-30', 'NIP-42'], correct: 0, difficulty: 'hard' },
      { id: 7, question: '¿Cómo se llama la delegación de identidad en Nostr?', answers: ['NIP-26 (Delegated Event Signing)', 'NIP-05', 'NIP-42', 'NIP-65'], correct: 0, difficulty: 'hard' },
      { id: 8, question: '¿Qué campo del evento Nostr identifica al autor?', answers: ['pubkey', 'id', 'sig', 'kind'], correct: 0, difficulty: 'easy' },
      { id: 9, question: '¿Qué ventaja tiene la identidad en Nostr frente a Twitter/X?', answers: ['Eres dueño de tu identidad (tu clave privada), nadie te puede censurar', 'Tu cuenta está verificada automáticamente', 'Tienes un nombre único garantizado', 'Tu identidad está ligada a tu email'], correct: 0, difficulty: 'medium' },
    ],
    creator: 'hackathon-demo', participants: 42,
  },
  {
    id: 'quiz-la-crypta',
    title: 'La Crypta',
    description: 'Comunidad cypherpunk y Bitcoin de Buenos Aires',
    questions: [
      { id: 101, question: '¿Qué es La Crypta?', answers: ['Una comunidad cypherpunk y espacio Bitcoin en Buenos Aires', 'Un exchange de criptomonedas argentino', 'Un wallet de Bitcoin', 'Una empresa de minería de Bitcoin'], correct: 0, difficulty: 'easy' },
      { id: 102, question: '¿Qué tipo de eventos organiza La Crypta principalmente?', answers: ['Hackathones, meetups y talleres sobre Bitcoin, Lightning y Nostr', 'Conferencias de trading', 'Cursos de finanzas tradicionales', 'Eventos de marketing digital'], correct: 0, difficulty: 'easy' },
      { id: 103, question: '¿Qué protocolo de pagos usa La Crypta para transacciones rápidas?', answers: ['Lightning Network', 'SWIFT', 'PayPal', 'Ethereum L2'], correct: 0, difficulty: 'medium' },
      { id: 104, question: '¿Cuál es la filosofía principal de La Crypta?', answers: ['Soberanía individual, privacidad y software libre — valores cypherpunk', 'Maximizar profits en DeFi', 'Promover regulación bancaria', 'Vender NFTs'], correct: 0, difficulty: 'medium' },
      { id: 105, question: '¿Qué temática tiene el hackathon 2026 de La Crypta?', answers: ['Identidad descentralizada y redes sociales (Identity & Social)', 'DeFi y yield farming', 'Metaverso y realidad virtual', 'Gaming blockchain'], correct: 0, difficulty: 'easy' },
      { id: 106, question: '¿En qué CC El Gorila se la comió entera con el usuario Kerry Kaberga?', answers: ['CC 169', 'CC 133', 'CC 157', 'CC 132'], correct: 1, difficulty: 'hard' },
    ],
    creator: 'hackathon-demo', participants: 21,
  },
  {
    id: 'quiz-bitcoin',
    title: 'Bitcoin Fundamentals',
    description: 'Conceptos fundamentales de Bitcoin para verdaderos cypherpunks',
    questions: [
      { id: 201, question: '¿Quién publicó el whitepaper de Bitcoin en 2008?', answers: ['Satoshi Nakamoto', 'Vitalik Buterin', 'Hal Finney', 'Nick Szabo'], correct: 0, difficulty: 'easy' },
      { id: 202, question: '¿Cuál es el suministro máximo de Bitcoin?', answers: ['21 millones', '100 millones', '18.5 millones', 'Ilimitado'], correct: 0, difficulty: 'easy' },
      { id: 203, question: '¿Qué es el "halving" de Bitcoin?', answers: ['La reducción a la mitad de la recompensa por bloque cada ~4 años', 'La división de la blockchain en dos', 'La reducción del tamaño de bloque', 'El proceso de quemar Bitcoin'], correct: 0, difficulty: 'medium' },
      { id: 204, question: '¿Qué mensaje dejó Satoshi en el bloque génesis?', answers: ['The Times 03/Jan/2009 Chancellor on brink of second bailout for banks', 'Hello World', 'In code we trust', 'The revolution will not be centralized'], correct: 0, difficulty: 'hard' },
      { id: 205, question: '¿Qué problema fundamental resuelve Bitcoin sin terceros?', answers: ['El problema del doble gasto (double-spending)', 'El problema de escalabilidad', 'El problema de interoperabilidad', 'El problema de almacenamiento'], correct: 0, difficulty: 'medium' },
    ],
    creator: 'hackathon-demo', participants: 69,
  },
];

export const useQuizStore = create((set, get) => ({
  quizzes: [],
  answers: [],

  createQuiz: async (quizData) => {
    try {
      const { signEvent, pubkey, isReadOnly } = useAuthStore.getState();
      if (isReadOnly) {
        set((state) => ({ quizzes: [...state.quizzes, { id: `quiz-${Date.now()}`, ...quizData }] }));
        return null;
      }
      const event = {
        kind: 30023,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', `quiz-${Date.now()}`], ['title', quizData.title], ['summary', quizData.description], ['type', 'kahoot-quiz']],
        content: JSON.stringify({ title: quizData.title, description: quizData.description, questions: quizData.questions, creator: pubkey, createdAt: quizData.createdAt, participants: 0 }),
        pubkey,
      };
      const signedEvent = await signEvent(event);
      if (!signedEvent) throw new Error('Could not sign event');
      set((state) => ({ quizzes: [...state.quizzes, { id: `quiz-${Date.now()}`, ...quizData }] }));
      return signedEvent;
    } catch (error) { console.error('Error creating quiz:', error); throw error; }
  },

  loadQuizzesFromNostr: async () => {
    try { set({ quizzes: DEMO_QUIZZES }); }
    catch (error) { console.error('Error loading quizzes:', error); }
  },

  getQuizById: async (quizId) => {
    const { quizzes } = get();
    // Search loaded quizzes first, fall back to DEMO_QUIZZES directly
    return quizzes.find((q) => q.id === quizId)
      || DEMO_QUIZZES.find((q) => q.id === quizId)
      || null;
  },

  saveAnswer: async (answerData) => {
    try {
      const { signEvent, pubkey, isReadOnly } = useAuthStore.getState();
      if (isReadOnly) {
        set((state) => ({ answers: [...state.answers, { ...answerData, timestamp: new Date().toISOString() }] }));
        return null;
      }
      const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['quiz', answerData.quizId], ['question', String(answerData.questionId)], ['answer', answerData.answer.toString()]],
        content: JSON.stringify({ quizId: answerData.quizId, questionId: answerData.questionId, answer: answerData.answer, correct: answerData.correct, timestamp: new Date().toISOString() }),
        pubkey,
      };
      const signedEvent = await signEvent(event);
      if (!signedEvent) throw new Error('Could not sign answer');
      set((state) => ({ answers: [...state.answers, signedEvent] }));
      return signedEvent;
    } catch (error) { console.error('Error saving answer:', error); throw error; }
  },

  getQuizResults: async (quizId) => {
    const { answers } = get();
    return answers.filter((a) => a.tags ? a.tags.some((t) => t[0] === 'quiz' && t[1] === quizId) : a.quizId === quizId);
  },
}));
