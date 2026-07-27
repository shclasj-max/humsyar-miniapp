export const tg = window.Telegram?.WebApp;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0A0E1A');
  tg.setBackgroundColor('#0A0E1A');
  tg.enableClosingConfirmation();
}

export const getInitData = () => tg?.initData || '';
export const getTgUser   = () => tg?.initDataUnsafe?.user || null;
export const haptic      = (t='light') => tg?.HapticFeedback?.impactOccurred(t);
export const hapticNotif = (t='success') => tg?.HapticFeedback?.notificationOccurred(t);
export const isTelegram  = !!tg;
