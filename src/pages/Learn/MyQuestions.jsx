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
import { useUIStore } from '../../stores/uiStore';

const LETTERS = [
  'الف',
  'ب',
  'ج',
  'د',
];

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

export default function MyQuestions() {
  const [
    editing,
    setEditing,
  ] = useState(null);

  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'my-question-designs',
    ],

    queryFn: () =>
      api
        .get(
          '/api/questions/my-designs'
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
        'my-question-designs',
      ],
    });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(
        `/api/questions/my-designs/${editing.id}`,
        {
          lesson:
            editing.lesson,

          topic:
            editing.topic,

          question:
            editing.question,

          options:
            editing.options,

          correct:
            Number(
              editing.correct
            ),

          explanation:
            editing.explanation ||
            '',

          difficulty:
            editing.difficulty ||
            'متوسط 🟡',
        }
      ),

    onSuccess: async () => {
      hapticNotif('success');

      toast(
        'سؤال ویرایش شد ✅',
        'success'
      );

      setEditing(null);

      await refresh();
    },

    onError: (error) =>
      toast(
        apiError(
          error,
          'ویرایش انجام نشد'
        ),
        'error'
      ),
  });

  const deleteMutation =
    useMutation({
      mutationFn: (id) =>
        api.delete(
          `/api/questions/my-designs/${id}`
        ),

      onSuccess: async () => {
        toast(
          'سؤال حذف شد',
          'info'
        );

        await refresh();
      },

      onError: (error) =>
        toast(
          apiError(
            error,
            'حذف انجام نشد'
          ),
          'error'
        ),
    });

  const questions = Array.isArray(
    data
  )
    ? data
    : [];

  const validEdit =
    editing &&
    editing.lesson.trim() &&
    editing.topic.trim() &&
    editing.question
      .trim()
      .length >= 10 &&
    editing.options.length === 4 &&
    editing.options.every(
      (item) => item.trim()
    );

  if (editing) {
    return (
      <>
        <Header
          title="ویرایش سؤال"
          onBack={() =>
            setEditing(null)
          }
        />

        <div className="page fade-up">
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}
          >
            <label
              style={{
                fontSize: 11,
                color: 'var(--txm)',
              }}
            >
              نام درس
            </label>

            <input
              className="inp"
              value={editing.lesson}
              maxLength={100}
              onChange={(event) =>
                setEditing({
                  ...editing,

                  lesson:
                    event.target.value,
                })
              }
              placeholder="درس"
            />

            <label
              style={{
                fontSize: 11,
                color: 'var(--txm)',
              }}
            >
              مبحث
            </label>

            <input
              className="inp"
              value={editing.topic}
              maxLength={100}
              onChange={(event) =>
                setEditing({
                  ...editing,

                  topic:
                    event.target.value,
                })
              }
              placeholder="مبحث"
            />

            <label
              style={{
                fontSize: 11,
                color: 'var(--txm)',
              }}
            >
              متن سؤال
            </label>

            <textarea
              className="inp"
              rows={4}
              maxLength={2000}
              value={editing.question}
              onChange={(event) =>
                setEditing({
                  ...editing,

                  question:
                    event.target.value,
                })
              }
              placeholder="متن سؤال"
            />

            <div
              style={{
                fontSize: 11,
                color: 'var(--txm)',
              }}
            >
              گزینه‌ها؛ روی حرف گزینهٔ
              صحیح بزنید
            </div>

            {editing.options.map(
              (option, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: 7,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,

                        correct:
                          index,
                      })
                    }
                    className={`badge ${
                      editing.correct ===
                      index
                        ? 'b-grn'
                        : 'b-gray'
                    }`}
                    style={{
                      border: 'none',
                      width: 42,
                      cursor: 'pointer',
                    }}
                  >
                    {LETTERS[index]}
                  </button>

                  <input
                    className="inp"
                    value={option}
                    maxLength={500}
                    onChange={(event) =>
                      setEditing({
                        ...editing,

                        options:
                          editing.options.map(
                            (
                              item,
                              itemIndex
                            ) =>
                              itemIndex ===
                              index
                                ? event
                                    .target
                                    .value
                                : item
                          ),
                      })
                    }
                    placeholder={`گزینه ${LETTERS[index]}`}
                  />
                </div>
              )
            )}

            <label
              style={{
                fontSize: 11,
                color: 'var(--txm)',
              }}
            >
              سطح سختی
            </label>

            <select
              className="inp"
              value={
                editing.difficulty
              }
              onChange={(event) =>
                setEditing({
                  ...editing,

                  difficulty:
                    event.target.value,
                })
              }
            >
              <option value="آسان 🟢">
                آسان
              </option>

              <option value="متوسط 🟡">
                متوسط
              </option>

              <option value="سخت 🔴">
                سخت
              </option>
            </select>

            <label
              style={{
                fontSize: 11,
                color: 'var(--txm)',
              }}
            >
              توضیح پاسخ
            </label>

            <textarea
              className="inp"
              rows={3}
              maxLength={3000}
              value={
                editing.explanation ||
                ''
              }
              onChange={(event) =>
                setEditing({
                  ...editing,

                  explanation:
                    event.target.value,
                })
              }
              placeholder="توضیح پاسخ"
            />
          </div>

          <button
            className="btn btn-p btn-full"
            style={{
              marginTop: 12,
            }}
            disabled={
              !validEdit ||
              updateMutation.isPending
            }
            onClick={() =>
              updateMutation.mutate()
            }
          >
            {updateMutation.isPending ? (
              <Spinner size={15} />
            ) : (
              '💾 ذخیره تغییرات'
            )}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={
          'سؤال‌های طراحی‌شدهٔ من'
        }
        subtitle={`${questions.length} سؤال`}
      />

      <div className="page fade-up">
        {isLoading ? (
          <SkeletonCard />
        ) : isError ? (
          <div className="empty">
            <div>
              دریافت سؤال‌ها انجام نشد.
            </div>

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
          </div>
        ) : questions.length === 0 ? (
          <div className="empty">
            <div
              style={{
                fontSize: 42,
                marginBottom: 10,
              }}
            >
              ✍️
            </div>

            <div>
              هنوز سؤالی طراحی نکرده‌اید.
            </div>
          </div>
        ) : (
          questions.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                marginBottom: 9,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                  marginBottom: 7,
                  flexWrap: 'wrap',
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
                    item.approved
                      ? 'b-grn'
                      : 'b-yel'
                  }`}
                  style={{
                    marginRight: 'auto',
                  }}
                >
                  {item.approved
                    ? 'تأییدشده'
                    : 'در انتظار تأیید'}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                {item.question}
              </div>

              {item.created_at && (
                <div
                  style={{
                    fontSize: 10,
                    color:
                      'var(--txm)',
                    marginTop: 5,
                  }}
                >
                  {item.created_at}
                </div>
              )}

              {!item.approved && (
                <div
                  style={{
                    display: 'flex',
                    gap: 7,
                    marginTop: 10,
                  }}
                >
                  <button
                    className="btn btn-dark"
                    style={{
                      flex: 1,
                    }}
                    onClick={() =>
                      setEditing({
                        ...item,

                        options:
                          Array.isArray(
                            item.options
                          )
                            ? item.options
                            : [
                                '',
                                '',
                                '',
                                '',
                              ],

                        correct:
                          Number(
                            item.correct
                          ) || 0,
                      })
                    }
                  >
                    ✏️ ویرایش
                  </button>

                  <button
                    className="btn btn-d"
                    style={{
                      flex: 1,
                    }}
                    disabled={
                      deleteMutation
                        .isPending
                    }
                    onClick={() => {
                      const confirmed =
                        window.confirm(
                          'این سؤال حذف شود؟'
                        );

                      if (confirmed) {
                        deleteMutation.mutate(
                          item.id
                        );
                      }
                    }}
                  >
                    🗑 حذف
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
