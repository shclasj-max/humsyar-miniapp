import {
  useEffect,
  useState,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import api from '../../lib/api';
import Header from '../../components/layout/Header';
import QuestionCard from '../../components/shared/QuestionCard';

import {
  SkeletonCard,
  Spinner,
} from '../../components/shared/Loading';

import {
  hapticNotif,
} from '../../lib/telegram';

import {
  useUIStore,
} from '../../stores/uiStore';


const formatTime = (seconds) => {
  if (seconds == null) {
    return 'بدون محدودیت';
  }

  const safe = Math.max(
    0,
    Number(seconds) || 0
  );

  const minutes = Math.floor(
    safe / 60
  );

  const remainingSeconds =
    safe % 60;

  return (
    `${String(minutes).padStart(
      2,
      '0'
    )}:` +
    `${String(
      remainingSeconds
    ).padStart(2, '0')}`
  );
};


const statusLabel = {
  active: 'در حال انجام',
  finished: 'تمام‌شده',
  expired: 'زمان تمام‌شده',
  abandoned: 'رهاشده',
};


const apiError = (
  error,
  fallback
) => {
  const detail =
    error?.response?.data?.detail;

  return typeof detail === 'string'
    ? detail
    : fallback;
};


export default function ExamCenter() {
  const [
    view,
    setView,
  ] = useState('setup');

  const [
    config,
    setConfig,
  ] = useState({
    lesson: '',
    topic: 'همه',
    count: 10,
    minutes: 20,
  });

  const [
    session,
    setSession,
  ] = useState(null);

  const [
    question,
    setQuestion,
  ] = useState(null);

  const [
    answer,
    setAnswer,
  ] = useState(null);

  const [
    result,
    setResult,
  ] = useState(null);

  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    secondsLeft,
    setSecondsLeft,
  ] = useState(null);

  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();


  const {
    data: lessons = [],
    isLoading: lessonsLoading,
  } = useQuery({
    queryKey: [
      'question-lessons',
    ],

    queryFn: () =>
      api
        .get(
          '/api/questions/lessons'
        )
        .then(
          (response) =>
            response.data
              ?.lessons || []
        ),

    staleTime:
      10 * 60 * 1000,
  });


  const {
    data: topics = [],
  } = useQuery({
    queryKey: [
      'question-topics',
      config.lesson,
    ],

    queryFn: () =>
      api
        .get(
          `/api/questions/topics/${
            encodeURIComponent(
              config.lesson
            )
          }`
        )
        .then(
          (response) =>
            response.data
              ?.topics || []
        ),

    enabled:
      Boolean(config.lesson),

    staleTime:
      10 * 60 * 1000,
  });


  const {
    data: history = [],
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [
      'exam-history',
    ],

    queryFn: () =>
      api
        .get(
          '/api/questions/custom-exam/history'
        )
        .then(
          (response) =>
            response.data
              ?.exams || []
        ),

    enabled:
      view === 'history',
  });


  const refreshHistory = () =>
    queryClient.invalidateQueries({
      queryKey: [
        'exam-history',
      ],
    });


  const loadNext = async (
    sessionId
  ) => {
    setQuestion(null);
    setAnswer(null);

    try {
      const response =
        await api.get(
          `/api/questions/custom-exam/${sessionId}/next`
        );

      if (
        response.data.finished
      ) {
        setResult(
          response.data
        );

        setView('result');

        await refreshHistory();

        return;
      }

      setQuestion(
        response.data.question
      );

      setProgress(
        response.data.progress ||
        0
      );

      setSecondsLeft(
        response.data
          .seconds_left ?? null
      );

      setView('active');

    } catch (error) {
      toast(
        apiError(
          error,
          'دریافت آزمون انجام نشد'
        ),
        'error'
      );

      setView('history');
    }
  };


  const startMutation =
    useMutation({
      mutationFn: () =>
        api.post(
          '/api/questions/custom-exam/start',
          {
            lesson:
              config.lesson,

            topic:
              config.topic ===
              'همه'
                ? null
                : config.topic,

            count:
              Number(
                config.count
              ),

            minutes:
              Number(
                config.minutes
              ),
          }
        ),

      onSuccess: async (
        response
      ) => {
        setSession(
          response.data
        );

        setResult(null);

        await loadNext(
          response.data
            .session_id
        );
      },

      onError: (error) =>
        toast(
          apiError(
            error,
            'ساخت آزمون انجام نشد'
          ),
          'error'
        ),
    });


  const answerMutation =
    useMutation({
      mutationFn: ({
        questionId,
        selected,
      }) =>
        api.post(
          `/api/questions/custom-exam/${session.session_id}/answer`,
          {
            selected,

            question_id:
              questionId,
          }
        ),

      onSuccess: (
        response
      ) => {
        setAnswer(
          response.data
        );

        hapticNotif(
          response.data
            .is_correct
            ? 'success'
            : 'error'
        );
      },

      onError: (error) =>
        toast(
          apiError(
            error,
            'ثبت پاسخ انجام نشد'
          ),
          'error'
        ),
    });


  const abandonMutation =
    useMutation({
      mutationFn: () =>
        api.delete(
          `/api/questions/custom-exam/${session.session_id}`
        ),

      onSuccess: async () => {
        setSession(null);
        setQuestion(null);
        setAnswer(null);
        setView('history');

        await refreshHistory();
      },

      onError: (error) =>
        toast(
          apiError(
            error,
            'رهاکردن آزمون انجام نشد'
          ),
          'error'
        ),
    });


  useEffect(() => {
    if (
      view !== 'active' ||
      secondsLeft == null
    ) {
      return undefined;
    }

    if (secondsLeft <= 0) {
      if (session?.session_id) {
        loadNext(
          session.session_id
        );
      }

      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          setSecondsLeft(
            (current) =>
              Math.max(
                0,
                (current || 0) - 1
              )
          );
        },
        1000
      );

    return () =>
      window.clearTimeout(
        timer
      );

  }, [
    view,
    session?.session_id,
    secondsLeft,
  ]);


  const resume = async (
    item
  ) => {
    setSession({
      session_id:
        item.session_id,

      total:
        item.total,

      minutes:
        item.minutes,
    });

    setResult(null);

    await loadNext(
      item.session_id
    );
  };


  if (view === 'active') {
    return (
      <>
        <Header
          title="آزمون سفارشی"
          onBack={() =>
            setView('history')
          }
        />

        <div className="page fade-up">
          <div
            className="card"
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <span>
              سؤال {progress} از{' '}
              {session?.total ||
                '—'}
            </span>

            <span className="badge b-yel">
              ⏱{' '}
              {formatTime(
                secondsLeft
              )}
            </span>
          </div>

          {!question ? (
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'center',
                padding: 40,
              }}
            >
              <Spinner size={30} />
            </div>
          ) : (
            <>
              <QuestionCard
                question={question}
                answered={answer}
                onAnswer={(
                  questionId,
                  selected
                ) =>
                  answerMutation.mutate({
                    questionId,
                    selected,
                  })
                }
                showReport={false}
              />

              {answer && (
                <div
                  className="card fade-up"
                  style={{
                    borderColor:
                      answer.is_correct
                        ? 'var(--ok)'
                        : 'var(--err)',
                  }}
                >
                  <div
                    style={{
                      color:
                        answer.is_correct
                          ? 'var(--ok)'
                          : 'var(--err)',

                      fontWeight: 800,
                    }}
                  >
                    {answer.is_correct
                      ? '✅ پاسخ صحیح'
                      : '❌ پاسخ اشتباه'}
                  </div>

                  {answer.explanation && (
                    <div
                      style={{
                        marginTop: 8,

                        lineHeight:
                          1.8,

                        color:
                          'var(--tx2)',
                      }}
                    >
                      {
                        answer.explanation
                      }
                    </div>
                  )}

                  <button
                    className="btn btn-p btn-full"
                    style={{
                      marginTop: 12,
                    }}
                    onClick={() =>
                      loadNext(
                        session.session_id
                      )
                    }
                  >
                    {answer.finished
                      ? 'مشاهده نتیجه'
                      : 'سؤال بعدی'}
                  </button>
                </div>
              )}
            </>
          )}

          <button
            className="btn btn-d btn-full"
            style={{
              marginTop: 12,
            }}
            disabled={
              abandonMutation
                .isPending
            }
            onClick={() => {
              const confirmed =
                window.confirm(
                  'آزمون رها شود؟'
                );

              if (confirmed) {
                abandonMutation
                  .mutate();
              }
            }}
          >
            {abandonMutation
              .isPending
              ? 'در حال ثبت...'
              : 'رهاکردن آزمون'}
          </button>
        </div>
      </>
    );
  }


  if (view === 'result') {
    return (
      <>
        <Header
          title="نتیجه آزمون"
          onBack={() =>
            setView('history')
          }
        />

        <div className="page fade-up">
          <div
            className="card card-glow"
            style={{
              textAlign: 'center',
              padding: 26,
            }}
          >
            <div
              style={{
                fontSize: 48,
              }}
            >
              {(result?.percentage ||
                0) >= 70
                ? '🎉'
                : '📚'}
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--acc)',
                marginTop: 8,
              }}
            >
              {result?.percentage ||
                0}
              ٪
            </div>

            <div
              style={{
                marginTop: 12,
              }}
            >
              {result?.correct || 0}{' '}
              پاسخ صحیح از{' '}
              {result?.answered || 0}
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--txm)',
                marginTop: 6,
              }}
            >
              وضعیت:{' '}
              {statusLabel[
                result?.status
              ] ||
                'تمام‌شده'}
            </div>

            <button
              className="btn btn-p btn-full"
              style={{
                marginTop: 18,
              }}
              onClick={() =>
                setView('history')
              }
            >
              مشاهده تاریخچه
            </button>
          </div>
        </div>
      </>
    );
  }


  if (view === 'history') {
    const safeHistory =
      Array.isArray(history)
        ? history
        : [];

    return (
      <>
        <Header
          title="تاریخچه آزمون‌ها"
          onBack={() =>
            setView('setup')
          }
        />

        <div className="page fade-up">
          <button
            className="btn btn-p btn-full"
            style={{
              marginBottom: 14,
            }}
            onClick={() =>
              setView('setup')
            }
          >
            + آزمون جدید
          </button>

          {historyLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : historyError ? (
            <div className="empty">
              <div>
                دریافت تاریخچه انجام نشد.
              </div>

              <button
                className="btn btn-p"
                style={{
                  marginTop: 12,
                }}
                onClick={() =>
                  refetchHistory()
                }
              >
                تلاش دوباره
              </button>
            </div>
          ) : safeHistory.length ===
            0 ? (
            <div className="empty">
              هنوز آزمونی ثبت نشده است.
            </div>
          ) : (
            safeHistory.map(
              (item) => (
                <div
                  key={
                    item.session_id
                  }
                  className="card"
                  style={{
                    marginBottom: 9,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',

                      justifyContent:
                        'space-between',

                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight:
                            700,
                        }}
                      >
                        {item.lesson ||
                          'آزمون'}
                      </div>

                      <div
                        style={{
                          fontSize: 11,

                          color:
                            'var(--txm)',

                          marginTop: 3,
                        }}
                      >
                        {item.topic ||
                          'همه مباحث'}

                        {' • '}

                        {item.answered ||
                          0}
                        /
                        {item.total ||
                          0}{' '}
                        پاسخ
                      </div>
                    </div>

                    <span
                      className={`badge ${
                        item.status ===
                        'active'
                          ? 'b-yel'
                          : (
                                item.percentage ||
                                0
                              ) >= 70
                            ? 'b-grn'
                            : 'b-gray'
                      }`}
                    >
                      {item.status ===
                      'active'
                        ? statusLabel
                            .active
                        : `${
                            item.percentage ||
                            0
                          }٪`}
                    </span>
                  </div>

                  {item.status ===
                    'active' && (
                    <button
                      className="btn btn-p btn-full"
                      style={{
                        marginTop: 10,
                      }}
                      onClick={() =>
                        resume(item)
                      }
                    >
                      ادامه آزمون
                    </button>
                  )}

                  {item.status !==
                    'active' && (
                    <div
                      style={{
                        fontSize:
                          10.5,

                        color:
                          'var(--txm)',

                        marginTop:
                          7,
                      }}
                    >
                      {statusLabel[
                        item.status
                      ] ||
                        item.status}
                    </div>
                  )}
                </div>
              )
            )
          )}
        </div>
      </>
    );
  }


  return (
    <>
      <Header title="آزمون سفارشی" />

      <div className="page fade-up">
        <button
          className="btn btn-dark btn-full"
          style={{
            marginBottom: 14,
          }}
          onClick={() =>
            setView('history')
          }
        >
          📋 تاریخچه و ادامه آزمون
        </button>

        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <label
            style={{
              fontSize: 11,
              color: 'var(--txm)',
            }}
          >
            درس
          </label>

          {lessonsLoading ? (
            <SkeletonCard />
          ) : (
            <select
              className="inp"
              value={config.lesson}
              onChange={(event) =>
                setConfig({
                  ...config,

                  lesson:
                    event.target.value,

                  topic:
                    'همه',
                })
              }
            >
              <option value="">
                انتخاب درس
              </option>

              {lessons.map(
                (item) => (
                  <option
                    key={item.name}
                    value={item.name}
                  >
                    {item.name} (
                    {item.count})
                  </option>
                )
              )}
            </select>
          )}

          <label
            style={{
              fontSize: 11,
              color: 'var(--txm)',
            }}
          >
            مبحث
          </label>

          <select
            className="inp"
            value={config.topic}
            disabled={
              !config.lesson
            }
            onChange={(event) =>
              setConfig({
                ...config,

                topic:
                  event.target.value,
              })
            }
          >
            <option value="همه">
              همه مباحث
            </option>

            {topics.map(
              (item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name} (
                  {item.count})
                </option>
              )
            )}
          </select>

          <label
            style={{
              fontSize: 11,
              color: 'var(--txm)',
            }}
          >
            تعداد سؤال
          </label>

          <select
            className="inp"
            value={config.count}
            onChange={(event) =>
              setConfig({
                ...config,

                count:
                  Number(
                    event.target
                      .value
                  ),
              })
            }
          >
            {[
              5,
              10,
              15,
              20,
              30,
              40,
            ].map((count) => (
              <option
                key={count}
                value={count}
              >
                {count} سؤال
              </option>
            ))}
          </select>

          <label
            style={{
              fontSize: 11,
              color: 'var(--txm)',
            }}
          >
            زمان
          </label>

          <select
            className="inp"
            value={
              config.minutes
            }
            onChange={(event) =>
              setConfig({
                ...config,

                minutes:
                  Number(
                    event.target
                      .value
                  ),
              })
            }
          >
            <option value={0}>
              بدون محدودیت
            </option>

            {[
              10,
              20,
              30,
              60,
              90,
            ].map((minutes) => (
              <option
                key={minutes}
                value={minutes}
              >
                {minutes} دقیقه
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-p btn-full"
          style={{
            marginTop: 14,
          }}
          disabled={
            !config.lesson ||
            startMutation.isPending
          }
          onClick={() =>
            startMutation.mutate()
          }
        >
          {startMutation
            .isPending ? (
            <Spinner size={16} />
          ) : (
            '🚀 شروع آزمون'
          )}
        </button>
      </div>
    </>
  );
}
