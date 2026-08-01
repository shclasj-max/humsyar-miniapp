import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useNavigate,
} from 'react-router-dom';

import Header from '../../components/layout/Header';
import {
  Spinner,
} from '../../components/shared/Loading';
import api from '../../lib/api';
import {
  haptic,
  hapticNotif,
} from '../../lib/telegram';
import {
  useUIStore,
} from '../../stores/uiStore';


/* ─────────────────────────────────────────────
   🔔 مرکز اعلان‌ها (موج ۴.۹۰)
   بازتاب همه‌ی رویدادهای مهمی که در ربات برای
   کاربر پیام می‌شوند — با آیکون نوع، زمان نسبی،
   وضعیت خوانده‌نشده و Deep Link مستقیم به مقصد.
   کلید کوئری با ردیف «مرکز اعلان‌ها» در صفحه‌ی
   «من» مشترک است — بج همیشه همین داده را می‌خواند.
───────────────────────────────────────────── */


export const INBOX_KEY = ['notif-inbox'];


const TYPE_META = {
  exam_reminder:  { icon: '📝', tone: 'red'    },
  daily_question: { icon: '🧪', tone: 'purple' },
  new_resources:  { icon: '📚', tone: 'green'  },
  class:          { icon: '🏫', tone: 'blue'   },
  exam:           { icon: '📝', tone: 'red'    },
  makeup:         { icon: '🔄', tone: 'yellow' },
  schedule_change:{ icon: '🔄', tone: 'yellow' },
  grade:          { icon: '📊', tone: 'acc'    },
  ticket_created: { icon: '🎫', tone: 'green'  },
  ticket_reply:   { icon: '📨', tone: 'green'  },
  ticket_closed:  { icon: '✅', tone: 'green'  },
  ticket_reopened:{ icon: '🔓', tone: 'yellow' },
  sub_activated:  { icon: '💎', tone: 'acc'    },
  sub_expiring:   { icon: '⏳', tone: 'yellow' },
  sub_expired:    { icon: '⌛', tone: 'red'    },
  announcement:   { icon: '📢', tone: 'blue'   },
  admin_dm:       { icon: '📩', tone: 'blue'   },
  account:        { icon: '🎓', tone: 'green'  },
  general:        { icon: '🔔', tone: 'blue'   },
};


const TONE_COLORS = {
  blue:   ['rgba(59,130,246,.13)',  '#93C5FD'],
  green:  ['rgba(16,185,129,.12)',  '#34D399'],
  yellow: ['rgba(245,158,11,.12)',  '#FCD34D'],
  red:    ['rgba(239,68,68,.12)',   '#FB7185'],
  purple: ['rgba(139,92,246,.13)',  '#C4B5FD'],
  acc:    ['rgba(34,211,238,.12)',  '#67E8F9'],
};


function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  return fallback;
}


/* زمان نسبی فارسی — «همین الان» تا «x روز پیش»؛
   قدیمی‌تر = تاریخ کامل fa-IR */
function timeAgo(iso) {
  const then = new Date(iso).getTime();

  if (!iso || Number.isNaN(then)) {
    return '';
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - then) / 1000),
  );

  if (seconds < 60) {
    return 'همین الان';
  }

  const steps = [
    [60,           'دقیقه'],
    [60,           'ساعت'],
    [24,           'روز'],
  ];

  let value = seconds;
  let unit  = 'ثانیه';

  for (const [size, name] of steps) {
    if (value < size) {
      break;
    }

    value = Math.floor(value / size);
    unit  = name;
  }

  if (unit === 'روز' && value >= 7) {
    return new Date(iso)
      .toLocaleDateString('fa-IR');
  }

  return `${value.toLocaleString('fa-IR')} ${unit} پیش`;
}


export default function NotificationCenter() {
  const navigate = useNavigate();

  const toast = useUIStore(
    (state) => state.toast,
  );

  const queryClient = useQueryClient();


  const {
    data,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: INBOX_KEY,

    queryFn: () =>
      api
        .get('/api/notifications/inbox')
        .then((response) => response.data),

    staleTime: 15_000,
  });

  const items  = data?.items  || [];
  const unread = data?.unread || 0;


  /* به‌روزرسانی خوش‌بینانه‌ی کش — بج و لیست
     هر دو از همین یک منبع خوانده می‌شوند */
  const patchCache = (updater) => {
    const previous =
      queryClient.getQueryData(INBOX_KEY);

    queryClient.setQueryData(
      INBOX_KEY,
      (old) =>
        old
          ? updater(old)
          : old,
    );

    return previous;
  };


  const readMutation = useMutation({
    mutationFn: (ids) =>
      api.post(
        '/api/notifications/inbox/read',
        { ids },
      ),

    onMutate: (ids) =>
      patchCache((old) => ({
        ...old,
        items: old.items.map((item) =>
          !ids || ids.includes(item.id)
            ? { ...item, read: true }
            : item
        ),
        unread: 0,
      })),

    onError: (_error, _ids, previous) => {
      if (previous) {
        queryClient.setQueryData(
          INBOX_KEY,
          previous,
        );
      }
    },

    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: INBOX_KEY,
      }),
  });


  const deleteMutation = useMutation({
    mutationFn: (id) =>
      api.delete(
        `/api/notifications/inbox/${id}`,
      ),

    onMutate: (id) => {
      const previous = patchCache((old) => {
        const removed = old.items.find(
          (item) => item.id === id,
        );

        return {
          ...old,
          items: old.items.filter(
            (item) => item.id !== id,
          ),
          unread:
            removed && !removed.read
              ? Math.max(0, old.unread - 1)
              : old.unread,
        };
      });

      hapticNotif('success');

      return previous;
    },

    onError: (error, _id, previous) => {
      if (previous) {
        queryClient.setQueryData(
          INBOX_KEY,
          previous,
        );
      }

      hapticNotif('error');

      toast(
        getErrorMessage(
          error,
          'حذف اعلان انجام نشد',
        ),
        'error',
      );
    },

    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: INBOX_KEY,
      }),
  });


  const openItem = (item) => {
    haptic('light');

    if (!item.read) {
      readMutation.mutate([item.id]);
    }

    if (item.link) {
      navigate(item.link);
    }
  };


  const headerAction = unread > 0
    ? (
      <button
        type="button"
        className="btn btn-d"
        style={{
          minHeight: 32,
          padding: '5px 9px',
          fontSize: 10.5,
        }}
        onClick={() => {
          haptic('light');

          readMutation.mutate(null);
        }}
        disabled={readMutation.isPending}
        aria-label="خواندن همه"
      >
        {
          readMutation.isPending
            ? <Spinner size={14} />
            : '✓'
        }

        خواندن همه
      </button>
    )
    : null;


  return (
    <>
      <Header
        title="مرکز اعلان‌ها"
        subtitle={
          unread > 0
            ? `${unread.toLocaleString('fa-IR')} اعلان خوانده‌نشده`
            : 'همه‌ی رویدادهای مهم حسابت'
        }
        right={headerAction}
        backTo="/me"
      />

      <main
        className="page"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingInline: 12,
        }}
      >
        {
          isPending
          && [0, 1, 2, 3].map((key) => (
            <div
              key={key}
              className="skeleton"
              style={{
                height: 66,
                borderRadius: 14,
              }}
            />
          ))
        }

        {
          isError
          && (
            <div className="empty card">
              <div style={{ fontSize: 28 }}>
                📡
              </div>

              <p>
                اعلان‌ها بارگذاری نشد
              </p>

              <button
                type="button"
                className="btn btn-d"
                onClick={() => refetch()}
              >
                تلاش دوباره
              </button>
            </div>
          )
        }

        {
          !isPending
          && !isError
          && items.length === 0
          && (
            <div className="empty card">
              <div style={{ fontSize: 28 }}>
                🔔
              </div>

              <p>
                هنوز اعلانی نداری
              </p>

              <span
                style={{
                  color: 'var(--txm)',
                  fontSize: 10.5,
                }}
              >
                هر اتفاق مهم حسابت
                این‌جا خبرت می‌کنیم
              </span>
            </div>
          )
        }

        {
          !isPending
          && items.length > 0
          && (
            <div
              className="card"
              style={{ padding: '0 12px' }}
            >
              {
                items.map((item, index) => {
                  const meta =
                    TYPE_META[item.type]
                    || TYPE_META.general;

                  const [
                    soft,
                    color,
                  ] = TONE_COLORS[meta.tone];

                  return (
                    <div
                      key={item.id}
                      className="pop-in"
                      style={{
                        display: 'flex',
                        alignItems:
                          'flex-start',
                        gap: 10,
                        padding:
                          '11px 0',
                        borderBottom:
                          index
                          < items.length - 1
                            ? '1px solid'
                              + ' rgba(148,163'
                              + ',184,.10)'
                            : 'none',
                        animationDelay:
                          `${Math.min(index, 8) * 30}ms`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openItem(item)
                        }
                        aria-label={item.title}
                        style={{
                          display: 'flex',
                          flex: 1,
                          minWidth: 0,
                          alignItems:
                            'flex-start',
                          gap: 10,
                          padding: 0,
                          border: 0,
                          background:
                            'none',
                          color: 'inherit',
                          font: 'inherit',
                          textAlign: 'right',
                          cursor:
                            'pointer',
                        }}
                      >
                        <span
                          style={{
                            display:
                              'grid',
                            flex:
                              '0 0 38px',
                            height: 38,
                            placeItems:
                              'center',
                            borderRadius: 12,
                            background:
                              soft,
                            color,
                            fontSize: 18,
                          }}
                        >
                          {meta.icon}
                        </span>

                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: 6,
                            }}
                          >
                            {
                              !item.read
                              && (
                                <span
                                  aria-hidden
                                  style={{
                                    width: 7,
                                    height: 7,
                                    flex:
                                      '0 0 7px',
                                    borderRadius:
                                      '50%',
                                    background:
                                      'var(--acc2)',
                                  }}
                                />
                              )
                            }

                            <b
                              style={{
                                fontSize: 12,
                                fontWeight:
                                  item.read
                                    ? 600
                                    : 800,
                                color:
                                  item.read
                                    ? 'var(--tx2)'
                                    : 'var(--tx)',
                              }}
                            >
                              {item.title}
                            </b>
                          </span>

                          {
                            item.body
                            && (
                              <span
                                style={{
                                  display:
                                    'block',
                                  marginTop: 3,
                                  color:
                                    'var(--txm)',
                                  fontSize: 10,
                                  lineHeight: 1.8,
                                  whiteSpace:
                                    'pre-line',
                                }}
                              >
                                {item.body}
                              </span>
                            )
                          }

                          <span
                            style={{
                              display:
                                'block',
                              marginTop: 4,
                              color:
                                'var(--txm)',
                              fontSize: 9,
                              opacity: .8,
                            }}
                          >
                            {
                              timeAgo(
                                item.created_at,
                              )
                            }
                          </span>
                        </span>

                        {
                          item.link
                          && (
                            <span
                              aria-hidden
                              style={{
                                alignSelf:
                                  'center',
                                color:
                                  'var(--txm)',
                                fontSize: 13,
                              }}
                            >
                              ←
                            </span>
                          )
                        }
                      </button>

                      <button
                        type="button"
                        aria-label="حذف اعلان"
                        onClick={() => {
                          haptic('light');

                          deleteMutation
                            .mutate(item.id);
                        }}
                        disabled={
                          deleteMutation
                            .isPending
                        }
                        style={{
                          alignSelf:
                            'center',
                          padding: 6,
                          border: 0,
                          background:
                            'none',
                          color:
                            'var(--txm)',
                          fontSize: 13,
                          cursor:
                            'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              }
            </div>
          )
        }

        {
          !isPending
          && items.length > 0
          && (
            <p
              style={{
                margin: '2px 4px 0',
                color: 'var(--txm)',
                fontSize: 9.5,
                textAlign: 'center',
              }}
            >
              اعلان‌های اعتبار، برنامه و نمره
              هم این‌جا می‌رسند — لازم نیست
              دنبال پیام تلگرام بگردی
            </p>
          )
        }
      </main>
    </>
  );
}
