export const tg = window.Telegram?.WebApp;

// تلگرام دسکتاپ نسخه‌ی WebApp قدیمی‌تری داره و روی متدهایی که موبایل
// پشتیبانی می‌کنه (مثلاً setHeaderColor با کد رنگ دلخواه) اکسپشن پرت می‌کنه.
// چون initTelegram توی useEffect اصلی App صدا زده می‌شه، یه خطای catch‌نشده
// اینجا کل رندر اپ رو متوقف می‌کنه و کاربر با صفحه‌ی سفید/لود دائمی می‌مونه.
// برای همین هر متد جدا try/catch می‌شه تا یکی خراب بشه بقیه اجرا بشن.
function safeCall(fn) {
  try { fn(); } catch (e) { console.warn('[telegram webapp]', e); }
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
export const getTgUser   = () => tg?.initDataUnsafe?.user || null;
export const haptic      = (t='light') => tg?.HapticFeedback?.impactOccurred(t);
export const hapticNotif = (t='success') => tg?.HapticFeedback?.notificationOccurred(t);
export const isTelegram  = !!tg;
