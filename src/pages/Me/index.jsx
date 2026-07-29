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

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
};

const toPercent = (value) =>
  Math.min(100, toNumber(value));

function MenuRow({
  icon,
  title,
  desc,
  badge,
  badgeColor = 'b-yel',
  onClick,
  last = false,
}) {
  return (
    <button
      className="menu-row"
      onClick={() => {
        haptic();
        onClick();
      }}
      style={{
        borderBottom: last
          ? 'none'
          : '1px solid var(--bd)',
      }}
    >
      <span
        style={{
          fontSize: 20,
          width: 26,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13.5,
            color: 'var(--tx)',
          }}
        >
          {title}
        </div>

        {desc && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--txm)',
              marginTop: 1,
            }}
          >
            {desc}
          </div>
        )}
      </div>

      {badge !== undefined && (
        <span
          className={`badge ${badgeColor}`}
        >
          {badge}
        </span>
      )}

      <span
        style={{
          color: 'var(--txm)',
          fontSize: 14,
        }}
      >
        ←
      </span>
    </button>
  );
}

export default function Me() {
  const navigate = useNavigate();

  const authUser = useAuthStore(
    (state) => state.user
  );

  const {
    data: profileData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () =>
      api
        .get('/api/profile')
        .then((response) => response.data),
    staleTime: 1000 * 60 * 3,
  });

  const { data: rankData } = useQuery({
    queryKey: ['rank'],
    queryFn: () =>
      api
        .get('/api/profile/rank')
        .then((response) => response.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: subscription } = useQuery({
    queryKey: ['sub-status'],
    queryFn: () =>
      api
        .get('/api/subscription/status')
        .then((response) => response.data),
    staleTime: 1000 * 60 * 5,
  });

  const dbUser =
    profileData?.user || authUser || {};

  const stats = profileData?.stats || {};

  const percentage = toPercent(
    stats.percentage
  );

  const openTickets = toNumber(
    profileData?.tickets?.open
  );

  const isManager = [
    'admin',
    'content_admin',
  ].includes(dbUser.role);

  return (
    <>
      <Header title="من" back={false} />

      <div className="page fade-up">
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isError ? (
          <div className="empty">
            <div
              style={{
                fontSize: 40,
                marginBottom: 10,
              }}
            >
              🌐
            </div>

            <div>
              دریافت اطلاعات حساب با مشکل مواجه شد.
            </div>

            <button
              className="btn btn-p"
              style={{ marginTop: 14 }}
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Spinner size={16} />
              ) : (
                'تلاش دوباره'
              )}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 13,
            }}
          >
            <div
              className="card card-glow"
              style={{ cursor: 'pointer' }}
              onClick={() =>
                navigate('/me/profile')
              }
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  navigate('/me/profile');
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  marginBottom: 13,
                }}
              >
                <div
                  className="avatar"
                  style={{
                    width: 52,
                    height: 52,
                    fontSize: 22,
                  }}
                >
                  {dbUser.name?.[0] || '؟'}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 17,
                    }}
                  >
                    {dbUser.name ||
                      'کاربر هامزیار'}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 5,
                      marginTop: 5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="badge b-acc">
                      ورودی{' '}
                      {dbUser.intake || '—'}
                    </span>

                    <span className="badge b-acc">
                      گروه{' '}
                      {dbUser.group || '—'}
                    </span>

                    {stats.level && (
                      <span
                        style={{
                          background: `${
                            stats.level.color ||
                            '#60A5FA'
                          }20`,
                          color:
                            stats.level.color ||
                            '#60A5FA',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {stats.level.icon ||
                          '📈'}{' '}
                        {stats.level.label ||
                          'سطح کاربر'}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    color: 'var(--txm)',
                  }}
                >
                  ←
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--txm)',
                  }}
                >
                  آمادگی تستی
                </span>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--acc)',
                  }}
                >
                  {percentage}٪
                </span>
              </div>

              <div className="pbar">
                <div
                  className="pbar-f"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  marginTop: 7,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--txm)',
                  }}
                >
                  {toNumber(
                    stats.total_answers
                  )}{' '}
                  سوال •{' '}
                  {toNumber(
                    stats.correct_answers
                  )}{' '}
                  صحیح
                </span>

                {rankData?.rank && (
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--warn)',
                      fontWeight: 700,
                    }}
                  >
                    🏅 رتبه{' '}
                    {toNumber(rankData.rank)} از{' '}
                    {toNumber(
                      rankData.total_users
                    )}
                  </span>
                )}
              </div>
            </div>

            {subscription?.active ? (
              <div
                className="card"
                style={{
                  borderColor:
                    'rgba(16,185,129,.25)',
                  background:
                    'rgba(16,185,129,.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                  }}
                >
                  <span style={{ fontSize: 24 }}>
                    💳
                  </span>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: 'var(--ok)',
                        fontSize: 13.5,
                      }}
                    >
                      اشتراک فعال —{' '}
                      {subscription.plan_name ||
                        'هامزیار'}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--txm)',
                        marginTop: 2,
                      }}
                    >
                      {toNumber(
                        subscription.days_left
                      )}{' '}
                      روز مانده
                      {subscription.expires
                        ? ` • تا ${subscription.expires}`
                        : ''}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        '/me/subscription'
                      )
                    }
                    className="btn btn-dark"
                    style={{
                      fontSize: 11,
                      padding: '5px 10px',
                    }}
                  >
                    مدیریت
                  </button>
                </div>
              </div>
            ) : subscription &&
              !subscription.active ? (
              <button
                onClick={() =>
                  navigate('/me/subscription')
                }
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor:
                    'rgba(239,68,68,.25)',
                  background:
                    'rgba(239,68,68,.04)',
                  width: '100%',
                  textAlign: 'right',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                  }}
                >
                  <span style={{ fontSize: 24 }}>
                    🔒
                  </span>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: 'var(--err)',
                        fontSize: 13.5,
                      }}
                    >
                      اشتراک فعال نیست
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--txm)',
                        marginTop: 2,
                      }}
                    >
                      برای دسترسی کامل اشتراک
                      بخرید
                    </div>
                  </div>

                  <span className="badge b-acc">
                    خرید
                  </span>
                </div>
              </button>
            ) : null}

            <div>
              <div className="sec-title">
                👤 حساب کاربری
              </div>

              <div
                className="card"
                style={{ padding: '0 14px' }}
              >
                <MenuRow
                  icon="👤"
                  title="پروفایل"
                  desc="ویرایش نام، گروه، ورودی"
                  onClick={() =>
                    navigate('/me/profile')
                  }
                />

                <MenuRow
                  icon="🔔"
                  title="اعلان‌ها"
                  desc="مدیریت انواع اعلان‌ها"
                  onClick={() =>
                    navigate(
                      '/me/notifications'
                    )
                  }
                  last
                />
              </div>
            </div>

            <div>
              <div className="sec-title">
                🆘 پشتیبانی
              </div>

              <div
                className="card"
                style={{ padding: '0 14px' }}
              >
                <MenuRow
                  icon="🎫"
                  title="تیکت پشتیبانی"
                  desc="ارسال مشکل و پیگیری پاسخ"
                  badge={
                    openTickets > 0
                      ? `${openTickets} باز`
                      : undefined
                  }
                  onClick={() =>
                    navigate('/me/tickets')
                  }
                />

                <MenuRow
                  icon="❓"
                  title="سوالات متداول"
                  desc="پاسخ سریع"
                  onClick={() =>
                    navigate('/me/faq')
                  }
                />

                <MenuRow
                  icon="🚩"
                  title="گزارش ایراد محتوا"
                  desc="خطا در سوال یا فایل"
                  onClick={() =>
                    navigate('/me/reports')
                  }
                  last
                />
              </div>
            </div>

            {isManager && (
              <div>
                <div className="sec-title">
                  ⚙️ مدیریت
                </div>

                <div
                  className="card"
                  style={{
                    padding: '0 14px',
                    borderColor:
                      'rgba(251,191,36,.2)',
                  }}
                >
                  {dbUser.role === 'admin' && (
                    <MenuRow
                      icon="👑"
                      title="پنل ادمین"
                      desc="کاربران، تیکت‌ها، ارسال همگانی"
                      onClick={() =>
                        navigate('/admin')
                      }
                    />
                  )}

                  <MenuRow
                    icon="🎓"
                    title="پنل محتوا"
                    desc="تأیید سوال، برنامه و FAQ"
                    onClick={() =>
                      navigate(
                        '/admin/content'
                      )
                    }
                    last
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
