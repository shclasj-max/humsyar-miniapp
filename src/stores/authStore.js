import { create } from 'zustand';
import api from '../lib/api';
import { getTgUser } from '../lib/telegram';

export const useAuthStore = create((set) => ({
  user:    null,
  tgUser:  null,
  loading: true,
  error:   null,

  init: async () => {
    const tgUser = getTgUser();
    set({ tgUser });
    try {
      const res = await api.get('/api/profile');
      set({ user: res.data.user, loading: false, error: null });
    } catch (err) {
      const detail = err.response?.data?.detail;
      set({ loading: false, error: detail || 'error' });
    }
  },

  refresh: async () => {
    try {
      const res = await api.get('/api/profile');
      set({ user: res.data.user });
    } catch (_) {}
  },
}));
