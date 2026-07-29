import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const toPercent = (value) => Math.min(100, toNumber(value));

function Ring({ pct = 0, size = 72 }) {
  const percentage = toPercent(pct);
  const radius = 27;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ovr)"
          strokeWidth={6}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--acc)"
          strokeWidth={6}
          strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--acc)',
        }}
      >
        {percentage}٪
      </div>
    </div>
  );
}

function WeekBar({ data = [] }) {
  const values = Array.isArray(data) ? data.map(toNumber) : [];
  const max = Math.max(...values, 1);
  const dayLabels = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        height: 50,
      }}
    >
      {values.map((value, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <div
            style={{
              width: '100%',
              borderRadius: 3,
              background: value > 0 ? 'var(--acc)' : 'var(--ovr)',
              height: `${Math.max(
                (value / max) * 42,
                value > 0 ? 5 : 3
              )}px`,
              transition: 'height .5s',
            }}
          />

          <div
            style={{
              fontSize: 8,
              color: 'var(--txm)',
            }}
          >
            {dayLabels[index] || ''}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorCard({ message, onRetry, loading = false }) {
  return (
    <div className="empty">
      <div
        style={{
          fontSize: 40,
          marginBottom: 10,
        }}
      >
        🌐
      </div>

      <div>{message}</div>

      <button
        className="btn btn-p"
        style={{ marginTop: 14 }}
        onClick={onRetry}
        disabled={loading}
      >
        {loading ? <Spinner size={16} /> : 'تلاش دوباره'}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () =>
      api
        .get('/api/dashboard')
        .then((response) => response.data),
    staleTime: 1000 * 60 * 3,
  });

  const { data: weekData } = useQuery({
    queryKey: ['weekly'],
    queryFn: () =>
      api
        .get('/api/dashboard/weekly')
        .then((response) => response.data?.weekly || []),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: leaderboard,
    isLoading: leaderboardLoading,
    isError: leaderboardError,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () =>
      api
        .get('/api/dashboard/leaderboard')
        .then((response) => response.data?.leaderboard || []),
    staleTime: 1000 * 60 * 5,
    enabled: tab === 'rank',
  });

  const user = data?.user || {};
  const stats = data?.stats || {};

  const percentage = toPercent(stats.percentage);

  const exams = Array.isArray(data?.upcoming_exams)
    ? data.upcoming_exams
    : [];

  const weakTopics = Array.isArray(stats.weak_topics)
    ? stats.weak_topics
    : [];

  const weekly = Array.isArray(weekData)
    ? weekData
    : [];

  const leaders = Array.isArray(leaderboard)
    ? leaderboard
    : [];

  const openTickets = toNumber(data?.open_tickets);

  const roleLabels = {
    admin: '👑 ادمین',
    content_admin: '🎓 ادمین محتوا',
    support: '🛟 پشتیبان',
  };

  return (
    <>
      <Header
        title="داشبورد"
        back={false}
        subtitle={
          data
            ? `ورودی ${user.intake || '—'} | گروه ${user.group || '—'}`
            : ''
        }
        right={
          <button
            onClick={() => {
              haptic();
              refetch();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              opacity: isRefetching ? 0.5 : 1,
            }}
            aria-label="به‌روزرسانی داشبورد"
            disabled={isRefetching}
          >
            🔄
          </button>
        }
      />

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
            <SkeletonCard />
          </div>
        ) : isError ? (
          <ErrorCard
            message="دریافت اطلاعات داشبورد با مشکل مواجه شد."
            onRetry={refetch}
            loading={isRefetching}
          />
        ) : data ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div className="card card-glow">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      color: 'var(--txm)',
                      fontSize: 12,
                    }}
                  >
                    سلام 👋
                  </div>

                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 20,
                      marginTop: 2,
                    }}
                  >
                    {user.name || 'کاربر هامزیار'}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 5,
                      marginTop: 7,
                      flexWrap: 'wrap',
                    }}
                  >
                    {roleLabels[user.role] && (
                      <span className="badge b-yel">
                        {roleLabels[user.role]}
                      </span>
                    )}

                    {stats.level && (
                      <span
                        style={{
                          background: `${
                            stats.level.color || '#60A5FA'
                          }20`,
                          color: stats.level.color || '#60A5FA',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {stats.level.icon || '📈'}{' '}
                        {stats.level.label || 'سطح کاربر'}
                      </span>
                    )}
                  </div>
                </div>

                <Ring pct={percentage} />
              </div>
            </div>

            <div className="tab-bar">
              {[
                ['stats', '📈 آمار'],
                ['exams', '⏳ امتحانات'],
                ['rank', '🏅 رتبه'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    haptic();
                    setTab(key);
                  }}
                  className="tab-btn"
                  style={{
                    background:
                      tab === key
                        ? 'var(--acc)'
                        : 'transparent',
                    color:
                      tab === key
                        ? '#fff'
                        : 'var(--tx2)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'stats' && (
              <>
                <div className="grid2">
                  {[
                    [
                      '🧪',
                      toNumber(stats.total_answers),
                      'سوال',
                      'var(--acc)',
                    ],
                    [
                      '✅',
                      toNumber(stats.correct_answers),
                      'صحیح',
                      'var(--ok)',
                    ],
                    [
                      '📥',
                      toNumber(stats.downloads),
                      'دانلود',
                      'var(--info)',
                    ],
                    [
                      '🔥',
                      toNumber(stats.week_activity),
                      'این هفته',
                      'var(--warn)',
                    ],
                  ].map(([icon, value, label, color]) => (
                    <div
                      key={label}
                      className="card"
                      style={{
                        textAlign: 'center',
                        padding: '12px 8px',
                      }}
                    >
                      <div style={{ fontSize: 22 }}>
                        {icon}
                      </div>

                      <div
                        style={{
                          fontSize: 21,
                          fontWeight: 800,
                          color,
                          margin: '3px 0',
                        }}
                      >
                        {value}
                      </div>

                      <div
                        style={{
                          fontSize: 10.5,
                          color: 'var(--txm)',
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                {weekly.length > 0 && (
                  <div className="card">
                    <div
                      style={{
                        color: 'var(--txm)',
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      فعالیت ۷ روز اخیر
                    </div>

                    <WeekBar
                      data={weekly.map(
                        (item) => item?.count
                      )}
                    />
                  </div>
                )}

                {weakTopics.length > 0 && (
                  <div className="card">
                    <div className="sec-title">
                      ⚡ نقاط ضعف
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      {weakTopics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => {
                            haptic();
                            navigate(
                              '/learn/questions?mode=weak'
                            );
                          }}
                          style={{
                            background:
                              'rgba(239,68,68,.12)',
                            color: 'var(--err)',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font)',
                          }}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'exams' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {exams.length === 0 ? (
                  <div className="empty">
                    <div
                      style={{
                        fontSize: 40,
                        marginBottom: 10,
                      }}
                    >
                      📭
                    </div>

                    <div>
                      امتحانی در ۷ روز آینده نیست
                    </div>
                  </div>
                ) : (
                  exams.map((exam, index) => {
                    const daysLeft =
                      exam.days_left == null
                        ? null
                        : toNumber(exam.days_left);

                    const urgent =
                      daysLeft !== null &&
                      daysLeft <= 3;

                    return (
                      <div
                        key={
                          exam.id ||
                          `${exam.lesson}-${exam.date}-${index}`
                        }
                        className="card"
                        style={{
                          borderColor: urgent
                            ? 'rgba(239,68,68,.3)'
                            : 'var(--bd)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 'var(--r-md)',
                              background: urgent
                                ? 'rgba(239,68,68,.1)'
                                : 'rgba(59,130,246,.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                              flexShrink: 0,
                            }}
                          >
                            📝
                          </div>

                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 13.5,
                                color: urgent
                                  ? 'var(--err)'
                                  : 'var(--tx)',
                              }}
                            >
                              {exam.lesson || 'امتحان'}
                            </div>

                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--txm)',
                                marginTop: 2,
                              }}
                            >
                              {exam.date ||
                                'تاریخ نامشخص'}{' '}
                              {exam.time
                                ? `• ${exam.time}`
                                : ''}
                            </div>
                          </div>

                          {daysLeft !== null && (
                            <span
                              className={`badge ${
                                daysLeft === 0
                                  ? 'b-red'
                                  : daysLeft <= 3
                                    ? 'b-yel'
                                    : 'b-grn'
                              }`}
                            >
                              {daysLeft === 0
                                ? 'امروز!'
                                : daysLeft === 1
                                  ? 'فردا!'
                                  : `${daysLeft} روز`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab === 'rank' && (
              <>
                <div
                  className="card"
                  style={{
                    background:
