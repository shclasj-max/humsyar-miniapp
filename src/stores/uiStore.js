import { create } from 'zustand';
let _id = 0;

export const useUIStore = create((set) => ({
  toasts: [],
  toast: (msg, type = 'info', ms = 2600) => {
    const id = ++_id;
    set(s => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), ms);
  },
}));
