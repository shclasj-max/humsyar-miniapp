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


  const answers =
    Array.isArray(
      data?.answers
    )
      ? data.answers
      : [];


  const correct =
    answers.filter(
      (item) =>
        item.is_correct
    ).length;


  const score =
    answers.length
      ? Math.round(
          (
            correct /
            answers.length
          ) * 100
        )
      : 0;


  return (
    <>
      <Header
        title="تاریخچه پاسخ‌ها"
        subtitle={`${
          Number(data?.total) || 0
        } پاسخ ثبت‌شده`}
      />

      <main className="page fade-up">
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
              'linear-gradient(145deg,rgba(29,78,216,.2),rgba(16,24,39,.95) 55%,rgba(34,211,238,.08))',
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
                  'var(--grad-brand)',

                fontSize:
                  24,
              }}
            >
              🕘
            </span>

            <div
              style={{
                flex:
                  1,
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
                مرور عملکرد گذشته
              </div>

              <b
                style={{
                  display:
                    'block',

                  fontSize:
                    16.5,

                  marginTop:
                    2,
                }}
              >
                {correct} پاسخ صحیح از{' '}
                {answers.length}
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
                با مرور اشتباهات، نقاط ضعف
                را به نقطه قوت تبدیل کن.
              </div>
            </div>

            <div
              style={{
                color:
                  score >= 70
                    ? 'var(--ok)'
                    : score >= 40
                      ? 'var(--warn)'
                      : 'var(--err)',

                fontSize:
                  20,

                fontWeight:
                  900,
              }}
            >
              {score}٪
            </div>
          </div>
        </section>


        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : isError ? (
          <div className="empty card">
            دریافت تاریخچه انجام نشد.

            <button
              className="btn btn-p"
              style={{
                marginTop:
                  12,
              }}
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
        ) : answers.length === 0 ? (
          <div className="empty card">
            هنوز پاسخی ثبت نشده است.
          </div>
        ) : (
          <section
            style={{
              display:
                'grid',

              gap:
                9,
            }}
          >
            {answers.map(
              (
                item,
                index
              ) => (
                <article
                  key={
                    item.id ||
                    item.question_id ||
                    index
                  }
                  className={
                    'card pop-in'
                  }
                  style={{
                    padding:
                      13,

                    borderColor:
                      item.is_correct
                        ? 'rgba(16,185,129,.25)'
                        : 'rgba(239,68,68,.25)',

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
                      display:
                        'flex',

                      flexWrap:
                        'wrap',

                      gap:
                        5,

                      marginBottom:
                        8,
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
                        marginRight:
                          'auto',
                      }}
                    >
                      {item.is_correct
                        ? '✓ صحیح'
                        : '✕ اشتباه'}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize:
                        12,

                      fontWeight:
                        650,

                      lineHeight:
                        1.8,
                    }}
                  >
                    {item.question ||
                      'متن سؤال موجود نیست'}
                  </div>

                  <div
                    style={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        '1fr 1fr',

                      gap:
                        7,

                      marginTop:
                        10,
                    }}
                  >
                    <div
                      style={{
                        padding:
                          '7px 9px',

                        color:
                          item.is_correct
                            ? 'var(--ok)'
                            : 'var(--err)',

                        background:
                          item.is_correct
                            ? 'rgba(16,185,129,.08)'
                            : 'rgba(239,68,68,.08)',

                        borderRadius:
                          10,

                        fontSize:
                          9.5,
                      }}
                    >
                      پاسخ شما:{' '}

                      <b>
                        {LETTERS[
                          item.selected
                        ] ??
                          item.selected}
                      </b>
                    </div>

                    <div
                      style={{
                        padding:
                          '7px 9px',

                        color:
                          'var(--ok)',

                        background:
                          'rgba(16,185,129,.08)',

                        borderRadius:
                          10,

                        fontSize:
                          9.5,
                      }}
                    >
                      پاسخ صحیح:{' '}

                      <b>
                        {LETTERS[
                          item
                            .correct_answer
                        ] ??
                          item
                            .correct_answer}
                      </b>
                    </div>
                  </div>

                  {item.answered_at && (
                    <div
                      style={{
                        color:
                          'var(--txm)',

                        fontSize:
                          8.5,

                        marginTop:
                          7,
                      }}
                    >
                      📆{' '}

                      {String(
                        item.answered_at
                      ).slice(0, 10)}
                    </div>
                  )}
                </article>
              )
            )}
          </section>
        )}
      </main>
    </>
  );
}
