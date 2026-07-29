import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
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


const SUGGESTIONS = [
  'مبحث پتانسیل عمل را ساده توضیح بده',

  'برای مرور آناتومی قلب یک برنامه کوتاه بده',

  'از فیزیولوژی تنفس یک سؤال چهارگزینه‌ای بساز',
];


export default function AiChat() {
  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    input,
    setInput,
  ] = useState('');

  const [
    reported,
    setReported,
  ] = useState(
    new Set()
  );

  const endRef =
    useRef(null);

  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();


  const {
    data: status,
    isLoading:
      statusLoading,
  } = useQuery({
    queryKey: [
      'ai-status',
    ],

    queryFn: () =>
      api
        .get(
          '/api/ai/status'
        )
        .then(
          (response) =>
            response.data
        ),

    refetchInterval:
      60_000,
  });


  const {
    isLoading:
      historyLoading,
  } = useQuery({
    queryKey: [
      'ai-history',
    ],

    queryFn: () =>
      api
        .get(
          '/api/ai/history'
        )
        .then(
          (response) => {
            const history =
              Array.isArray(
                response.data
                  ?.messages
              )
                ? response.data
                    .messages
                : [];

            setMessages(
              history.map(
                (
                  item,
                  index
                ) => ({
                  ...item,

                  id:
                    `history-${index}`,
                })
              )
            );

            return history;
          }
        ),
  });


  const askMutation =
    useMutation({
      mutationFn: (
        message
      ) =>
        api.post(
          '/api/ai/ask',

          {
            message,
          },

          {
            timeout:
              120_000,
          }
        ),

      onSuccess: async (
        response
      ) => {
        hapticNotif(
          'success'
        );

        setMessages(
          (current) => [
            ...current,

            {
              id:
                `assistant-${Date.now()}`,

              role:
                'assistant',

              text:
                response.data
                  .answer,
            },
          ]
        );

        await queryClient
          .invalidateQueries({
            queryKey:
              ['ai-status'],
          });
      },

      onError: (error) => {
        hapticNotif('error');

        toast(
          error?.response
            ?.data
            ?.detail ||
            'هوشیار نتوانست پاسخ دهد',

          'error'
        );
      },
    });


  const clearMutation =
    useMutation({
      mutationFn: () =>
        api.delete(
          '/api/ai/history'
        ),

      onSuccess: async () => {
        setMessages([]);

        toast(
          'گفت‌وگوی جدید شروع شد',
          'info'
        );

        await queryClient
          .invalidateQueries({
            queryKey:
              ['ai-history'],
          });
      },
    });


  const reportMutation =
    useMutation({
      mutationFn: ({
        question,
        answer,
      }) =>
        api.post(
          '/api/ai/report',

          {
            question,
            answer,
          }
        ),

      onSuccess: (
        _,
        variables
      ) => {
        setReported(
          (current) =>
            new Set([
              ...current,
              variables.answer,
            ])
        );

        toast(
          'گزارش پاسخ ثبت شد',
          'success'
        );
      },

      onError: () =>
        toast(
          'ثبت گزارش انجام نشد',
          'error'
        ),
    });


  useEffect(() => {
    endRef.current
      ?.scrollIntoView({
        behavior:
          'smooth',

        block:
          'end',
      });
  }, [
    messages,
    askMutation.isPending,
  ]);


  const send = (
    customMessage
  ) => {
    const message = String(
      customMessage ?? input
    ).trim();

    if (
      !message ||
      askMutation.isPending
    ) {
      return;
    }

    haptic('medium');

    setMessages(
      (current) => [
        ...current,

        {
          id:
            `user-${Date.now()}`,

          role:
            'user',

          text:
            message,
        },
      ]
    );

    setInput('');

    askMutation.mutate(
      message
    );
  };


  const followUp = (
    type
  ) => {
    const prompts = {
      example:
        'برای پاسخ قبلی یک مثال بالینی ساده بزن.',

      summary:
        'پاسخ قبلی را خیلی کوتاه و نکته‌ای خلاصه کن.',

      similar:
        'براساس پاسخ قبلی یک سؤال چهارگزینه‌ای مشابه بساز.',
    };

    send(
      prompts[type]
    );
  };


  const remaining =
    status?.unlimited
      ? 'نامحدود'

      : `${
          status?.remaining ??
          0
        } از ${
          status?.daily_limit ??
          0
        }`;


  const unavailable =
    !status?.enabled ||
    status?.banned;


  return (
    <>
      <Header
        title="هوشیار"
        subtitle={`دستیار آموزشی • سهمیه ${remaining}`}
        right={
          <button
            type="button"
            aria-label="گفت‌وگوی جدید"
            disabled={
              clearMutation
                .isPending ||
              messages.length === 0
            }
            onClick={() => {
              const accepted =
                window.confirm(
                  'گفت‌وگوی فعلی پاک شود؟'
                );

              if (accepted) {
                clearMutation
                  .mutate();
              }
            }}
            style={{
              width:
                36,

              height:
                36,

              borderRadius:
                12,

              color:
                'var(--tx)',

              background:
                'var(--elev)',

              border:
                '1px solid var(--bd)',

              cursor:
                'pointer',
            }}
          >
            ＋
          </button>
        }
      />

      <main
        className="page fade-up"
        style={{
          paddingBottom:
            'calc(var(--nav-h) + 112px + env(safe-area-inset-bottom))',
        }}
      >
        {statusLoading ||
        historyLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : unavailable ? (
          <section
            className={
              'empty card card-glow'
            }
          >
            <div
              style={{
                fontSize:
                  46,
              }}
            >
              {status?.banned
                ? '⛔'
                : '🤖'}
            </div>

            <h2
              style={{
                marginTop:
                  10,

                fontSize:
                  16,
              }}
            >
              {status?.banned
                ? 'دسترسی به هوشیار مسدود است'
                : 'هوشیار فعلاً غیرفعال است'}
            </h2>

            <p
              style={{
                marginTop:
                  6,

                color:
                  'var(--txm)',

                fontSize:
                  10.5,
              }}
            >
              {status
                ?.disabled_message ||
                'برای اطلاعات بیشتر با مدیریت تماس بگیرید.'}
            </p>
          </section>
        ) : (
          <>
            {messages.length ===
              0 && (
              <section
                className={
                  'card card-glow'
                }
                style={{
                  padding:
                    20,

                  textAlign:
                    'center',

                  background:
                    'linear-gradient(145deg,rgba(139,92,246,.16),rgba(16,24,39,.95) 55%,rgba(34,211,238,.08))',
                }}
              >
                <div
                  style={{
                    display:
                      'grid',

                    width:
                      68,

                    height:
                      68,

                    placeItems:
                      'center',

                    margin:
                      '0 auto',

                    background:
                      'linear-gradient(135deg,#7C3AED,#3B82F6,#22D3EE)',

                    borderRadius:
                      22,

                    boxShadow:
                      'var(--shd-glow)',

                    fontSize:
                      33,
                  }}
                >
                  🤖
                </div>

                <h1
                  style={{
                    marginTop:
                      13,

                    fontSize:
                      18,
                  }}
                >
                  سلام، من هوشیارم
                </h1>

                <p
                  style={{
                    marginTop:
                      5,

                    color:
                      'var(--tx2)',

                    fontSize:
                      10.5,

                    lineHeight:
                      1.8,
                  }}
                >
                  سؤال درسی بپرس، توضیح
                  ساده بخواه یا برای مرور و
                  آزمون کمک بگیر.
                </p>

                <div
                  style={{
                    display:
                      'grid',

                    gap:
                      7,

                    marginTop:
                      15,
                  }}
                >
                  {SUGGESTIONS.map(
                    (item) => (
                      <button
                        type="button"
                        key={item}
                        className={
                          'btn btn-dark btn-full'
                        }
                        onClick={() =>
                          send(item)
                        }
                        style={{
                          minHeight:
                            38,

                          fontSize:
                            10,

                          whiteSpace:
                            'normal',
                        }}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
              </section>
            )}


            <section
              style={{
                display:
                  'grid',

                gap:
                  11,
              }}
            >
              {messages.map(
                (
                  message,
                  index
                ) => {
                  const mine =
                    message.role ===
                    'user';

                  const previousUser = [
                    ...messages.slice(
                      0,
                      index
                    ),
                  ]
                    .reverse()
                    .find(
                      (item) =>
                        item.role ===
                        'user'
                    );

                  return (
                    <div
                      key={
                        message.id ||
                        index
                      }
                      style={{
                        display:
                          'flex',

                        justifyContent:
                          mine
                            ? 'flex-start'
                            : 'flex-end',
                      }}
                    >
                      <article
                        style={{
                          maxWidth:
                            mine
                              ? '86%'
                              : '94%',

                          padding:
                            mine
                              ? '10px 12px'
                              : '12px 13px',

                          color:
                            'var(--tx)',

                          background:
                            mine
                              ? 'rgba(59,130,246,.16)'
                              : 'linear-gradient(145deg,rgba(139,92,246,.11),rgba(16,24,39,.97))',

                          border:
                            `1px solid ${
                              mine
                                ? 'var(--bdg)'
                                : 'rgba(139,92,246,.22)'
                            }`,

                          borderRadius:
                            mine
                              ? '16px 16px 5px 16px'
                              : '16px 16px 16px 5px',

                          boxShadow:
                            'var(--shd-1)',
                        }}
                      >
                        {!mine && (
                          <div
                            style={{
                              display:
                                'flex',

                              alignItems:
                                'center',

                              gap:
                                6,

                              marginBottom:
                                7,

                              color:
                                'var(--acc2)',

                              fontSize:
                                9.5,

                              fontWeight:
                                800,
                            }}
                          >
                            <span>🤖</span>

                            هوشیار
                          </div>
                        )}

                        <div
                          style={{
                            fontSize:
                              11.5,

                            lineHeight:
                              2,

                            whiteSpace:
                              'pre-wrap',

                            overflowWrap:
                              'anywhere',
                          }}
                        >
                          {message.text}
                        </div>

                        {!mine &&
                          index ===
                            messages.length -
                              1 && (
                          <div
                            style={{
                              display:
                                'flex',

                              flexWrap:
                                'wrap',

                              gap:
                                5,

                              marginTop:
                                10,
                            }}
                          >
                            <button
                              className="badge b-acc"
                              onClick={() =>
                                followUp(
                                  'example'
                                )
                              }
                              style={{
                                border:
                                  0,

                                cursor:
                                  'pointer',

                                padding:
                                  '6px 9px',
                              }}
                            >
                              🔬 مثال
                            </button>

                            <button
                              className="badge b-pur"
                              onClick={() =>
                                followUp(
                                  'summary'
                                )
                              }
                              style={{
                                border:
                                  0,

                                cursor:
                                  'pointer',

                                padding:
                                  '6px 9px',
                              }}
                            >
                              📝 خلاصه
                            </button>

                            <button
                              className="badge b-yel"
                              onClick={() =>
                                followUp(
                                  'similar'
                                )
                              }
                              style={{
                                border:
                                  0,

                                cursor:
                                  'pointer',

                                padding:
                                  '6px 9px',
                              }}
                            >
                              🎯 سؤال مشابه
                            </button>

                            <button
                              className="badge b-red"
                              disabled={
                                reported.has(
                                  message.text
                                ) ||
                                reportMutation
                                  .isPending
                              }
                              onClick={() =>
                                reportMutation
                                  .mutate({
                                    question:
                                      previousUser
                                        ?.text ||
                                      'نامشخص',

                                    answer:
                                      message.text,
                                  })
                              }
                              style={{
                                border:
                                  0,

                                cursor:
                                  'pointer',

                                padding:
                                  '6px 9px',

                                marginRight:
                                  'auto',
                              }}
                            >
                              {reported.has(
                                message.text
                              )
                                ? '✓ گزارش شد'
                                : '🚩 گزارش'}
                            </button>
                          </div>
                        )}
                      </article>
                    </div>
                  );
                }
              )}


              {askMutation.isPending && (
                <div
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'flex-end',
                  }}
                >
                  <div
                    className="card"
                    style={{
                      display:
                        'flex',

                      alignItems:
                        'center',

                      gap:
                        8,

                      padding:
                        '10px 12px',

                      color:
                        'var(--txm)',

                      fontSize:
                        10,
                    }}
                  >
                    <Spinner size={15} />

                    هوشیار در حال فکرکردن
                    است...
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </section>
          </>
        )}
      </main>


      {!unavailable &&
        !statusLoading && (
        <div
          className="glass"
          style={{
            position:
              'fixed',

            right:
              '50%',

            bottom:
              'calc(var(--nav-h) + 18px + env(safe-area-inset-bottom))',

            zIndex:
              95,

            display:
              'flex',

            width:
              'calc(100% - 20px)',

            maxWidth:
              'calc(var(--content-w) - 20px)',

            gap:
              7,

            padding:
              8,

            transform:
              'translateX(50%)',

            border:
              '1px solid var(--bd)',

            borderRadius:
              17,

            boxShadow:
              'var(--shd-3)',
          }}
        >
          <textarea
            className="inp"
            rows={1}
            maxLength={2000}
            value={input}
            disabled={
              askMutation.isPending
            }
            onChange={(event) =>
              setInput(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                  'Enter' &&
                !event.shiftKey
              ) {
                event.preventDefault();

                send();
              }
            }}
            placeholder={
              'از هوشیار بپرسید...'
            }
            style={{
              minHeight:
                42,

              maxHeight:
                110,

              resize:
                'none',
            }}
          />

          <button
            type="button"
            className="btn btn-p"
            aria-label="ارسال"
            disabled={
              !input.trim() ||
              askMutation.isPending
            }
            onClick={() =>
              send()
            }
            style={{
              flex:
                '0 0 44px',

              width:
                44,

              padding:
                0,
            }}
          >
            ↑
          </button>
        </div>
      )}
    </>
  );
}
