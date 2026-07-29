import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import {
  SkeletonCard,
  Spinner,
} from '../../components/shared/Loading';

const LETTERS = [
  'الف',
  'ب',
  'ج',
  'د',
];

export default function QuestionHistory() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      'answer-history',
    ],

    queryFn: () =>
      api
        .get(
          '/api/questions/history',
          {
            params: {
              limit: 100,
            },
          }
        )
        .then(
          (response) =>
            response.data
        ),
  });

  const answers = Array.isArray(
    data?.answers
  )
    ? data.answers
    : [];

  return (
    <>
      <Header
        title="تاریخچه پاسخ‌ها"
        subtitle={`${
          Number(data?.total) || 0
        } پاسخ`}
      />

      <div className="page fade-up">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
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
              دریافت تاریخچه انجام نشد.
            </div>

            <button
              className="btn btn-p"
              style={{
                marginTop: 12,
              }}
              onClick={() =>
                refetch()
              }
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Spinner size={15} />
              ) : (
                'تلاش دوباره'
              )}
            </button>
          </div>
        ) : answers.length === 0 ? (
          <div className="empty">
            <div
              style={{
                fontSize: 42,
                marginBottom: 10,
              }}
            >
              🕘
            </div>

            <div>
              هنوز پاسخی ثبت نشده است.
            </div>
          </div>
        ) : (
          answers.map((item) => (
            <div
              key={
                item.id ||
                item.question_id
              }
              className="card"
              style={{
                marginBottom: 9,

                borderColor:
                  item.is_correct
                    ? 'rgba(16,185,129,.25)'
                    : 'rgba(239,68,68,.25)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  marginBottom: 7,
                  flexWrap: 'wrap',
                }}
              >
                <span className="badge b-acc">
                  {item.lesson ||
                    'درس'}
                </span>

                {item.topic && (
                  <span className="badge b-gray">
                    {item.topic}
                  </span>
                )}

                <span
                  className={`badge ${
                    item.is_correct
                      ? 'b-grn'
                      : 'b-red'
                  }`}
                  style={{
                    marginRight: 'auto',
                  }}
                >
                  {item.is_correct
                    ? 'صحیح'
                    : 'اشتباه'}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                {item.question ||
                  'متن سؤال موجود نیست'}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--txm)',
                  marginTop: 7,
                }}
              >
                پاسخ شما:{' '}
                {LETTERS[
                  item.selected
                ] ?? item.selected}

                {' • پاسخ صحیح: '}

                {LETTERS[
                  item.correct_answer
                ] ??
                  item.correct_answer}
              </div>

              {item.answered_at && (
                <div
                  style={{
                    fontSize: 10,
                    color:
                      'var(--txm)',
                    marginTop: 4,
                  }}
                >
                  {String(
                    item.answered_at
                  ).slice(0, 10)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
