import { useState } from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import api from '../../lib/api';
import Header from '../../components/layout/Header';

import {
  Spinner,
} from '../../components/shared/Loading';

import {
  TicketsSkeleton,
  SkRowList,
} from '../../components/shared/skeletons';

import {
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


const statusInfo = (status) => {
  if (status === 'closed') {
    return {
      label:
        'بسته‌شده',

      badge:
        'b-gray',
    };
  }

  return {
    label:
      'باز',

    badge:
      'b-grn',
  };
};


export default function Tickets() {
  const [
    view,
    setView,
  ] = useState('list');

  const [
    selectedId,
    setSelectedId,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState({
    subject: '',
    message: '',
  });

  const [
    reply,
    setReply,
  ] = useState('');

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
      'tickets',
    ],

    queryFn: () =>
      api
        .get('/api/tickets')
        .then(
          (response) =>
            response.data
        ),
  });


  const {
    data: detail,

    isLoading:
      detailLoading,

    isError:
      detailError,
  } = useQuery({
    queryKey: [
      'ticket',
      selectedId,
    ],

    queryFn: () =>
      api
        .get(
          `/api/tickets/${selectedId}`
        )
        .then(
          (response) =>
            response.data
              ?.ticket
        ),

    enabled:
      selectedId != null &&
      view === 'detail',
  });


  const refresh = async () => {
    await Promise.all([
      queryClient
        .invalidateQueries({
          queryKey:
            ['tickets'],
        }),

      queryClient
        .invalidateQueries({
          queryKey: [
            'ticket',
            selectedId,
          ],
        }),

      queryClient
        .invalidateQueries({
          queryKey:
            ['profile'],
        }),
    ]);
  };


  const createMutation =
    useMutation({
      mutationFn: () =>
        api.post(
          '/api/tickets',
          {
            subject:
              form.subject,

            message:
              form.message.trim(),
          }
        ),

      onSuccess: async (
        response
      ) => {
        hapticNotif(
          'success'
        );

        toast(
          'تیکت با موفقیت ثبت شد ✅',
          'success'
        );

        setForm({
          subject: '',
          message: '',
        });

        setSelectedId(
          response.data
            ?.ticket_id
        );

        setView('detail');

        await refresh();
      },

      onError: (error) =>
        toast(
          error?.response
            ?.data
            ?.detail ||
            'ثبت تیکت انجام نشد',

          'error'
        ),
    });


  const replyMutation =
    useMutation({
      mutationFn: () =>
        api.post(
          `/api/tickets/${selectedId}/reply`,

          {
            message:
              reply.trim(),
          }
        ),

      onSuccess: async () => {
        hapticNotif(
          'success'
        );

        setReply('');

        toast(
          'پاسخ ارسال شد ✅',
          'success'
        );

        await refresh();
      },

      onError: (error) =>
        toast(
          error?.response
            ?.data
            ?.detail ||
            'ارسال پاسخ انجام نشد',

          'error'
        ),
    });


  const tickets =
    Array.isArray(
      data?.tickets
    )
      ? data.tickets
      : [];


  const subjects =
    Array.isArray(
      data?.subjects
    )
      ? data.subjects
      : [];


  const openCount =
    tickets.filter(
      (item) =>
        item.status !==
        'closed'
    ).length;


  const ticket =
    detail || {};


  if (view === 'new') {
    const valid =
      form.subject &&
      form.message
        .trim()
        .length >= 10;

    return (
      <>
        <Header
          title="تیکت جدید"
          subtitle={
            'با پشتیبانی در ارتباط باشید'
          }
          onBack={() =>
            setView('list')
          }
        />

        <main className="page fade-up">
          <section
            className={
              'card card-glow hero-card'
            }
            style={{
              marginBottom:
                13,
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
                    48,

                  height:
                    48,

                  placeItems:
                    'center',

                  borderRadius:
                    15,

                  background:
                    'var(--grad-brand)',

                  fontSize:
                    23,
                }}
              >
                🎫
              </span>

              <div>
                <b>
                  چطور می‌تونیم کمک کنیم؟
                </b>

                <div
                  style={{
                    color:
                      'var(--txm)',

                    fontSize:
                      10,

                    marginTop:
                      3,
                  }}
                >
                  موضوع را انتخاب و مشکل
                  را با جزئیات توضیح دهید.
                </div>
              </div>
            </div>
          </section>


          <section
            className="card"
            style={{
              display: 'grid',
              gap: 10,
            }}
          >
            <label className="fld-label">
              موضوع
            </label>

            <select
              className="inp"
              value={
                form.subject
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  subject:
                    event.target
                      .value,
                })
              }
            >
              <option value="">
                انتخاب موضوع
              </option>

              {subjects.map(
                (subject) => (
                  <option
                    key={subject}
                    value={subject}
                  >
                    {subject}
                  </option>
                )
              )}
            </select>


            <label className="fld-label">
              شرح درخواست
            </label>

            <textarea
              className="inp"
              rows={6}
              maxLength={2000}
              value={
                form.message
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  message:
                    event.target
                      .value,
                })
              }
              placeholder={
                'مشکل یا سؤال خود را ' +
                'دقیق بنویسید...'
              }
            />

            <div
              style={{
                color:
                  form.message
                    .trim()
                    .length >= 10
                    ? 'var(--ok)'
                    : 'var(--txm)',

                fontSize:
                  9,
              }}
            >
              {form.message
                .trim()
                .length}
              /10 حداقل کاراکتر
            </div>
          </section>


          <button
            className={
              'btn btn-p btn-full'
            }
            style={{
              marginTop:
                13,
            }}
            disabled={
              !valid ||
              createMutation
                .isPending
            }
            onClick={() =>
              createMutation.mutate()
            }
          >
            {createMutation
              .isPending ? (
              <Spinner size={16} />
            ) : (
              'ارسال تیکت'
            )}
          </button>
        </main>
      </>
    );
  }


  if (view === 'detail') {
    const status =
      statusInfo(
        ticket.status
      );

    const replies =
      Array.isArray(
        ticket.replies
      )
        ? ticket.replies
        : [];

    return (
      <>
        <Header
          title={`تیکت #${
            selectedId || '—'
          }`}
          subtitle={
            ticket.subject ||
            'جزئیات گفت‌وگو'
          }
          onBack={() => {
            setSelectedId(null);
            setView('list');
          }}
        />

        <main className="page fade-up">
          {detailLoading ? (
            <SkRowList
              n={2}
              icon={38}
              lines={2}
            />
          ) : detailError ? (
            <div className="empty card">
              دریافت تیکت انجام نشد.
            </div>
          ) : (
            <div
              style={{
                display:
                  'grid',

                gap:
                  11,
              }}
            >
              <section
                className="card"
                style={{
                  borderColor:
                    ticket.status ===
                    'closed'
                      ? 'var(--bd)'
                      : 'rgba(16,185,129,.25)',
                }}
              >
                <div
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'space-between',

                    gap:
                      8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color:
                          'var(--txm)',

                        fontSize:
                          9.5,
                      }}
                    >
                      موضوع درخواست
                    </div>

                    <b
                      style={{
                        display:
                          'block',

                        fontSize:
                          13.5,

                        marginTop:
                          3,
                      }}
                    >
                      {ticket.subject ||
                        'بدون موضوع'}
                    </b>
                  </div>

                  <span
                    className={`badge ${
                      status.badge
                    }`}
                  >
                    {status.label}
                  </span>
                </div>

                <div
                  style={{
                    marginTop:
                      11,

                    padding:
                      '10px 11px',

                    color:
                      'var(--tx2)',

                    background:
                      'rgba(100,116,139,.08)',

                    borderRadius:
                      12,

                    fontSize:
                      11,

                    lineHeight:
                      1.8,
                  }}
                >
                  {ticket.message ||
                    'پیامی ثبت نشده است.'}
                </div>
              </section>


              <div className="sec-title">
                💬 گفت‌وگو
              </div>


              {replies.length === 0 ? (
                <div className="empty card">
                  هنوز پاسخی ثبت نشده است.
                </div>
              ) : (
                replies.map(
                  (
                    item,
                    index
                  ) => {
                    const mine =
                      item.sender ===
                      'user';

                    return (
                      <div
                        key={`${
                          item.at
                        }-${index}`}
                        style={{
                          display:
                            'flex',

                          justifyContent:
                            mine
                              ? 'flex-start'
                              : 'flex-end',
                        }}
                      >
                        <div
                          style={{
                            maxWidth:
                              '88%',

                            padding:
                              '10px 12px',

                            color:
                              'var(--tx)',

                            background:
                              mine
                                ? 'rgba(59,130,246,.14)'
                                : 'rgba(16,185,129,.12)',

                            border:
                              `1px solid ${
                                mine
                                  ? 'var(--bdg)'
                                  : 'rgba(16,185,129,.22)'
                              }`,

                            borderRadius:
                              mine
                                ? '15px 15px 4px 15px'
                                : '15px 15px 15px 4px',

                            fontSize:
                              11,

                            lineHeight:
                              1.8,
                          }}
                        >
                          <div>
                            {item.text}
                          </div>

                          <div
                            style={{
                              color:
                                'var(--txm)',

                              fontSize:
                                8.5,

                              marginTop:
                                4,
                            }}
                          >
                            {mine
                              ? 'شما'
                              : 'پشتیبانی'}

                            {' • '}

                            {item.at ||
                              ''}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              )}


              {ticket.status !==
                'closed' ? (
                <section className="card">
                  <textarea
                    className="inp"
                    rows={3}
                    maxLength={1000}
                    value={reply}
                    onChange={(event) =>
                      setReply(
                        event.target
                          .value
                      )
                    }
                    placeholder={
                      'پاسخ خود را بنویسید...'
                    }
                  />

                  <button
                    className={
                      'btn btn-p btn-full'
                    }
                    style={{
                      marginTop:
                        9,
                    }}
                    disabled={
                      !reply.trim() ||
                      replyMutation
                        .isPending
                    }
                    onClick={() =>
                      replyMutation
                        .mutate()
                    }
                  >
                    {replyMutation
                      .isPending ? (
                      <Spinner
                        size={15}
                      />
                    ) : (
                      'ارسال پاسخ'
                    )}
                  </button>
                </section>
              ) : (
                <div
                  className="card"
                  style={{
                    color:
                      'var(--txm)',

                    fontSize:
                      10.5,

                    textAlign:
                      'center',
                  }}
                >
                  🔒 این تیکت بسته شده و
                  امکان ارسال پاسخ ندارد.
                </div>
              )}
            </div>
          )}
        </main>
      </>
    );
  }


  return (
    <>
      <Header
        title="پشتیبانی"
        subtitle={
          'تیکت‌ها و گفت‌وگوها'
        }
      />

      <main className="page fade-up">
        <section
          className={
            'card card-glow hero-card'
          }
          style={{
            marginBottom:
              14,
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
              🛟
            </span>

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
                مرکز پشتیبانی هامزیار
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
                {openCount} تیکت باز
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
                درخواست‌ها و پاسخ‌های
                پشتیبانی را اینجا پیگیری
                کنید.
              </div>
            </div>
          </div>
        </section>


        <button
          className={
            'btn btn-p btn-full'
          }
          style={{
            marginBottom:
              14,
          }}
          onClick={() =>
            setView('new')
          }
        >
          ＋ ایجاد تیکت جدید
        </button>


        <div className="sec-title">
          تیکت‌های من
        </div>


        {isLoading ? (
          <TicketsSkeleton />
        ) : isError ? (
          <div className="empty card">
            <div className="empty__ic">
              🌐
            </div>

            <div>
              دریافت تیکت‌ها انجام نشد.
            </div>

            <button
              className="btn btn-p"
              onClick={() =>
                refetch()
              }
            >
              تلاش دوباره
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty card">
            هنوز تیکتی ثبت نکرده‌اید.
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
            {tickets.map(
              (item) => {
                const status =
                  statusInfo(
                    item.status
                  );

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      'card card-tap'
                    }
                    onClick={() => {
                      setSelectedId(
                        item.id
                      );

                      setView(
                        'detail'
                      );
                    }}
                    style={{
                      display:
                        'flex',

                      alignItems:
                        'center',

                      width:
                        '100%',

                      gap:
                        11,

                      padding:
                        13,

                      textAlign:
                        'right',
                    }}
                  >
                    <span
                      style={{
                        display:
                          'grid',

                        width:
                          44,

                        height:
                          44,

                        placeItems:
                          'center',

                        borderRadius:
                          14,

                        background:
                          item.status ===
                          'closed'
                            ? 'rgba(100,116,139,.12)'
                            : 'rgba(16,185,129,.12)',

                        fontSize:
                          20,
                      }}
                    >
                      🎫
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
                        {item.subject ||
                          'بدون موضوع'}
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
                        }}
                      >
                        #{item.id}

                        {' • '}

                        {item.created_at ||
                          '—'}

                        {' • '}

                        {number(
                          item.reply_count
                        )}{' '}

                        پاسخ
                      </span>
                    </span>

                    <span
                      className={`badge ${
                        status.badge
                      }`}
                    >
                      {status.label}
                    </span>

                    <span
                      style={{
                        color:
                          'var(--txm)',
                      }}
                    >
                      ←
                    </span>
                  </button>
                );
              }
            )}
          </section>
        )}
      </main>
    </>
  );
}
