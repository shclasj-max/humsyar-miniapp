import { create } from 'zustand';
import { hapticNotif } from '../lib/telegram';

let _id = 0;

export const useUIStore = create((set) => ({
  toasts: [],
  toast: (msg, type = 'info', ms = 2600) => {
    const id = ++_id;

    /* ✅ بازخورد لمسی سینک با نوع پیام —
       مثل اپ‌های نیتیو درجه یک */
    if (type === 'success') hapticNotif('success');
    else if (type === 'error') hapticNotif('error');
    else if (type === 'warning') hapticNotif('warning');

    set(s => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), ms);
  },

  /* ✅ Onboarding — ورود اول + اجرای دستی از پروفایل.
     onboardingDone فلگ حافظه‌ای نشست جاری است تا اگر
     localStorage در WebView تلگرام سایلنت فیل کرد،
     صفحه معرفی هرگز گیر نکند. */
  showOnboarding: false,
  onboardingDone: false,
  openOnboarding: () => set({ showOnboarding: true, onboardingDone: false }),
  closeOnboarding: () => set({ showOnboarding: false, onboardingDone: true }),
}));
