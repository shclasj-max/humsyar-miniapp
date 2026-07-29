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


const TONES = {
  new_resources: [
    '📚',
    '#34D399',
    'rgba(16,185,129,.12)',
  ],

  schedule: [
    '📅',
    '#70A7FF',
    'rgba(59,130,246,.12)',
  ],

  exam: [
    '📝',
    '#FB7185',
    'rgba(239,68,68,.12)',
  ],

  makeup: [
    '🔄',
    '#FCD34D',
    'rgba(245,158,11,.12)',
  ],

  daily_question: [
    '🧪',
    '#C4B5FD',
    'rgba(139,92,246,.13)',
  ],

  edu_message: [
    '🎓',
    '#22D3EE',
    'rgba(34,211,238,.12)',
  ],

  general: [
    '📢',
    '#70A7FF',
    'rgba(59,130,246,.12)',
  ],

  grade_release: [
    '📊',
    '#34D399',
    'rgba(16,185,129,.12)',
  ],

  sub_expiry: [
    '💳',
    '#FCD34D',
    'rgba(245,158,11,.12)',
  ],
};


export function Notifications() {
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
      'notification-settings',
    ],

    queryFn: () =>
      api
        .get(
          '/api/notifications/settings'
        )
        .then(
          (response) =>
            response.data
              ?.settings || []
        ),
  });


  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: [
        'notification-settings',
      ],
    });


  const toggleMutation =
    useMutation({
      mutationFn: ({
        key,
        enabled,
      }) =>
        api.patch(
          '/api/notifications/settings',
          {
            settings: {
              [key]: enabled,
            },
          }
        ),

      onSuccess: async () => {
        hapticNotif(
          'success'
        );

        await refresh();
      },

      onError: () =>
        toast(
          'ذخیره تنظیمات انجام نشد',
          'error'
        ),
    });


  const allMutation =
    useMutation({
      mutationFn: (enabled) =>
        api.patch(
          '/api/notifications/settings/all',
          {
            enabled,
          }
        ),

      onSuccess: async (
        _,
        enabled
      ) => {
        hapticNotif(
          'success'
        );

        toast(
          enabled
            ? 'همه اعلان‌ها فعال شدند'
            : 'همه اعلان‌ها غیرفعال شدند',

          'success'
        );

        await refresh();
      },

      onError: () =>
        toast(
          'تغییر تنظیمات انجام نشد',
          'error'
        ),
    });


  const settings =
    Array.isArray(data)
      ? data
      : [];


  const enabledCount =
    settings.filter(
      (item) =>
        item.enabled
    ).length;


  const allEnabled =
    settings.length > 0 &&
    enabledCount ===
      settings.length;


  const pending =
    toggleMutation.isPending ||
    allMutation.isPending;


  return (
    <>
      <Header
        title="اعلان‌ها"
        subtitle={
          'یادآوری‌ها و اطلاع‌رسانی'
        }
      />

      <main className="page fade-up">
        <section
          className={
            'card card-glow'
          }
          style={{
            padding: 17,

            marginBottom:
              14,

            background:
              'linear-gradient(145deg,rgba(29,78,216,.2),rgba(16,24,39,.95) 52%,rgba(34,211,238,.08))',
          }}
        >
          <div
            style={{
              display: 'flex',

              alignItems:
                'center',

              gap:
                13,
            }}
          >
            <div
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

                boxShadow:
                  'var(--shd-glow)',

                fontSize:
                  24,
              }}
            >
              🔔
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
                مرکز اعلان هامزیار
              </div>

              <div
                style={{
                  fontSize:
                    16.5,

                  fontWeight:
                    900,

                  marginTop:
                    2,
                }}
              >
                {enabledCount} از{' '}

                {settings.length ||
                  0}{' '}

                اعلان فعال
              </div>

              <div
                style={{
                  color:
                    'var(--tx2)',

                  fontSize:
                    10,

                  marginTop:
                    3,
                }}
              >
                فقط پیام‌هایی را دریافت
                کنید که برایتان مهم‌اند.
              </div>
            </div>

            <div
              style={{
                display:
                  'grid',

                width:
                  48,

                height:
                  48,

                placeItems:
                  'center',

                color:
                  allEnabled
                    ? 'var(--ok)'
                    : 'var(--warn)',

                background:
                  allEnabled
                    ? 'rgba(16,185,129,.12)'
                    : 'rgba(245,158,11,.12)',

                borderRadius:
                  '50%',

                fontSize:
                  12,

                fontWeight:
                  900,
              }}
            >
              {settings.length
                ? Math.round(
                    (
                      enabledCount /
                      settings.length
                    ) * 100
                  )
                : 0}
              ٪
            </div>
          </div>
        </section>


        <div
          style={{
            display:
              'flex',

            gap:
              8,

            marginBottom:
              14,
          }}
        >
          <button
            className="btn btn-p"
            style={{
              flex: 1,
            }}
            disabled={
              pending ||
              allEnabled
            }
            onClick={() => {
              haptic();

              allMutation.mutate(
                true
              );
            }}
          >
            فعال‌کردن همه
          </button>

          <button
            className="btn btn-dark"
            style={{
              flex: 1,
            }}
            disabled={
              pending ||
              enabledCount === 0
            }
            onClick={() => {
              haptic();

              allMutation.mutate(
                false
              );
            }}
          >
            خاموش‌کردن همه
          </button>
        </div>


        <div className="sec-title">
          تنظیم جداگانه
        </div>


        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gap: 9,
            }}
          >
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isError ? (
          <div className="empty card">
            دریافت تنظیمات انجام نشد.

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
        ) : settings.length ===
          0 ? (
          <div className="empty card">
            تنظیمی برای اعلان‌ها تعریف
            نشده است.
          </div>
        ) : (
          <section
            className="card"
            style={{
              padding:
                '2px 14px',
            }}
          >
            {settings.map(
              (
                item,
                index
              ) => {
                const [
                  icon,
                  color,
                  soft,
                ] = (
                  TONES[item.key] || [
                    '🔔',

                    '#70A7FF',

                    'rgba(59,130,246,.12)',
                  ]
                );

                return (
                  <div
                    key={item.key}
                    style={{
                      display:
                        'flex',

                      alignItems:
                        'center',

                      minHeight:
                        68,

                      gap:
                        11,

                      padding:
                        '9px 0',

                      borderBottom:
                        index <
                        settings.length -
                          1
                          ? '1px solid var(--bd)'
                          : 0,
                    }}
                  >
                    <span
                      style={{
                        display:
                          'grid',

                        flex:
                          '0 0 42px',

                        height:
                          42,

                        placeItems:
                          'center',

                        color,

                        background:
                          soft,

                        borderRadius:
                          13,

                        fontSize:
                          20,
                      }}
                    >
                      {icon}
                    </span>

                    <div
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

                          fontSize:
                            12.5,
                        }}
                      >
                        {item.label ||
                          'اعلان'}
                      </b>

                      <span
                        style={{
                          display:
                            'block',

                          color:
                            'var(--txm)',

                          fontSize:
                            9.5,

                          marginTop:
                            3,

                          lineHeight:
                            1.5,
                        }}
                      >
                        {item.desc ||
                          ''}
                      </span>
                    </div>

                    <label
                      className="toggle-wrap"
                      aria-label={
                        `تغییر ${
                          item.label
                        }`
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          Boolean(
                            item.enabled
                          )
                        }
                        disabled={
                          pending
                        }
                        onChange={(
                          event
                        ) => {
                          haptic(
                            'light'
                          );

                          toggleMutation
                            .mutate({
                              key:
                                item.key,

                              enabled:
                                event
                                  .target
                                  .checked,
                            });
                        }}
                      />

                      <span className="toggle-sl" />
                    </label>
                  </div>
                );
              }
            )}
          </section>
        )}


        {pending && (
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              gap:
                7,

              marginTop:
                12,

              color:
                'var(--txm)',

              fontSize:
                10,
            }}
          >
            <Spinner size={14} />

            در حال ذخیره تنظیمات...
          </div>
        )}
      </main>
    </>
  );
}
