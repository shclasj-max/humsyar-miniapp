export default function AuthError({ error }) {
  const isNotReg = error === 'not_registered';
  const isPending = error === 'pending_approval';
  const isSuspended = error === 'suspended';
  const isTelegramRequired = error === 'telegram_required';
  const isNetwork = error === 'network_error';

  const icon =
    isNotReg
      ? '🩺'
      : isPending
        ? '⏳'
        : isSuspended
          ? '🚫'
          : isTelegramRequired
            ? '📱'
            : isNetwork
              ? '🌐'
              : '❌';

  const title =
    isNotReg
      ? 'ثبت‌نام نشده‌اید'
      : isPending
        ? 'در انتظار تأیید'
        : isSuspended
          ? 'حساب تعلیق شده'
          : isTelegramRequired
            ? 'بازکردن از داخل تلگرام'
            : isNetwork
              ? 'اتصال برقرار نشد'
              : 'خطا در احراز هویت';

  const message =
    isNotReg
      ? 'برای استفاده از Mini App هامزیار باید ابتدا در ربات تلگرام ثبت‌نام کنید.'
      : isPending
        ? 'ثبت‌نام شما دریافت شده و منتظر تأیید ادمین است.'
        : isSuspended
          ? 'حساب کاربری شما تعلیق شده. برای رفع مشکل با پشتیبانی تماس بگیرید.'
          : isTelegramRequired
            ? 'این برنامه باید از طریق دکمهٔ Mini App داخل ربات هامزیار باز شود.'
            : isNetwork
              ? 'اتصال به سرور برقرار نشد. اینترنت و آدرس API را بررسی کنید و دوباره تلاش کنید.'
              : 'اطلاعات ورود معتبر نیست یا نشست شما منقضی شده است. Mini App را از داخل ربات دوباره باز کنید.';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: 24,
        textAlign: 'center',
        background: 'var(--bg)',
        gap: 20,
      }}
    >
      <div style={{ fontSize: 64 }}>
        {icon}
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--tx)',
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: 'var(--tx2)',
          lineHeight: 1.8,
          maxWidth: 280,
          fontSize: 13,
        }}
      >
        {message}
      </div>

      {isNotReg && (
        <div
          style={{
            background: 'var(--acc-soft)',
            border: '1px solid var(--bdg)',
            borderRadius: 'var(--r-lg)',
            padding: 14,
            maxWidth: 280,
            width: '100%',
            fontSize: 13,
            color: 'var(--tx2)',
            lineHeight: 1.7,
          }}
        >
          👈 ربات هامزیار را پیدا کن و /start بزن
        </div>
      )}
    </div>
  );
}
