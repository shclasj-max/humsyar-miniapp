import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';

import {
  GradesSkeleton,
  Spinner,
} from '../../components/shared/Loading';

import { haptic } from '../../lib/telegram';


const finite = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};


const percentage = (value) => {
  const parsed = finite(value);

  if (parsed === null) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      parsed
    )
  );
};


const visual = (value) => {
  const safe =
    percentage(value);

  if (safe === null) {
    return {
      color: 'var(--txm)',

      soft:
        'rgba(100,116,139,.12)',

      label:
        'در انتظار',

      icon:
        '⏳',
    };
  }

  if (safe >= 85) {
    return {
      color:
        '#34D399',

      soft:
        'rgba(16,185,129,.12)',

      label:
        'عالی',

      icon:
        '🌟',
    };
  }

  if (safe >= 70) {
    return {
      color:
        '#70A7FF',

      soft:
        'rgba(59,130,246,.12)',

      label:
        'خوب',

      icon:
        '👍',
    };
  }

  if (safe >= 50) {
    return {
      color:
        '#FCD34D',

      soft:
        'rgba(245,158,11,.12)',

      label:
        'متوسط',

      icon:
        '📖',
    };
  }

  return {
    color:
      '#FB7185',

    soft:
      'rgba(239,68,68,.12)',

    label:
      'نیازمند تلاش',

    icon:
      '💪',
  };
};


function GradeRow({
  grade,
  index,
}) {
  const score =
    finite(grade.score);

  const maxScore =
    finite(
      grade.max_score
    ) || 20;

  const value =
    percentage(
      grade.percentage ??
      (
        score === null
          ? null
          : (
              score /
              maxScore
            ) * 100
      )
    );

  const style =
    visual(value);

  return (
    <article
      className="card pop-in"
      style={{
        padding: 13,

        animationDelay:
          `${
            Math.min(
              index,
              8
            ) * 35
          }ms`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
        }}
      >
        <div
          style={{
            display: 'grid',

            flex:
              '0 0 54px',

            height:
              54,

            placeItems:
              'center',

            borderRadius:
              16,

            background:
              style.soft,

            border:
              `1px solid ${style.soft}`,

            textAlign:
              'center',
          }}
        >
          <div>
            <div
              style={{
                color:
                  style.color,

                fontSize:
                  17,

                fontWeight:
                  900,

                lineHeight:
                  1.1,
              }}
            >
              {score ?? '—'}
            </div>

            <div
              style={{
                color:
                  'var(--txm)',

                fontSize:
                  8,

                marginTop:
                  2,
              }}
            >
              از {maxScore}
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
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
            {grade.lesson ||
              'درس بدون عنوان'}
          </h3>

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
            {grade.exam_title ||
              'امتحان'}
          </div>

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
            📆{' '}

            {grade.exam_date ||
              'تاریخ نامشخص'}
          </div>
        </div>

        <div
          style={{
            textAlign:
              'center',
          }}
        >
          <div
            style={{
              fontSize:
                19,
            }}
          >
            {style.icon}
          </div>

          <span
            style={{
              color:
                style.color,

              fontSize:
                9.5,

              fontWeight:
                800,
            }}
          >
            {style.label}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop:
            11,
        }}
      >
        <div
          style={{
            display:
              'flex',

            justifyContent:
              'space-between',

            marginBottom:
              5,
          }}
        >
          <span
            style={{
              color:
                'var(--txm)',

              fontSize:
                9,
            }}
          >
            درصد کسب‌شده
          </span>

          <span
            style={{
              color:
                style.color,

              fontSize:
                10,

              fontWeight:
                800,
            }}
          >
            {value ?? 0}٪
          </span>
        </div>

        <div className="pbar">
          <div
            className="pbar-f"
            style={{
              width:
                `${value ?? 0}%`,

              background:
                style.color,
            }}
          />
        </div>
      </div>

      {grade.note && (
        <div
          style={{
            marginTop:
              9,

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
          📝 {grade.note}
        </div>
      )}
    </article>
  );
}


export default function Grades() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      'grades',
    ],

    queryFn: () =>
      api
        .get('/api/grades')
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      5 * 60 * 1000,
  });


  const grades =
    Array.isArray(
      data?.grades
    )
      ? data.grades
      : [];


  const average =
    finite(data?.avg);


  const averagePercent =
    percentage(
      data?.avg_percentage ??
      (
        average === null
          ? null
          : (
              average /
              20
            ) * 100
      )
    );


  const averageStyle =
    visual(
      averagePercent
    );


  const totalValue =
    Number(data?.total);


  const total =
    Number.isFinite(
      totalValue
    )
      ? Math.max(
          0,
          totalValue
        )
      : grades.length;


  const countValue =
    Number(
      data?.graded_count
    );


  const graded =
    Number.isFinite(
      countValue
    )
      ? Math.max(
          0,
          countValue
        )
      : grades.filter(
          (item) =>
            finite(
              item?.score
            ) !== null
        ).length;


  const passed =
    grades.filter(
      (item) =>
        (
          percentage(
            item.percentage
          ) || 0
        ) >= 50
    ).length;


  const best =
    grades.reduce(
      (
        current,
        item
      ) =>
        Math.max(
          current,

          percentage(
            item.percentage
          ) || 0
        ),

      0
    );


  return (
    <>
      <Header
        title="کارنامه من"
        subtitle={
          total
            ? `${total} نمره ثبت‌شده`
            : 'نمرات و ارزیابی‌ها'
        }
        back={false}
        onRefresh={refetch}
        refreshing={isRefetching}
      />

      <main className="page fade-up">
        {isLoading ? (
          <GradesSkeleton />
        ) : isError ? (
          <div className="empty card">
            <div className="empty__ic">
              🌐
            </div>

            <div>
              دریافت نمرات انجام نشد.
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
        ) : grades.length ===
          0 ? (
          <div className="empty card">
            <div className="empty__ic">
              📊
            </div>

            <div
              style={{
                color:
                  'var(--tx2)',

                fontWeight:
                  700,
              }}
            >
              هنوز نمره‌ای ثبت نشده است
            </div>

            <div
              style={{
                fontSize:
                  10.5,
              }}
            >
              بعد از ثبت توسط مدیر محتوا،
              نتیجه اینجا نمایش داده
              می‌شود.
            </div>
          </div>
        ) : (
          <div
            style={{
              display:
                'grid',

              gap:
                12,
            }}
          >
            <section
              className={
                'card card-glow hero-card'
              }
            >
              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    15,
                }}
              >
                <div
                  style={{
                    position:
                      'relative',

                    display:
                      'grid',

                    flex:
                      '0 0 90px',

                    height:
                      90,

                    placeItems:
                      'center',

                    borderRadius:
                      '50%',

                    background:
                      `conic-gradient(${
                        averageStyle.color
                      } ${
                        averagePercent ||
                        0
                      }%,var(--ovr) 0)`,

                    boxShadow:
                      'var(--shd-glow)',
                  }}
                >
                  <div
                    style={{
                      display:
                        'grid',

                      width:
                        72,

                      height:
                        72,

                      placeItems:
                        'center',

                      background:
                        'var(--surf)',

                      borderRadius:
                        '50%',

                      textAlign:
                        'center',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color:
                            averageStyle.color,

                          fontSize:
                            23,

                          fontWeight:
                            900,

                          lineHeight:
                            1,
                        }}
                      >
                        {average ===
                        null
                          ? '—'
                          : average.toFixed(
                              2
                            )}
                      </div>

                      <div
                        style={{
                          color:
                            'var(--txm)',

                          fontSize:
                            8,

                          marginTop:
                            4,
                        }}
                      >
                        از ۲۰
                      </div>
                    </div>
                  </div>
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
                    میانگین کل شما
                  </div>

                  <div
                    style={{
                      color:
                        averageStyle.color,

                      fontSize:
                        18,

                      fontWeight:
                        900,

                      marginTop:
                        3,
                    }}
                  >
                    {averageStyle.icon}{' '}
                    {averageStyle.label}
                  </div>

                  <div
                    style={{
                      color:
                        'var(--tx2)',

                      fontSize:
                        10.5,

                      lineHeight:
                        1.7,

                      marginTop:
                        5,
                    }}
                  >
                    {graded} نمره در محاسبهٔ
                    میانگین لحاظ شده است.
                  </div>
                </div>
              </div>
            </section>

            <section className="grid2">
              <div
                className="card"
                style={{
                  textAlign:
                    'center',

                  padding:
                    12,
                }}
              >
                <div
                  style={{
                    color:
                      'var(--ok)',

                    fontSize:
                      20,

                    fontWeight:
                      900,
                  }}
                >
                  {passed}
                </div>

                <div
                  style={{
                    color:
                      'var(--txm)',

                    fontSize:
                      9.5,
                  }}
                >
                  نمره قبولی
                </div>
              </div>

              <div
                className="card"
                style={{
                  textAlign:
                    'center',

                  padding:
                    12,
                }}
              >
                <div
                  style={{
                    color:
                      'var(--acc2)',

                    fontSize:
                      20,

                    fontWeight:
                      900,
                  }}
                >
                  {best}٪
                </div>

                <div
                  style={{
                    color:
                      'var(--txm)',

                    fontSize:
                      9.5,
                  }}
                >
                  بهترین عملکرد
                </div>
              </div>
            </section>

            {total > graded && (
              <div
                className="card"
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    10,

                  borderColor:
                    'rgba(245,158,11,.25)',
                }}
              >
                <span
                  style={{
                    fontSize:
                      21,
                  }}
                >
                  ⏳
                </span>

                <div>
                  <b
                    style={{
                      fontSize:
                        12,
                    }}
                  >
                    {total -
                      graded}{' '}

                    نمره در انتظار محاسبه
                  </b>

                  <div
                    style={{
                      color:
                        'var(--txm)',

                      fontSize:
                        9.5,

                      marginTop:
                        2,
                    }}
                  >
                    پس از تکمیل نمره،
                    میانگین خودکار
                    به‌روزرسانی می‌شود.
                  </div>
                </div>
              </div>
            )}

            <div
              className="sec-title"
              style={{
                marginTop:
                  4,
              }}
            >
              📋 جزئیات نمرات
            </div>

            <section
              style={{
                display:
                  'grid',

                gap:
                  9,
              }}
            >
              {grades.map(
                (
                  grade,
                  index
                ) => (
                  <GradeRow
                    key={
                      grade.id ||
                      `${
                        grade.lesson
                      }-${index}`
                    }
                    grade={grade}
                    index={index}
                  />
                )
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
