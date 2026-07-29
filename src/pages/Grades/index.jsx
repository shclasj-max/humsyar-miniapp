import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';

const finiteNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const clampPercentage = (value) => {
  const number = finiteNumber(value);

  return number === null
    ? null
    : Math.max(0, Math.min(100, number));
};

const gradeStyle = (percentage) => {
  const value = clampPercentage(
    percentage
  );

  if (value === null) {
    return {
      color: 'var(--txm)',
      soft: 'rgba(100,116,139,.12)',
      label: 'در انتظار',
    };
  }

  if (value >= 85) {
    return {
      color: 'var(--ok)',
      soft: 'rgba(16,185,129,.12)',
      label: 'عالی',
    };
  }

  if (value >= 70) {
    return {
      color: 'var(--warn)',
      soft: 'rgba(245,158,11,.12)',
      label: 'خوب',
    };
  }

  return {
    color: 'var(--err)',
    soft: 'rgba(239,68,68,.11)',
    label: 'نیاز به تلاش',
  };
};

export default function Grades() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['grades'],

    queryFn: () =>
      api
        .get('/api/grades')
        .then((response) => response.data),

    staleTime: 1000 * 60 * 5,
  });

  const grades = Array.isArray(
    data?.grades
  )
    ? data.grades
    : [];

  const average = finiteNumber(
    data?.avg
  );

  const averagePercentage =
    clampPercentage(
      data?.avg_percentage ??
        (average === null
          ? null
          : (average / 20) * 100)
    );

  const averageVisual = gradeStyle(
    averagePercentage
  );

  const totalValue = Number(
    data?.total
  );

  const total = Number.isFinite(
    totalValue
  )
    ? Math.max(0, totalValue)
    : grades.length;

  const gradedCountValue = Number(
    data?.graded_count
  );

  const gradedCount = Number.isFinite(
    gradedCountValue
  )
    ? Math.max(0, gradedCountValue)
    : grades.filter(
        (grade) =>
          finiteNumber(grade?.score) !==
          null
      ).length;

  return (
    <>
      <Header
        title="📊 نمرات من"
        back={false}
        subtitle={
          total > 0
            ? `${total} نمره ثبت‌شده`
            : ''
        }
        right={
          <button
            onClick={() => {
              haptic();
              refetch();
            }}
            disabled={isRefetching}
            aria-label="به‌روزرسانی نمرات"
            style={{
              background: 'none',
              border: 'none',
              cursor: isRefetching
                ? 'default'
                : 'pointer',
              fontSize: 18,
              opacity: isRefetching
                ? 0.5
                : 1,
            }}
          >
            🔄
          </button>
        }
      />

      <div className="page fade-up">
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {[1, 2, 3].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
        ) : isError ? (
          <div className="empty">
            <div
              style={{
                fontSize: 42,
                marginBottom: 10,
              }}
            >
              🌐
            </div>

            <div>
              دریافت نمرات با مشکل مواجه شد.
            </div>

            <button
              className="btn btn-p"
              style={{ marginTop: 14 }}
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Spinner size={16} />
              ) : (
                'تلاش دوباره'
              )}
            </button>
          </div>
        ) : grades.length === 0 ? (
          <div className="empty">
            <div
              style={{
                fontSize: 44,
                marginBottom: 12,
              }}
            >
              📊
            </div>

            <div>
              هنوز هیچ نمره‌ای ثبت نشده است.
            </div>

            <div
              style={{
                fontSize: 12,
                color: 'var(--txm)',
                marginTop: 8,
              }}
            >
              پس از ثبت نمره توسط مدیر محتوا،
              نتیجه اینجا نمایش داده می‌شود.
            </div>
          </div>
        ) : (
          <>
            <div
              className="card card-glow"
              style={{
                textAlign: 'center',
                padding: 22,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  color:
                    averageVisual.color,
                }}
              >
                {average === null
                  ? '—'
                  : average.toFixed(2)}
              </div>

              <div
                style={{
                  color: 'var(--txm)',
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                میانگین کل از ۲۰
              </div>

              <div
                style={{
                  marginTop: 12,
                }}
              >
                <div className="pbar">
                  <div
                    className="pbar-f"
                    style={{
                      width: `${
                        averagePercentage || 0
                      }%`,
                      background:
                        averageVisual.color,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span className="badge b-acc">
                  {gradedCount} نمره
                  محاسبه‌شده
                </span>

                {total > gradedCount && (
                  <span className="badge b-gray">
                    {total - gradedCount}{' '}
                    نمره در انتظار
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 9,
              }}
            >
              {grades.map(
                (grade, index) => {
                  const score =
                    finiteNumber(
                      grade.score
                    );

                  const maxScore =
                    finiteNumber(
                      grade.max_score
                    ) || 20;

                  const percentage =
                    clampPercentage(
                      grade.percentage
                    );

                  const visual =
                    gradeStyle(
                      percentage
                    );

                  return (
                    <div
                      key={
                        grade.id ||
                        `${grade.lesson}-${grade.exam_title}-${grade.exam_date}-${index}`
                      }
                      className="card"
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius:
                              'var(--r-md)',
                            background:
                              visual.soft,
                            display: 'flex',
                            flexDirection:
                              'column',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 17,
                              fontWeight: 800,
                              color:
                                visual.color,
                            }}
                          >
                            {score === null
                              ? '—'
                              : score}
                          </div>

                          <div
                            style={{
                              fontSize: 8.5,
                              color:
                                'var(--txm)',
                            }}
                          >
                            از {maxScore}
                          </div>
                        </div>

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {grade.lesson ||
                              'درس بدون عنوان'}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color:
                                'var(--tx2)',
                              marginTop: 2,
                            }}
                          >
                            {grade.exam_title ||
                              'امتحان'}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              color:
                                'var(--txm)',
                              marginTop: 3,
                            }}
                          >
                            {grade.exam_date ||
                              'تاریخ نامشخص'}
                          </div>
                        </div>

                        <div
                          style={{
                            padding:
                              '5px 10px',
                            borderRadius:
                              'var(--r-sm)',
                            background:
                              visual.soft,
                            fontSize: 11,
                            fontWeight: 800,
                            color:
                              visual.color,
                            flexShrink: 0,
                          }}
                        >
                          {visual.label}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                        }}
                      >
                        <div className="pbar">
                          <div
                            className="pbar-f"
                            style={{
                              width: `${
                                percentage || 0
                              }%`,
                              background:
                                visual.color,
                            }}
                          />
                        </div>
                      </div>

                      {grade.note && (
                        <div
                          style={{
                            marginTop: 9,
                            fontSize: 11,
                            lineHeight: 1.7,
                            color:
                              'var(--txm)',
                          }}
                        >
                          📝 {grade.note}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
