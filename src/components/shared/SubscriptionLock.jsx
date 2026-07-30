import {
  useNavigate,
} from 'react-router-dom';

import {
  haptic,
} from '../../lib/telegram';


/* ─────────────────────────────────────────────
   🔒 صفحه‌ی قفل اشتراک (Sync با ربات)

   بک‌اند مرجع نهایی است: وقتی GETِ بخش محافظت‌شده
   با 403 + detail='subscription_required' جواب
   بدهد (همان قانونِ واحدِ has_access ربات)،
   صفحه‌های علوم پایه/رفرنس به‌جای کارت خطای
   عمومی این صفحه را می‌آورند. هیچ قضاوتِ
   اشتراکی سمت فرانت انجام نمی‌شود.

   زبان بصری = همان کارت مرجعِ برنامه درسی:
   card-glow + گرادیان hero ــــــــــــــــ */
const BENEFITS = [
  {
    icon: '🔬',
    text: 'همه‌ی محتوای جلسات علوم پایه (ویدیو، جزوه، پاورپوینت)',
  },

  {
    icon: '📖',
    text: 'کتاب‌های مرجع فارسی و لاتین به‌صورت کامل',
  },

  {
    icon: '📥',
    text: 'دانلود مستقیم در تلگرام بدون محدودیت',
  },

  {
    icon: '🔄',
    text: 'دسترسی هم‌زمان در ربات و مینی‌اپ با یک اشتراک',
  },
];



/* تشخیص قفل اشتراک از روی خطای axios —
   بک‌اند با 403 + این detail پاسخ می‌دهد */
export function isSubscriptionLock(
  error,
) {
  return (
    error?.response?.status === 403 &&
    error?.response?.data?.detail ===
      'subscription_required'
  );
}


export default function SubscriptionLock({
  feature = 'این بخش',
}) {
  const navigate =
    useNavigate();


  const goPlans = () => {
    haptic('light');

    navigate(
      '/me/subscription',
    );
  };


  return (
    <section
      className={
        'card card-glow fade-up'
      }
      style={{
        padding: 22,

        textAlign: 'center',

        /* زبان hero ـــ دمِ بنفش برای حس
           «محتوای ویژه» هم‌راستا با شاخه‌ی
           رفرنس/منابع */
        background:
          'linear-gradient(145deg,rgba(29,78,216,.2),rgba(16,24,39,.95) 55%,rgba(139,92,246,.08))',
      }}
    >
      <div
        style={{
          display: 'grid',
          width: 66,
          height: 66,
          placeItems: 'center',
          margin: '0 auto',

          background:
            'rgba(139,92,246,.12)',

          border:
            '1px solid rgba(139,92,246,.3)',

          borderRadius: 20,
          fontSize: 30,
        }}
      >
        🔒
      </div>

      <h2
        style={{
          marginTop: 13,
          fontSize: 15.5,
          fontWeight: 900,
        }}
      >
        {feature} مخصوص مشترک‌هاست
      </h2>

      <p
        style={{
          marginTop: 7,
          color: 'var(--tx2)',
          fontSize: 11,
          lineHeight: 1.9,
        }}
      >
        برای باز شدن کامل این بخش، یکی از
        پلن‌های اشتراک را فعال کنید؛ دسترسی
        شما بلافاصله در ربات و مینی‌اپ
        هم‌زمان باز می‌شود.
      </p>

      <div
        style={{
          display: 'grid',
          gap: 8,
          marginTop: 15,
          textAlign: 'right',
        }}
      >
        {BENEFITS.map(
          (item) => (
            <div
              key={item.icon}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,

                padding: '9px 12px',

                background:
                  'rgba(255,255,255,.03)',

                border:
                  '1px solid rgba(148,163,184,.1)',

                borderRadius: 12,
                fontSize: 10,
                lineHeight: 1.7,
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>

              <span>{item.text}</span>
            </div>
          ),
        )}
      </div>

      <button
        type="button"
        className={
          'btn btn-p btn-full'
        }
        style={{
          marginTop: 16,
        }}
        onClick={goPlans}
      >
        💎 مشاهده پلن‌ها و فعال‌سازی
      </button>
    </section>
  );
}
