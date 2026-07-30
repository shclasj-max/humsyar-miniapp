import { confirmAction } from '../../lib/confirm';
import { useState } from 'react';

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
  hapticNotif,
} from '../../lib/telegram';

import {
  useUIStore,
} from '../../stores/uiStore';


const LETTERS = [
  'الف',
  'ب',
  'ج',
  'د',
  'هـ',
  'و',
];


const errorText = (
  error,
  fallback
) => {
  const detail =
    error?.response?.data?.detail;

  return typeof detail === 'string'
    ? detail
    : fallback;
};


function Empty({
  icon = '📭',
  children,
}) {
  return (
    <div className="empty card">
      <div
        style={{
          fontSize: 42,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: 8,
        }}
      >
        {children}
      </div>
    </div>
  );
}


function QuestionDetails({
  question,
  pending,
  onApprove,
  onReject,
  onClose,
}) {
  const options =
    Array.isArray(
      question.options
    )
      ? question.options
      : [];

  return (
    <div
      className="more-sheet"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={
          'more-sheet__panel ' +
          'glass sheet-in'
        }
        role="dialog"
        aria-modal="true"
        aria-label="جزئیات سؤال"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="more-sheet__handle" />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 5,
            marginBottom: 11,
          }}
        >
          <span className="badge b-acc">
            {question.lesson ||
              'درس'}
          </span>

          <span className="badge b-gray">
            {question.topic ||
              'مبحث'}
          </span>

          <span
            className={`badge ${
              question.difficulty
                ?.includes('سخت')
                ? 'b-red'

                : question.difficulty
                    ?.includes('آسان')
                  ? 'b-grn'

                  : 'b-yel'
            }`}
          >
            {question.difficulty ||
              'متوسط'}
          </span>
        </div>


        <div
          style={{
            fontSize: 13,
            fontWeight: 750,
            lineHeight: 1.9,
            marginBottom: 12,
          }}
        >
          {question.question ||
            'متن سؤال موجود نیست'}
        </div>


        <div
          style={{
            display: 'grid',
            gap: 7,
          }}
        >
          {options.map(
            (
              option,
              index
            ) => {
              const correct =
                index ===
                question.correct;

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding:
                      '9px 10px',

                    color:
                      correct
                        ? 'var(--ok)'
                        : 'var(--tx2)',

                    background:
                      correct
                        ? 'rgba(16,185,129,.1)'
                        : 'rgba(100,116,139,.08)',

                    border:
                      `1px solid ${
                        correct
                          ? 'rgba(16,185,129,.25)'
                          : 'var(--bd)'
                      }`,

                    borderRadius:
                      11,
                  }}
                >
                  <b>
                    {LETTERS[index] ||
                      index + 1}
                  </b>

                  <span>
                    {option}
                  </span>

                  {correct && (
                    <span
                      style={{
                        marginRight:
                          'auto',
                      }}
                    >
                      ✓ صحیح
                    </span>
                  )}
                </div>
              );
            }
          )}
        </div>


        {question.explanation && (
          <div
            style={{
              marginTop: 11,
              padding:
                '10px 11px',

              color:
                'var(--tx2)',

              background:
                'rgba(59,130,246,.08)',

              borderRadius:
                12,

              fontSize:
                10.5,

              lineHeight:
                1.8,
            }}
          >
            <b
              style={{
                color:
                  'var(--acc2)',
              }}
            >
              توضیح پاسخ:
            </b>

            <br />

            {question.explanation}
          </div>
        )}


        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            color: 'var(--txm)',
            fontSize: 9.5,
          }}
        >
          <span>
            طراح:{' '}

            {question.creator_name ||
              'نامشخص'}
          </span>

          <span>•</span>

          <span>
            {question.created_at ||
              '—'}
          </span>

          <span
            className="badge b-gray"
            style={{
              marginRight:
                'auto',
            }}
          >
            {question.source ===
            'webapp'
              ? 'Mini App'
              : 'ربات'}
          </span>
        </div>


        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 14,
          }}
        >
          <button
            className="btn btn-p"
            style={{
              flex: 1,
            }}
            disabled={pending}
            onClick={onApprove}
          >
            {pending ? (
              <Spinner size={14} />
            ) : (
              '✅ تأیید سؤال'
            )}
          </button>

          <button
            className="btn btn-d"
            style={{
              flex: 1,
            }}
            disabled={pending}
            onClick={onReject}
          >
            ❌ رد سؤال
          </button>
        </div>
      </div>
    </div>
  );
}


/* مدیریت سؤال‌ها */

export function ContentQuestions() {
  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    filter,
    setFilter,
  ] = useState('all');

  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();


  const {
    data = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      'pending-content-questions',
    ],

    queryFn: () =>
      api
        .get(
          '/api/content/questions/pending'
        )
        .then(
          (response) =>
            response.data
              ?.questions || []
        ),
  });


  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: [
        'pending-content-questions',
      ],
    });


  const action = useMutation({
    mutationFn: ({
      id,
      type,
    }) =>
      api.post(
        `/api/content/questions/${id}/${type}`
      ),

    onSuccess: async (
      _,
      variables
    ) => {
      hapticNotif(
        'success'
      );

      toast(
        variables.type ===
        'approve'
          ? 'سؤال تأیید شد ✅'
          : 'سؤال رد و حذف شد',

        variables.type ===
        'approve'
          ? 'success'
          : 'info'
      );

      setSelected(null);

      await Promise.all([
        refresh(),

        queryClient
          .invalidateQueries({
            queryKey: [
              'content-overview',
            ],
          }),
      ]);
    },

    onError: (error) =>
      toast(
        errorText(
          error,
          'عملیات انجام نشد'
        ),
        'error'
      ),
  });


  const questions =
    Array.isArray(data)
      ? data
      : [];


  const lessons = [
    ...new Set(
      questions
        .map(
          (item) =>
            item.lesson
        )
        .filter(Boolean)
    ),
  ];


  const rows =
    filter === 'all'
      ? questions

      : questions.filter(
          (item) =>
            item.lesson === filter
        );


  return (
    <>
      <Header
        title="بررسی سؤال‌ها"
        subtitle={`${questions.length} سؤال در انتظار`}
        right={
          <button
            type="button"
            onClick={() =>
              refetch()
            }
            disabled={
              isRefetching
            }
            aria-label="به‌روزرسانی"
            style={{
              width: 35,
              height: 35,

              borderRadius:
                11,

              background:
                'var(--elev)',

              border:
                '1px solid var(--bd)',
            }}
          >
            ↻
          </button>
        }
      />


      {selected && (
        <QuestionDetails
          question={selected}
          pending={
            action.isPending
          }
          onClose={() => {
            if (
              !action.isPending
            ) {
              setSelected(null);
            }
          }}
          onApprove={() =>
            action.mutate({
              id:
                selected.id,

              type:
                'approve',
            })
          }
          onReject={async () => {
            const accepted =
              await confirmAction(
                'این سؤال رد و حذف شود؟'
              );

            if (accepted) {
              action.mutate({
                id:
                  selected.id,

                type:
                  'reject',
              });
            }
          }}
        />
      )}


      <main className="page fade-up">
        <section
          className={
            'card card-glow'
          }
          style={{
            padding: 17,
            marginBottom: 14,

            background:
              'linear-gradient(145deg,rgba(139,92,246,.15),rgba(16,24,39,.95) 55%,rgba(245,158,11,.08))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
            }}
          >
            <span
              style={{
                display: 'grid',
                width: 52,
                height: 52,
                placeItems: 'center',
                borderRadius: 16,

                background:
                  'linear-gradient(135deg,#7C3AED,#3B82F6)',

                fontSize: 25,
              }}
            >
              🔍
            </span>

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
                    10,
                }}
              >
                صف بررسی علمی
              </div>

              <b
                style={{
                  display: 'block',
                  fontSize: 16.5,
                  marginTop: 2,
                }}
              >
                {questions.length} سؤال
                نیازمند تصمیم
              </b>

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
                متن، گزینه صحیح و توضیح را
                قبل از انتشار بررسی کنید.
              </div>
            </div>
          </div>
        </section>


        {lessons.length > 1 && (
          <div className="tab-bar">
            <button
              className="tab-btn"
              onClick={() =>
                setFilter('all')
              }
              style={{
                color:
                  filter === 'all'
                    ? '#fff'
                    : 'var(--tx2)',

                background:
                  filter === 'all'
                    ? 'var(--grad-brand)'
                    : 'transparent',
              }}
            >
              همه ({questions.length})
            </button>

            {lessons.map(
              (lesson) => (
                <button
                  key={lesson}
                  className="tab-btn"
                  onClick={() =>
                    setFilter(
                      lesson
                    )
                  }
                  style={{
                    color:
                      filter === lesson
                        ? '#fff'
                        : 'var(--tx2)',

                    background:
                      filter === lesson
                        ? 'var(--grad-brand)'
                        : 'transparent',
                  }}
                >
                  {lesson}
                </button>
              )
            )}
          </div>
        )}


        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : isError ? (
          <Empty icon="🌐">
            دریافت سؤال‌ها انجام نشد.

            <button
              className="btn btn-p"
              style={{
                marginTop: 12,
              }}
              onClick={() =>
                refetch()
              }
            >
              تلاش دوباره
            </button>
          </Empty>
        ) : rows.length === 0 ? (
          <Empty icon="✅">
            سؤالی در انتظار بررسی نیست.
          </Empty>
        ) : (
          <section
            style={{
              display: 'grid',
              gap: 9,
            }}
          >
            {rows.map(
              (
                item,
                index
              ) => (
                <article
                  key={item.id}
                  className={
                    'card pop-in'
                  }
                  style={{
                    animationDelay:
                      `${
                        Math.min(
                          index,
                          8
                        ) * 30
                      }ms`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 5,
                      marginBottom: 8,
                    }}
                  >
                    <span className="badge b-acc">
                      {item.lesson ||
                        'درس'}
                    </span>

                    <span className="badge b-gray">
                      {item.topic ||
                        'مبحث'}
                    </span>

                    <span
                      className={`badge ${
                        item.difficulty
                          ?.includes(
                            'سخت'
                          )
                          ? 'b-red'

                          : item.difficulty
                              ?.includes(
                                'آسان'
                              )
                            ? 'b-grn'

                            : 'b-yel'
                      }`}
                    >
                      {item.difficulty ||
                        'متوسط'}
                    </span>
                  </div>

                  <div
                    style={{
                      display:
                        '-webkit-box',

                      overflow:
                        'hidden',

                      fontSize:
                        12,

                      fontWeight:
                        650,

                      lineHeight:
                        1.8,

                      WebkitBoxOrient:
                        'vertical',

                      WebkitLineClamp:
                        3,
                    }}
                  >
                    {item.question}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: 9,
                      color: 'var(--txm)',
                      fontSize: 9,
                    }}
                  >
                    <span>
                      ✍️{' '}

                      {item.creator_name ||
                        'نامشخص'}
                    </span>

                    <span
                      style={{
                        marginRight:
                          'auto',
                      }}
                    >
                      {item.created_at ||
                        '—'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 7,
                      marginTop: 10,
                    }}
                  >
                    <button
                      className={
                        'btn btn-dark'
                      }
                      style={{
                        flex: 1,
                      }}
                      onClick={() =>
                        setSelected(
                          item
                        )
                      }
                    >
                      مشاهده کامل
                    </button>

                    <button
                      className={
                        'btn btn-p'
                      }
                      style={{
                        flex: 1,
                      }}
                      disabled={
                        action.isPending
                      }
                      onClick={() =>
                        action.mutate({
                          id:
                            item.id,

                          type:
                            'approve',
                        })
                      }
                    >
                      ✅ تأیید
                    </button>

                    <button
                      className={
                        'btn btn-d'
                      }
                      disabled={
                        action.isPending
                      }
                      onClick={async () => {
                        const accepted =
                          await confirmAction(
                            'سؤال رد شود؟'
                          );

                        if (accepted) {
                          action.mutate({
                            id:
                              item.id,

                            type:
                              'reject',
                          });
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </main>
    </>
  );
}


/* مدیریت FAQ */

export function ContentFaq() {
  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({
    category:
      'عمومی',

    question:
      '',

    answer:
      '',
  });

  const [
    openId,
    setOpenId,
  ] = useState(null);

  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();


  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'content-faq',
    ],

    queryFn: () =>
      api
        .get(
          '/api/content/faq'
        )
        .then(
          (response) =>
            response.data
              ?.items || []
        ),
  });


  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: [
        'content-faq',
      ],
    });


  const mutation = useMutation({
    mutationFn: ({
      type,
      id,
    }) => {
      if (type === 'add') {
        return api.post(
          '/api/content/faq',
          form
        );
      }

      return api.delete(
        `/api/content/faq/${id}`
      );
    },

    onSuccess: async (
      _,
      variables
    ) => {
      hapticNotif(
        'success'
      );

      toast(
        variables.type === 'add'
          ? 'سؤال متداول اضافه شد ✅'
          : 'سؤال حذف شد',

        variables.type === 'add'
          ? 'success'
          : 'info'
      );

      setForm({
        category:
          'عمومی',

        question:
          '',

        answer:
          '',
      });

      setFormOpen(false);

      await refresh();
    },

    onError: (error) =>
      toast(
        errorText(
          error,
          'عملیات انجام نشد'
        ),
        'error'
      ),
  });


  const items =
    Array.isArray(data)
      ? data
      : [];


  const categories = [
    ...new Set(
      items
        .map(
          (item) =>
            item.category
        )
        .filter(Boolean)
    ),
  ];


  const valid =
    form.question
      .trim()
      .length >= 5 &&
    form.answer
      .trim()
      .length >= 5;


  if (formOpen) {
    return (
      <>
        <Header
          title="FAQ جدید"
          subtitle={
            'افزودن پاسخ به راهنمای کاربران'
          }
          onBack={() =>
            setFormOpen(false)
          }
        />

        <main className="page fade-up">
          <section
            className={
              'card card-glow'
            }
            style={{
              display: 'grid',
              gap: 10,
            }}
          >
            <input
              className="inp"
              list="faq-categories"
              value={
                form.category
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  category:
                    event.target
                      .value,
                })
              }
              placeholder="دسته‌بندی"
            />

            <datalist id="faq-categories">
              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  />
                )
              )}
            </datalist>

            <textarea
              className="inp"
              rows={3}
              maxLength={500}
              value={
                form.question
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  question:
                    event.target
                      .value,
                })
              }
              placeholder="متن سؤال..."
            />

            <textarea
              className="inp"
              rows={7}
              maxLength={4000}
              value={
                form.answer
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  answer:
                    event.target
                      .value,
                })
              }
              placeholder={
                'پاسخ کامل و واضح...'
              }
            />
          </section>

          <button
            className={
              'btn btn-p btn-full'
            }
            style={{
              marginTop: 12,
            }}
            disabled={
              !valid ||
              mutation.isPending
            }
            onClick={() =>
              mutation.mutate({
                type:
                  'add',
              })
            }
          >
            {mutation.isPending ? (
              <Spinner size={15} />
            ) : (
              '💾 ذخیره سؤال متداول'
            )}
          </button>
        </main>
      </>
    );
  }


  return (
    <>
      <Header
        title="مدیریت FAQ"
        subtitle={`${items.length} سؤال متداول`}
      />

      <main className="page fade-up">
        <section
          className={
            'card card-glow'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 13,

            background:
              'linear-gradient(145deg,rgba(139,92,246,.13),rgba(16,24,39,.95))',
          }}
        >
          <span
            style={{
              display: 'grid',
              width: 50,
              height: 50,
              placeItems: 'center',
              borderRadius: 16,

              background:
                'linear-gradient(135deg,#7C3AED,#3B82F6)',

              fontSize: 24,
            }}
          >
            ❓
          </span>

          <div
            style={{
              flex: 1,
            }}
          >
            <b
              style={{
                fontSize: 16,
              }}
            >
              راهنمای کاربران
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
              پاسخ‌های واضح، تعداد تیکت‌ها
              را کاهش می‌دهد.
            </div>
          </div>
        </section>


        <button
          className={
            'btn btn-p btn-full'
          }
          style={{
            marginBottom: 14,
          }}
          onClick={() =>
            setFormOpen(true)
          }
        >
          ＋ افزودن سؤال متداول
        </button>


        {isLoading ? (
          <SkeletonCard />
        ) : isError ? (
          <Empty icon="🌐">
            دریافت FAQ انجام نشد.

            <button
              className="btn btn-p"
              style={{
                marginTop: 12,
              }}
              onClick={() =>
                refetch()
              }
            >
              تلاش دوباره
            </button>
          </Empty>
        ) : items.length === 0 ? (
          <Empty>
            هنوز سؤالی ثبت نشده است.
          </Empty>
        ) : (
          <section
            style={{
              display: 'grid',
              gap: 8,
            }}
          >
            {items.map(
              (
                item,
                index
              ) => {
                const open =
                  openId === item.id;

                return (
                  <article
                    key={item.id}
                    className={
                      'card pop-in'
                    }
                    style={{
                      animationDelay:
                        `${
                          Math.min(
                            index,
                            8
                          ) * 30
                        }ms`,

                      borderColor:
                        open
                          ? 'var(--bdg)'
                          : 'var(--bd)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenId(
                          open
                            ? null
                            : item.id
                        )
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: 9,
                        color: 'var(--tx)',
                        textAlign: 'right',
                        background: 'none',
                        border: 0,
                        cursor: 'pointer',
                      }}
                    >
                      <span className="badge b-pur">
                        {item.category ||
                          'عمومی'}
                      </span>

                      <b
                        style={{
                          flex: 1,

                          fontSize:
                            12,

                          lineHeight:
                            1.7,
                        }}
                      >
                        {item.question}
                      </b>

                      <span
                        style={{
                          color:
                            'var(--txm)',

                          transform:
                            open
                              ? 'rotate(90deg)'
                              : 'none',

                          transition:
                            'transform .2s',
                        }}
                      >
                        ←
                      </span>
                    </button>

                    {open && (
                      <>
                        <div
                          style={{
                            padding:
                              '11px 0 3px',

                            color:
                              'var(--tx2)',

                            fontSize:
                              10.5,

                            lineHeight:
                              1.9,
                          }}
                        >
                          {item.answer}
                        </div>

                        <button
                          className={
                            'btn btn-d btn-full'
                          }
                          style={{
                            marginTop:
                              9,
                          }}
                          disabled={
                            mutation.isPending
                          }
                          onClick={async () => {
                            const accepted =
                              await confirmAction(
                                'این سؤال متداول حذف شود؟'
                              );

                            if (accepted) {
                              mutation.mutate({
                                type:
                                  'delete',

                                id:
                                  item.id,
                              });
                            }
                          }}
                        >
                          🗑 حذف
                        </button>
                      </>
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
