import {
  useMutation,
  useQuery,
} from '@tanstack/react-query';

import {
  useNavigate,
} from 'react-router-dom';

import api from '../../lib/api';
import Header from '../../components/layout/Header';

import {
  SkeletonCard,
  Spinner,
} from '../../components/shared/Loading';

import {
  haptic,
  hapticNotif,
} from '../../lib/telegram';

import {
  useUIStore,
} from '../../stores/uiStore';


const number = (value) =>
  Math.max(
    0,
    Number(value) || 0
  );


function Stat({
  icon,
  value,
  label,
  color,
  soft,
}) {
  return (
    <div
      className="card"
      style={{
        padding: 12,

        display:
          'flex',

        alignItems:
          'center',

        gap:
          9,
      }}
    >
      <span
        style={{
          display:
            'grid',

          width:
            38,

          height:
            38,

          placeItems:
            'center',

          borderRadius:
            12,

          background:
            soft,

          fontSize:
            18,
        }}
      >
        {icon}
      </span>

      <div>
        <b
          style={{
            display:
              'block',

            color,

            fontSize:
              18,
          }}
        >
          {value}
        </b>

        <span
          style={{
            color:
              'var(--txm)',

            fontSize:
              9,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}


const SECTIONS = [
  {
    icon: '👥',
    title: 'مدیریت کاربران',

    desc:
      'جست‌وجو، تأیید، ویرایش و تعلیق',

    route:
      '/admin/users',

    color:
      '#70A7FF',

    soft:
      'rgba(59,130,246,.12)',
  },

  {
    icon: '📅',
    title: 'مدیریت ورودی‌ها',

    desc:
      'ورودی‌ها، گروه‌ها و آمار دانشجویان',

    route:
      '/admin/intakes',

    color:
      '#34D399',

    soft:
      'rgba(16,185,129,.12)',
  },

  {
    icon: '🎓',
    title: 'مدیران محتوا',

    desc:
      'اعطا و لغو دسترسی محتوا',

    route:
      '/admin/content-admins',

    color:
      '#C4B5FD',

    soft:
      'rgba(139,92,246,.13)',
  },

  {
    icon: '🎫',
    title: 'تیکت‌های پشتیبانی',

    desc:
      'پاسخ، بستن و بازگشایی تیکت',

    route:
      '/admin/tickets',

    color:
      '#FCD34D',

    soft:
      'rgba(245,158,11,.12)',
  },

  {
    icon: '📣',
    title: 'ارسال همگانی',

    desc:
      'ارسال هدفمند به کاربران',

    route:
      '/admin/broadcast',

    color:
      '#22D3EE',

    soft:
      'rgba(34,211,238,.12)',
  },

  {
    icon: '📊',
    title: 'نظرسنجی',

    desc:
      'ساخت نظرسنجی در کانال',

    route:
      '/admin/poll',

    color:
      '#70A7FF',

    soft:
      'rgba(59,130,246,.12)',
  },

  {
    icon: '🔔',
    title: 'مدیریت اعلان‌ها',

    desc:
      'تنظیم، تاریخچه و ارسال مجدد',

    route:
      '/admin/notifications',

    color:
      '#FCD34D',

    soft:
      'rgba(245,158,11,.12)',
  },

  {
    icon: '🚫',
    title: 'فهرست مسدودها',

    desc:
      'مشاهده و رفع مسدودیت کاربران',

    route:
      '/admin/blacklist',

    color:
      '#FB7185',

    soft:
      'rgba(239,68,68,.12)',
  },

  {
    icon: '📚',
    title: 'پنل محتوا',

    desc:
      'سؤال، منابع، برنامه و نمرات',

    route:
      '/admin/content',

    color:
      '#34D399',

    soft:
      'rgba(16,185,129,.12)',
  },
];


export default function AdminHome() {
  const navigate =
    useNavigate();

  const toast = useUIStore(
    (state) => state.toast
  );


  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      'admin-stats',
    ],

    queryFn: () =>
      api
        .get(
          '/api/admin/stats'
        )
        .then(
          (response) =>
            response.data
        ),

    refetchInterval:
      60_000,
  });


  const {
    data: bot,
  } = useQuery({
    queryKey: [
      'admin-bot-status',
    ],

    queryFn: () =>
      api
        .get(
          '/api/admin/bot-status'
        )
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      30_000,
  });


  const exportMutation =
    useMutation({
      mutationFn: () =>
        api.post(
          '/api/admin/export/excel'
        ),

      onSuccess: (
        response
      ) => {
        hapticNotif(
          'success'
        );

        toast(
          response.data
            ?.message ||
            'خروجی در ربات ارسال می‌شود',

          'success'
        );
      },

      onError: () =>
        toast(
          'درخواست خروجی انجام نشد',
          'error'
        ),
    });


  const open = (route) => {
    haptic('light');
    navigate(route);
  };


  const pending =
    number(
      stats?.users?.pending
    );


  const openTickets =
    number(
      stats?.tickets?.open
    );


  const openReports =
    number(
      stats?.reports?.open
    );


  return (
    <>
      <Header
        title="پنل مدیریت"
        subtitle={
          'کنترل مرکزی هامزیار'
        }
        right={
          <button
            type="button"
            onClick={() =>
              refetch()
            }
            disabled={
              isRefetching
            }
            aria-label="به‌روزرسانی"
            style={{
              width:
                36,

              height:
                36,

              borderRadius:
                12,

              background:
                'var(--elev)',

              border:
                '1px solid var(--bd)',

              cursor:
                'pointer',
            }}
          >
            ↻
          </button>
        }
      />

      <main className="page fade-up">
        <section
          className={
            'card card-glow'
          }
          style={{
            padding:
              18,

            marginBottom:
              14,

            background:
              'linear-gradient(145deg,rgba(245,158,11,.13),rgba(16,24,39,.95) 55%,rgba(59,130,246,.1))',
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                13,
            }}
          >
            <span
              style={{
                display:
                  'grid',

                width:
                  56,

                height:
                  56,

                placeItems:
                  'center',

                borderRadius:
                  18,

                background:
                  'linear-gradient(135deg,#D97706,#F59E0B)',

                boxShadow:
                  '0 8px 26px rgba(245,158,11,.2)',

                fontSize:
                  27,
              }}
            >
              👑
            </span>

            <div
              style={{
                flex:
                  1,
              }}
            >
              <div
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    10,
                }}
              >
                مرکز فرمان هامزیار
              </div>

              <b
                style={{
                  display:
                    'block',

                  fontSize:
                    17,

                  marginTop:
                    2,
                }}
              >
                مدیریت کل سامانه
              </b>

              <div
                style={{
                  display:
                    'flex',

                  gap:
                    5,

                  marginTop:
                    6,
                }}
              >
                <span className="badge b-grn">
                  {bot?.db_status ||
                    'در حال بررسی'}
                </span>

                <span className="badge b-acc">
                  Ping:{' '}

                  {bot?.db_ping ||
                    '—'}
                </span>
              </div>
            </div>
          </div>
        </section>


        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : isError ? (
          <div className="empty card">
            دریافت آمار انجام نشد.

            <button
              className="btn btn-p"
              style={{
                marginTop:
                  12,
              }}
              onClick={() =>
                refetch()
              }
            >
              تلاش دوباره
            </button>
          </div>
        ) : (
          <section
            className="grid2"
            style={{
              marginBottom:
                16,
            }}
          >
            <Stat
              icon="👥"
              value={
                number(
                  stats?.users
                    ?.total
                )
              }
              label="کاربر تأییدشده"
              color="#70A7FF"
              soft={
                'rgba(59,130,246,.12)'
              }
            />

            <Stat
              icon="⏳"
              value={pending}
              label="در انتظار تأیید"
              color="#FCD34D"
              soft={
                'rgba(245,158,11,.12)'
              }
            />

            <Stat
              icon="🧪"
              value={
                number(
                  stats
                    ?.questions
                    ?.approved
                )
              }
              label="سؤال تأییدشده"
              color="#34D399"
              soft={
                'rgba(16,185,129,.12)'
              }
            />

            <Stat
              icon="🎫"
              value={openTickets}
              label="تیکت باز"
              color="#FB7185"
              soft={
                'rgba(239,68,68,.12)'
              }
            />
          </section>
        )}


        {(
          pending > 0 ||
          openTickets > 0 ||
          openReports > 0
        ) && (
          <section
            className="card"
            style={{
              marginBottom:
                15,

              borderColor:
                'rgba(245,158,11,.25)',
            }}
          >
            <div className="sec-title">
              ⚠️ نیازمند رسیدگی
            </div>

            <div
              style={{
                display:
                  'flex',

                flexWrap:
                  'wrap',

                gap:
                  6,
              }}
            >
              {pending > 0 && (
                <span className="badge b-yel">
                  {pending} کاربر جدید
                </span>
              )}

              {openTickets > 0 && (
                <span className="badge b-red">
                  {openTickets} تیکت باز
                </span>
              )}

              {openReports > 0 && (
                <span className="badge b-pur">
                  {openReports} گزارش محتوا
                </span>
              )}
            </div>
          </section>
        )}


        <div className="sec-title">
          ابزارهای مدیریت
        </div>

        <section
          style={{
            display:
              'grid',

            gap:
              9,
          }}
        >
          {SECTIONS.map((item) => (
            <button
              type="button"
              key={item.route}
              className={
                'card card-tap'
              }
              onClick={() =>
                open(item.route)
              }
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                width:
                  '100%',

                gap:
                  11,

                padding:
                  13,

                textAlign:
                  'right',
              }}
            >
              <span
                style={{
                  display:
                    'grid',

                  width:
                    44,

                  height:
                    44,

                  placeItems:
                    'center',

                  borderRadius:
                    14,

                  color:
                    item.color,

                  background:
                    item.soft,

                  fontSize:
                    20,
                }}
              >
                {item.icon}
              </span>

              <span
                style={{
                  flex:
                    1,
                }}
              >
                <b
                  style={{
                    display:
                      'block',

                    fontSize:
                      12.5,
                  }}
                >
                  {item.title}
                </b>

                <span
                  style={{
                    display:
                      'block',

                    color:
                      'var(--txm)',

                    fontSize:
                      9.5,

                    marginTop:
                      3,
                  }}
                >
                  {item.desc}
                </span>
              </span>

              <span
                style={{
                  color:
                    'var(--txm)',
                }}
              >
                ←
              </span>
            </button>
          ))}
        </section>


        <section
          className="card"
          style={{
            marginTop:
              14,
          }}
        >
          <div className="sec-title">
            📡 وضعیت سرور
          </div>

          <div className="grid2">
            <div
              style={{
                padding:
                  9,

                background:
                  'rgba(100,116,139,.07)',

                borderRadius:
                  11,
              }}
            >
              <span
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    9,
                }}
              >
                حافظه ربات
              </span>

              <b
                style={{
                  display:
                    'block',

                  marginTop:
                    3,
                }}
              >
                {bot?.sys
                  ?.bot_ram_mb ||
                  '—'}{' '}

                MB
              </b>
            </div>

            <div
              style={{
                padding:
                  9,

                background:
                  'rgba(100,116,139,.07)',

                borderRadius:
                  11,
              }}
            >
              <span
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    9,
                }}
              >
                CPU
              </span>

              <b
                style={{
                  display:
                    'block',

                  marginTop:
                    3,
                }}
              >
                {bot?.sys
                  ?.cpu_pct ??
                  '—'}
                ٪
              </b>
            </div>

            <div
              style={{
                padding:
                  9,

                background:
                  'rgba(100,116,139,.07)',

                borderRadius:
                  11,
              }}
            >
              <span
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    9,
                }}
              >
                RAM سیستم
              </span>

              <b
                style={{
                  display:
                    'block',

                  marginTop:
                    3,
                }}
              >
                {bot?.sys
                  ?.used_ram_pct ??
                  '—'}
                ٪
              </b>
            </div>

            <div
              style={{
                padding:
                  9,

                background:
                  'rgba(100,116,139,.07)',

                borderRadius:
                  11,
              }}
            >
              <span
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    9,
                }}
              >
                زمان فعالیت
              </span>

              <b
                style={{
                  display:
                    'block',

                  marginTop:
                    3,
                }}
              >
                {bot?.sys
                  ?.uptime ||
                  '—'}
              </b>
            </div>
          </div>
        </section>


        <button
          className={
            'btn btn-dark btn-full'
          }
          style={{
            marginTop:
              12,
          }}
          disabled={
            exportMutation
              .isPending
          }
          onClick={() =>
            exportMutation.mutate()
          }
        >
          {exportMutation.isPending ? (
            <Spinner size={15} />
          ) : (
            '📥 دریافت خروجی Excel در ربات'
          )}
        </button>
      </main>
    </>
  );
}
