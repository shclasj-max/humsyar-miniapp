import { useState } from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import api from '../../lib/api';
import Header from '../../components/layout/Header';

import PrestigeHero from '../../components/shared/PrestigeHero';

import {
  Spinner,
} from '../../components/shared/Loading';

import {
  ProfileSkeleton,
} from '../../components/shared/skeletons';

import {
  haptic,
  hapticNotif,
} from '../../lib/telegram';

import {
  useUIStore,
} from '../../stores/uiStore';

import {
  useAuthStore,
} from '../../stores/authStore';


const number = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
};


const percent = (value) =>
  Math.min(
    100,
    number(value)
  );


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


// تاریخ شمسی کوتاه برای
// پیام Cooldown لقب
const faDate = (iso) => {
  if (!iso) {
    return '';
  }

  try {
    return new Date(
      iso
    ).toLocaleDateString('fa-IR');
  } catch {
    return '';
  }
};


// سوییچ کوچک — همان الگوی
// MiniSwitch در Roles.jsx
function MiniSwitch({
  on,
  onToggle,
  color,
  disabled,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      style={{
        width: 32,
        height: 18,
        borderRadius: 99,
        border:
          '1px solid var(--line)',
        background: on
          ? color ||
            'rgba(52,211,153,.35)'
          : 'rgba(255,255,255,.06)',
        position: 'relative',
        flexShrink: 0,
        cursor: disabled
          ? 'default'
          : 'pointer',
        opacity: disabled
          ? .45
          : 1,
        transition:
          'background .15s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          insetInlineStart: on
            ? 15
            : 2,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: on
            ? '#E8F0FF'
            : '#7A8DB0',
          transition:
            'inset-inline-start .15s ease',
        }}
      />
    </button>
  );
}


function Picker({
  title,
  options,
  current,
  loading,
  pending,
  onSelect,
  onClose,
}) {
  return (
    <div
      className="more-sheet"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={
          'more-sheet__panel ' +
          'glass sheet-in'
        }
        role="dialog"
        aria-modal="true"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="more-sheet__handle" />

        <div className="more-sheet__title">
          {title}
        </div>

        {loading ? (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              padding: 24,
            }}
          >
            <Spinner />
          </div>
        ) : options.length === 0 ? (
          <div className="empty">
            گزینه‌ای موجود نیست.
          </div>
        ) : (
          options.map((item) => (
            <button
              type="button"
              key={item.value}
              className="more-sheet__item"
              disabled={pending}
              onClick={() => {
                if (
                  item.value === current
                ) {
                  onClose();
                } else {
                  onSelect(
                    item.value
                  );
                }
              }}
            >
              <span className="more-sheet__item-icon">
                {item.icon || '📌'}
              </span>

              <span className="more-sheet__item-text">
                <span className="more-sheet__item-title">
                  {item.label}
                </span>
              </span>

              {item.value ===
              current ? (
                <span className="badge b-grn">
                  انتخاب فعلی
                </span>
              ) : (
                <span className="more-sheet__arrow">
                  ←
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}


function WeekChart({
  rows = [],
}) {
  const safeRows =
    Array.isArray(rows)
      ? rows
      : [];

  const values =
    safeRows.map(
      (item) =>
        number(item?.count)
    );

  const max = Math.max(
    ...values,
    1
  );

  if (!safeRows.length) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: 70,
        gap: 6,
      }}
    >
      {safeRows.map(
        (item, index) => {
          const value =
            values[index];

          return (
            <div
              key={`${
                item?.date
              }-${index}`}
              style={{
                flex: 1,

                display:
                  'flex',

                height:
                  '100%',

                flexDirection:
                  'column',

                alignItems:
                  'center',

                justifyContent:
                  'flex-end',

                gap: 4,
              }}
            >
              <div
                style={{
                  width:
                    '100%',

                  minHeight:
                    4,

                  height:
                    `${Math.max(
                      4,

                      (
                        value /
                        max
                      ) * 44
                    )}px`,

                  borderRadius:
                    '6px 6px 2px 2px',

                  background:
                    value
                      ? 'var(--grad-brand)'
                      : 'var(--ovr)',
                }}
              />

              <span
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    8,
                }}
              >
                {String(
                  item?.date ||
                  ''
                ).slice(-2)}
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}


// 🏷 موج Identity v1 — کارت لقب و
// حریم نمایش نام واقعی (§۳/§Privacy)
function NicknameCard({
  user,
  onSaved,
}) {
  const toast = useUIStore(
    (state) => state.toast
  );

  const [editing, setEditing] =
    useState(false);

  const [value, setValue] =
    useState('');


  const saveMutation =
    useMutation({
      mutationFn: (raw) =>
        api.patch(
          '/api/profile/nickname',

          { nickname: raw }
        ),

      onSuccess: async () => {
        hapticNotif('success');

        toast(
          'لقب به‌روزرسانی شد ✅',
          'success'
        );

        setEditing(false);

        await onSaved();
      },

      onError: (error) => {
        hapticNotif('error');

        toast(
          errorText(
            error,
            'ثبت لقب انجام نشد'
          ),
          'error'
        );
      },
    });


  const privacyMutation =
    useMutation({
      mutationFn: (on) =>
        api.patch(
          '/api/profile/privacy',

          {
            show_real_name: on,
          }
        ),

      onSuccess: async () => {
        hapticNotif('success');

        toast(
          'تنظیم نمایش ذخیره شد ✅',
          'success'
        );

        await onSaved();
      },

      onError: (error) => {
        hapticNotif('error');

        toast(
          errorText(
            error,
            'ذخیره انجام نشد'
          ),
          'error'
        );
      },
    });


  const nick = user.nickname || '';

  const canChange =
    user.can_change_nickname !==
    false;

  const coolDays =
    number(
      user.nickname_cooldown_days
    ) || 30;

  const showReal =
    user.show_real_name !== false;

  const nextText = faDate(
    user.next_change_at
  );

  const pending =
    saveMutation.isPending;


  const startEdit = () => {
    haptic();

    setValue(nick);
    setEditing(true);
  };


  const submit = (event) => {
    event.preventDefault();

    if (!pending) {
      saveMutation.mutate(
        value.trim()
      );
    }
  };


  return (
    <section className="card">
      <div className="sec-title">
        🏷 لقب و نام نمایشی
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              overflow: 'hidden',

              fontSize: 15,

              fontWeight: 900,

              textOverflow:
                'ellipsis',

              whiteSpace:
                'nowrap',
            }}
          >
            {nick || '—'}
          </div>

          <div
            style={{
              color:
                'var(--txm)',

              fontSize: 9.5,

              marginTop: 3,
            }}
          >
            {nick
              ? 'این نام در رتبه‌بندی، فید و نشان‌ها دیده می‌شود'
              : 'لقبی ندارید؛ نام واقعی شما نمایش داده می‌شود'}
          </div>
        </div>

        {!editing && (
          <button
            type="button"
            className="btn btn-dark"
            disabled={
              !canChange || pending
            }
            onClick={startEdit}
          >
            {nick
              ? 'ویرایش'
              : 'انتخاب لقب'}
          </button>
        )}
      </div>

      {editing && (
        <form
          onSubmit={submit}
          style={{
            display: 'flex',
            gap: 7,
            marginTop: 12,
          }}
        >
          <input
            className="inp"
            value={value}
            maxLength={24}
            placeholder={
              'لقب (۳ تا ۲۴ نویسه)'
            }
            autoFocus
            onChange={(event) =>
              setValue(
                event.target.value
              )
            }
          />

          <button
            className="btn btn-p"
            type="submit"
            disabled={pending}
          >
            {pending ? (
              <Spinner size={14} />
            ) : (
              'ذخیره'
            )}
          </button>

          <button
            className="btn btn-dark"
            type="button"
            onClick={() =>
              setEditing(false)
            }
          >
            لغو
          </button>
        </form>
      )}

      {nick && !editing && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            saveMutation.mutate('')
          }
          style={{
            padding: 0,
            marginTop: 8,
            color: 'var(--txm)',
            background: 'none',
            border: 0,
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          حذف لقب ✕
        </button>
      )}

      <div
        style={{
          color: 'var(--txm)',
          fontSize: 9,
          marginTop: 9,
        }}
      >
        {canChange
          ? `تغییر لقب هر ${coolDays} روز یک‌بار ممکن است؛ نام واقعی در ثبت نمره و گزارش‌ها همیشه ثابت می‌ماند.`
          : `تغییر بعدی لقب از ${nextText} ممکن می‌شود.`}
      </div>

      <div className="divider" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 12 }}>
            نمایش اسم واقعی
          </b>

          <div
            style={{
              color:
                'var(--txm)',

              fontSize: 9.5,

              marginTop: 2,
            }}
          >
            {showReal
              ? 'در فضای عمومی نام واقعی شما هم دیده می‌شود'
              : 'در فضای عمومی فقط لقب شما دیده می‌شود'}
          </div>
        </div>

        <MiniSwitch
          on={showReal}
          disabled={
            privacyMutation
              .isPending
          }
          onToggle={() =>
            privacyMutation.mutate(
              !showReal
            )
          }
        />
      </div>
    </section>
  );
}


export default function Profile() {
  const [
    editField,
    setEditField,
  ] = useState(null);

  const [
    fieldValue,
    setFieldValue,
  ] = useState('');

  const [
    picker,
    setPicker,
  ] = useState(null);

  const toast = useUIStore(
    (state) => state.toast
  );

  const refreshAuth =
    useAuthStore(
      (state) =>
        state.refresh
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
      'profile',
    ],

    queryFn: () =>
      api
        .get('/api/profile')
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      3 * 60 * 1000,
  });


  const {
    data: rank,
  } = useQuery({
    queryKey: [
      'rank',
    ],

    queryFn: () =>
      api
        .get(
          '/api/profile/rank'
        )
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      5 * 60 * 1000,
  });


  const {
    data: badges = [],
  } = useQuery({
    queryKey: [
      'badges',
    ],

    queryFn: () =>
      api
        .get(
          '/api/profile/badges'
        )
        .then(
          (response) =>
            response.data
              ?.badges || []
        ),

    staleTime:
      10 * 60 * 1000,
  });


  const {
    data: intakes = [],

    isLoading:
      intakesLoading,
  } = useQuery({
    queryKey: [
      'intakes',
    ],

    queryFn: () =>
      api
        .get(
          '/api/profile/intakes'
        )
        .then(
          (response) =>
            response.data
              ?.intakes || []
        ),

    enabled:
      picker === 'intake',

    staleTime:
      30 * 60 * 1000,
  });


  const refreshAll = async () => {
    await Promise.all([
      queryClient
        .invalidateQueries({
          queryKey:
            ['profile'],
        }),

      queryClient
        .invalidateQueries({
          queryKey:
            ['dashboard'],
        }),

      queryClient
        .invalidateQueries({
          queryKey:
            ['rank'],
        }),

      queryClient
        .invalidateQueries({
          queryKey:
            ['badges'],
        }),

      queryClient
        .invalidateQueries({
          queryKey:
            ['schedule'],
        }),

      refreshAuth(),
    ]);
  };


  const updateMutation =
    useMutation({
      mutationFn: ({
        field,
        value,
      }) => {
        const endpoint = {
          name:
            'name',

          student_id:
            'student-id',

          group:
            'group',

          intake:
            'intake',
        }[field];

        return api.patch(
          `/api/profile/${endpoint}`,

          {
            [field]:
              value,
          }
        );
      },

      onSuccess:
        async () => {
          hapticNotif(
            'success'
          );

          toast(
            'اطلاعات با موفقیت ذخیره شد ✅',
            'success'
          );

          setEditField(null);
          setPicker(null);

          await refreshAll();
        },

      onError: (error) => {
        hapticNotif('error');

        toast(
          errorText(
            error,
            'ذخیره اطلاعات انجام نشد'
          ),
          'error'
        );
      },
    });


  const user =
    data?.user || {};

  const stats =
    data?.stats || {};

  const badgeList =
    Array.isArray(badges)
      ? badges
      : [];

  const weak =
    Array.isArray(
      stats.weak_topics
    )
      ? stats.weak_topics
      : [];

  const readiness =
    percent(
      stats.percentage
    );


  const startEdit = (
    field,
    value
  ) => {
    haptic();

    setEditField(field);

    setFieldValue(
      value || ''
    );
  };


  const validField =
    editField === 'name'
      ? fieldValue
          .trim()
          .length >= 3

      : editField ===
          'student_id'

        ? /^\d{3,20}$/.test(
            fieldValue.trim()
          )

        : false;


  const submitEdit = (
    event
  ) => {
    event.preventDefault();

    if (validField) {
      updateMutation.mutate({
        field:
          editField,

        value:
          fieldValue.trim(),
      });
    }
  };


  return (
    <>
      <Header
        title="پروفایل من"
        subtitle={
          'اطلاعات تحصیلی و پیشرفت'
        }
      />


      {picker ===
        'group' && (
        <Picker
          title={
            'انتخاب گروه درسی'
          }
          current={
            user.group
          }
          pending={
            updateMutation
              .isPending
          }
          onClose={() => {
            if (
              !updateMutation
                .isPending
            ) {
              setPicker(null);
            }
          }}
          onSelect={(value) =>
            updateMutation.mutate({
              field:
                'group',

              value,
            })
          }
          options={[
            {
              value: '1',
              label: 'گروه ۱',
              icon: '1️⃣',
            },

            {
              value: '2',
              label: 'گروه ۲',
              icon: '2️⃣',
            },
          ]}
        />
      )}


      {picker ===
        'intake' && (
        <Picker
          title={
            'انتخاب ورودی'
          }
          current={
            user.intake
          }
          loading={
            intakesLoading
          }
          pending={
            updateMutation
              .isPending
          }
          onClose={() => {
            if (
              !updateMutation
                .isPending
            ) {
              setPicker(null);
            }
          }}
          onSelect={(value) =>
            updateMutation.mutate({
              field:
                'intake',

              value,
            })
          }
          options={
            (
              Array.isArray(
                intakes
              )
                ? intakes
                : []
            ).map(
              (item) => ({
                value:
                  item.code,

                label:
                  item.label ||
                  item.code,

                icon:
                  '📅',
              })
            )
          }
        />
      )}


      <main className="page fade-up">
        {isLoading ? (
          <ProfileSkeleton />
        ) : isError ? (
          <div className="empty card">
            دریافت پروفایل انجام نشد.

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
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 13,
            }}
          >
            <section
              className={
                'card card-glow hero-card'
              }
            >
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
                    width: 60,
                    height: 60,
                    fontSize: 24,
                  }}
                >
                  {(
                    user
                      .display_name ||
                    user.name
                  )?.[0] || 'ه'}
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <h2
                    style={{
                      overflow:
                        'hidden',

                      fontSize:
                        17.5,

                      fontWeight:
                        900,

                      textOverflow:
                        'ellipsis',

                      whiteSpace:
                        'nowrap',
                    }}
                  >
                    {user
                      .display_name ||
                      user.name ||
                      'کاربر هامزیار'}
                  </h2>

                  {user.nickname && (
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
                      نام واقعی:{' '}
                      {user.name ||
                        '—'}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      startEdit(
                        'student_id',
                        user.student_id
                      )
                    }
                    style={{
                      display: 'block',

                      padding:
                        0,

                      marginTop:
                        3,

                      color:
                        'var(--txm)',

                      background:
                        'none',

                      border:
                        0,

                      fontSize:
                        10.5,

                      cursor:
                        'pointer',
                    }}
                  >
                    شماره دانشجویی:{' '}

                    {user.student_id ||
                      'ثبت نشده'}{' '}

                    ✎
                  </button>

                  <div
                    style={{
                      display: 'flex',

                      flexWrap:
                        'wrap',

                      gap:
                        5,

                      marginTop:
                        7,
                    }}
                  >
                    <button
                      type="button"
                      className={
                        'badge b-acc'
                      }
                      onClick={() =>
                        setPicker(
                          'intake'
                        )
                      }
                    >
                      ورودی{' '}

                      {user.intake ||
                        '—'}{' '}

                      ✎
                    </button>

                    <button
                      type="button"
                      className={
                        'badge b-acc'
                      }
                      onClick={() =>
                        setPicker(
                          'group'
                        )
                      }
                    >
                      گروه{' '}

                      {user.group ||
                        '—'}{' '}

                      ✎
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="icon-btn"
                  aria-label="ویرایش نام"
                  onClick={() =>
                    startEdit(
                      'name',
                      user.name
                    )
                  }
                >
                  ✎
                </button>
              </div>

              {editField && (
                <form
                  onSubmit={
                    submitEdit
                  }
                  style={{
                    display: 'flex',
                    gap: 7,
                    marginTop: 14,
                  }}
                >
                  <input
                    className="inp"
                    value={
                      fieldValue
                    }
                    maxLength={
                      editField ===
                      'name'
                        ? 50
                        : 20
                    }
                    inputMode={
                      editField ===
                      'student_id'
                        ? 'numeric'
                        : 'text'
                    }
                    onChange={(
                      event
                    ) =>
                      setFieldValue(
                        editField ===
                        'student_id'
                          ? event
                              .target
                              .value
                              .replace(
                                /\D/g,
                                ''
                              )
                          : event
                              .target
                              .value
                      )
                    }
                    placeholder={
                      editField ===
                      'name'
                        ? 'نام و نام خانوادگی'
                        : 'شماره دانشجویی'
                    }
                    autoFocus
                  />

                  <button
                    className={
                      'btn btn-p'
                    }
                    type="submit"
                    disabled={
                      !validField ||
                      updateMutation
                        .isPending
                    }
                  >
                    {updateMutation
                      .isPending ? (
                      <Spinner
                        size={14}
                      />
                    ) : (
                      'ذخیره'
                    )}
                  </button>

                  <button
                    className={
                      'btn btn-dark'
                    }
                    type="button"
                    onClick={() =>
                      setEditField(
                        null
                      )
                    }
                  >
                    لغو
                  </button>
                </form>
              )}
            </section>


            {/* 🏷 موج Identity v1 —
                لقب + حریم نام واقعی */}
            <NicknameCard
              user={user}
              onSaved={refreshAll}
            />


            {/* 👑 موج P0 — کارت قهرمان
                Prestige (رنک/هدف/رقیب/سپر) */}
            <PrestigeHero />


            {rank?.rank && (
              <section
                className="card"
                style={{
                  display: 'flex',

                  alignItems:
                    'center',

                  gap: 11,

                  borderColor:
                    'rgba(245,158,11,.24)',

                  background:
                    'linear-gradient(145deg,rgba(245,158,11,.09),rgba(16,24,39,.95))',
                }}
              >
                <span
                  style={{
                    fontSize: 29,
                  }}
                >
                  🏅
                </span>

                <div>
                  <b
                    style={{
                      color:
                        'var(--warn)',

                      fontSize:
                        14,
                    }}
                  >
                    رتبه{' '}

                    {number(
                      rank.rank
                    )}{' '}

                    از{' '}

                    {number(
                      rank.total_users
                    )}
                  </b>

                  <div
                    style={{
                      color:
                        'var(--txm)',

                      fontSize:
                        10,

                      marginTop:
                        2,
                    }}
                  >
                    بهتر از{' '}

                    {percent(
                      rank.percentile
                    )}
                    ٪ دانشجویان
                  </div>
                </div>
              </section>
            )}


            <section className="card">
              <div className="sec-title">
                📊 عملکرد تحصیلی
              </div>

              <div
                className="grid2"
                style={{
                  marginBottom:
                    14,
                }}
              >
                {[
                  [
                    '🧪',

                    number(
                      stats
                        .total_answers
                    ),

                    'سؤال',

                    '#70A7FF',
                  ],

                  [
                    '✅',

                    number(
                      stats
                        .correct_answers
                    ),

                    'صحیح',

                    '#34D399',
                  ],

                  [
                    '📥',

                    number(
                      stats.downloads
                    ),

                    'دانلود',

                    '#22D3EE',
                  ],

                  [
                    '📈',

                    `${readiness}٪`,

                    'موفقیت',

                    '#FCD34D',
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
                        padding:
                          10,

                        textAlign:
                          'center',

                        background:
                          'rgba(100,116,139,.07)',

                        borderRadius:
                          13,
                      }}
                    >
                      <div>
                        {icon}
                      </div>

                      <div
                        style={{
                          color,

                          fontSize:
                            17,

                          fontWeight:
                            900,

                          marginTop:
                            2,
                        }}
                      >
                        {value}
                      </div>

                      <div
                        style={{
                          color:
                            'var(--txm)',

                          fontSize:
                            9,
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
                    display: 'flex',

                    alignItems:
                      'center',

                    gap:
                      8,

                    padding:
                      '9px 11px',

                    marginBottom:
                      12,

                    color:
                      stats
                        .level
                        .color ||
                      'var(--acc)',

                    background:
                      `${
                        stats
                          .level
                          .color ||
                        '#3B82F6'
                      }15`,

                    borderRadius:
                      12,
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        20,
                    }}
                  >
                    {stats
                      .level
                      .icon ||
                      '📈'}
                  </span>

                  <b>
                    {stats
                      .level
                      .label ||
                      'سطح کاربر'}
                  </b>

                  <span
                    style={{
                      marginRight:
                        'auto',

                      color:
                        'var(--txm)',

                      fontSize:
                        9,
                    }}
                  >
                    سطح فعلی
                  </span>
                </div>
              )}

              <WeekChart
                rows={
                  stats.weekly_chart
                }
              />

              {weak.length >
                0 && (
                <>
                  <div className="divider" />

                  <div
                    style={{
                      color:
                        'var(--txm)',

                      fontSize:
                        10.5,

                      marginBottom:
                        7,
                    }}
                  >
                    ⚡ مباحث نیازمند تمرین
                  </div>

                  <div
                    style={{
                      display:
                        'flex',

                      flexWrap:
                        'wrap',

                      gap:
                        5,
                    }}
                  >
                    {weak.map(
                      (item) => (
                        <span
                          key={item}
                          className={
                            'badge b-red'
                          }
                        >
                          {item}
                        </span>
                      )
                    )}
                  </div>
                </>
              )}
            </section>


            {badgeList.length >
              0 && (
              <section className="card">
                <div className="sec-title">
                  🏆 نشان‌های پیشرفت
                </div>

                <div
                  style={{
                    display: 'grid',

                    gridTemplateColumns:
                      'repeat(4,minmax(0,1fr))',

                    gap:
                      9,
                  }}
                >
                  {badgeList.map(
                    (badge) => (
                      <div
                        key={badge.id}
                        style={{
                          textAlign:
                            'center',

                          opacity:
                            badge.earned
                              ? 1
                              : .3,
                        }}
                      >
                        <div
                          style={{
                            display:
                              'grid',

                            width:
                              46,

                            height:
                              46,

                            placeItems:
                              'center',

                            margin:
                              '0 auto',

                            background:
                              badge.earned
                                ? 'var(--acc-soft)'
                                : 'var(--elev)',

                            border:
                              `1px solid ${
                                badge.earned
                                  ? 'var(--bdg)'
                                  : 'var(--bd)'
                              }`,

                            borderRadius:
                              '50%',

                            fontSize:
                              21,
                          }}
                        >
                          {badge.icon}
                        </div>

                        <div
                          style={{
                            color:
                              'var(--tx2)',

                            fontSize:
                              8.5,

                            marginTop:
                              5,
                          }}
                        >
                          {badge.title}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </>
  );
}
