export const tg =
  typeof window !== 'undefined'
    ? window.Telegram?.WebApp
    : undefined;

function safeCall(fn) {
  try {
    fn();
  } catch (error) {
    console.warn('[telegram webapp]', error);
  }
}

export function initTelegram() {
  if (!tg) return;

  safeCall(() => tg.ready());
  safeCall(() => tg.expand());
  safeCall(() => tg.setHeaderColor('#0A0E1A'));
  safeCall(() => tg.setBackgroundColor('#0A0E1A'));
  safeCall(() => tg.enableClosingConfirmation());
}

export const getInitData = () => tg?.initData || '';

export const getTgUser = () =>
  tg?.initDataUnsafe?.user || null;

export const haptic = (type = 'light') => {
  safeCall(() => tg?.HapticFeedback?.impactOccurred(type));
};

export const hapticNotif = (type = 'success') => {
  safeCall(() =>
    tg?.HapticFeedback?.notificationOccurred(type)
  );
};

export const isTelegram = Boolean(tg);
