import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';
import { useAuthStore } from '../../stores/authStore';

const TYPE_CONFIG = {
  class: {
    icon: '🏫',
    color: 'var(--acc)',
    soft: 'rgba(59,130,246,.12)',
    label: 'کلاس‌ها',
  },
  exam: {
    icon: '📝',
    color: 'var(--err)',
    soft: 'rgba(239,68,68,.11)',
    label: 'امتحانات',
  },
  makeup: {
    icon: '🔄',
    color: 'var(--warn)',
    soft: 'rgba(245,158,11,.11)',
    label: 'جبرانی',
  },
};

const safeDays = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(0, Math.floor(number))
    : null;
};

const groupLabel = (group) => {
  if (!group || group === '0') {
    return '';
  }

  if (group === 'هر دو') {
    return 'هر دو گروه';
  }

  return `گروه ${group}`;
};

export default function Schedule() {
  const [tab, setTab] = useState('class');

  const userGroup = useAuthStore(
    (state) => state.user?.group || ''
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['schedule', userGroup],

    queryFn: () =>
      api
        .get('/api/schedule')
        .then((response) => response.data),

    staleTime: 1000 * 60 * 5,
    refetchOnMount: 'always',
  });

  const schedule = Array.isArray(
    data?.schedule
  )
    ? data.schedule
    : [];

  const items = schedule.filter(
    (item) => item?.type === tab
  );

  const config = TYPE_CONFIG[tab];

  const counts = Object.keys(
    TYPE_CONFIG
  ).reduce((result, type) => {
    result[type] = schedule.filter(
      (item) => item?.type === type
    ).length;

    return result;
  }, {});

  return (
    <>
      <Header
        title="برنامه"
        subtitle={`گروه ${
          data?.group || userGroup || '—'
        }`}
        back={false}
        right={
          <button
            onClick={() => {
              haptic();
              refetch();
            }}
            disabled={isRefetching}
            aria-label="به‌روزرسانی برنامه"
            style={{
              background: 'none',
              border: 'none',
              cursor: isRefetching
                ? 'default'
                : 'pointer',
              fontSize: 18,
              opacity: isRefetching ? 0.5 : 1,
            }}
          >
            🔄
          </button>
        }
      />

      <div className="page fade-up">
        <div className="tab-bar">
          {Object.entries(
            TYPE_CONFIG
          ).map(([key, item]) => (
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
                    ? item.color
                    : 'transparent',

                color:
                  tab === key
                    ? '#fff'
                    : 'var(--tx2)',
              }}
            >
              {item.icon} {item.label}

              {counts[key] > 0
                ? ` (${counts[key]})`
                : ''}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {[1, 2, 3].map((item) => (
              <SkeletonCard key={item} />
            ))}
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
              دریافت برنامه با مشکل مواجه شد.
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
        ) : items.length === 0 ? (
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
              موردی در این بخش ثبت نشده است.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}
          >
            {items.map((item, index) => {
              const daysLeft = safeDays(
                item.days_left
              );

              const urgent =
                item.type === 'exam' &&
                daysLeft !== null &&
                daysLeft <= 3;

              const sharedGroup = groupLabel(
                item.group
              );

              const note =
                item.note ||
                item.flex_note ||
                '';

              return (
                <div
                  key={
                    item.id ||
                    `${item.lesson}-${item.date}-${item.time}-${index}`
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
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius:
                          'var(--r-md)',
                        background:
                          config.soft,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {config.icon}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: urgent
                            ? 'var(--err)'
                            : 'var(--tx)',
                        }}
                      >
                        {item.lesson ||
                          'بدون عنوان'}
                      </div>

                      {item.teacher && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color:
                              'var(--tx2)',
                            marginTop: 2,
                          }}
                        >
                          استاد: {item.teacher}
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          gap: 5,
                          marginTop: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span className="badge b-acc">
                          {item.date ||
                            'تاریخ نامشخص'}
                        </span>

                        {item.time && (
                          <span className="badge b-gray">
                            ⏰ {item.time}
                          </span>
                        )}

                        {item.location && (
                          <span className="badge b-gray">
                            📍 {item.location}
                          </span>
                        )}

                        {sharedGroup && (
                          <span className="badge b-gray">
                            {sharedGroup}
                          </span>
                        )}

                        {item.flex_type ===
                          'flexible' && (
                          <span className="badge b-yel">
                            زمان منعطف
                          </span>
                        )}
                      </div>

                      {note && (
                        <div
                          style={{
                            fontSize: 11,
                            color:
                              'var(--txm)',
                            marginTop: 7,
                            lineHeight: 1.7,
                          }}
                        >
                          📝 {note}
                        </div>
                      )}
                    </div>

                    {item.type === 'exam' &&
                      daysLeft !== null && (
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
            })}
          </div>
        )}
      </div>
    </>
  );
}
