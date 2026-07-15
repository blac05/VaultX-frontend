/**
 * VaultX — Global State Store (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = useVaultStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const deviceId = localStorage.getItem('vaultx_device_id');
  if (deviceId) config.headers['X-Device-ID'] = deviceId;
  return config;
});

api.interceptors.response.use(
  r => r,
  async (error) => {
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      const store = useVaultStore.getState();
      try {
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: store.refreshToken });
        store.setTokens(res.data.accessToken, res.data.refreshToken);
        error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api.request(error.config);
      } catch { store.logout(); }
    }
    return Promise.reject(error);
  }
);

export { api };

function getDeviceId() {
  let id = localStorage.getItem('vaultx_device_id');
  if (!id) {
    id = 'dev_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('vaultx_device_id', id);
  }
  return id;
}

const useVaultStore = create(
  persist(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────
      user: null, accessToken: null, refreshToken: null,
      isAuthenticated: false, deviceId: getDeviceId(),

      // ── Financial ────────────────────────────────────────
      cards: [], transactions: [], summary: null,
      liveTransaction: null,

      // ── Notifications ────────────────────────────────────
      unreadCount: 0, pendingRequests: 0,

      // ── UI / Socket ──────────────────────────────────────
      isLoading: false, socket: null,
      biometricToken: null, biometricExpiry: null,

      // ── Auth actions ──────────────────────────────────────
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      login: async (identifier, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', {
            identifier, password, deviceId: get().deviceId, deviceName: navigator.userAgent
          });
          const { user, accessToken, refreshToken } = res.data;
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
          get().connectSocket(accessToken);
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', data);
          const { user, accessToken, refreshToken } = res.data;
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
          get().connectSocket(accessToken);
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.response?.data?.error || 'Registration failed' };
        }
      },

      logout: () => {
        get().socket?.disconnect();
        set({
          user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
          socket: null, cards: [], transactions: [], summary: null,
          biometricToken: null, unreadCount: 0, pendingRequests: 0
        });
      },

      refreshUser: async () => {
        try { const res = await api.get('/auth/me'); set({ user: res.data.user }); } catch {}
      },

      // ── Biometric ─────────────────────────────────────────
      requestBiometricToken: async (biometricType = 'face_id', biometricScore = 0.98) => {
        const res = await api.post('/auth/biometric-token', { biometricType, biometricScore });
        set({ biometricToken: res.data.biometricToken, biometricExpiry: Date.now() + res.data.expiresIn * 1000 });
        return res.data.biometricToken;
      },
      isBiometricValid: () => {
        const { biometricToken, biometricExpiry } = get();
        return biometricToken && biometricExpiry && Date.now() < biometricExpiry;
      },

      // ── Cards ─────────────────────────────────────────────
      fetchCards: async () => {
        try { const r = await api.get('/cards'); set({ cards: r.data.cards }); } catch {}
      },
      addCard: async (cardData) => {
        try {
          const r = await api.post('/cards/tokenize', cardData);
          set(s => ({ cards: [...s.cards, r.data.card] }));
          return { success: true, card: r.data.card };
        } catch (err) { return { success: false, error: err.response?.data?.error || 'Failed to add card' }; }
      },
      removeCard: async (cardId) => {
        try {
          await api.delete(`/cards/${cardId}`);
          set(s => ({ cards: s.cards.filter(c => c.id !== cardId) }));
          return { success: true };
        } catch (err) { return { success: false, error: err.response?.data?.error }; }
      },

      // ── Transactions ─────────────────────────────────────
      fetchTransactions: async (params = {}) => {
        try { const r = await api.get('/transfers/history', { params }); set({ transactions: r.data.transactions }); return r.data; }
        catch { return { transactions: [] }; }
      },
      fetchSummary: async () => {
        try { const r = await api.get('/transfers/stats/summary'); set({ summary: r.data.summary }); } catch {}
      },

      // ── Transfer ──────────────────────────────────────────
      resolveRecipient: async (handle) => {
        const r = await api.get('/transfers/resolve/recipient', { params: { handle } });
        return r.data.recipient;
      },
      getFXRate: async (from, to, amount) => {
        const r = await api.get('/transfers/fx/rate', { params: { from, to, amount } });
        return r.data.fx;
      },
      initiateTransfer: async (transferData) => {
        const biometricToken = get().biometricToken;
        if (!biometricToken) throw new Error('Biometric authentication required');
        const r = await api.post('/transfers/initiate', transferData, {
          headers: { 'X-Biometric-Token': biometricToken }
        });
        if (r.data.success) set({ liveTransaction: r.data.transaction });
        return r.data;
      },
      setLiveTransaction: (txn) => set({ liveTransaction: txn }),
      clearLiveTransaction: () => set({ liveTransaction: null }),

      // ── Notifications ────────────────────────────────────
      fetchUnreadCount: async () => {
        try { const r = await api.get('/notifications/unread-count'); set({ unreadCount: r.data.count || 0 }); } catch {}
      },
      fetchPendingRequests: async () => {
        try { const r = await api.get('/requests/pending-count'); set({ pendingRequests: r.data.count || 0 }); } catch {}
      },

      // ── Socket ───────────────────────────────────────────
      connectSocket: (token) => {
        const existing = get().socket;
        if (existing?.connected) return;
        const socket = io('/', {
          auth: { token }, transports: ['websocket'],
          reconnection: true, reconnectionDelay: 1000
        });

        socket.on('transfer:update', (data) => {
          set(s => ({
            liveTransaction: s.liveTransaction?.txId === data.txId
              ? { ...s.liveTransaction, ...data } : s.liveTransaction
          }));
        });
        socket.on('transfer:settled', () => { get().fetchSummary(); get().refreshUser(); });
        socket.on('transfer:received', () => { get().fetchSummary(); });
        socket.on('notification:new', ({ unreadCount }) => { set({ unreadCount }); });
        socket.on('security:account_frozen', () => { get().logout(); });

        set({ socket });
      }
    }),
    {
      name: 'vaultx-store',
      partialize: s => ({
        accessToken: s.accessToken, refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated, user: s.user, deviceId: s.deviceId
      })
    }
  )
);

export default useVaultStore;
