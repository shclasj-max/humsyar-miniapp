import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import {
  SkeletonCard,
  Spinner,
} from '../../components/shared/Loading';
import { haptic, tg } from '../../lib/telegram';

/* باز کردن لینک خارجی از داخل مینی‌اپ —
   اولویت با openLink نیتیو تلگرام */
export const openExternal = (url) => {
  try {
    if (tg?.openLink) {
      tg.openLink(url);
      return;
    }
  } catch (_) {
    /* fallback به مرورگر */
  }
  window.open(url, '_blank', 'noopener');
};

const number = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
};

const percent = (value) =>
  Math.min(
    100,
    number(value)
  );

/* ✅ سلام متناسب با ساعت روز —
   میکروجزئیتی که محصول را زنده
   و شخصی حس می‌کند */
const dayGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12)
    return 'صبح بخیر ☀️';
  if (hour >= 12 && hour < 17)
    return 'ظهر بخیر 👋';
  if (hour >= 17 && hour < 20)
    return 'عصر بخیر 🌆';
  return 'شب بخیر 🌙';
};

function Ring({
  value = 0,
}) {
  const safe = percent(value);
  const radius = 29;

  const circumference =
    2 * Math.PI * radius;

  return (
    <div
      style={{
        position: 'relative',
        width: 82,
        height: 82,
        flexShrink: 0,
      }}
    >
      <svg
        width="82"
        height="82"
        viewBox="0 0 82 82"
        style={{
          transform:
            'rotate(-90deg)',
        }}
      >
        <circle
          cx="41"
          cy="41"
          r={radius}
          fill="none"
          stroke="var(--ovr)"
          strokeWidth="7"
        />

        <circle
          cx="41"
          cy="41"
          r={radius}
          fill="none"
          stroke="url(#dashboard-ring)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${
            (safe / 100) *
            circumference
          } ${circumference}`}
        />

        <defs>
          <linearGradient
            id="dashboard-ring"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              stopColor="#3B82F6"
            />

            <stop
              offset="1"
              stopColor="#22D3EE"
            />
          </linearGradient>
        </defs>
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: 'var(--tx)',
              fontSize: 17,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {safe}٪
          </div>

          <div
            style={{
              color: 'var(--txm)',
              fontSize: 8,
              marginTop: 3,
            }}
          >
            آمادگی
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
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
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: soft,
          fontSize: 18,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color,
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>

        <div
          style={{
            color: 'var(--txm)',
            fontSize: 9.5,
            marginTop: 2,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function WeekChart({
  rows = [],
}) {
  const values = rows.map(
    (item) =>
      number(item?.count)
  );

  const max = Math.max(
    ...values,
    1
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: 84,
        gap: 7,
        paddingTop: 8,
      }}
    >
      {rows.map(
        (item, index) => {
          const value =
            values[index];

          return (
            <div
              key={`${
                item?.date || 'day'
              }-${index}`}
              style={{
                flex: 1,
                display: 'flex',
                height: '100%',
                flexDirection:
                  'column',
                alignItems:
                  'center',
                justifyContent:
                  'flex-end',
                gap: 5,
              }}
            >
              <div
                style={{
                  color:
                    'var(--tx2)',
                  fontSize: 8.5,
                }}
              >
                {value || ''}
              </div>

              <div
                style={{
                  width: '100%',
                  minHeight: 4,

                  height: `${Math.max(
                    4,
                    (
                      value / max
                    ) * 48
                  )}px`,

                  borderRadius:
                    '7px 7px 3px 3px',

                  background:
                    value
                      ? 'var(--grad-brand)'
                      : 'var(--ovr)',

                  boxShadow:
                    value
                      ? '0 5px 14px rgba(59,130,246,.18)'
                      : 'none',
                }}
              />

              <div
                style={{
                  color:
                    'var(--txm)',
                  fontSize: 8,
                }}
              >
                {String(
                  item?.date || ''
                ).slice(-2)}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

function ErrorState({
  onRetry,
  loading,
}) {
  return (
    <div className="empty card">
      <div className="empty__ic">
        🌐
      </div>

      <div>
        دریافت اطلاعات داشبورد انجام
        نشد.
      </div>

      <button
        className="btn btn-p"
        onClick={onRetry}
        disabled={loading}
      >
        {loading ? (
          <Spinner size={16} />
        ) : (
          'تلاش دوباره'
        )}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate =
    useNavigate();

  const [
    tab,
    setTab,
  ] = useState('stats');

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      'dashboard',
    ],

    queryFn: () =>
      api
        .get('/api/dashboard')
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      3 * 60 * 1000,
  });

  const {
    data: weeklyData = [],
  } = useQuery({
    queryKey: [
      'weekly',
    ],

    queryFn: () =>
      api
        .get(
          '/api/dashboard/weekly'
        )
        .then(
          (response) =>
            response.data
              ?.weekly || []
        ),

    staleTime:
      5 * 60 * 1000,
  });

  /* 💙 تنظیمات زنده حمایت مالی —
     سینک با دکمه «حمایت مالی» ربات */
  const {
    data: donation,
  } = useQuery({
    queryKey: ['donation-config'],

    queryFn: () =>
      api
        .get('/api/profile/donation')
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      10 * 60 * 1000,
    retry: false,
  });

  const showDonation = Boolean(
    donation?.enabled && donation?.link
  );

  const {
    data: leaderboard = [],

    isLoading:
      rankLoading,

    isError:
      rankError,

    refetch:
      refetchRank,
  } = useQuery({
    queryKey: [
      'leaderboard',
    ],

    queryFn: () =>
      api
        .get(
          '/api/dashboard/leaderboard'
        )
        .then(
          (response) =>
            response.data
              ?.leaderboard || []
        ),

    enabled:
      tab === 'rank',

    staleTime:
      5 * 60 * 1000,
  });

  const user =
    data?.user || {};

  const stats =
    data?.stats || {};

  const exams =
    Array.isArray(
      data?.upcoming_exams
    )
      ? data.upcoming_exams
      : [];

  const weakTopics =
    Array.isArray(
      stats.weak_topics
    )
      ? stats.weak_topics
      : [];

  const weekly =
    Array.isArray(weeklyData)
      ? weeklyData
      : [];

  const leaders =
    Array.isArray(leaderboard)
      ? leaderboard
      : [];

  const openTickets =
    number(
      data?.open_tickets
    );

  const role = {
    admin: '👑 مدیر',

    content_admin:
      '🎓 مدیر محتوا',

    support:
      '🛟 پشتیبان',
  }[user.role];

  return (
    <>
      <Header
        title="داشبورد"
        back={false}
        subtitle={`ورودی ${
          user.intake || '—'
        } • گروه ${
          user.group || '—'
        }`}
        onRefresh={refetch}
        refreshing={isRefetching}
      />

      <main className="page fade-up">
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gap: 10,
            }}
          >
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isError ? (
          <ErrorState
            onRetry={refetch}
            loading={
              isRefetching
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            <section
              className={
                'card card-glow hero-card'
              }
            >
              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 13,
                }}
              >
                <div
                  className="avatar"
                  style={{
                    width: 52,
                    height: 52,
                    fontSize: 21,
                  }}
                >
                  {user.name?.[0] ||
                    'ه'}
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      color:
                        'var(--txm)',
                      fontSize: 10.5,
                    }}
                  >
                    {dayGreeting()}
                  </div>

                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 900,
                      marginTop: 2,
                      overflow:
                        'hidden',
                      textOverflow:
                        'ellipsis',
                      whiteSpace:
                        'nowrap',
                    }}
                  >
                    {user.name ||
                      'کاربر هامزیار'}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap:
                        'wrap',
                      gap: 5,
                      marginTop: 7,
                    }}
                  >
                    {role && (
                      <span className="badge b-yel">
                        {role}
                      </span>
                    )}

                    {stats.level && (
                      <span className="badge b-acc">
                        {stats
                          .level
                          .icon ||
                          '📈'}{' '}

                        {stats
                          .level
                          .label ||
                          'سطح کاربر'}
                      </span>
                    )}
                  </div>
                </div>

                <Ring
                  value={
                    stats.percentage
                  }
                />
              </div>
            </section>

            {/* 💙 حمایت مالی — فقط وقتی
                مدیر فعالش کرده (سینک با ربات) */}
            {showDonation && (
              <button
                type="button"
                className="card card-tap fade-up"
                onClick={() => {
                  haptic('light');
                  openExternal(
                    donation.link
                  );
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: 13,
                  textAlign: 'right',
                  borderColor:
                    'rgba(244,114,182,.28)',
                  background:
                    'linear-gradient(145deg,rgba(236,72,153,.12),rgba(16,24,39,.95) 55%,rgba(244,114,182,.07))',
                }}
              >
                <span
                  style={{
                    display: 'grid',
                    width: 42,
                    height: 42,
                    placeItems: 'center',
                    borderRadius: 14,
                    background:
                      'rgba(236,72,153,.14)',
                    fontSize: 20,
                  }}
                >
                  💙
                </span>

                <span
                  style={{ flex: 1 }}
                >
                  <b
                    style={{
                      display: 'block',
                      color: '#F9A8D4',
                      fontSize: 12.5,
                    }}
                  >
                    حمایت از هامزیار
                  </b>

                  <span
                    style={{
                      display: 'block',
                      color: 'var(--txm)',
                      fontSize: 9.6,
                      marginTop: 3,
                      lineHeight: 1.7,
                    }}
                  >
                    با حمایت کوچیکت به ادامه‌دار
                    بودن و پیشرفت هامزیار کمک کن 🙏
                  </span>
                </span>

                <span
                  className="badge"
                  style={{
                    background:
                      'rgba(236,72,153,.14)',
                    color: '#F9A8D4',
                  }}
                >
                  💙 حمایت
                </span>
              </button>
            )}

            <section className="grid2">
              <Metric
                icon="🧪"
                value={
                  number(
                    stats
                      .total_answers
                  )
                }
                label="سؤال پاسخ‌داده"
                color="#70A7FF"
                soft={
                  'rgba(59,130,246,.12)'
                }
              />

              <Metric
                icon="✅"
                value={
                  number(
                    stats
                      .correct_answers
                  )
                }
                label="پاسخ صحیح"
                color="#34D399"
                soft={
                  'rgba(16,185,129,.12)'
                }
              />

              <Metric
                icon="📥"
                value={
                  number(
                    stats.downloads
                  )
                }
                label="دانلود منابع"
                color="#22D3EE"
                soft={
                  'rgba(34,211,238,.12)'
                }
              />

              <Metric
                icon="🔥"
                value={
                  number(
                    stats
                      .week_activity
                  )
                }
                label="فعالیت این هفته"
                color="#FCD34D"
                soft={
                  'rgba(245,158,11,.12)'
                }
              />
            </section>

            <div
              className="tab-bar"
              role="tablist"
            >
              {[
                [
                  'stats',
                  '📈 عملکرد',
                ],

                [
                  'exams',
                  '⏳ امتحانات',
                ],

                [
                  'rank',
                  '🏅 رتبه‌بندی',
                ],
              ].map(
                ([
                  key,
                  label,
                ]) => (
                  <button
                    type="button"
                    key={key}
                    className={`tab-btn ${
                      tab === key
                        ? 'tab-btn--on'
                        : ''
                    }`}
                    role="tab"
                    aria-selected={
                      tab === key
                    }
                    onClick={() => {
                      haptic();
                      setTab(key);
                    }}
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            {tab === 'stats' && (
              <>
                {weekly.length >
                  0 && (
                  <section className="card">
                    <div className="sec-title">
                      فعالیت هفت روز اخیر
                    </div>

                    <WeekChart
                      rows={weekly}
                    />
                  </section>
                )}

                {weakTopics.length >
                  0 && (
                  <section className="card">
                    <div className="sec-title">
                      ⚡ مباحث نیازمند تمرین
                    </div>

                    <div
                      style={{
                        display:
                          'flex',

                        flexWrap:
                          'wrap',

                        gap: 7,
                      }}
                    >
                      {weakTopics.map(
                        (topic) => (
                          <button
                            type="button"
                            key={topic}
                            className={
                              'badge b-red'
                            }
                            style={{
                              padding:
                                '6px 11px',
                            }}
                            onClick={() =>
                              navigate(
                                '/learn/questions?mode=weak'
                              )
                            }
                          >
                            {topic}
                          </button>
                        )
                      )}
                    </div>
                  </section>
                )}

                <button
                  className={
                    'btn btn-p btn-full'
                  }
                  onClick={() => {
                    haptic(
                      'medium'
                    );

                    navigate(
                      '/learn/questions?mode=weak'
                    );
                  }}
                >
                  ⚡ شروع تمرین هوشمند
                </button>
              </>
            )}

            {tab === 'exams' && (
              <section
                style={{
                  display: 'grid',
                  gap: 9,
                }}
              >
                {exams.length ===
                0 ? (
                  <div className="empty card">
                    📭 امتحانی در هفت روز
                    آینده ثبت نشده است.
                  </div>
                ) : (
                  exams.map(
                    (
                      exam,
                      index
                    ) => {
                      const days =
                        exam.days_left ==
                        null
                          ? null
                          : number(
                              exam.days_left
                            );

                      const urgent =
                        days != null &&
                        days <= 3;

                      return (
                        <div
                          key={
                            exam.id ||
                            index
                          }
                          className="card"
                          style={{
                            borderColor:
                              urgent
                                ? 'rgba(239,68,68,.3)'
                                : 'var(--bd)',
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',

                              alignItems:
                                'center',

                              gap: 11,
                            }}
                          >
                            <div
                              style={{
                                width:
                                  44,

                                height:
                                  44,

                                display:
                                  'grid',

                                placeItems:
                                  'center',

                                borderRadius:
                                  13,

                                background:
                                  urgent
                                    ? 'rgba(239,68,68,.12)'
                                    : 'var(--acc-soft)',

                                fontSize:
                                  20,
                              }}
                            >
                              📝
                            </div>

                            <div
                              style={{
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  fontWeight:
                                    800,
                                }}
                              >
                                {exam.lesson ||
                                  'امتحان'}
                              </div>

                              <div
                                style={{
                                  color:
                                    'var(--txm)',

                                  fontSize:
                                    10.5,

                                  marginTop:
                                    3,
                                }}
                              >
                                {exam.date ||
                                  'تاریخ نامشخص'}

                                {exam.time
                                  ? ` • ${exam.time}`
                                  : ''}
                              </div>
                            </div>

                            {days !=
                              null && (
                              <span
                                className={`badge ${
                                  urgent
                                    ? 'b-red'
                                    : 'b-grn'
                                }`}
                              >
                                {days === 0
                                  ? 'امروز'
                                  : days ===
                                      1
                                    ? 'فردا'
                                    : `${days} روز`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )
                )}

                <button
                  className={
                    'btn btn-dark btn-full'
                  }
                  onClick={() =>
                    navigate(
                      '/schedule'
                    )
                  }
                >
                  مشاهده برنامه کامل
                </button>
              </section>
            )}

            {tab === 'rank' && (
              <section className="card">
                <div className="sec-title">
                  🏆 برترین دانشجویان
                </div>

                {rankLoading ? (
                  <div
                    style={{
                      display: 'grid',
                      placeItems:
                        'center',
                      padding: 30,
                    }}
                  >
                    <Spinner />
                  </div>
                ) : rankError ? (
                  <button
                    className={
                      'btn btn-dark btn-full'
                    }
                    onClick={() =>
                      refetchRank()
                    }
                  >
                    تلاش دوباره
                  </button>
                ) : leaders.length ===
                  0 ? (
                  <div className="empty">
                    هنوز رتبه‌ای ثبت نشده
                    است.
                  </div>
                ) : (
                  leaders.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${
                          item.rank
                        }-${
                          item.name
                        }-${index}`}
                        style={{
                          display:
                            'flex',

                          alignItems:
                            'center',

                          gap: 10,

                          padding:
                            '10px 0',

                          borderBottom:
                            index <
                            leaders.length -
                              1
                              ? '1px solid var(--bd)'
                              : 0,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            textAlign:
                              'center',
                            fontWeight:
                              900,
                          }}
                        >
                          {item.rank ===
                          1
                            ? '🥇'
                            : item.rank ===
                                2
                              ? '🥈'
                              : item.rank ===
                                  3
                                ? '🥉'
                                : item.rank}
                        </div>

                        <div
                          style={{
                            flex: 1,

                            color:
                              item.is_me
                                ? 'var(--acc2)'
                                : 'var(--tx)',

                            fontWeight:
                              item.is_me
                                ? 800
                                : 600,
                          }}
                        >
                          {item.name ||
                            'کاربر'}

                          {item.is_me
                            ? ' • شما'
                            : ''}
                        </div>

                        <div
                          style={{
                            textAlign:
                              'left',
                          }}
                        >
                          <div
                            style={{
                              color:
                                'var(--ok)',

                              fontSize:
                                12,

                              fontWeight:
                                800,
                            }}
                          >
                            {percent(
                              item.percent
                            )}
                            ٪
                          </div>

                          <div
                            style={{
                              color:
                                'var(--txm)',

                              fontSize:
                                9,
                            }}
                          >
                            {number(
                              item.correct
                            )}
                            /
                            {number(
                              item.total
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </section>
            )}

            {openTickets > 0 && (
              <button
                type="button"
                className={
                  'card card-tap'
                }
                onClick={() =>
                  navigate(
                    '/me/tickets'
                  )
                }
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 11,
                  width: '100%',
                  textAlign:
                    'right',

                  borderColor:
                    'rgba(245,158,11,.25)',
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                  }}
                >
                  🎫
                </span>

                <span
                  style={{
                    flex: 1,
                  }}
                >
                  <b>
                    {openTickets} تیکت باز
                  </b>

                  <span
                    style={{
                      display:
                        'block',

                      color:
                        'var(--txm)',

                      fontSize:
                        10.5,
                    }}
                  >
                    پیگیری گفت‌وگوهای
                    پشتیبانی
                  </span>
                </span>

                <span>←</span>
              </button>
            )}
          </div>
        )}
      </main>
    </>
  );
}
