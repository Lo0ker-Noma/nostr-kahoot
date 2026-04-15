import { create } from 'zustand';
import { useAuthStore } from './authStore';

const NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.info',
  'wss://nostr.wine'
];

export const useQuizStore = create((set, get) => ({
  quizzes: [],
  answers: [],

  // Crear un nuevo quiz y publicarlo en Nostr
  createQuiz: async (quizData) => {
    try {
      const { signEvent, pubkey } = useAuthStore.getState();

      // Preparar evento Nostr (KIND 30023 para contenido editable)
      const event = {
        kind: 30023,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['d', `quiz-${Date.now()}`],
          ['title', quizData.title],
          ['summary', quizData.description],
          ['type', 'kahoot-quiz']
        ],
        content: JSON.stringify({
          title: quizData.title,
          description: quizData.description,
          questions: quizData.questions,
          creator: pubkey,
          createdAt: quizData.createdAt,
          participants: 0
        }),
        pubkey: pubkey
      };

      // Firmar el evento
      const signedEvent = await signEvent(event);

      if (!signedEvent) {
        throw new Error('No se pudo firmar el evento');
      }

      // Aquí iría la publicación a relays (en versión simplificada)
      // En producción, conectarías a los relays WebSocket y publicarías el evento
      console.log('Quiz publicado:', signedEvent);

      // Añadir a la lista local
      set((state) => ({
        quizzes: [...state.quizzes, { id: `quiz-${Date.now()}`, ...quizData }]
      }));

      return signedEvent;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },

  // Cargar quizzes desde Nostr
  loadQuizzesFromNostr: async () => {
    try {
      // En producción, aquí conectarías a los relays y buscarías eventos con kind 30023 y tag 'kahoot-quiz'
      // Por ahora, retornamos quizzes de demostración
      const demoQuizzes = [
        {
          id: 'quiz-nostr-basics',
          title: 'Conceptos Básicos de Nostr',
          description: 'Aprende sobre el protocolo descentralizado Nostr',
          questions: [
            {
              id: 1,
              question: '¿Qué significa Nostr?',
              answers: ['Notes and Other Stuff Transmitted by Relays', 'Network Over String Transmission', 'New Open System for Text Relay'],
              correct: 0,
              difficulty: 'easy'
            }
          ],
          creator: 'demo',
          participants: 42
        }
      ];

      set({ quizzes: demoQuizzes });
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  },

  // Obtener un quiz por ID
  getQuizById: async (quizId) => {
    const { quizzes } = get();
    const quiz = quizzes.find(q => q.id === quizId);

    if (quiz) {
      return quiz;
    }

    // Si no está en la lista local, buscar en Nostr
    try {
      // Aquí iría la búsqueda en relays
      return null;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return null;
    }
  },

  // Guardar respuesta de un jugador
  saveAnswer: async (answerData) => {
    try {
      const { signEvent, pubkey } = useAuthStore.getState();

      // Crear evento Nostr para la respuesta (KIND 1)
      const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['quiz', answerData.quizId],
          ['question', answerData.questionId],
          ['answer', answerData.answer.toString()]
        ],
        content: JSON.stringify({
          quizId: answerData.quizId,
          questionId: answerData.questionId,
          answer: answerData.answer,
          correct: answerData.correct,
          timestamp: new Date().toISOString()
        }),
        pubkey: pubkey
      };

      const signedEvent = await signEvent(event);

      if (!signedEvent) {
        throw new Error('No se pudo firmar la respuesta');
      }

      // Guardar localmente
      set((state) => ({
        answers: [...state.answers, signedEvent]
      }));

      console.log('Respuesta guardada:', signedEvent);
      return signedEvent;
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
  },

  // Obtener resultados de un quiz
  getQuizResults: async (quizId) => {
    try {
      // En producción, aquí buscarías todos los eventos de respuestas para el quiz
      // y compilarías los resultados
      const { answers } = get();
      return answers.filter(a => a.tags.some(t => t[0] === 'quiz' && t[1] === quizId));
    } catch (error) {
      console.error('Error fetching results:', error);
      return [];
    }
  }
}));
