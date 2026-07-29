import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import {
  SkeletonCard,
  Spinner,
} from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';
import { useAuthStore } from '../../stores/authStore';

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

function MenuRow({
  icon,
  title,
  description,
  badge,
  tone = 'blue',
  onClick,
  last = false,
}) {
  const colors = {
    blue: [
      'rgba(59,130,246,.12)',
      '#70A7FF',
    ],

    green: [
      'rgba(16,185,129,.12)',
      '#34D399',
    ],

    yellow: [
      'rgba(245,158,11,.12)',
      '#FCD34D',
    ],

    red: [
      'rgba(239,68,68,.12)',
      '#FB7185',
    ],

    purple: [
      'rgba(139,92,246,.13)',
      '#C4B5FD',
    ],
  };

  const [
    soft,
    color,
  ] = colors[tone] ||
    colors.blue;

  return (
    <button
      type="button"
      className="menu-row"
      onClick={() => {
        haptic();
        onClick();
      }}
      style={{
        borderBottom:
          last
            ? 0
            : undefined,
      }}
    >
      <span
        style={{
          display: 'grid',
          flex: '0 0 40px',
          height: 40,
          placeItems: 'center',
          borderRadius: 12,
          background: soft,
          color,
          fontSize: 19,
        }}
      >
        {icon}
      </span>

      <span
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: 'right',
        }}
      >
        <b
          style={{
            display: 'block',
            fontSize: 12.5,
          }}
        >
          {title}
        </b>

        {description && (
          <span
            style={{
              display: 'block',
              color: 'var(--txm)',
              fontSize: 9.8,
              marginTop: 2,
            }}
          >
            {description}
          </span>
        )}
      </span>

      {badge && (
        <span className="badge b-yel">
          {badge}
        </span>
      )}

      <span
        style={{
          color: 'var(--txm)',
        }}
      >
        ←
      </span>
    </button>
  );
}

export default function Me() {
  const navigate =
    useNavigate();

  const authUser =
    useAuthStore(
      (state) => state.user
    );

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      'profile',
    ],

    queryFn: () =>
      api
        .get('/api/profile')
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      3 * 60 * 1000,
  });

  const {
    data: rank,
  } = useQuery({
    queryKey: [
      'rank',
    ],

    queryFn: () =>
      api
        .get(
          '/api/profile/rank'
        )
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      5 * 60 * 1000,
  });

  const {
    data: subscription,
  } = useQuery({
    queryKey: [
      'sub-status',
    ],

    queryFn: () =>
      api
        .get(
          '/api/subscription/status'
        )
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      5 * 60 * 1000,
  });

  const user =
    profile?.user ||
    authUser ||
    {};

  const stats =
    profile?.stats || {};

  const readiness =
    percent(
      stats.percentage
    );

  const openTickets =
    number(
      profile?.tickets?.open
    );

  const manager = [
    'admin',
    'content_admin',
  ].includes(user.role);

  const roleLabel = {
    admin: 'مدیر اصلی',

    content_admin:
      'مدیر محتوا',

    support:
      'پشتیبان',
  }[user.role] ||
    'دانشجو';

  return (
    <>
      <Header
        title="حساب من"
        subtitle={
          'پروفایل، خدمات و تنظیمات'
        }
        back={false}
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
          </div>
        ) : isError ? (
          <div className="empty card">
            <div
              style={{
                fontSize: 40,
              }}
            >
              🌐
            </div>

            <div
              style={{
                marginTop: 8,
              }}
            >
              دریافت اطلاعات حساب انجام
              نشد.
            </div>

            <button
              className="btn btn-p"
              style={{
                marginTop: 13,
              }}
              onClick={() =>
                refetch()
              }
              disabled={
                isRefetching
              }
            >
              {isRefetching ? (
                <Spinner size={15} />
              ) : (
                'تلاش دوباره'
              )}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 13,
            }}
          >
            <section
              className={
                'card card-glow card-tap'
              }
              role="button"
              tabIndex={0}
              onClick={() =>
                navigate(
                  '/me/profile'
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  navigate(
                    '/me/profile'
                  );
                }
              }}
              style={{
                padding: 17,
                cursor: 'pointer',

                background:
                  'linear-gradient(145deg,rgba(29,78,216,.22),rgba(16,24,39,.95) 52%,rgba(34,211,238,.08))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                }}
              >
                <div
                  className="avatar"
                  style={{
                    width: 58,
                    height: 58,
                    fontSize: 23,
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
                  <h2
                    style={{
                      overflow:
                        'hidden',

                      fontSize:
                        17,

                      fontWeight:
                        900,

                      textOverflow:
                        'ellipsis',

                      whiteSpace:
                        'nowrap',
                    }}
                  >
                    {user.name ||
                      'کاربر هامزیار'}
                  </h2>

                  <div
                    style={{
                      display: 'flex',

                      flexWrap:
                        'wrap',

                      gap:
                        5,

                      marginTop:
                        6,
                    }}
                  >
                    <span className="badge b-acc">
                      ورودی{' '}
                      {user.intake ||
                        '—'}
                    </span>

                    <span className="badge b-acc">
                      گروه{' '}
                      {user.group ||
                        '—'}
                    </span>

                    <span className="badge b-pur">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    color:
                      'var(--txm)',

                    fontSize:
                      18,
                  }}
                >
                  ←
                </span>
              </div>

              <div
                style={{
                  marginTop: 15,
                }}
              >
                <div
                  style={{
                    display: 'flex',

                    justifyContent:
                      'space-between',

                    marginBottom:
                      6,
                  }}
                >
                  <span
                    style={{
                      color:
                        'var(--txm)',

                      fontSize:
                        10,
                    }}
                  >
                    آمادگی تستی
                  </span>

                  <b
                    style={{
                      color:
                        'var(--acc2)',

                      fontSize:
                        11,
                    }}
                  >
                    {readiness}٪
                  </b>
                </div>

                <div className="pbar">
                  <div
                    className="pbar-f"
                    style={{
                      width:
                        `${readiness}%`,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',

                    justifyContent:
                      'space-between',

                    marginTop:
                      7,

                    color:
                      'var(--txm)',

                    fontSize:
                      9.5,
                  }}
                >
                  <span>
                    {number(
                      stats
                        .total_answers
                    )}{' '}

                    سؤال •{' '}

                    {number(
                      stats
                        .correct_answers
                    )}{' '}

                    صحیح
                  </span>

                  {rank?.rank && (
                    <span
                      style={{
                        color:
                          'var(--warn)',
                      }}
                    >
                      🏅 رتبه{' '}

                      {number(
                        rank.rank
                      )}{' '}

                      از{' '}

                      {number(
                        rank.total_users
                      )}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {subscription?.active ? (
              <section
                className="card"
                style={{
                  borderColor:
                    'rgba(16,185,129,.25)',

                  background:
                    'linear-gradient(145deg,rgba(16,185,129,.1),rgba(16,24,39,.95))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: 11,
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

                      background:
                        'rgba(16,185,129,.12)',

                      fontSize:
                        21,
                    }}
                  >
                    💎
                  </span>

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <b
                      style={{
                        color:
                          'var(--ok)',

                        fontSize:
                          12.5,
                      }}
                    >
                      اشتراک{' '}

                      {subscription
                        .plan_name ||
                        'هامزیار'}{' '}

                      فعال است
                    </b>

                    <div
                      style={{
                        color:
                          'var(--txm)',

                        fontSize:
                          9.5,

                        marginTop:
                          3,
                      }}
                    >
                      {number(
                        subscription
                          .days_left
                      )}{' '}

                      روز باقی‌مانده

                      {subscription
                        .expires
                        ? ` • تا ${subscription.expires}`
                        : ''}
                    </div>
                  </div>

                  <button
                    className={
                      'btn btn-dark'
                    }
                    style={{
                      minHeight:
                        34,

                      padding:
                        '6px 10px',

                      fontSize:
                        10,
                    }}
                    onClick={() =>
                      navigate(
                        '/me/subscription'
                      )
                    }
                  >
                    مدیریت
                  </button>
                </div>
              </section>
            ) : subscription ? (
              <button
                type="button"
                className={
                  'card card-tap'
                }
                onClick={() =>
                  navigate(
                    '/me/subscription'
                  )
                }
                style={{
                  width:
                    '100%',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    11,

                  textAlign:
                    'right',

                  borderColor:
                    'rgba(245,158,11,.24)',

                  background:
                    'linear-gradient(145deg,rgba(245,158,11,.08),rgba(16,24,39,.95))',
                }}
              >
                <span
                  style={{
                    fontSize: 23,
                  }}
                >
                  🔐
                </span>

                <span
                  style={{
                    flex: 1,
                  }}
                >
                  <b
                    style={{
                      color:
                        'var(--warn)',

                      fontSize:
                        12.5,
                    }}
                  >
                    اشتراک فعال نیست
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
                        2,
                    }}
                  >
                    برای دسترسی کامل، پلن
                    مناسب را انتخاب کنید.
                  </span>
                </span>

                <span className="badge b-yel">
                  مشاهده پلن‌ها
                </span>
              </button>
            ) : null}

            <section>
              <div className="sec-title">
                👤 حساب و تنظیمات
              </div>

              <div
                className="card"
                style={{
                  padding:
                    '0 14px',
                }}
              >
                <MenuRow
                  icon="👤"
                  title={
                    'پروفایل و اطلاعات تحصیلی'
                  }
                  description={
                    'نام، شماره دانشجویی، ورودی و گروه'
                  }
                  onClick={() =>
                    navigate(
                      '/me/profile'
                    )
                  }
                />

                <MenuRow
                  icon="🔔"
                  title={
                    'تنظیمات اعلان‌ها'
                  }
                  description={
                    'مدیریت یادآوری کلاس، امتحان و محتوا'
                  }
                  tone="yellow"
                  onClick={() =>
                    navigate(
                      '/me/notifications'
                    )
                  }
                  last
                />
              </div>
            </section>

            <section>
              <div className="sec-title">
                🆘 پشتیبانی و راهنما
              </div>

              <div
                className="card"
                style={{
                  padding:
                    '0 14px',
                }}
              >
                <MenuRow
                  icon="🎫"
                  title={
                    'تیکت پشتیبانی'
                  }
                  description={
                    'گفت‌وگو با تیم پشتیبانی'
                  }
                  badge={
                    openTickets
                      ? `${openTickets} باز`
                      : ''
                  }
                  tone="green"
                  onClick={() =>
                    navigate(
                      '/me/tickets'
                    )
                  }
                />

                <MenuRow
                  icon="❓"
                  title={
                    'سؤالات متداول'
                  }
                  description={
                    'پاسخ سریع به پرسش‌های رایج'
                  }
                  tone="purple"
                  onClick={() =>
                    navigate(
                      '/me/faq'
                    )
                  }
                />

                <MenuRow
                  icon="🚩"
                  title={
                    'گزارش ایراد محتوا'
                  }
                  description={
                    'اعلام مشکل سؤال، جزوه یا فایل'
                  }
                  tone="red"
                  onClick={() =>
                    navigate(
                      '/me/reports'
                    )
                  }
                  last
                />
              </div>
            </section>

            {manager && (
              <section>
                <div className="sec-title">
                  ⚙️ ابزارهای مدیریتی
                </div>

                <div
                  className="card"
                  style={{
                    padding:
                      '0 14px',

                    borderColor:
                      'rgba(245,158,11,.2)',
                  }}
                >
                  {user.role ===
                    'admin' && (
                    <MenuRow
                      icon="👑"
                      title={
                        'پنل مدیریت'
                      }
                      description={
                        'کاربران، ارتباطات و تنظیمات'
                      }
                      tone="yellow"
                      onClick={() =>
                        navigate(
                          '/admin'
                        )
                      }
                    />
                  )}

                  <MenuRow
                    icon="🎓"
                    title={
                      'مدیریت محتوا'
                    }
                    description={
                      'سؤال‌ها، برنامه، نمرات و منابع'
                    }
                    tone="purple"
                    onClick={() =>
                      navigate(
                        '/admin/content'
                      )
                    }
                    last
                  />
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </>
  );
}
