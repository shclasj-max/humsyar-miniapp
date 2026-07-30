import { useState } from 'react';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  useNavigate,
} from 'react-router-dom';

import api from '../../lib/api';
import {
  useDebouncedValue,
} from '../../lib/useDebounce';
import Header from '../../components/layout/Header';

import {
  SkeletonCard,
  Spinner,
} from '../../components/shared/Loading';

import {
  haptic,
} from '../../lib/telegram';


const TYPES = {
  question: [
    'سؤال',
    'b-pur',
  ],

  resource: [
    'منبع',
    'b-grn',
  ],

  qbank: [
    'بانک فایل',
    'b-yel',
  ],

  reference: [
    'رفرنس',
    'b-acc',
  ],

  schedule: [
    'برنامه',
    'b-red',
  ],

  faq: [
    'راهنما',
    'b-gray',
  ],
};


export default function GlobalSearch() {
  const [
    query,
    setQuery,
  ] = useState('');

  /* ✅ جلوگیری از ریکوئست با هر ضربه کلید */
  const debouncedQuery =
    useDebouncedValue(query, 380);

  const [
    type,
    setType,
  ] = useState('all');

  const navigate =
    useNavigate();


  const {
    data,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'global-search',
      debouncedQuery.trim(),
    ],

    queryFn: () =>
      api
        .get(
          '/api/search',

          {
            params: {
              q:
                debouncedQuery.trim(),
            },
          }
        )
        .then(
          (response) =>
            response.data
        ),

    enabled:
      debouncedQuery.trim().length >= 2,

    staleTime:
      60_000,
  });


  const allResults =
    Array.isArray(
      data?.results
    )
      ? data.results
      : [];


  const results =
    type === 'all'
      ? allResults

      : allResults.filter(
          (item) =>
            item.type === type
        );


  const availableTypes = [
    ...new Set(
      allResults.map(
        (item) =>
          item.type
      )
    ),
  ];


  const open = (item) => {
    haptic('light');

    navigate(
      item.route
    );
  };


  return (
    <>
      <Header
        title="جست‌وجوی سراسری"
        subtitle={
          'سؤال، منبع، رفرنس، برنامه و راهنما'
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
              'linear-gradient(145deg,rgba(34,211,238,.12),rgba(16,24,39,.95) 55%,rgba(59,130,246,.1))',
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                12,
            }}
          >
            <span
              style={{
                display:
                  'grid',

                width:
                  52,

                height:
                  52,

                placeItems:
                  'center',

                borderRadius:
                  16,

                background:
                  'linear-gradient(135deg,#0891B2,#3B82F6)',

                fontSize:
                  25,
              }}
            >
              🔎
            </span>

            <div>
              <b
                style={{
                  fontSize:
                    16.5,
                }}
              >
                همه‌چیز را یکجا پیدا کن
              </b>

              <div
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    10,

                  marginTop:
                    3,
                }}
              >
                حداقل دو حرف از عنوان، درس
                یا محتوا بنویسید.
              </div>
            </div>
          </div>


          <div
            style={{
              position:
                'relative',

              marginTop:
                14,
            }}
          >
            <input
              className="inp"
              value={query}
              onChange={(event) => {
                setQuery(
                  event.target.value
                );

                setType('all');
              }}
              placeholder={
                'مثلاً فیزیولوژی، قلب یا امتحان...'
              }
              style={{
                paddingLeft:
                  42,
              }}
              autoFocus
            />

            {isFetching && (
              <span
                style={{
                  position:
                    'absolute',

                  left:
                    12,

                  top:
                    12,
                }}
              >
                <Spinner size={16} />
              </span>
            )}
          </div>
        </section>


        {query.trim().length <
          2 ? (
          <section className="grid2">
            {[
              [
                '🧪',
                'سؤال‌ها',
              ],

              [
                '📚',
                'منابع',
              ],

              [
                '📘',
                'رفرنس‌ها',
              ],

              [
                '📅',
                'برنامه',
              ],
            ].map(
              ([
                icon,
                label,
              ]) => (
                <div
                  key={label}
                  className="card"
                  style={{
                    padding:
                      14,

                    textAlign:
                      'center',
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        24,
                    }}
                  >
                    {icon}
                  </div>

                  <div
                    style={{
                      color:
                        'var(--txm)',

                      fontSize:
                        9.5,

                      marginTop:
                        5,
                    }}
                  >
                    {label}
                  </div>
                </div>
              )
            )}
          </section>
        ) : isError ? (
          <div className="empty card">
            جست‌وجو انجام نشد.

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
          !isFetching &&
          allResults.length === 0
        ) ? (
          <div className="empty card">
            نتیجه‌ای برای «{query}» پیدا
            نشد.
          </div>
        ) : (
          <>
            {availableTypes.length >
              1 && (
              <div className="tab-bar">
                <button
                  className="tab-btn"
                  onClick={() =>
                    setType('all')
                  }
                  style={{
                    color:
                      type === 'all'
                        ? '#fff'
                        : 'var(--tx2)',

                    background:
                      type === 'all'
                        ? 'var(--grad-brand)'
                        : 'transparent',
                  }}
                >
                  همه (
                  {allResults.length})
                </button>

                {availableTypes.map(
                  (key) => (
                    <button
                      key={key}
                      className="tab-btn"
                      onClick={() =>
                        setType(key)
                      }
                      style={{
                        color:
                          type === key
                            ? '#fff'
                            : 'var(--tx2)',

                        background:
                          type === key
                            ? 'var(--grad-brand)'
                            : 'transparent',
                      }}
                    >
                      {TYPES[key]
                        ?.[0] || key}
                    </button>
                  )
                )}
              </div>
            )}


            {isFetching &&
            allResults.length ===
              0 ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <section
                style={{
                  display:
                    'grid',

                  gap:
                    8,
                }}
              >
                {results.map(
                  (
                    item,
                    index
                  ) => {
                    const [
                      label,
                      badge,
                    ] = (
                      TYPES[
                        item.type
                      ] || [
                        item.type,

                        'b-gray',
                      ]
                    );

                    return (
                      <button
                        type="button"
                        key={`${
                          item.type
                        }-${
                          item.id
                        }-${index}`}
                        className={
                          'card card-tap pop-in'
                        }
                        onClick={() =>
                          open(item)
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

                          animationDelay:
                            `${
                              Math.min(
                                index,
                                10
                              ) * 25
                            }ms`,
                        }}
                      >
                        <span
                          style={{
                            display:
                              'grid',

                            flex:
                              '0 0 44px',

                            height:
                              44,

                            placeItems:
                              'center',

                            borderRadius:
                              14,

                            background:
                              'rgba(100,116,139,.1)',

                            fontSize:
                              21,
                          }}
                        >
                          {item.icon ||
                            '🔎'}
                        </span>

                        <span
                          style={{
                            flex:
                              1,

                            minWidth:
                              0,
                          }}
                        >
                          <b
                            style={{
                              display:
                                '-webkit-box',

                              overflow:
                                'hidden',

                              fontSize:
                                12,

                              lineHeight:
                                1.7,

                              WebkitBoxOrient:
                                'vertical',

                              WebkitLineClamp:
                                2,
                            }}
                          >
                            {item.title ||
                              'نتیجه جست‌وجو'}
                          </b>

                          {item.subtitle && (
                            <span
                              style={{
                                display:
                                  'block',

                                overflow:
                                  'hidden',

                                color:
                                  'var(--txm)',

                                fontSize:
                                  9.5,

                                marginTop:
                                  3,

                                textOverflow:
                                  'ellipsis',

                                whiteSpace:
                                  'nowrap',
                              }}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </span>

                        <span
                          className={`badge ${badge}`}
                        >
                          {label}
                        </span>

                        <span>←</span>
                      </button>
                    );
                  }
                )}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
