import {
  useEffect,
} from 'react';

import {
  tg,
  haptic,
} from '../../lib/telegram';


const STATES = {
  telegram_required: {
    icon:
      '📱',

    title:
      'از داخل تلگرام باز کنید',

    message:
      'این Mini App باید از طریق دکمهٔ مخصوص داخل ربات هامزیار باز شود.',

    color:
      '#70A7FF',

    soft:
      'rgba(59,130,246,.13)',

    retry:
      false,
  },

  not_registered: {
    icon:
      '👤',

    title:
      'ابتدا در ربات ثبت‌نام کنید',

    message:
      'حساب تلگرام شما هنوز در هامزیار ثبت نشده است. به ربات برگردید، دستور /start را بزنید و مراحل ثبت‌نام را انجام دهید.',

    color:
      '#FCD34D',

    soft:
      'rgba(245,158,11,.13)',

    retry:
      true,
  },

  pending_approval: {
    icon:
      '⏳',

    title:
      'در انتظار تأیید مدیریت',

    message:
      'ثبت‌نام شما انجام شده اما حساب هنوز توسط مدیریت تأیید نشده است. بعد از تأیید دوباره تلاش کنید.',

    color:
      '#FCD34D',

    soft:
      'rgba(245,158,11,.13)',

    retry:
      true,
  },

  suspended: {
    icon:
      '🚫',

    title:
      'دسترسی حساب تعلیق شده',

    message:
      'دسترسی این حساب موقتاً غیرفعال شده است. برای پیگیری با مدیریت یا پشتیبانی هامزیار تماس بگیرید.',

    color:
      '#FB7185',

    soft:
      'rgba(239,68,68,.13)',

    retry:
      false,
  },

  network_error: {
    icon:
      '🌐',

    title:
      'ارتباط با سرور برقرار نشد',

    message:
      'اتصال اینترنت یا سرور هامزیار در دسترس نیست. اینترنت خود را بررسی کنید و دوباره تلاش کنید.',

    color:
      '#22D3EE',

    soft:
      'rgba(34,211,238,.13)',

    retry:
      true,
  },

  init_data_expired: {
    icon:
      '⌛',

    title:
      'نشست شما منقضی شده',

    message:
      'برای حفظ امنیت، نشست Mini App منقضی شده است. برنامه را ببندید و دوباره از داخل ربات باز کنید.',

    color:
      '#FCD34D',

    soft:
      'rgba(245,158,11,.13)',

    retry:
      false,
  },

  invalid_init_data: {
    icon:
      '🔐',

    title:
      'اطلاعات ورود معتبر نیست',

    message:
      'احراز هویت تلگرام انجام نشد. Mini App را ببندید و مجدداً از داخل ربات هامزیار باز کنید.',

    color:
      '#FB7185',

    soft:
      'rgba(239,68,68,.13)',

    retry:
      false,
  },
};


export default function AuthError({
  error,
}) {
  const state =
    STATES[error] || {
      icon:
        '⚠️',

      title:
        'مشکلی پیش آمده است',

      message:
        'امکان ورود به هامزیار وجود ندارد. چند لحظه بعد دوباره تلاش کنید.',

      color:
        '#FB7185',

      soft:
        'rgba(239,68,68,.13)',

      retry:
        true,
    };


  /* صفحه فول‌اسکرین خطا → دکمه بک
     نیتیو تلگرام نباید قابل دیدن باشد */
  useEffect(() => {
    try {
      tg?.BackButton?.hide?.();
    } catch (_) {
      /* نسخه قدیمی */
    }
  }, []);


  const reload = () => {
    haptic('light');

    window.location.reload();
  };


  const close = () => {
    haptic('light');

    try {
      tg?.close?.();

    } catch (_) {
      window.history.back();
    }
  };


  return (
    <main
      dir="rtl"
      style={{
        position:
          'relative',

        display:
          'flex',

        alignItems:
          'center',

        justifyContent:
          'center',

        width:
          '100%',

        minHeight:
          '100dvh',

        padding:
          '24px 16px',

        overflow:
          'hidden',

        color:
          'var(--tx)',

        background:
          'var(--grad-page),linear-gradient(180deg,var(--bg-soft),var(--bg))',
      }}
    >
      <div
        style={{
          position:
            'absolute',

          top:
            '12%',

          width:
            250,

          height:
            250,

          borderRadius:
            '50%',

          background:
            state.soft,

          filter:
            'blur(55px)',
        }}
      />

      <section
        className={
          'card card-glow fade-up'
        }
        style={{
          position:
            'relative',

          width:
            '100%',

          maxWidth:
            390,

          padding:
            22,

          textAlign:
            'center',
        }}
      >
        <div
          style={{
            display:
              'grid',

            width:
              72,

            height:
              72,

            placeItems:
              'center',

            margin:
              '0 auto',

            background:
              state.soft,

            border:
              `1px solid ${
                state.color
              }35`,

            borderRadius:
              23,

            boxShadow:
              `0 10px 30px ${
                state.color
              }18`,

            fontSize:
              35,
          }}
        >
          {state.icon}
        </div>

        <h1
          style={{
            marginTop:
              16,

            fontSize:
              18,

            fontWeight:
              900,
          }}
        >
          {state.title}
        </h1>

        <p
          style={{
            marginTop:
              8,

            color:
              'var(--tx2)',

            fontSize:
              11,

            lineHeight:
              1.9,
          }}
        >
          {state.message}
        </p>


        {error ===
          'not_registered' && (
          <div
            style={{
              marginTop:
                14,

              padding:
                '10px 11px',

              color:
                'var(--tx2)',

              background:
                'rgba(100,116,139,.08)',

              borderRadius:
                12,

              fontSize:
                10,

              lineHeight:
                1.8,
            }}
          >
            ۱. به گفت‌وگوی ربات
            برگردید

            <br />

            ۲. دستور{' '}

            <b>/start</b>{' '}

            را ارسال کنید

            <br />

            ۳. بعد از ثبت‌نام Mini App
            را دوباره باز کنید
          </div>
        )}


        <div
          style={{
            display:
              'grid',

            gap:
              8,

            marginTop:
              18,
          }}
        >
          {state.retry && (
            <button
              type="button"
              className={
                'btn btn-p btn-full'
              }
              onClick={reload}
            >
              ↻ تلاش دوباره
            </button>
          )}

          <button
            type="button"
            className={
              'btn btn-dark btn-full'
            }
            onClick={close}
          >
            {tg
              ? 'بازگشت به تلگرام'
              : 'بازگشت'}
          </button>
        </div>


        <div
          style={{
            marginTop:
              15,

            color:
              'var(--txm)',

            fontSize:
              8.5,
          }}
        >
          کد وضعیت:{' '}

          {error ||
            'unknown_error'}
        </div>
      </section>
    </main>
  );
}
