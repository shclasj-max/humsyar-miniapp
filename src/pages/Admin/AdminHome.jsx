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

        display: 'flex',

        alignItems:
          'center',

        gap:
          9,
      }}
    >
      <span
        style={{
          display: 'grid',

          width: 38,
          height: 38,

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

    title:
      'مدیریت کاربران',

    description:
      'جست‌وجو، تأیید، ویرایش و تعلیق',

    route:
      '/admin/users',

    color:
      '#70A7FF',

    soft:
      'rgba(59,130,246,.12)',
  },

  {
    icon: '💳',

    title:
      'اشتراک و پرداخت',

    description:
      'پلن‌ها، رسیدها، مشترکین و تخفیف',

    route:
      '/admin/subscription',

    color:
      '#34D399',

    soft:
      'rgba(16,185,129,.12)',
  },

  {
    icon: '📅',

    title:
      'مدیریت ورودی‌ها',

    description:
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

    title:
      'مدیران محتوا',

    description:
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

    title:
      'تیکت‌های پشتیبانی',

    description:
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

    title:
      'ارسال همگانی',

    description:
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

    title:
      'نظرسنجی',

    description:
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

    title:
      'مدیریت اعلان‌ها',

    description:
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

    title:
      'فهرست مسدودها',

    description:
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

    title:
      'پنل محتوا',

    description:
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
    queryKey:
      ['admin-stats'],

    queryFn: () =>
      api
        .get('/api/admin/stats')
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
    queryKey:
      ['admin-bot-status'],

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


  const {
    data: subscription,
  } = useQuery({
    queryKey:
      ['subscription-admin-overview'],

    queryFn: () =>
      api
        .get(
          '/api/subscription-admin/overview'
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


  const pendingUsers =
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

  const pendingPayments =
    number(
      subscription
        ?.stats
        ?.pending
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
              width: 36,
              height: 36,

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
              display: 'flex',
              alignItems: 'center',
              gap: 13,
            }}
          >
            <span
              style={{
                display: 'grid',
                width: 56,
                height: 56,
                placeItems: 'center',
                borderRadius: 18,

                background:
                  'linear-gradient(135deg,#D97706,#F59E0B)',

                fontSize: 27,
              }}
            >
              👑
            </span>

            <div>
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
              label="کاربر فعال"
              color="#70A7FF"
              soft={
                'rgba(59,130,246,.12)'
              }
            />

            <Stat
              icon="⏳"
              value={
                pendingUsers
              }
              label="کاربر منتظر"
              color="#FCD34D"
              soft={
                'rgba(245,158,11,.12)'
              }
            />

            <Stat
              icon="💎"
              value={
                number(
                  subscription
                    ?.stats
                    ?.active
                )
              }
              label="مشترک فعال"
              color="#34D399"
              soft={
                'rgba(16,185,129,.12)'
              }
            />

            <Stat
              icon="💳"
              value={
                pendingPayments
              }
              label="رسید منتظر"
              color="#FB7185"
              soft={
                'rgba(239,68,68,.12)'
              }
            />
          </section>
        )}


        {(
          pendingUsers > 0 ||
          openTickets > 0 ||
          openReports > 0 ||
          pendingPayments > 0
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
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {pendingUsers >
                0 && (
                <span className="badge b-yel">
                  {pendingUsers} کاربر جدید
                </span>
              )}

              {openTickets >
                0 && (
                <span className="badge b-red">
                  {openTickets} تیکت باز
                </span>
              )}

              {openReports >
                0 && (
                <span className="badge b-pur">
                  {openReports} گزارش
                </span>
              )}

              {pendingPayments >
                0 && (
                <span className="badge b-grn">
                  {pendingPayments} رسید
                  منتظر
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
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: 11,
                padding: 13,
                textAlign: 'right',
              }}
            >
              <span
                style={{
                  display: 'grid',
                  width: 44,
                  height: 44,
                  placeItems: 'center',
                  borderRadius: 14,
                  color: item.color,
                  background: item.soft,
                  fontSize: 20,
                }}
              >
                {item.icon}
              </span>

              <span
                style={{
                  flex: 1,
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
                  {item.description}
                </span>
              </span>

              {item.route ===
                '/admin/subscription' &&
                pendingPayments >
                  0 && (
                <span className="badge b-red">
                  {pendingPayments}
                </span>
              )}

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
          {exportMutation
            .isPending ? (
            <Spinner size={15} />
          ) : (
            '📥 دریافت خروجی Excel در ربات'
          )}
        </button>
      </main>
    </>
  );
}
