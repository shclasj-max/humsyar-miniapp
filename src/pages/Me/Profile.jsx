import { useState } from 'react';
import {
  useQuery,
  useMutation,
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
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
};

const toPercent = (value) =>
  Math.min(100, toNumber(value));

const errorMessage = (
  error,
  fallback = 'انجام عملیات با خطا مواجه شد'
) => {
  const detail = error?.response?.data?.detail;

  return typeof detail === 'string' && detail
    ? detail
    : fallback;
};

function WeekChart({ data = [] }) {
  const rows = Array.isArray(data)
    ? data
    : [];

  if (rows.length === 0) {
    return null;
  }

  const values = rows.map((item) =>
    toNumber(item?.count)
  );

  const max = Math.max(...values, 1);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        height: 50,
      }}
    >
      {rows.map((item, index) => {
        const count = values[index];

        return (
          <div
            key={`${item?.date || 'day'}-${index}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <div
              style={{
                width: '100%',
                borderRadius: 3,
                background:
                  count > 0
                    ? 'var(--acc)'
                    : 'var(--ovr)',
                height: `${Math.max(
                  (count / max) * 42,
                  count > 0 ? 5 : 3
                )}px`,
                transition: 'height .5s',
              }}
            />

            <div
              style={{
                fontSize: 8,
                color: 'var(--txm)',
              }}
            >
              {String(
                item?.date || ''
              ).slice(-2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PickerSheet({
  title,
  options = [],
  current,
  onSelect,
  onClose,
  loading = false,
  pending = false,
}) {
  const safeOptions = Array.isArray(options)
    ? options
    : [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.65)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        className="fade-up"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surf)',
          borderRadius: '20px 20px 0 0',
          padding:
            '18px 14px calc(18px + env(safe-area-inset-bottom))',
        }}
      >
        <div
          style={{
            width: 34,
            height: 4,
            background: 'var(--bd)',
            borderRadius: 999,
            margin: '0 auto 14px',
          }}
        />

        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 12,
          }}
        >
          {title}
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <Spinner size={22} />
          </div>
        ) : safeOptions.length === 0 ? (
          <div className="empty">
            گزینه‌ای برای انتخاب وجود ندارد.
          </div>
        ) : (
          safeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                haptic();

                if (option.value === current) {
                  onClose();
                } else {
                  onSelect(option.value);
                }
              }}
              disabled={pending}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 6px',
                background: 'none',
                border: 'none',
                cursor: pending
                  ? 'default'
                  : 'pointer',
                textAlign: 'right',
                borderBottom:
                  '1px solid var(--bd)',
                color:
                  current === option.value
                    ? 'var(--acc)'
                    : 'var(--tx)',
                fontWeight:
                  current === option.value
                    ? 700
                    : 400,
                fontFamily: 'var(--font)',
                fontSize: 13.5,
                opacity: pending ? 0.6 : 1,
              }}
            >
              {option.label}

              {current === option.value && (
                <span>✓</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const [editName, setEditName] =
    useState(false);

  const [nameValue, setNameValue] =
    useState('');

  const [
    editStudentId,
    setEditStudentId,
  ] = useState(false);

  const [
    studentIdValue,
    setStudentIdValue,
  ] = useState('');

  const [showGroup, setShowGroup] =
    useState(false);

  const [showIntake, setShowIntake] =
    useState(false);

  const toast = useUIStore(
    (state) => state.toast
  );

  const refreshAuthUser = useAuthStore(
    (state) => state.refresh
  );

  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () =>
      api
        .get('/api/profile')
        .then((response) => response.data),
    staleTime: 1000 * 60 * 3,
  });

  const { data: rankData } = useQuery({
    queryKey: ['rank'],
    queryFn: () =>
      api
        .get('/api/profile/rank')
        .then((response) => response.data),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: intakes,
    isLoading: intakesLoading,
  } = useQuery({
    queryKey: ['intakes'],
    queryFn: () =>
      api
        .get('/api/profile/intakes')
        .then(
          (response) =>
            response.data?.intakes || []
        ),
    staleTime: 1000 * 60 * 30,
    enabled: showIntake,
  });

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () =>
      api
        .get('/api/profile/badges')
        .then(
          (response) =>
            response.data?.badges || []
        ),
    staleTime: 1000 * 60 * 10,
  });

  const refreshProfile = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['profile'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['dashboard'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['rank'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['badges'],
      }),
      refreshAuthUser(),
    ]);
  };

  const updateName = useMutation({
    mutationFn: (name) =>
      api
        .patch('/api/profile/name', {
          name,
        })
        .then((response) => response.data),

    onSuccess: async () => {
      hapticNotif('success');
      toast('نام ذخیره شد ✅', 'success');
      setEditName(false);
      await refreshProfile();
    },

    onError: (error) => {
      hapticNotif('error');
      toast(
        errorMessage(
          error,
          'نام ذخیره نشد'
        ),
        'error'
      );
    },
  });

  const updateStudentId = useMutation({
    mutationFn: (studentId) =>
      api
        .patch('/api/profile/student-id', {
          student_id: studentId,
        })
        .then((response) => response.data),

    onSuccess: async () => {
      hapticNotif('success');
      toast(
        'شماره دانشجویی ذخیره شد ✅',
        'success'
      );
      setEditStudentId(false);
      await refreshProfile();
    },

    onError: (error) => {
      hapticNotif('error');
      toast(
        errorMessage(
          error,
          'شماره دانشجویی ذخیره نشد'
        ),
        'error'
      );
    },
  });

  const updateGroup = useMutation({
    mutationFn: (group) =>
      api
        .patch('/api/profile/group', {
          group,
        })
        .then((response) => response.data),

    onSuccess: async () => {
      hapticNotif('success');
      toast(
        'گروه تغییر کرد ✅',
        'success'
      );
      setShowGroup(false);
      await refreshProfile();
    },

    onError: (error) => {
      hapticNotif('error');
      toast(
        errorMessage(
          error,
          'گروه تغییر نکرد'
        ),
        'error'
      );
    },
  });

  const updateIntake = useMutation({
    mutationFn: (intake) =>
      api
        .patch('/api/profile/intake', {
          intake,
        })
        .then((response) => response.data),

    onSuccess: async () => {
      hapticNotif('success');
      toast(
        'ورودی تغییر کرد ✅',
        'success'
      );
      setShowIntake(false);
      await refreshProfile();
    },

    onError: (error) => {
      hapticNotif('error');
      toast(
        errorMessage(
          error,
          'ورودی تغییر نکرد'
        ),
        'error'
      );
    },
  });

  const user = data?.user || null;
  const stats = data?.stats || {};

  const weakTopics = Array.isArray(
    stats.weak_topics
  )
    ? stats.weak_topics
    : [];

  const badgeItems = Array.isArray(badges)
    ? badges
    : [];

  const intakeOptions = (
    Array.isArray(intakes) ? intakes : []
  ).map((item) => ({
    value: item.code,
    label: item.label || item.code,
  }));

  return (
    <>
      <Header title="پروفایل" />

      {showGroup && (
        <PickerSheet
          title="انتخاب گروه"
          options={[
            {
              value: '1',
              label: 'گروه ۱',
            },
            {
              value: '2',
              label: 'گروه ۲',
            },
          ]}
          current={user?.group}
          onSelect={(value) =>
            updateGroup.mutate(value)
          }
          onClose={() =>
            !updateGroup.isPending &&
            setShowGroup(false)
          }
          pending={updateGroup.isPending}
        />
      )}

      {showIntake && (
        <PickerSheet
          title="انتخاب ورودی"
          options={intakeOptions}
          current={user?.intake}
          onSelect={(value) =>
            updateIntake.mutate(value)
          }
          onClose={() =>
            !updateIntake.isPending &&
            setShowIntake(false)
          }
          loading={intakesLoading}
          pending={updateIntake.isPending}
        />
      )}

      <div className="page fade-up">
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <SkeletonCard />
            <SkeletonCard />
          </div>
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
              دریافت اطلاعات پروفایل با مشکل مواجه شد.
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
        ) : user ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 13,
            }}
          >
            <div className="card card-glow">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                }}
              >
                <div
                  className="avatar"
                  style={{
                    width: 52,
                    height: 52,
                    fontSize: 22,
                  }}
                >
                  {user.name?.[0] || '؟'}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 17,
                    }}
                  >
                    {user.name ||
                      'کاربر هامزیار'}
                  </div>

                  <button
                    onClick={() => {
                      haptic();
                      setStudentIdValue(
                        user.student_id || ''
                      );
                      setEditStudentId(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--txm)',
                      fontSize: 11,
                      padding: 0,
                      fontFamily: 'var(--font)',
                    }}
                  >
                    شماره دانشجویی:{' '}
                    {user.student_id || '—'} ✏️
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      gap: 5,
                      marginTop: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      onClick={() => {
                        haptic();
                        setShowIntake(true);
                      }}
                      className="badge b-acc"
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily:
                          'var(--font)',
                      }}
                    >
                      ورودی{' '}
                      {user.intake || '—'} ✏️
                    </button>

                    <button
                      onClick={() => {
                        haptic();
                        setShowGroup(true);
                      }}
                      className="badge b-acc"
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily:
                          'var(--font)',
                      }}
                    >
                      گروه {user.group || '—'} ✏️
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    haptic();
                    setNameValue(
                      user.name || ''
                    );
                    setEditName(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                  aria-label="ویرایش نام"
                >
                  ✏️
                </button>
              </div>

              {editName && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();

                    if (
                      nameValue.trim().length >= 3
                    ) {
                      updateName.mutate(
                        nameValue
                      );
                    }
                  }}
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <input
                    className="inp"
                    value={nameValue}
                    onChange={(event) =>
                      setNameValue(
                        event.target.value
                      )
                    }
                    placeholder="نام جدید"
                    maxLength={50}
                    style={{ flex: 1 }}
                    autoFocus
                  />

                  <button
                    className="btn btn-p"
                    type="submit"
                    disabled={
                      updateName.isPending ||
                      nameValue.trim().length < 3
                    }
                  >
                    {updateName.isPending ? (
                      <Spinner size={14} />
                    ) : (
                      'ذخیره'
                    )}
                  </button>

                  <button
                    className="btn btn-dark"
                    type="button"
                    onClick={() =>
                      setEditName(false)
                    }
                    disabled={
                      updateName.isPending
                    }
                  >
                    لغو
                  </button>
                </form>
              )}

              {editStudentId && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();

                    if (
                      /^\d{3,20}$/.test(
                        studentIdValue.trim()
                      )
                    ) {
                      updateStudentId.mutate(
                        studentIdValue
                      );
                    }
                  }}
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <input
                    className="inp"
                    value={studentIdValue}
                    onChange={(event) =>
                      setStudentIdValue(
                        event.target.value.replace(
                          /\D/g,
                          ''
                        )
                      )
                    }
                    placeholder="شماره دانشجویی"
                    inputMode="numeric"
                    minLength={3}
                    maxLength={20}
                    style={{ flex: 1 }}
                    autoFocus
                  />

                  <button
                    className="btn btn-p"
                    type="submit"
                    disabled={
                      updateStudentId.isPending ||
                      !/^\d{3,20}$/.test(
                        studentIdValue.trim()
                      )
                    }
                  >
                    {updateStudentId.isPending ? (
                      <Spinner size={14} />
                    ) : (
                      'ذخیره'
                    )}
                  </button>

                  <button
                    className="btn btn-dark"
                    type="button"
                    onClick={() =>
                      setEditStudentId(false)
                    }
                    disabled={
                      updateStudentId.isPending
                    }
                  >
                    لغو
                  </button>
                </form>
              )}
            </div>

            {rankData?.rank && (
              <div
                className="card"
                style={{
                  background:
                    'linear-gradient(135deg,rgba(245,158,11,.08),rgba(59,130,246,.06))',
                  borderColor:
                    'rgba(245,158,11,.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                }}
              >
                <div style={{ fontSize: 28 }}>
                  🏅
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: 'var(--warn)',
                    }}
                  >
                    رتبه{' '}
                    {toNumber(rankData.rank)} از{' '}
                    {toNumber(
                      rankData.total_users
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--txm)',
                    }}
                  >
                    بهتر از{' '}
                    {toPercent(
                      rankData.percentile
                    )}
                    ٪ دانشجویان
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="sec-title">
                📊 آمار
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-around',
                  marginBottom: 13,
                }}
              >
                {[
                  [
                    '🧪',
                    toNumber(
                      stats.total_answers
                    ),
                    'سوال',
                    'var(--acc)',
                  ],
                  [
                    '✅',
                    toNumber(
                      stats.correct_answers
                    ),
                    'صحیح',
                    'var(--ok)',
                  ],
                  [
                    '📥',
                    toNumber(stats.downloads),
                    'دانلود',
                    'var(--info)',
                  ],
                  [
                    '📈',
                    `${toPercent(
                      stats.percentage
                    )}٪`,
                    'موفقیت',
                    'var(--warn)',
                  ],
                ].map(
                  ([
                    icon,
                    value,
                    label,
                    color,
                  ]) => (
                    <div
                      key={label}
                      style={{
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                        }}
                      >
                        {icon}
                      </div>

                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color,
                          margin: '2px 0',
                        }}
                      >
                        {value}
                      </div>

                      <div
                        style={{
                          fontSize: 9.5,
                          color: 'var(--txm)',
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  )
                )}
              </div>

              {stats.level && (
                <div
                  style={{
                    background: `${
                      stats.level.color ||
                      '#60A5FA'
                    }15`,
                    border: `1px solid ${
                      stats.level.color ||
                      '#60A5FA'
                    }40`,
                    borderRadius:
                      'var(--r-md)',
                    padding: '8px 12px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                    }}
                  >
                    {stats.level.icon || '📈'}
                  </span>

                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        stats.level.color ||
                        '#60A5FA',
                      fontSize: 14,
                    }}
                  >
                    {stats.level.label ||
                      'سطح کاربر'}
                  </div>

                  <div
                    style={{
                      marginRight: 'auto',
                      fontSize: 11,
                      color: 'var(--txm)',
                    }}
                  >
                    سطح کاربری
                  </div>
                </div>
              )}

              <WeekChart
                data={stats.weekly_chart}
              />

              {weakTopics.length > 0 && (
                <>
                  <div className="divider" />

                  <div
                    style={{
                      color: 'var(--txm)',
                      fontSize: 12,
                      marginBottom: 7,
                    }}
                  >
                    ⚡ نقاط ضعف
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 5,
                      flexWrap: 'wrap',
                    }}
                  >
                    {weakTopics.map(
                      (topic) => (
                        <span
                          key={topic}
                          className="badge b-red"
                        >
                          {topic}
                        </span>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            {badgeItems.length > 0 && (
              <div className="card">
                <div className="sec-title">
                  🏅 بج‌های پیشرفت
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  {badgeItems.map((badge) => (
                    <div
                      key={badge.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        opacity: badge.earned
                          ? 1
                          : 0.3,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: badge.earned
                            ? 'rgba(59,130,246,.14)'
                            : 'rgba(71,85,105,.1)',
                          border: `2px solid ${
                            badge.earned
                              ? 'rgba(59,130,246,.35)'
                              : 'var(--bd)'
                          }`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            'center',
                          fontSize: 20,
                        }}
                      >
                        {badge.icon}
                      </div>

                      <div
                        style={{
                          fontSize: 9,
                          color: 'var(--tx2)',
                          textAlign: 'center',
                        }}
                      >
                        {badge.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty">
            اطلاعات پروفایل در دسترس نیست.
          </div>
        )}
      </div>
    </>
  );
}
