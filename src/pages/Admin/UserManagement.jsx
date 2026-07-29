import { useState } from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

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


const number = (value) =>
  Math.max(
    0,
    Number(value) || 0
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


function Empty({
  icon = '📭',
  children,
}) {
  return (
    <div className="empty card">
      <div
        style={{
          fontSize: 40,
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


/* مدیریت کاربران */

export function AdminUsers() {
  const navigate =
    useNavigate();

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    group,
    setGroup,
  ] = useState('');

  const [
    intake,
    setIntake,
  ] = useState('');

  const [
    status,
    setStatus,
  ] = useState('all');


  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      'admin-users',
      search,
      group,
      intake,
    ],

    queryFn: () =>
      api
        .get(
          '/api/admin/users',

          {
            params: {
              search:
                search.trim() ||
                undefined,

              group:
                group ||
                undefined,

              intake:
                intake ||
                undefined,
            },
          }
        )
        .then(
          (response) =>
            response.data
              ?.users || []
        ),

    staleTime:
      30_000,
  });


  const {
    data: intakes = [],
  } = useQuery({
    queryKey: [
      'admin-intakes',
    ],

    queryFn: () =>
      api
        .get(
          '/api/admin/intakes'
        )
        .then(
          (response) =>
            response.data
              ?.intakes || []
        ),

    staleTime:
      5 * 60 * 1000,
  });


  const all =
    Array.isArray(data)
      ? data
      : [];


  const users =
    all.filter((item) => {
      if (
        status === 'pending'
      ) {
        return !item.approved;
      }

      if (
        status === 'active'
      ) {
        return (
          item.approved &&
          !item.suspended
        );
      }

      if (
        status === 'suspended'
      ) {
        return item.suspended;
      }

      return true;
    });


  const pending =
    all.filter(
      (item) =>
        !item.approved
    ).length;


  return (
    <>
      <Header
        title="مدیریت کاربران"
        subtitle={`${all.length} کاربر`}
        right={
          <button
            type="button"
            onClick={() =>
              refetch()
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

      <main className="page fade-up">
        <section
          className={
            'card card-glow'
          }
          style={{
            padding:
              16,

            marginBottom:
              13,

            background:
              'linear-gradient(145deg,rgba(59,130,246,.15),rgba(16,24,39,.95))',
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                12,
            }}
          >
            <span
              style={{
                display:
                  'grid',

                width:
                  50,

                height:
                  50,

                placeItems:
                  'center',

                borderRadius:
                  16,

                background:
                  'var(--grad-brand)',

                fontSize:
                  23,
              }}
            >
              👥
            </span>

            <div
              style={{
                flex:
                  1,
              }}
            >
              <b
                style={{
                  fontSize:
                    16,
                }}
              >
                کاربران هامزیار
              </b>

              <div
                style={{
                  display:
                    'flex',

                  gap:
                    5,

                  marginTop:
                    6,
                }}
              >
                <span className="badge b-grn">
                  {all.filter(
                    (item) =>
                      item.approved
                  ).length}{' '}

                  تأییدشده
                </span>

                {pending > 0 && (
                  <span className="badge b-yel">
                    {pending} در انتظار
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>


        <section
          className="card"
          style={{
            display:
              'grid',

            gap:
              9,

            marginBottom:
              13,
          }}
        >
          <div
            style={{
              position:
                'relative',
            }}
          >
            <input
              className="inp"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={
                'نام، شماره دانشجویی یا یوزرنیم...'
              }
            />

            {isFetching && (
              <span
                style={{
                  position:
                    'absolute',

                  left:
                    12,

                  top:
                    12,
                }}
              >
                <Spinner size={15} />
              </span>
            )}
          </div>

          <div className="grid2">
            <select
              className="inp"
              value={group}
              onChange={(event) =>
                setGroup(
                  event.target.value
                )
              }
            >
              <option value="">
                همه گروه‌ها
              </option>

              <option value="1">
                گروه ۱
              </option>

              <option value="2">
                گروه ۲
              </option>
            </select>

            <select
              className="inp"
              value={intake}
              onChange={(event) =>
                setIntake(
                  event.target.value
                )
              }
            >
              <option value="">
                همه ورودی‌ها
              </option>

              {(
                Array.isArray(
                  intakes
                )
                  ? intakes
                  : []
              ).map((item) => (
                <option
                  key={item.code}
                  value={item.code}
                >
                  {item.label ||
                    item.code}
                </option>
              ))}
            </select>
          </div>
        </section>


        <div className="tab-bar">
          {[
            [
              'all',
              'همه',
            ],

            [
              'active',
              'فعال',
            ],

            [
              'pending',
              'در انتظار',
            ],

            [
              'suspended',
              'تعلیق',
            ],
          ].map(
            ([
              key,
              label,
            ]) => (
              <button
                key={key}
                className="tab-btn"
                onClick={() =>
                  setStatus(key)
                }
                style={{
                  color:
                    status === key
                      ? '#fff'
                      : 'var(--tx2)',

                  background:
                    status === key
                      ? 'var(--grad-brand)'
                      : 'transparent',
                }}
              >
                {label}
              </button>
            )
          )}
        </div>


        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : isError ? (
          <Empty icon="🌐">
            دریافت کاربران انجام نشد.

            <button
              className="btn btn-p"
              style={{
                marginTop:
                  12,
              }}
              onClick={() =>
                refetch()
              }
            >
              تلاش دوباره
            </button>
          </Empty>
        ) : users.length === 0 ? (
          <Empty>
            کاربری با این فیلتر پیدا نشد.
          </Empty>
        ) : (
          <section
            style={{
              display:
                'grid',

              gap:
                8,
            }}
          >
            {users.map(
              (
                user,
                index
              ) => (
                <button
                  type="button"
                  key={user.id}
                  className={
                    'card card-tap pop-in'
                  }
                  onClick={() =>
                    navigate(
                      `/admin/users/${user.id}`
                    )
                  }
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    width:
                      '100%',

                    gap:
                      10,

                    padding:
                      12,

                    textAlign:
                      'right',

                    animationDelay:
                      `${
                        Math.min(
                          index,
                          8
                        ) * 25
                      }ms`,
                  }}
                >
                  <span
                    className="avatar"
                    style={{
                      width:
                        43,

                      height:
                        43,
                    }}
                  >
                    {user.name?.[0] ||
                      '؟'}
                  </span>

                  <span
                    style={{
                      flex:
                        1,

                      minWidth:
                        0,
                    }}
                  >
                    <b
                      style={{
                        display:
                          'block',

                        overflow:
                          'hidden',

                        fontSize:
                          12.5,

                        textOverflow:
                          'ellipsis',

                        whiteSpace:
                          'nowrap',
                      }}
                    >
                      {user.name ||
                        `#${user.id}`}
                    </b>

                    <span
                      style={{
                        display:
                          'block',

                        color:
                          'var(--txm)',

                        fontSize:
                          9.2,

                        marginTop:
                          3,
                      }}
                    >
                      {user.student_id ||
                        'بدون شماره'}

                      {' • ورودی '}

                      {user.intake ||
                        '—'}

                      {' • گروه '}

                      {user.group ||
                        '—'}
                    </span>
                  </span>

                  <span
                    className={`badge ${
                      user.suspended
                        ? 'b-red'

                        : !user.approved
                          ? 'b-yel'

                          : user.role !==
                              'student'
                            ? 'b-pur'

                            : 'b-grn'
                    }`}
                  >
                    {user.suspended
                      ? 'تعلیق'

                      : !user.approved
                        ? 'در انتظار'

                        : user.role ===
                            'content_admin'
                          ? 'مدیر محتوا'

                          : user.role ===
                              'support'
                            ? 'پشتیبان'

                            : 'فعال'}
                  </span>

                  <span>←</span>
                </button>
              )
            )}
          </section>
        )}
      </main>
    </>
  );
}


/* جزئیات کاربر */

export function AdminUserDetail() {
  const {
    uid,
  } = useParams();

  const navigate =
    useNavigate();

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({});

  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();


  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'admin-user',
      uid,
    ],

    queryFn: () =>
      api
        .get(
          `/api/admin/users/${uid}`
        )
        .then(
          (response) =>
            response.data
              ?.user
        ),
  });


  const refresh = async () => {
    await Promise.all([
      queryClient
        .invalidateQueries({
          queryKey: [
            'admin-user',
            uid,
          ],
        }),

      queryClient
        .invalidateQueries({
          queryKey: [
            'admin-users',
          ],
        }),
    ]);
  };


  const action = useMutation({
    mutationFn: ({
      type,
      payload,
    }) => {
      if (type === 'edit') {
        return api.patch(
          `/api/admin/users/${uid}`,
          payload
        );
      }

      return api.post(
        `/api/admin/users/${uid}/${type}`
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
        'عملیات با موفقیت انجام شد ✅',
        'success'
      );

      setEditing(false);

      await refresh();

      if (
        [
          'delete',
          'block',
          'reject',
        ].includes(
          variables.type
        )
      ) {
        navigate(
          '/admin/users'
        );
      }
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


  const startEdit = () => {
    setForm({
      name:
        user.name || '',

      student_id:
        user.student_id || '',

      intake:
        user.intake || '',

      group:
        user.group || '1',

      role:
        user.role ||
        'student',
    });

    setEditing(true);
  };


  const run = (
    type,
    message
  ) => {
    if (
      window.confirm(message)
    ) {
      action.mutate({
        type,
      });
    }
  };


  return (
    <>
      <Header
        title="جزئیات کاربر"
        subtitle={`شناسه ${uid}`}
      />

      <main className="page fade-up">
        {isLoading ? (
          <SkeletonCard />
        ) : isError || !user ? (
          <Empty icon="🌐">
            کاربر پیدا نشد.
          </Empty>
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
                'card card-glow'
              }
              style={{
                padding:
                  17,

                background:
                  'linear-gradient(145deg,rgba(59,130,246,.15),rgba(16,24,39,.95))',
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
                  className="avatar"
                  style={{
                    width:
                      58,

                    height:
                      58,

                    fontSize:
                      22,
                  }}
                >
                  {user.name?.[0] ||
                    '؟'}
                </span>

                <div
                  style={{
                    flex:
                      1,
                  }}
                >
                  <h2
                    style={{
                      fontSize:
                        17,
                    }}
                  >
                    {user.name ||
                      `#${uid}`}
                  </h2>

                  <div
                    style={{
                      display:
                        'flex',

                      gap:
                        5,

                      marginTop:
                        6,
                    }}
                  >
                    <span
                      className={`badge ${
                        user.suspended
                          ? 'b-red'

                          : user.approved
                            ? 'b-grn'

                            : 'b-yel'
                      }`}
                    >
                      {user.suspended
                        ? 'تعلیق‌شده'

                        : 
