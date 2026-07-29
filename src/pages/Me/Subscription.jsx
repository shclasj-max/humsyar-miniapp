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
  haptic,
  hapticNotif,
} from '../../lib/telegram';

import {
  useUIStore,
} from '../../stores/uiStore';


const number = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
};


const money = (value) => {
  const formatted =
    new Intl.NumberFormat(
      'fa-IR'
    ).format(
      number(value)
    );

  return `${formatted} تومان`;
};


export default function Subscription() {
  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    requestResult,
    setRequestResult,
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
      'sub-status',
    ],

    queryFn: () =>
      api
        .get(
          '/api/subscription/status'
        )
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      3 * 60 * 1000,
  });


  const buyMutation =
    useMutation({
      mutationFn: (
        planId
      ) =>
        api.post(
          '/api/subscription/buy',
          {
            plan_id:
              planId,
          }
        ),

      onSuccess: async (
        response
      ) => {
        hapticNotif(
          'success'
        );

        setRequestResult(
          response.data
        );

        setSelected(null);

        toast(
          'درخواست خرید با موفقیت ثبت شد ✅',
          'success'
        );

        await queryClient
          .invalidateQueries({
            queryKey:
              ['sub-status'],
          });
      },

      onError: (error) => {
        hapticNotif('error');

        toast(
          error?.response
            ?.data
            ?.detail ||
            'ثبت درخواست خرید انجام نشد',

          'error'
        );
      },
    });


  const plans =
    Array.isArray(
      data?.plans
    )
      ? data.plans
      : [];


  const pending =
    Boolean(
      data?.has_pending_payment
    );


  const active =
    Boolean(
      data?.active
    );


  const daysLeft =
    number(
      data?.days_left
    );


  const confirmBuy = () => {
    if (
      !selected ||
      pending
    ) {
      return;
    }

    const plan =
      plans.find(
        (item) =>
          item.id === selected
      );

    const accepted =
      window.confirm(
        `درخواست خرید «${
          plan?.name ||
          'اشتراک'
        }» با مبلغ ${
          money(plan?.price)
        } ثبت شود؟`
      );

    if (accepted) {
      buyMutation.mutate(
        selected
      );
    }
  };


  return (
    <>
      <Header
        title="اشتراک ویژه"
        subtitle={
          'پلن‌ها و دسترسی کامل'
        }
      />

      <main className="page fade-up">
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gap: 10,
            }}
          >
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isError ? (
          <div className="empty card">
            دریافت اطلاعات اشتراک انجام
            نشد.

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
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 14,
            }}
          >
            <section
              className={
                'card card-glow'
              }
              style={{
                padding:
                  19,

                background:
                  active
                    ? 'linear-gradient(145deg,rgba(16,185,129,.16),rgba(16,24,39,.95) 55%,rgba(34,211,238,.07))'
                    : 'linear-gradient(145deg,rgba(29,78,216,.22),rgba(16,24,39,.95) 55%,rgba(139,92,246,.08))',
              }}
            >
              <div
                style={{
                  display: 'flex',

                  alignItems:
                    'center',

                  gap:
                    14,
                }}
              >
                <div
                  style={{
                    display:
                      'grid',

                    width:
                      62,

                    height:
                      62,

                    placeItems:
                      'center',

                    borderRadius:
                      19,

                    background:
                      active
                        ? 'rgba(16,185,129,.14)'
                        : 'var(--grad-brand)',

                    boxShadow:
                      active
                        ? '0 8px 26px rgba(16,185,129,.18)'
                        : 'var(--shd-glow)',

                    fontSize:
                      29,
                  }}
                >
                  {active
                    ? '💎'
                    : '🚀'}
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
                    {active
                      ? 'اشتراک فعال شما'
                      : 'ارتقای حساب هامزیار'}
                  </div>

                  <h2
                    style={{
                      color:
                        active
                          ? 'var(--ok)'
                          : 'var(--tx)',

                      fontSize:
                        18,

                      fontWeight:
                        900,

                      marginTop:
                        2,
                    }}
                  >
                    {active
                      ? data
                          ?.plan_name ||
                        'اشتراک ویژه'
                      : 'دسترسی کامل به امکانات'}
                  </h2>

                  <div
                    style={{
                      color:
                        'var(--tx2)',

                      fontSize:
                        10.5,

                      marginTop:
                        4,
                    }}
                  >
                    {active
                      ? `${daysLeft} روز باقی‌مانده ${
                          data?.expires
                            ? `• تا ${data.expires}`
                            : ''
                        }`
                      : 'تمرین، منابع، هوش مصنوعی و قابلیت‌های ویژه'}
                  </div>
                </div>

                {active && (
                  <span className="badge b-grn">
                    فعال
                  </span>
                )}
              </div>

              {active && (
                <div
                  style={{
                    marginTop:
                      14,
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',

                      justifyContent:
                        'space-between',

                      marginBottom:
                        6,

                      color:
                        'var(--txm)',

                      fontSize:
                        9.5,
                    }}
                  >
                    <span>
                      زمان باقی‌مانده
                    </span>

                    <span>
                      {daysLeft} روز
                    </span>
                  </div>

                  <div className="pbar">
                    <div
                      className="pbar-f"
                      style={{
                        width:
                          `${
                            Math.min(
                              100,

                              (
                                daysLeft /
                                Math.max(
                                  daysLeft,
                                  30
                                )
                              ) * 100
                            )
                          }%`,

                        background:
                          'var(--ok)',
                      }}
                    />
                  </div>
                </div>
              )}
            </section>


            {pending && (
              <section
                className="card"
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    11,

                  borderColor:
                    'rgba(245,158,11,.28)',

                  background:
                    'linear-gradient(145deg,rgba(245,158,11,.09),rgba(16,24,39,.95))',
                }}
              >
                <span
                  style={{
                    fontSize:
                      25,
                  }}
                >
                  ⏳
                </span>

                <div>
                  <b
                    style={{
                      color:
                        'var(--warn)',

                      fontSize:
                        12.5,
                    }}
                  >
                    درخواست شما در انتظار
                    بررسی است
                  </b>

                  <div
                    style={{
                      color:
                        'var(--txm)',

                      fontSize:
                        9.5,

                      lineHeight:
                        1.6,

                      marginTop:
                        3,
                    }}
                  >
                    پس از بررسی رسید توسط
                    مدیریت، اشتراک به‌صورت
                    خودکار فعال می‌شود.
                  </div>
                </div>
              </section>
            )}


            {requestResult && (
              <section
                className="card"
                style={{
                  borderColor:
                    'rgba(16,185,129,.25)',
                }}
              >
                <div className="sec-title">
                  ✅ درخواست ثبت شد
                </div>

                <div
                  style={{
                    color:
                      'var(--tx2)',

                    fontSize:
                      11,

                    lineHeight:
                      1.8,
                  }}
                >
                  {requestResult.message ||
                    'درخواست خرید برای مدیریت ارسال شد.'}
                </div>

                <div
                  style={{
                    display:
                      'flex',

                    flexWrap:
                      'wrap',

                    gap:
                      6,

                    marginTop:
                      9,
                  }}
                >
                  <span className="badge b-acc">
                    {requestResult
                      .plan_name}
                  </span>

                  <span className="badge b-grn">
                    {money(
                      requestResult.price
                    )}
                  </span>

                  {requestResult
                    .payment_id && (
                    <span className="badge b-gray">
                      شناسه{' '}

                      {
                        requestResult
                          .payment_id
                      }
                    </span>
                  )}
                </div>
              </section>
            )}


            <section>
              <div className="sec-title">
                ✨ امکانات اشتراک ویژه
              </div>

              <div className="grid2">
                {[
                  [
                    '🧪',

                    'تمرین نامحدود',

                    'بانک سؤال و آزمون',
                  ],

                  [
                    '🤖',

                    'هوشیار',

                    'دستیار آموزشی',
                  ],

                  [
                    '📚',

                    'همه منابع',

                    'جزوه و رفرنس',
                  ],

                  [
                    '📊',

                    'تحلیل پیشرفته',

                    'آمار و نقاط ضعف',
                  ],
                ].map(
                  ([
                    icon,
                    title,
                    description,
                  ]) => (
                    <div
                      key={title}
                      className="card"
                      style={{
                        padding:
                          12,
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            21,
                        }}
                      >
                        {icon}
                      </div>

                      <b
                        style={{
                          display:
                            'block',

                          fontSize:
                            11.5,

                          marginTop:
                            5,
                        }}
                      >
                        {title}
                      </b>

                      <div
                        style={{
                          color:
                            'var(--txm)',

                          fontSize:
                            9,

                          marginTop:
                            2,
                        }}
                      >
                        {description}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>


            <section>
              <div className="sec-title">
                💳 انتخاب پلن
              </div>

              {plans.length === 0 ? (
                <div className="empty card">
                  در حال حاضر پلن فعالی
                  ارائه نشده است.
                </div>
              ) : (
                <div
                  style={{
                    display:
                      'grid',

                    gap:
                      9,
                  }}
                >
                  {plans.map(
                    (
                      plan,
                      index
                    ) => {
                      const chosen =
                        selected ===
                        plan.id;

                      const popular =
                        plans.length >
                          1 &&
                        index ===
                          Math.floor(
                            plans.length /
                              2
                          );

                      return (
                        <button
                          type="button"
                          key={plan.id}
                          className={
                            'card card-tap'
                          }
                          onClick={() => {
                            haptic();

                            setSelected(
                              plan.id
                            );
                          }}
                          disabled={
                            pending ||
                            buyMutation
                              .isPending
                          }
                          style={{
                            width:
                              '100%',

                            padding:
                              15,

                            textAlign:
                              'right',

                            borderColor:
                              chosen
                                ? 'var(--acc)'
                                : popular
                                  ? 'rgba(139,92,246,.3)'
                                  : 'var(--bd)',

                            boxShadow:
                              chosen
                                ? 'var(--shd-glow)'
                                : 'var(--shd-1)',

                            background:
                              chosen
                                ? 'linear-gradient(145deg,rgba(59,130,246,.14),rgba(16,24,39,.96))'
                                : undefined,
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',

                              alignItems:
                                'center',

                              gap:
                                11,
                            }}
                          >
                            <span
                              style={{
                                display:
                                  'grid',

                                width:
                                  46,

                                height:
                                  46,

                                placeItems:
                                  'center',

                                borderRadius:
                                  14,

                                background:
                                  chosen
                                    ? 'var(--grad-brand)'
                                    : 'var(--elev)',

                                fontSize:
                                  21,
                              }}
                            >
                              {chosen
                                ? '✓'
                                : '💠'}
                            </span>

                            <span
                              style={{
                                flex:
                                  1,
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    'flex',

                                  alignItems:
                                    'center',

                                  gap:
                                    6,
                                }}
                              >
                                <b
                                  style={{
                                    fontSize:
                                      13.5,
                                  }}
                                >
                                  {plan.name ||
                                    'پلن اشتراک'}
                                </b>

                                {popular && (
                                  <span className="badge b-pur">
                                    پیشنهادی
                                  </span>
                                )}
                              </span>

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
                                }}
                              >
                                {number(
                                  plan.days
                                )}{' '}

                                روز دسترسی کامل
                              </span>
                            </span>

                            <span
                              style={{
                                color:
                                  chosen
                                    ? 'var(--acc2)'
                                    : 'var(--tx)',

                                fontSize:
                                  13,

                                fontWeight:
                                  900,
                              }}
                            >
                              {money(
                                plan.price
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>


            <button
              className={
                'btn btn-p btn-full'
              }
              disabled={
                !selected ||
                pending ||
                buyMutation.isPending
              }
              onClick={
                confirmBuy
              }
            >
              {buyMutation.isPending ? (
                <Spinner size={16} />
              ) : pending ? (
                'درخواست در انتظار بررسی است'
              ) : selected ? (
                'ثبت درخواست خرید'
              ) : (
                'یک پلن انتخاب کنید'
              )}
            </button>


            <div
              style={{
                padding:
                  '0 10px',

                color:
                  'var(--txm)',

                fontSize:
                  9.5,

                lineHeight:
                  1.8,

                textAlign:
                  'center',
              }}
            >
              🔒 فعال‌سازی اشتراک پس از
              تأیید پرداخت توسط مدیریت
              انجام می‌شود.
            </div>
          </div>
        )}
      </main>
    </>
  );
}
