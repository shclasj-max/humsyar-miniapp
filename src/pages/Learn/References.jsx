import { useState } from 'react';

import {
  useMutation,
  useQuery,
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


export default function References() {
  const [
    view,
    setView,
  ] = useState('subjects');

  const [
    subject,
    setSubject,
  ] = useState(null);

  const [
    book,
    setBook,
  ] = useState(null);

  const [
    language,
    setLanguage,
  ] = useState('fa');

  const toast = useUIStore(
    (state) => state.toast
  );


  const {
    data: subjects = [],
    isLoading: subjectsLoading,
    isError: subjectsError,
    refetch,
  } = useQuery({
    queryKey: [
      'reference-subjects',
    ],

    queryFn: () =>
      api
        .get(
          '/api/references/subjects'
        )
        .then(
          (response) =>
            response.data
              ?.subjects || []
        ),

    staleTime:
      10 * 60 * 1000,
  });


  const {
    data: booksData,
    isLoading: booksLoading,
  } = useQuery({
    queryKey: [
      'reference-books',
      subject?.id,
    ],

    queryFn: () =>
      api
        .get(
          `/api/references/books/${
            subject.id
          }`
        )
        .then(
          (response) =>
            response.data
        ),

    enabled:
      view === 'books' &&
      Boolean(subject?.id),
  });


  const {
    data: filesData,
    isLoading: filesLoading,
  } = useQuery({
    queryKey: [
      'reference-files',
      book?.id,
    ],

    queryFn: () =>
      api
        .get(
          `/api/references/files/${
            book.id
          }`
        )
        .then(
          (response) =>
            response.data
        ),

    enabled:
      view === 'files' &&
      Boolean(book?.id),
  });


  const downloadMutation =
    useMutation({
      mutationFn: (id) =>
        api.post(
          `/api/references/download/${id}`
        ),

      onSuccess: (
        response
      ) => {
        hapticNotif(
          'success'
        );

        toast(
          `جلد ${
            response.data
              ?.volume || ''
          } در ربات ارسال شد ✅`,

          'success'
        );
      },

      onError: (error) =>
        toast(
          error?.response
            ?.data
            ?.detail ||
            'ارسال فایل انجام نشد',

          'error'
        ),
    });


  const books =
    Array.isArray(
      booksData?.books
    )
      ? booksData.books
      : [];


  const faFiles =
    Array.isArray(
      filesData?.fa_files
    )
      ? filesData.fa_files
      : [];


  const enFiles =
    Array.isArray(
      filesData?.en_files
    )
      ? filesData.en_files
      : [];


  const files =
    language === 'fa'
      ? faFiles
      : enFiles;


  const back = () => {
    if (view === 'files') {
      setBook(null);
      setView('books');

    } else if (
      view === 'books'
    ) {
      setSubject(null);
      setView('subjects');
    }
  };


  const title =
    view === 'files'
      ? filesData
          ?.book
          ?.name ||
        book?.name ||
        'جلدهای کتاب'

      : view === 'books'
        ? booksData
            ?.subject
            ?.name ||
          subject?.name ||
          'کتاب‌ها'

        : 'رفرنس‌های درسی';


  return (
    <>
      <Header
        title={title}
        subtitle={
          'کتاب‌های مرجع فارسی و لاتین'
        }
        back={
          view !== 'subjects'
        }
        onBack={
          view !== 'subjects'
            ? back
            : undefined
        }
      />

      <main className="page fade-up">
        {view === 'subjects' && (
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
                'linear-gradient(145deg,rgba(29,78,216,.2),rgba(16,24,39,.95) 55%,rgba(139,92,246,.09))',
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
                    'linear-gradient(135deg,#1D4ED8,#7C3AED)',

                  fontSize:
                    25,
                }}
              >
                📘
              </span>

              <div>
                <b
                  style={{
                    fontSize:
                      16.5,
                  }}
                >
                  کتابخانه رفرنس
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
                  نسخه‌های فارسی و انگلیسی
                  منابع معتبر پزشکی
                </div>
              </div>
            </div>
          </section>
        )}


        {view === 'subjects' ? (
          subjectsLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : subjectsError ? (
            <div className="empty card">
              دریافت درس‌ها انجام نشد.

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
            Array.isArray(
              subjects
            ) &&
            subjects.length === 0
          ) ? (
            <div className="empty card">
              هنوز رفرنسی ثبت نشده است.
            </div>
          ) : (
            <section className="grid2">
              {subjects.map(
                (
                  item,
                  index
                ) => (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      'card card-tap pop-in'
                    }
                    onClick={() => {
                      haptic();

                      setSubject(item);

                      setView(
                        'books'
                      );
                    }}
                    style={{
                      padding:
                        16,

                      textAlign:
                        'center',

                      animationDelay:
                        `${
                          index * 35
                        }ms`,
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

                        margin:
                          '0 auto 8px',

                        borderRadius:
                          16,

                        background:
                          'rgba(59,130,246,.12)',

                        fontSize:
                          24,
                      }}
                    >
                      🩺
                    </span>

                    <b
                      style={{
                        fontSize:
                          12.5,
                      }}
                    >
                      {item.name ||
                        'درس'}
                    </b>

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
                      {Number(
                        item.book_count
                      ) || 0}{' '}

                      کتاب
                    </div>
                  </button>
                )
              )}
            </section>
          )
        ) : view === 'books' ? (
          booksLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : books.length === 0 ? (
            <div className="empty card">
              کتابی برای این درس ثبت نشده
              است.
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
              {books.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={
                    'card card-tap'
                  }
                  onClick={() => {
                    setBook(item);

                    setLanguage(
                      item.fa_count
                        ? 'fa'
                        : 'en'
                    );

                    setView(
                      'files'
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
                        46,

                      height:
                        46,

                      placeItems:
                        'center',

                      borderRadius:
                        14,

                      background:
                        'rgba(139,92,246,.13)',

                      fontSize:
                        22,
                    }}
                  >
                    📕
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
                      {item.name ||
                        'کتاب'}
                    </b>

                    <span
                      style={{
                        display:
                          'flex',

                        gap:
                          5,

                        marginTop:
                          5,
                      }}
                    >
                      <span className="badge b-acc">
                        🇮🇷{' '}

                        {Number(
                          item.fa_count
                        ) || 0}{' '}

                        جلد
                      </span>

                      <span className="badge b-pur">
                        🇬🇧{' '}

                        {Number(
                          item.en_count
                        ) || 0}{' '}

                        جلد
                      </span>
                    </span>
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
              ))}
            </section>
          )
        ) : filesLoading ? (
          <SkeletonCard />
        ) : (
          <>
            <section
              className="card"
              style={{
                marginBottom:
                  12,
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
                      45,

                    height:
                      45,

                    placeItems:
                      'center',

                    borderRadius:
                      14,

                    background:
                      'var(--acc-soft)',

                    fontSize:
                      22,
                  }}
                >
                  📖
                </span>

                <div>
                  <b>
                    {filesData
                      ?.book
                      ?.name ||
                      book?.name}
                  </b>

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
                    {faFiles.length +
                      enFiles.length}{' '}

                    فایل در دسترس
                  </div>
                </div>
              </div>
            </section>


            <div className="tab-bar">
              <button
                className="tab-btn"
                disabled={
                  !faFiles.length
                }
                onClick={() =>
                  setLanguage('fa')
                }
                style={{
                  color:
                    language === 'fa'
                      ? '#fff'
                      : 'var(--tx2)',

                  background:
                    language === 'fa'
                      ? 'var(--grad-brand)'
                      : 'transparent',
                }}
              >
                🇮🇷 فارسی (
                {faFiles.length})
              </button>

              <button
                className="tab-btn"
                disabled={
                  !enFiles.length
                }
                onClick={() =>
                  setLanguage('en')
                }
                style={{
                  color:
                    language === 'en'
                      ? '#fff'
                      : 'var(--tx2)',

                  background:
                    language === 'en'
                      ? 'var(--grad-brand)'
                      : 'transparent',
                }}
              >
                🇬🇧 انگلیسی (
                {enFiles.length})
              </button>
            </div>


            {files.length === 0 ? (
              <div className="empty card">
                فایلی برای این زبان موجود
                نیست.
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
                {files.map(
                  (
                    item,
                    index
                  ) => (
                    <article
                      key={item.id}
                      className={
                        'card pop-in'
                      }
                      style={{
                        padding:
                          13,

                        animationDelay:
                          `${
                            index *
                            35
                          }ms`,
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
                              48,

                            height:
                              48,

                            placeItems:
                              'center',

                            borderRadius:
                              15,

                            background:
                              language ===
                              'fa'
                                ? 'rgba(16,185,129,.12)'
                                : 'rgba(139,92,246,.13)',

                            fontSize:
                              22,
                          }}
                        >
                          {language ===
                          'fa'
                            ? '🇮🇷'
                            : '🇬🇧'}
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
                                12.5,
                            }}
                          >
                            جلد{' '}

                            {Number(
                              item.volume
                            ) ||
                              index +
                                1}
                          </b>

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
                            {Number(
                              item.downloads
                            ) || 0}{' '}

                            دانلود
                          </div>

                          {item.description && (
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
                              {
                                item.description
                              }
                            </div>
                          )}
                        </div>

                        <button
                          className={
                            'btn btn-p'
                          }
                          style={{
                            minHeight:
                              35,

                            padding:
                              '6px 10px',

                            fontSize:
                              10,
                          }}
                          disabled={
                            downloadMutation
                              .isPending
                          }
                          onClick={() =>
                            downloadMutation
                              .mutate(
                                item.id
                              )
                          }
                        >
                          {downloadMutation
                            .isPending ? (
                            <Spinner
                              size={13}
                            />
                          ) : (
                            'ارسال به ربات'
                          )}
                        </button>
                      </div>
                    </article>
                  )
                )}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
