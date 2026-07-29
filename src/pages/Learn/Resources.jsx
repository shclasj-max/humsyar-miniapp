import { useState } from 'react';

import {
  useMutation,
  useQuery,
} from '@tanstack/react-query';

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


const TYPES = {
  video: [
    '🎬',
    'ویدیو',
    '#FB7185',
    'rgba(239,68,68,.12)',
  ],

  ppt: [
    '📊',
    'اسلاید',
    '#FCD34D',
    'rgba(245,158,11,.12)',
  ],

  pdf: [
    '📄',
    'PDF',
    '#70A7FF',
    'rgba(59,130,246,.12)',
  ],

  note: [
    '📝',
    'جزوه',
    '#34D399',
    'rgba(16,185,129,.12)',
  ],

  test: [
    '🧪',
    'آزمون',
    '#C4B5FD',
    'rgba(139,92,246,.13)',
  ],

  voice: [
    '🎧',
    'صوت',
    '#22D3EE',
    'rgba(34,211,238,.12)',
  ],
};


export default function Resources() {
  const [
    view,
    setView,
  ] = useState('terms');

  const [
    term,
    setTerm,
  ] = useState(null);

  const [
    lesson,
    setLesson,
  ] = useState(null);

  const [
    session,
    setSession,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState('');

  const toast = useUIStore(
    (state) => state.toast
  );


  const {
    data: terms = [],
    isLoading: termsLoading,
    isError: termsError,
  } = useQuery({
    queryKey: [
      'resource-terms',
    ],

    queryFn: () =>
      api
        .get(
          '/api/resources/terms'
        )
        .then(
          (response) =>
            response.data
              ?.terms || []
        ),

    staleTime:
      10 * 60 * 1000,
  });


  const {
    data: lessons = [],
    isLoading: lessonsLoading,
  } = useQuery({
    queryKey: [
      'resource-lessons',
      term?.name,
    ],

    queryFn: () =>
      api
        .get(
          `/api/resources/lessons/${
            encodeURIComponent(
              term.name
            )
          }`
        )
        .then(
          (response) =>
            response.data
              ?.lessons || []
        ),

    enabled:
      view === 'lessons' &&
      Boolean(term),
  });


  const {
    data: sessions = [],
    isLoading: sessionsLoading,
  } = useQuery({
    queryKey: [
      'resource-sessions',
      lesson?._id,
    ],

    queryFn: () =>
      api
        .get(
          `/api/resources/sessions/${
            lesson._id
          }`
        )
        .then(
          (response) =>
            response.data
              ?.sessions || []
        ),

    enabled:
      view === 'sessions' &&
      Boolean(lesson?._id),
  });


  const {
    data: files = [],
    isLoading: filesLoading,
  } = useQuery({
    queryKey: [
      'resource-files',
      session?._id,
    ],

    queryFn: () =>
      api
        .get(
          `/api/resources/files/${
            session._id
          }`
        )
        .then(
          (response) =>
            response.data
              ?.files || []
        ),

    enabled:
      view === 'files' &&
      Boolean(session?._id),
  });


  const {
    data: results = [],
    isFetching: searching,
  } = useQuery({
    queryKey: [
      'resource-search',
      search,
    ],

    queryFn: () =>
      api
        .get(
          '/api/resources/search',

          {
            params: {
              q: search.trim(),
            },
          }
        )
        .then(
          (response) =>
            response.data
              ?.results || []
        ),

    enabled:
      search.trim().length >= 2,
  });


  const downloadMutation =
    useMutation({
      mutationFn: (id) =>
        api.post(
          `/api/resources/download/${id}`
        ),

      onSuccess: (
        response
      ) => {
        hapticNotif(
          'success'
        );

        toast(
          `${
            response.data?.name ||
            'فایل'
          } در ربات ارسال شد ✅`,

          'success'
        );
      },

      onError: (error) =>
        toast(
          error?.response
            ?.data
            ?.detail ||
            'ارسال فایل انجام نشد',

          'error'
        ),
    });


  const goBack = () => {
    if (view === 'files') {
      setSession(null);
      setView('sessions');

    } else if (
      view === 'sessions'
    ) {
      setLesson(null);
      setView('lessons');

    } else if (
      view === 'lessons'
    ) {
      setTerm(null);
      setView('terms');
    }
  };


  const title =
    view === 'files'
      ? session?.topic ||
        'فایل‌های جلسه'

      : view === 'sessions'
        ? lesson?.name ||
          'جلسات درس'

        : view === 'lessons'
          ? term?.name ||
            'درس‌ها'

          : 'منابع علوم پایه';


  const searchRows =
    search.trim().length >= 2
      ? (
          Array.isArray(results)
            ? results
            : []
        )
      : null;


  function ResourceFile({
    item,
    searchMode = false,
  }) {
    const [
      icon,
      label,
      color,
      soft,
    ] = (
      TYPES[item.type] || [
        '📎',
        'فایل',
        '#70A7FF',
        'rgba(59,130,246,.12)',
      ]
    );

    return (
      <article
        className="card"
        style={{
          padding:
            13,
        }}
      >
        <div
          style={{
            display:
              'flex',

            alignItems:
              'center',

            gap:
              11,
          }}
        >
          <span
            style={{
              display:
                'grid',

              width:
                46,

              height:
                46,

              placeItems:
                'center',

              borderRadius:
                14,

              color,

              background:
                soft,

              fontSize:
                22,
            }}
          >
            {icon}
          </span>

          <div
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
                  'block',

                overflow:
                  'hidden',

                fontSize:
                  12.5,

                textOverflow:
                  'ellipsis',

                whiteSpace:
                  'nowrap',
              }}
            >
              {item.name ||
                label}
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
              {searchMode
                ? `${item.lesson || ''} ${
                    item.session
                      ? `• ${item.session}`
                      : ''
                  }`
                : `${label} • ${
                    Number(
                      item.downloads
                    ) || 0
                  } دانلود`}
            </div>

            {item.description && (
              <div
                style={{
                  color:
                    'var(--tx2)',

                  fontSize:
                    9.5,

                  marginTop:
                    3,
                }}
              >
                {item.description}
              </div>
            )}
          </div>

          <button
            className="btn btn-p"
            style={{
              minHeight:
                35,

              padding:
                '6px 10px',

              fontSize:
                10,
            }}
            disabled={
              downloadMutation
                .isPending
            }
            onClick={() =>
              downloadMutation.mutate(
                item.id
              )
            }
          >
            {downloadMutation
              .isPending ? (
              <Spinner size={13} />
            ) : (
              'ارسال'
            )}
          </button>
        </div>
      </article>
    );
  }


  return (
    <>
      <Header
        title={title}
        subtitle={
          'کتابخانه محتوای آموزشی'
        }
        back={
          view !== 'terms'
        }
        onBack={
          view !== 'terms'
            ? goBack
            : undefined
        }
      />

      <main className="page fade-up">
        {view === 'terms' && (
          <section
            className={
              'card card-glow'
            }
            style={{
              padding:
                17,

              marginBottom:
                14,

              background:
                'linear-gradient(145deg,rgba(16,185,129,.13),rgba(16,24,39,.95) 55%,rgba(34,211,238,.08))',
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
                    52,

                  height:
                    52,

                  placeItems:
                    'center',

                  borderRadius:
                    16,

                  background:
                    'linear-gradient(135deg,#059669,#06B6D4)',

                  fontSize:
                    25,
                }}
              >
                📚
              </span>

              <div>
                <b
                  style={{
                    fontSize:
                      16.5,
                  }}
                >
                  کتابخانه علوم پایه
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
                  محتوای آموزشی را
                  ترم‌به‌ترم دنبال کنید.
                </div>
              </div>
            </div>
          </section>
        )}


        <div
          style={{
            position:
              'relative',

            marginBottom:
              14,
          }}
        >
          <input
            className="inp"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={
              'جست‌وجو در تمام منابع...'
            }
            style={{
              paddingLeft:
                40,
            }}
          />

          {searching && (
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
              <Spinner size={15} />
            </span>
          )}
        </div>


        {searchRows !== null ? (
          <section
            style={{
              display:
                'grid',

              gap:
                9,
            }}
          >
            <div className="sec-title">
              نتایج جست‌وجو (
              {searchRows.length})
            </div>

            {searchRows.length ? (
              searchRows.map(
                (item) => (
                  <ResourceFile
                    key={item.id}
                    item={item}
                    searchMode
                  />
                )
              )
            ) : (
              !searching && (
                <div className="empty card">
                  نتیجه‌ای پیدا نشد.
                </div>
              )
            )}
          </section>
        ) : view === 'terms' ? (
          termsLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : termsError ? (
            <div className="empty card">
              دریافت ترم‌ها انجام نشد.
            </div>
          ) : (
            <section className="grid2">
              {(
                Array.isArray(terms)
                  ? terms
                  : []
              ).map(
                (
                  item,
                  index
                ) => (
                  <button
                    type="button"
                    key={item.name}
                    className={
                      'card card-tap pop-in'
                    }
                    onClick={() => {
                      haptic();

                      setTerm(item);

                      setView(
                        'lessons'
                      );
                    }}
                    style={{
                      padding:
                        16,

                      textAlign:
                        'center',

                      animationDelay:
                        `${
                          index * 35
                        }ms`,
                    }}
                  >
                    <span
                      style={{
                        display:
                          'grid',

                        width:
                          50,

                        height:
                          50,

                        placeItems:
                          'center',

                        margin:
                          '0 auto 8px',

                        borderRadius:
                          16,

                        background:
                          'rgba(16,185,129,.12)',

                        fontSize:
                          24,
                      }}
                    >
                      🎓
                    </span>

                    <b
                      style={{
                        fontSize:
                          12.5,
                      }}
                    >
                      {item.name}
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
                      {Number(
                        item
                          .lesson_count
                      ) || 0}{' '}

                      درس
                    </div>
                  </button>
                )
              )}
            </section>
          )
        ) : view === 'lessons' ? (
          lessonsLoading ? (
            <SkeletonCard />
          ) : (
            <section
              style={{
                display:
                  'grid',

                gap:
                  9,
              }}
            >
              {(
                Array.isArray(
                  lessons
                )
                  ? lessons
                  : []
              ).map((item) => (
                <button
                  type="button"
                  key={item._id}
                  className={
                    'card card-tap'
                  }
                  onClick={() => {
                    setLesson(item);

                    setView(
                      'sessions'
                    );
                  }}
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

                      background:
                        'var(--acc-soft)',

                      fontSize:
                        21,
                    }}
                  >
                    📖
                  </span>

                  <span
                    style={{
                      flex:
                        1,
                    }}
                  >
                    <b
                      style={{
                        fontSize:
                          12.5,
                      }}
                    >
                      {item.name ||
                        'درس'}
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
                      {Number(
                        item
                          .session_count
                      ) || 0}{' '}

                      جلسه
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
          )
        ) : view === 'sessions' ? (
          sessionsLoading ? (
            <SkeletonCard />
          ) : (
            <section
              style={{
                display:
                  'grid',

                gap:
                  9,
              }}
            >
              {(
                Array.isArray(
                  sessions
                )
                  ? sessions
                  : []
              ).map(
                (
                  item,
                  index
                ) => (
                  <button
                    type="button"
                    key={item._id}
                    className={
                      'card card-tap'
                    }
                    onClick={() => {
                      setSession(item);

                      setView(
                        'files'
                      );
                    }}
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

                        background:
                          'rgba(139,92,246,.13)',

                        color:
                          '#C4B5FD',

                        fontSize:
                          13,

                        fontWeight:
                          900,
                      }}
                    >
                      {item.number ||
                        index + 1}
                    </span>

                    <span
                      style={{
                        flex:
                          1,
                      }}
                    >
                      <b
                        style={{
                          fontSize:
                            12.5,
                        }}
                      >
                        {item.topic ||
                          `جلسه ${
                            index + 1
                          }`}
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
                        {Number(
                          item
                            .file_count
                        ) || 0}{' '}

                        فایل
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
                )
              )}
            </section>
          )
        ) : filesLoading ? (
          <SkeletonCard />
        ) : (
          <section
            style={{
              display:
                'grid',

              gap:
                9,
            }}
          >
            {(
              Array.isArray(files)
                ? files
                : []
            ).length ? (
              files.map(
                (item) => (
                  <ResourceFile
                    key={item.id}
                    item={item}
                  />
                )
              )
            ) : (
              <div className="empty card">
                فایلی در این جلسه ثبت نشده
                است.
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
