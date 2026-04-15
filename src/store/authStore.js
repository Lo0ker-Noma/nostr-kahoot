import { create } from 'zustand';
import { getPublicKey, finalizeEvent } from 'nostr-tools';

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,
  pubkey: null,
  nostrWindow: null,

  // Inicializar conexión con NIP-07 (extensión del navegador)
  initNostr: async () => {
    if (window.nostr) {
      try {
        const pubkey = await window.nostr.getPublicKey();
        set({
          pubkey,
          isAuthenticated: true,
          nostrWindow: window.nostr
        });

        // Obtener metadata del usuario desde Nostr relays
        const userData = await get().fetchUserMetadata(pubkey);
        set({ user: userData });

        return true;
      } catch (error) {
        console.error('Error al conectar con Nostr:', error);
        return false;
      }
    }
    return false;
  },

  // Buscar metadata del usuario en los relays
  fetchUserMetadata: async (pubkey) => {
    try {
      // Por ahora retornamos datos básicos
      // En producción, conectaríamos a relays para obtener metadata NIP-05
      return {
        pubkey,
        name: `User ${pubkey.slice(0, 8)}`,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pubkey}`,
      };
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return { pubkey, name: 'Anónimo', picture: '' };
    }
  },

  // Firmar un evento Nostr
  signEvent: async (event) => {
    if (!window.nostr) return null;
    try {
      return await window.nostr.signEvent(event);
    } catch (error) {
      console.error('Error signing event:', error);
      return null;
    }
  },

  // Verificar si hay autenticación previa
  checkExistingAuth: async () => {
    if (window.nostr) {
      try {
        const pubkey = await window.nostr.getPublicKey();
        const userData = await get().fetchUserMetadata(pubkey);
        set({
          pubkey,
          user: userData,
          isAuthenticated: true,
          nostrWindow: window.nostr
        });
      } catch (error) {
        console.log('No hay autenticación previa');
      }
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      user: null,
      pubkey: null,
      nostrWindow: null
    });
  }
}));
