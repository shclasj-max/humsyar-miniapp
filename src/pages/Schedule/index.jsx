import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import {
  Spinner,
} from '../../components/shared/Loading';

import {
  ScheduleSkeleton,
} from '../../components/shared/skeletons';
import { haptic } from '../../lib/telegram';
import { useAuthStore } from '../../stores/authStore';

const TYPES = {
  class: {
    icon: '🏫',
    label: 'کلاس‌ها',
    color: '#70A7FF',
    soft: 'rgba(59,130,246,.12)',
  },

  exam: {
    icon: '📝',
    label: 'امتحانات',
    color: '#FB7185',
    soft: 'rgba(239,68,68,.12)',
  },

  makeup: {
    icon: '🔄',
    label: 'جبرانی',
    color: '#FCD34D',
    soft: 'rgba(245,158,11,.12)',
  },
};

const days = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? Math.max(
        0,
        Math.floor(parsed)
      )
    : null;
};

const groupName = (value) => {
  if (
    !value ||
    value === '0'
  ) {
    return '';
  }

  if (value === 'هر دو') {
    return 'هر دو گروه';
  }

  return `گروه ${value}`;
};

function Empty({
  type,
}) {
  return (
    <div className="empty card">
      <div className="empty__ic">
        {TYPES[type].icon}
      </div>

      <div>
        موردی در بخش{' '}
        {TYPES[type].label}{' '}
        ثبت نشده است.
      </div>
    </div>
  );
}

export default function Schedule() {
  const [
    tab,
    setTab,
  ] = useState('class');

  const userGroup = useAuthStore(
    (state) =>
      state.user?.group || ''
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      'schedule',
      userGroup,
    ],

    queryFn: () =>
      api
        .get('/api/schedule')
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      5 * 60 * 1000,

    refetchOnMount:
      'always',
  });

  const schedule =
    Array.isArray(
      data?.schedule
    )
      ? data.schedule
      : [];

  const items =
    schedule.filter(
      (item) =>
        item?.type === tab
    );

  /* 🧠 موج N3 — Deep Link: /schedule?hl=<درس>
     اولین کارت هم‌نام درس، اسکرول + فلش می‌خورد */
  const [flashIdx, setFlashIdx] = useState(-1);
  const [searchParams] = useSearchParams();
  const hlDone = useRef(false);

  useEffect(() => {
    if (hlDone.current || !items.length) return;

    const hl = searchParams.get('hl');
    if (!hl) return;

    const match = items.findIndex(
      (it) =>
        it.id === hl ||
        (it.lesson || '') === hl ||
        (it.lesson || '').includes(hl)
    );

    if (match < 0) return;

    hlDone.current = true;
    setFlashIdx(match);

    const el = document.querySelector(
      `[data-lidx="${match}"]`
    );

    if (el) {
      setTimeout(() => {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 60);

      setTimeout(() => setFlashIdx(-1), 3200);
    }
  }, [items, searchParams]);

  const config =
    TYPES[tab];

  const counts =
    Object.fromEntries(
      Object.keys(TYPES).map(
        (type) => [
          type,

          schedule.filter(
            (item) =>
              item?.type === type
          ).length,
        ]
      )
    );

  const nearestExam =
    schedule.find(
      (item) =>
        item?.type === 'exam'
    );

  const nearestDays =
    days(
      nearestExam?.days_left
    );

  return (
    <>
      <Header
        title="برنامه درسی"
        subtitle={`برنامه شخصی ${
          groupName(
            data?.group ||
            userGroup
          ) || 'شما'
        }`}
        back={false}
        onRefresh={refetch}
        refreshing={isRefetching}
      />

      <main className="page fade-up">
        <section
          className={
            'card card-glow hero-card'
          }
          style={{
            marginBottom: 14,
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
              style={{
                width: 52,
                height: 52,

                display: 'grid',
                placeItems: 'center',

                borderRadius:
                  16,

                background:
                  'var(--grad-brand)',

                boxShadow:
                  'var(--shd-glow)',

                fontSize: 24,
              }}
            >
              📅
            </div>

            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    10.5,
                }}
              >
                برنامه ترم جاری
              </div>

              <div
                style={{
                  fontSize: 17,

                  fontWeight:
                    900,

                  marginTop:
                    2,
                }}
              >
                {groupName(
                  data?.group ||
                  userGroup
                ) ||
                  'گروه نامشخص'}
              </div>

              <div
                style={{
                  display: 'flex',

                  gap: 5,

                  marginTop:
                    7,
                }}
              >
                <span className="badge b-acc">
                  {counts.class ||
                    0}{' '}
                  کلاس
                </span>

                <span className="badge b-red">
                  {counts.exam ||
                    0}{' '}
                  امتحان
                </span>
              </div>
            </div>

            {nearestExam &&
              nearestDays !==
                null && (
                <div
                  style={{
                    minWidth:
                      58,

                    textAlign:
                      'center',

                    padding:
                      '8px 7px',

                    borderRadius:
                      14,

                    background:
                      nearestDays <=
                      3
                        ? 'rgba(239,68,68,.12)'
                        : 'var(--acc-soft)',

                    border:
                      `1px solid ${
                        nearestDays <=
                        3
                          ? 'rgba(239,68,68,.24)'
                          : 'var(--bdg)'
                      }`,
                  }}
                >
                  <div
                    style={{
                      color:
                        nearestDays <=
                        3
                          ? 'var(--err)'
                          : 'var(--acc2)',

                      fontSize:
                        18,

                      fontWeight:
                        900,
                    }}
                  >
                    {nearestDays}
                  </div>

                  <div
                    style={{
                      color:
                        'var(--txm)',

                      fontSize:
                        8,
                    }}
                  >
                    {nearestDays ===
                    0
                      ? 'امروز'
                      : 'روز تا امتحان'}
                  </div>
                </div>
              )}
          </div>
        </section>

        <div
          className="tab-bar"
          role="tablist"
        >
          {Object.entries(
            TYPES
          ).map(
            ([key, item]) => (
              <button
                type="button"
                role="tab"
                aria-selected={
                  tab === key
                }
                key={key}
                className={`tab-btn ${
                  tab === key
                    ? 'tab-btn--on'
                    : ''
                }`}
                onClick={() => {
                  haptic();
                  setTab(key);
                }}
              >
                {item.icon}{' '}
                {item.label}{' '}

                {counts[key]
                  ? `(${counts[key]})`
                  : ''}
              </button>
            )
          )}
        </div>

        {isLoading ? (
          <ScheduleSkeleton />
        ) : isError ? (
          <div className="empty card">
            <div className="empty__ic">
              🌐
            </div>

            <div>
              دریافت برنامه انجام نشد.
            </div>

            <button
              className="btn btn-p"
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
        ) : items.length === 0 ? (
          <Empty type={tab} />
        ) : (
          <section
            style={{
              display: 'grid',
              gap: 9,
            }}
          >
            {items.map(
              (item, index) => {
                const remaining =
                  days(
                    item.days_left
                  );

                const urgent =
                  item.type ===
                    'exam' &&
                  remaining !==
                    null &&
                  remaining <= 3;

                const note =
                  item.note ||
                  item.flex_note ||
                  '';

                return (
                  <article
                    key={
                      item.id ||
                      `${item.lesson}-${index}`
                    }
                    data-lidx={index}
                    className={
                      flashIdx === index
                        ? 'card hl-flash'
                        : 'card'
                    }
                    style={{
                      padding: 13,

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
                          'flex-start',

                        gap: 11,
                      }}
                    >
                      <div
                        style={{
                          display:
                            'grid',

                          flex:
                            '0 0 46px',

                          height:
                            46,

                          placeItems:
                            'center',

                          borderRadius:
                            14,

                          background:
                            urgent
                              ? 'rgba(239,68,68,.12)'
                              : config.soft,

                          fontSize:
                            21,
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
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap: 6,
                          }}
                        >
                          <h3
                            style={{
                              overflow:
                                'hidden',

                              fontSize:
                                13.5,

                              fontWeight:
                                850,

                              textOverflow:
                                'ellipsis',

                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            {item.lesson ||
                              'بدون عنوان'}
                          </h3>

                          {item.flex_type ===
                            'flexible' && (
                            <span className="badge b-yel">
                              منعطف
                            </span>
                          )}
                        </div>

                        {item.teacher && (
                          <div
                            style={{
                              color:
                                'var(--tx2)',

                              fontSize:
                                10.5,

                              marginTop:
                                3,
                            }}
                          >
                            👨‍🏫{' '}
                            {item.teacher}
                          </div>
                        )}

                        <div
                          style={{
                            display:
                              'flex',

                            flexWrap:
                              'wrap',

                            gap: 5,

                            marginTop:
                              7,
                          }}
                        >
                          <span className="badge b-acc">
                            📆{' '}
                            {item.date ||
                              'تاریخ نامشخص'}
                          </span>

                          {item.time && (
                            <span className="badge b-gray">
                              ⏰{' '}
                              {item.time}
                            </span>
                          )}

                          {item.location && (
                            <span className="badge b-gray">
                              📍{' '}
                              {
                                item.location
                              }
                            </span>
                          )}

                          {groupName(
                            item.group
                          ) && (
                            <span className="badge b-gray">
                              {groupName(
                                item.group
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.type ===
                        'exam' &&
                        remaining !==
                          null && (
                          <span
                            className={`badge ${
                              urgent
                                ? 'b-red'
                                : 'b-grn'
                            }`}
                          >
                            {remaining ===
                            0
                              ? 'امروز'
                              : remaining ===
                                  1
                                ? 'فردا'
                                : `${remaining} روز`}
                          </span>
                        )}
                    </div>

                    {note && (
                      <div
                        style={{
                          marginTop:
                            10,

                          padding:
                            '8px 10px',

                          color:
                            'var(--tx2)',

                          background:
                            'rgba(100,116,139,.08)',

                          borderRadius:
                            11,

                          fontSize:
                            10.5,

                          lineHeight:
                            1.7,
                        }}
                      >
                        📝 {note}
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </section>
        )}
      </main>
    </>
  );
}
