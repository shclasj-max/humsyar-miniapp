import {
  useRef,
  useState,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import Header from '../../components/layout/Header';

import {
  SkeletonCard,
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


function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}


function errorText(
  error,
  fallback,
) {
  const detail =
    error?.response?.data?.detail;

  return (
    typeof detail === 'string'
    && detail.trim()
  )
    ? detail
    : fallback;
}


function ResourceFile({
  item,
  rowKey,
  sendingKey,
  sendDisabled,
  searchMode = false,
  onSend,
}) {
  const [
    icon,
    label,
    color,
    soft,
  ] = (
    TYPES[item?.type]
    || [
      '📎',
      'فایل',
      '#70A7FF',
      'rgba(59,130,246,.12)',
    ]
  );

  // فقط ردیفی که واقعاً کلیک شده، لودینگ نشان می‌دهد.
  const isSending =
    sendingKey === rowKey;

  const title = (
    item?.name
    || item?.description
    || label
  );

  const context = [
    item?.lesson,
    item?.session,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <article
      className="card"
      style={styles.fileCard}
    >
      <div
        style={{
          ...styles.fileIcon,
          color,
          background: soft,
        }}
      >
        {icon}
      </div>

      <div style={styles.fileBody}>
        <strong style={styles.fileTitle}>
          {title}
        </strong>

        <span style={styles.fileMeta}>
          {
            searchMode
              ? context || label
              : `${label} • ${
                  Number(
                    item?.downloads
                  ) || 0
                } دانلود`
          }
        </span>

        {
          item?.description
          && item.description !== title
          && (
            <p style={styles.fileDescription}>
              {item.description}
            </p>
          )
        }
      </div>

      <button
        type="button"
        className="btn btn-g"
        style={styles.sendButton}
        onClick={
          () => onSend(
            item?.id,
            rowKey,
          )
        }
        disabled={
          sendDisabled
          || !item?.id
        }
        aria-busy={isSending}
        aria-label={
          `ارسال ${title} در ربات`
        }
      >
        {
          isSending
            ? (
              <>
                <Spinner size={15} />
                ارسال...
              </>
            )
            : 'ارسال'
        }
      </button>
    </article>
  );
}


function LoadingList() {
  return (
    <div style={styles.list}>
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </div>
  );
}


function EmptyState({
  icon = '📭',
  text,
}) {
  return (
    <div
      className="card empty"
      style={styles.empty}
    >
      <span style={styles.emptyIcon}>
        {icon}
      </span>

      <p>{text}</p>
    </div>
  );
}


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

  const [
    sendingKey,
    setSendingKey,
  ] = useState(null);

  // این ref به‌صورت هم‌زمان تغییر می‌کند.
  // بنابراین چند لمس سریع قبل از Render بعدی هم
  // نمی‌تواند درخواست دوم بسازد.
  const sendLockRef =
    useRef(null);

  const toast =
    useUIStore(
      (state) => state.toast
    );

  const queryClient =
    useQueryClient();

  const {
    data: terms = [],
    isLoading: termsLoading,
    isError: termsError,
    refetch: refetchTerms,
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
            safeArray(
              response.data?.terms
            )
        ),

    staleTime:
      10 * 60 * 1000,
  });

  const {
    data: lessons = [],
    isLoading: lessonsLoading,
    isError: lessonsError,
    refetch: refetchLessons,
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
            safeArray(
              response.data?.lessons
            )
        ),

    enabled:
      view === 'lessons'
      && Boolean(term?.name),
  });

  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: refetchSessions,
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
            safeArray(
              response.data?.sessions
            )
        ),

    enabled:
      view === 'sessions'
      && Boolean(lesson?._id),
  });

  const {
    data: files = [],
    isLoading: filesLoading,
    isError: filesError,
    refetch: refetchFiles,
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
            safeArray(
              response.data?.files
            )
        ),

    enabled:
      view === 'files'
      && Boolean(session?._id),
  });

  const normalizedSearch =
    search.trim();

  const {
    data: results = [],
    isFetching: searching,
    isError: searchError,
  } = useQuery({
    queryKey: [
      'resource-search',
      normalizedSearch,
    ],

    queryFn: () =>
      api
        .get(
          '/api/resources/search',
          {
            params: {
              q: normalizedSearch,
            },
          }
        )
        .then(
          (response) =>
            safeArray(
              response.data?.results
            )
        ),

    enabled:
      normalizedSearch.length >= 2,
  });

  const downloadMutation =
    useMutation({
      mutationFn: ({
        id,
      }) =>
        api.post(
          `/api/resources/download/${id}`
        ),

      onSuccess: async (
        response
      ) => {
        hapticNotif(
          'success'
        );

        toast(
          `${
            response.data?.name
            || 'فایل'
          } در ربات ارسال شد ✅`,
          'success'
        );

        await Promise.all([
          queryClient
            .invalidateQueries({
              queryKey: [
                'resource-files',
              ],
            }),

          queryClient
            .invalidateQueries({
              queryKey: [
                'resource-search',
              ],
            }),
        ]);
      },

      onError: (error) => {
        hapticNotif(
          'error'
        );

        toast(
          errorText(
            error,
            'ارسال فایل انجام نشد'
          ),
          'error'
        );
      },

      onSettled: (
        _data,
        _error,
        variables
      ) => {
        if (
          sendLockRef.current
          === variables?.key
        ) {
          sendLockRef.current =
            null;
        }

        setSendingKey(
          (current) =>
            current === variables?.key
              ? null
              : current
        );
      },
    });

  const sendFile = (
    id,
    key,
  ) => {
    const fileId =
      String(
        id || ''
      ).trim();

    const rowKey =
      String(
        key || ''
      ).trim();

    if (
      !fileId
      || !rowKey
      || sendLockRef.current
      || downloadMutation.isPending
    ) {
      return;
    }

    // قفل بلافاصله و قبل از mutation فعال می‌شود.
    sendLockRef.current =
      rowKey;

    // فقط کلید همین ردیف ذخیره می‌شود.
    setSendingKey(
      rowKey
    );

    haptic('medium');

    downloadMutation.mutate({
      id: fileId,
      key: rowKey,
    });
  };

  const goBack = () => {
    haptic('light');

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
      ? (
        session?.topic
        || 'فایل‌های جلسه'
      )
      : view === 'sessions'
        ? (
          lesson?.name
          || 'جلسات درس'
        )
        : view === 'lessons'
          ? (
            term?.name
            || 'درس‌ها'
          )
          : 'منابع علوم پایه';

  const subtitle =
    view === 'terms'
      ? (
        'جزوه، ویدیو، اسلاید و فایل‌های آموزشی'
      )
      : view === 'lessons'
        ? (
          'یک درس را انتخاب کنید'
        )
        : view === 'sessions'
          ? (
            'جلسه موردنظر را انتخاب کنید'
          )
          : (
            'فقط فایل انتخاب‌شده در ربات ارسال می‌شود'
          );

  const renderError = (
    message,
    retry,
  ) => (
    <div
      className="card"
      style={styles.errorCard}
    >
      <span>⚠️</span>

      <p>{message}</p>

      <button
        type="button"
        className="btn btn-g"
        onClick={
          () => retry()
        }
      >
        تلاش دوباره
      </button>
    </div>
  );

  return (
    <>
      <Header
        title={title}
        subtitle={subtitle}
        back
        onBack={
          view !== 'terms'
            ? goBack
            : undefined
        }
      />

      <main
        className="page fade-up"
        style={styles.page}
      >
        {
          view === 'terms'
          && (
            <>
              <section
                className="card card-glow"
                style={styles.hero}
              >
                <div
                  style={styles.heroIcon}
                >
                  📚
                </div>

                <div>
                  <strong
                    style={styles.heroTitle}
                  >
                    کتابخانه علوم پایه
                  </strong>

                  <p
                    style={styles.heroText}
                  >
                    فایل موردنظر را پیدا کنید و همان یک فایل را در ربات تحویل بگیرید.
                  </p>
                </div>
              </section>

              <div
                style={styles.searchBox}
              >
                <span>⌕</span>

                <input
                  className="inp"
                  value={search}
                  onChange={
                    (event) =>
                      setSearch(
                        event.target.value
                      )
                  }
                  placeholder="جست‌وجوی نام درس، جلسه یا فایل..."
                  maxLength={100}
                  style={
                    styles.searchInput
                  }
                />

                {
                  search
                  && (
                    <button
                      type="button"
                      style={
                        styles.clearSearch
                      }
                      onClick={
                        () => setSearch('')
                      }
                      aria-label="پاک‌کردن جست‌وجو"
                    >
                      ×
                    </button>
                  )
                }
              </div>

              {
                normalizedSearch
                  .length >= 2
                  ? (
                    <section>
                      <div
                        className="sec-title"
                      >
                        نتیجه جست‌وجو
                      </div>

                      {
                        searching
                          ? (
                            <LoadingList />
                          )
                          : searchError
                            ? (
                              <EmptyState
                                icon="⚠️"
                                text="جست‌وجو انجام نشد؛ دوباره تلاش کنید."
                              />
                            )
                            : safeArray(
                              results
                            ).length === 0
                              ? (
                                <EmptyState
                                  icon="🔎"
                                  text="فایلی با این عبارت پیدا نشد."
                                />
                              )
                              : (
                                <div
                                  style={
                                    styles.list
                                  }
                                >
                                  {
                                    safeArray(
                                      results
                                    ).map(
                                      (
                                        item,
                                        index
                                      ) => {
                                        const rowKey =
                                          `search-${
                                            item.id
                                          }-${index}`;

                                        return (
                                          <ResourceFile
                                            key={
                                              rowKey
                                            }
                                            item={
                                              item
                                            }
                                            rowKey={
                                              rowKey
                                            }
                                            sendingKey={
                                              sendingKey
                                            }
                                            sendDisabled={
                                              downloadMutation
                                                .isPending
                                            }
                                            searchMode
                                            onSend={
                                              sendFile
                                            }
                                          />
                                        );
                                      }
                                    )
                                  }
                                </div>
                              )
                      }
                    </section>
                  )
                  : termsLoading
                    ? (
                      <LoadingList />
                    )
                    : termsError
                      ? (
                        renderError(
                          'دریافت ترم‌ها انجام نشد.',
                          refetchTerms
                        )
                      )
                      : safeArray(
                        terms
                      ).length === 0
                        ? (
                          <EmptyState
                            text="هنوز ترمی ثبت نشده است."
                          />
                        )
                        : (
                          <section>
                            <div
                              className="sec-title"
                            >
                              انتخاب ترم
                            </div>

                            <div
                              style={
                                styles.grid
                              }
                            >
                              {
                                safeArray(
                                  terms
                                ).map(
                                  (
                                    item,
                                    index
                                  ) => (
                                    <button
                                      key={
                                        `${
                                          item.name
                                        }-${index}`
                                      }
                                      type="button"
                                      className="card card-tap"
                                      style={
                                        styles.navCard
                                      }
                                      onClick={
                                        () => {
                                          haptic(
                                            'light'
                                          );

                                          setTerm(
                                            item
                                          );

                                          setView(
                                            'lessons'
                                          );
                                        }
                                      }
                                    >
                                      <span
                                        style={
                                          styles.navIcon
                                        }
                                      >
                                        🎓
                                      </span>

                                      <strong>
                                        {
                                          item.name
                                          || 'ترم بدون نام'
                                        }
                                      </strong>

                                      <span
                                        style={
                                          styles.navMeta
                                        }
                                      >
                                        {
                                          Number(
                                            item.lesson_count
                                          ) || 0
                                        }{' '}
                                        درس
                                      </span>
                                    </button>
                                  )
                                )
                              }
                            </div>
                          </section>
                        )
              }
            </>
          )
        }

        {
          view === 'lessons'
          && (
            lessonsLoading
              ? (
                <LoadingList />
              )
              : lessonsError
                ? (
                  renderError(
                    'دریافت درس‌ها انجام نشد.',
                    refetchLessons
                  )
                )
                : safeArray(
                  lessons
                ).length === 0
                  ? (
                    <EmptyState
                      text="برای این ترم درسی ثبت نشده است."
                    />
                  )
                  : (
                    <div
                      style={styles.list}
                    >
                      {
                        safeArray(
                          lessons
                        ).map(
                          (
                            item,
                            index
                          ) => (
                            <button
                              key={
                                `${
                                  item._id
                                }-${index}`
                              }
                              type="button"
                              className="card card-tap"
                              style={
                                styles.rowCard
                              }
                              onClick={
                                () => {
                                  haptic(
                                    'light'
                                  );

                                  setLesson(
                                    item
                                  );

                                  setView(
                                    'sessions'
                                  );
                                }
                              }
                            >
                              <span
                                style={
                                  styles.rowIcon
                                }
                              >
                                📘
                              </span>

                              <span
                                style={
                                  styles.rowBody
                                }
                              >
                                <strong>
                                  {
                                    item.name
                                    || 'درس بدون نام'
                                  }
                                </strong>

                                <small>
                                  {
                                    item.teacher
                                    || 'استاد ثبت نشده'
                                  }
                                </small>
                              </span>

                              <span
                                className="badge b-acc"
                              >
                                {
                                  Number(
                                    item.session_count
                                  ) || 0
                                }{' '}
                                جلسه
                              </span>

                              <span
                                style={
                                  styles.arrow
                                }
                              >
                                ‹
                              </span>
                            </button>
                          )
                        )
                      }
                    </div>
                  )
          )
        }

        {
          view === 'sessions'
          && (
            sessionsLoading
              ? (
                <LoadingList />
              )
              : sessionsError
                ? (
                  renderError(
                    'دریافت جلسات انجام نشد.',
                    refetchSessions
                  )
                )
                : safeArray(
                  sessions
                ).length === 0
                  ? (
                    <EmptyState
                      text="برای این درس جلسه‌ای ثبت نشده است."
                    />
                  )
                  : (
                    <div
                      style={styles.list}
                    >
                      {
                        safeArray(
                          sessions
                        ).map(
                          (
                            item,
                            index
                          ) => (
                            <button
                              key={
                                `${
                                  item._id
                                }-${index}`
                              }
                              type="button"
                              className="card card-tap"
                              style={
                                styles.rowCard
                              }
                              onClick={
                                () => {
                                  haptic(
                                    'light'
                                  );

                                  setSession(
                                    item
                                  );

                                  setView(
                                    'files'
                                  );
                                }
                              }
                            >
                              <span
                                style={
                                  styles.sessionNumber
                                }
                              >
                                {
                                  Number(
                                    item.number
                                  )
                                  || index + 1
                                }
                              </span>

                              <span
                                style={
                                  styles.rowBody
                                }
                              >
                                <strong>
                                  {
                                    item.topic
                                    || `جلسه ${
                                      index + 1
                                    }`
                                  }
                                </strong>

                                <small>
                                  {
                                    item.teacher
                                    || lesson?.teacher
                                    || 'استاد ثبت نشده'
                                  }
                                </small>
                              </span>

                              <span
                                className="badge b-gray"
                              >
                                {
                                  Number(
                                    item.file_count
                                  ) || 0
                                }{' '}
                                فایل
                              </span>

                              <span
                                style={
                                  styles.arrow
                                }
                              >
                                ‹
                              </span>
                            </button>
                          )
                        )
                      }
                    </div>
                  )
          )
        }

        {
          view === 'files'
          && (
            filesLoading
              ? (
                <LoadingList />
              )
              : filesError
                ? (
                  renderError(
                    'دریافت فایل‌های جلسه انجام نشد.',
                    refetchFiles
                  )
                )
                : safeArray(
                  files
                ).length === 0
                  ? (
                    <EmptyState
                      text="برای این جلسه فایلی ثبت نشده است."
                    />
                  )
                  : (
                    <>
                      <div
                        className="sec-title"
                      >
                        فایل‌های این جلسه
                      </div>

                      <div
                        className="card"
                        style={
                          styles.notice
                        }
                      >
                        <span>ℹ️</span>

                        با زدن «ارسال»، فقط همان ردیف انتخاب‌شده در ربات فرستاده می‌شود.
                      </div>

                      <div
                        style={styles.list}
                      >
                        {
                          safeArray(
                            files
                          ).map(
                            (
                              item,
                              index
                            ) => {
                              const rowKey =
                                `file-${
                                  item.id
                                }-${index}`;

                              return (
                                <ResourceFile
                                  key={
                                    rowKey
                                  }
                                  item={
                                    item
                                  }
                                  rowKey={
                                    rowKey
                                  }
                                  sendingKey={
                                    sendingKey
                                  }
                                  sendDisabled={
                                    downloadMutation
                                      .isPending
                                  }
                                  onSend={
                                    sendFile
                                  }
                                />
                              );
                            }
                          )
                        }
                      </div>
                    </>
                  )
          )
        }
      </main>
    </>
  );
}


const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 13,
    paddingInline: 13,
  },

  hero: {
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    padding: 17,

    /* موج ۳.۱۰ — دقیقاً همان دستورِ
       .hero-card مشترکِ کل مینی‌اپ */
    background:
      'linear-gradient(145deg,rgba(29,78,216,.22),rgba(16,24,39,.95) 52%,rgba(34,211,238,.08))',
  },

  heroIcon: {
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 52px',
    width: 52,
    height: 52,
    fontSize: 25,
    borderRadius: 16,

    background:
      'var(--grad-brand)',

    boxShadow:
      'var(--shd-glow)',
  },

  heroTitle: {
    fontSize: 15,
  },

  heroText: {
    marginTop: 4,
    color: 'var(--tx2)',
    fontSize: 10.5,
    lineHeight: 1.9,
  },

  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  searchInput: {
    paddingInline:
      '34px 36px',
  },

  clearSearch: {
    position: 'absolute',
    left: 8,
    width: 27,
    height: 27,
    color: 'var(--tx2)',
    cursor: 'pointer',
    border: 0,
    borderRadius: 8,
    background: 'var(--ovr)',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
  },

  grid: {
    display: 'grid',

    gridTemplateColumns:
      'repeat(2,minmax(0,1fr))',

    gap: 9,
  },

  navCard: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 6,
    minHeight: 124,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },

  navIcon: {
    fontSize: 29,
  },

  navMeta: {
    color: 'var(--tx2)',
    fontSize: 10,
  },

  rowCard: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    fontFamily: 'inherit',
    textAlign: 'right',
    cursor: 'pointer',
  },

  rowIcon: {
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 42px',
    height: 42,
    fontSize: 21,
    borderRadius: 12,
    background: 'var(--acc-soft)',
  },

  sessionNumber: {
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 38px',
    height: 38,
    color: '#70A7FF',
    fontWeight: 900,
    borderRadius: 12,
    background: 'var(--acc-soft)',
  },

  rowBody: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 3,
  },

  arrow: {
    color: 'var(--txm)',
    fontSize: 23,
  },

  fileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 11,
  },

  fileIcon: {
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 43px',
    width: 43,
    height: 43,
    fontSize: 21,
    borderRadius: 12,
  },

  fileBody: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,
  },

  fileTitle: {
    overflow: 'hidden',
    fontSize: 11.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  fileMeta: {
    color: 'var(--tx2)',
    fontSize: 9.5,
  },

  fileDescription: {
    marginTop: 3,
    color: 'var(--txm)',
    fontSize: 9,
    lineHeight: 1.7,
  },

  sendButton: {
    flex: '0 0 auto',
    minWidth: 68,
    minHeight: 34,
    padding: '6px 9px',
    fontSize: 10,
  },

  notice: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: 10,
    color: 'var(--tx2)',
    fontSize: 9.5,
    lineHeight: 1.8,
  },

  empty: {
    padding: '45px 14px',
  },

  emptyIcon: {
    display: 'block',
    marginBottom: 8,
    fontSize: 31,
  },

  errorCard: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 10,
    padding: 25,
    color: 'var(--tx2)',
    textAlign: 'center',
  },
};
