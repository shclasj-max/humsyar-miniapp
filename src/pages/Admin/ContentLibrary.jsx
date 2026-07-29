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
  hapticNotif,
} from '../../lib/telegram';

import {
  useUIStore,
} from '../../stores/uiStore';


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


const number = (value) =>
  Math.max(
    0,
    Number(value) || 0
  );


function Empty({
  children,
}) {
  return (
    <div className="empty card">
      {children}
    </div>
  );
}


function DeleteButton({
  pending,
  onClick,
}) {
  return (
    <button
      type="button"
      className="btn btn-d"
      style={{
        minHeight: 33,
        padding: '5px 9px',
      }}
      disabled={pending}
      onClick={onClick}
    >
      🗑
    </button>
  );
}


/* مدیریت علوم پایه */

export function BasicScienceAdmin() {
  const [
    term,
    setTerm,
  ] = useState('ترم ۱');

  const [
    lesson,
    setLesson,
  ] = useState(null);

  const [
    session,
    setSession,
  ] = useState(null);

  const [
    lessonForm,
    setLessonForm,
  ] = useState({
    name: '',
    teacher: '',
  });

  const [
    sessionForm,
    setSessionForm,
  ] = useState({
    number: 1,
    topic: '',
    teacher: '',
  });

  const [
    upload,
    setUpload,
  ] = useState({
    type: 'pdf',
    description: '',
    extra_info: '',
    file: null,
  });

  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();


  const {
    data: terms = [
      'ترم ۱',
      'ترم ۲',
      'ترم ۳',
      'ترم ۴',
      'ترم ۵',
    ],
  } = useQuery({
    queryKey: [
      'bs-admin-terms',
    ],

    queryFn: () =>
      api
        .get(
          '/api/content/basic-science/terms'
        )
        .then(
          (response) =>
            response.data
              ?.terms || []
        ),
  });


  const {
    data: lessons = [],
    isLoading: lessonsLoading,
  } = useQuery({
    queryKey: [
      'bs-admin-lessons',
      term,
    ],

    queryFn: () =>
      api
        .get(
          '/api/content/basic-science/lessons',

          {
            params: {
              term,
            },
          }
        )
        .then(
          (response) =>
            response.data
              ?.lessons || []
        ),
  });


  const {
    data: sessions = [],
    isLoading: sessionsLoading,
  } = useQuery({
    queryKey: [
      'bs-admin-sessions',
      lesson?.id,
    ],

    queryFn: () =>
      api
        .get(
          `/api/content/basic-science/lessons/${lesson.id}/sessions`
        )
        .then(
          (response) =>
            response.data
              ?.sessions || []
        ),

    enabled:
      Boolean(lesson?.id),
  });


  const {
    data: content = [],
    isLoading: contentLoading,
  } = useQuery({
    queryKey: [
      'bs-admin-content',
      session?.id,
    ],

    queryFn: () =>
      api
        .get(
          `/api/content/basic-science/sessions/${session.id}/content`
        )
        .then(
          (response) =>
            response.data
              ?.content || []
        ),

    enabled:
      Boolean(session?.id),
  });


  const refresh = async () => {
    await Promise.all([
      queryClient
        .invalidateQueries({
          queryKey: [
            'bs-admin-lessons',
          ],
        }),

      queryClient
        .invalidateQueries({
          queryKey: [
            'bs-admin-sessions',
          ],
        }),

      queryClient
        .invalidateQueries({
          queryKey: [
            'bs-admin-content',
          ],
        }),
    ]);
  };


  const mutation = useMutation({
    mutationFn: async ({
      type,
      id,
    }) => {
      if (
        type === 'lesson-add'
      ) {
        return api.post(
          '/api/content/basic-science/lessons',

          {
            term,

            ...lessonForm,
          }
        );
      }

      if (
        type === 'lesson-delete'
      ) {
        return api.delete(
          `/api/content/basic-science/lessons/${id}`
        );
      }

      if (
        type === 'session-add'
      ) {
        return api.post(
          `/api/content/basic-science/lessons/${lesson.id}/sessions`,

          {
            ...sessionForm,

            number:
              Number(
                sessionForm.number
              ),
          }
        );
      }

      if (
        type === 'session-delete'
      ) {
        return api.delete(
          `/api/content/basic-science/sessions/${id}`
        );
      }

      if (
        type === 'content-delete'
      ) {
        return api.delete(
          `/api/content/basic-science/content/${id}`
        );
      }

      const body =
        new FormData();

      body.append(
        'ctype',
        upload.type
      );

      body.append(
        'description',
        upload.description
      );

      body.append(
        'extra_info',
        upload.extra_info
      );

      body.append(
        'file',
        upload.file
      );

      return api.post(
        `/api/content/basic-science/sessions/${session.id}/content`,

        body
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

      if (
        variables.type ===
        'lesson-add'
      ) {
        setLessonForm({
          name: '',
          teacher: '',
        });
      }

      if (
        variables.type ===
        'session-add'
      ) {
        setSessionForm({
          number: 1,
          topic: '',
          teacher: '',
        });
      }

      if (
        variables.type ===
        'upload'
      ) {
        setUpload({
          type: 'pdf',
          description: '',
          extra_info: '',
          file: null,
        });
      }

      await refresh();
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


  const goBack = () => {
    if (session) {
      setSession(null);

    } else if (lesson) {
      setLesson(null);
    }
  };


  const title =
    session
      ? session.topic

      : lesson
        ? lesson.name

        : 'مدیریت علوم پایه';


  const typeIcon = {
    video: '🎬',
    ppt: '📊',
    pdf: '📄',
    note: '📝',
    test: '🧪',
    voice: '🎧',
  };


  return (
    <>
      <Header
        title={
          title ||
          'علوم پایه'
        }
        subtitle={
          session
            ? 'محتوای جلسه'

            : lesson
              ? 'جلسات درس'

              : 'درس‌ها و محتوای آموزشی'
        }
        back={
          Boolean(lesson)
        }
        onBack={
          lesson
            ? goBack
            : undefined
        }
      />

      <main className="page fade-up">
        {!lesson && (
          <>
            <section
              className={
                'card card-glow'
              }
              style={{
                marginBottom:
                  13,
              }}
            >
              <div className="sec-title">
                🔬 کتابخانه علوم پایه
              </div>

              <div className="tab-bar">
                {terms.map(
                  (item) => (
                    <button
                      key={item}
                      className="tab-btn"
                      onClick={() =>
                        setTerm(item)
                      }
                      style={{
                        color:
                          term === item
                            ? '#fff'
                            : 'var(--tx2)',

                        background:
                          term === item
                            ? 'var(--grad-brand)'
                            : 'transparent',
                      }}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <div className="grid2">
                <input
                  className="inp"
                  value={
                    lessonForm.name
                  }
                  onChange={(event) =>
                    setLessonForm({
                      ...lessonForm,

                      name:
                        event.target
                          .value,
                    })
                  }
                  placeholder="نام درس"
                />

                <input
                  className="inp"
                  value={
                    lessonForm.teacher
                  }
                  onChange={(event) =>
                    setLessonForm({
                      ...lessonForm,

                      teacher:
                        event.target
                          .value,
                    })
                  }
                  placeholder="استاد"
                />
              </div>

              <button
                className={
                  'btn btn-p btn-full'
                }
                style={{
                  marginTop:
                    9,
                }}
                disabled={
                  !lessonForm
                    .name
                    .trim() ||
                  mutation.isPending
                }
                onClick={() =>
                  mutation.mutate({
                    type:
                      'lesson-add',
                  })
                }
              >
                ＋ افزودن درس
              </button>
            </section>


            {lessonsLoading ? (
              <SkeletonCard />
            ) : lessons.length ===
              0 ? (
              <Empty>
                درسی در این ترم ثبت نشده
                است.
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
                {lessons.map(
                  (item) => (
                    <article
                      key={item.id}
                      className="card"
                    >
                      <div
                        style={{
                          display:
                            'flex',

                          alignItems:
                            'center',

                          gap:
                            10,
                        }}
                      >
                        <span
                          style={{
                            display:
                              'grid',

                            width:
                              43,

                            height:
                              43,

                            placeItems:
                              'center',

                            borderRadius:
                              14,

                            background:
                              'rgba(16,185,129,.12)',

                            fontSize:
                              20,
                          }}
                        >
                          📗
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setLesson(
                              item
                            )
                          }
                          style={{
                            flex:
                              1,

                            color:
                              'var(--tx)',

                            textAlign:
                              'right',

                            background:
                              'none',

                            border:
                              0,

                            cursor:
                              'pointer',
                          }}
                        >
                          <b>
                            {item.name}
                          </b>

                          <span
                            style={{
                              display:
                                'block',

                              color:
                                'var(--txm)',

                              fontSize:
                                9,

                              marginTop:
                                3,
                            }}
                          >
                            {item.teacher ||
                              'بدون استاد'}
                          </span>
                        </button>

                        <DeleteButton
                          pending={
                            mutation
                              .isPending
                          }
                          onClick={() => {
                            const accepted =
                              window.confirm(
                                'درس و زیرمجموعه‌های آن حذف شود؟'
                              );

                            if (accepted) {
                              mutation
                                .mutate({
                                  type:
                                    'lesson-delete',

                                  id:
                                    item.id,
                                });
                            }
                          }}
                        />
                      </div>
                    </article>
                  )
                )}
              </section>
            )}
          </>
        )}


        {lesson &&
          !session && (
          <>
            <section
              className={
                'card card-glow'
              }
              style={{
                display:
                  'grid',

                gap:
                  9,

                marginBottom:
                  13,
              }}
            >
              <div className="sec-title">
                ＋ جلسه جدید
              </div>

              <div className="grid2">
                <input
                  className="inp"
                  type="number"
                  min="1"
                  value={
                    sessionForm.number
                  }
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,

                      number:
                        event.target
                          .value,
                    })
                  }
                  placeholder="شماره"
                />

                <input
                  className="inp"
                  value={
                    sessionForm.topic
                  }
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,

                      topic:
                        event.target
                          .value,
                    })
                  }
                  placeholder="موضوع جلسه"
                />
              </div>

              <input
                className="inp"
                value={
                  sessionForm.teacher
                }
                onChange={(event) =>
                  setSessionForm({
                    ...sessionForm,

                    teacher:
                      event.target
                        .value,
                  })
                }
                placeholder="استاد جلسه"
              />

              <button
                className={
                  'btn btn-p btn-full'
                }
                disabled={
                  !sessionForm
                    .topic
                    .trim() ||
                  mutation.isPending
                }
                onClick={() =>
                  mutation.mutate({
                    type:
                      'session-add',
                  })
                }
              >
                افزودن جلسه
              </button>
            </section>


            {sessionsLoading ? (
              <SkeletonCard />
            ) : sessions.length ===
              0 ? (
              <Empty>
                جلسه‌ای ثبت نشده است.
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
                {sessions.map(
                  (item) => (
                    <article
                      key={item.id}
                      className="card"
                    >
                      <div
                        style={{
                          display:
                            'flex',

                          alignItems:
                            'center',

                          gap:
                            10,
                        }}
                      >
                        <span
                          style={{
                            display:
                              'grid',

                            width:
                              42,

                            height:
                              42,

                            placeItems:
                              'center',

                            borderRadius:
                              13,

                            background:
                              'var(--acc-soft)',

                            color:
                              'var(--acc2)',

                            fontWeight:
                              900,
                          }}
                        >
                          {item.number}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setSession(
                              item
                            )
                          }
                          style={{
                            flex:
                              1,

                            color:
                              'var(--tx)',

                            textAlign:
                              'right',

                            background:
                              'none',

                            border:
                              0,

                            cursor:
                              'pointer',
                          }}
                        >
                          <b>
                            {item.topic}
                          </b>

                          <span
                            style={{
                              display:
                                'block',

                              color:
                                'var(--txm)',

                              fontSize:
                                9,
                            }}
                          >
                            {item.teacher ||
                              'بدون استاد'}
                          </span>
                        </button>

                        <DeleteButton
                          pending={
                            mutation
                              .isPending
                          }
                          onClick={() => {
                            const accepted =
                              window.confirm(
                                'جلسه حذف شود؟'
                              );

                            if (accepted) {
                              mutation
                                .mutate({
                                  type:
                                    'session-delete',

                                  id:
                                    item.id,
                                });
                            }
                          }}
                        />
                      </div>
                    </article>
                  )
                )}
              </section>
            )}
          </>
        )}


        {session && (
          <>
            <section
              className={
                'card card-glow'
              }
              style={{
                display:
                  'grid',

                gap:
                  9,

                marginBottom:
                  13,
              }}
            >
              <div className="sec-title">
                📤 افزودن محتوا
              </div>

              <select
                className="inp"
                value={
                  upload.type
                }
                onChange={(event) =>
                  setUpload({
                    ...upload,

                    type:
                      event.target
                        .value,
                  })
                }
              >
                {Object.entries(
                  typeIcon
                ).map(
                  ([
                    key,
                    icon,
                  ]) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {icon} {key}
                    </option>
                  )
                )}
              </select>

              <input
                className="inp"
                value={
                  upload.description
                }
                onChange={(event) =>
                  setUpload({
                    ...upload,

                    description:
                      event.target
                        .value,
                  })
                }
                placeholder="توضیحات"
              />

              <input
                className="inp"
                value={
                  upload.extra_info
                }
                onChange={(event) =>
                  setUpload({
                    ...upload,

                    extra_info:
                      event.target
                        .value,
                  })
                }
                placeholder="اطلاعات تکمیلی"
              />

              <input
                className="inp"
                type="file"
                onChange={(event) =>
                  setUpload({
                    ...upload,

                    file:
                      event.target
                        .files?.[0] ||
                      null,
                  })
                }
              />

              <button
                className={
                  'btn btn-p btn-full'
                }
                disabled={
                  !upload.file ||
                  mutation.isPending
                }
                onClick={() =>
                  mutation.mutate({
                    type:
                      'upload',
                  })
                }
              >
                {mutation.isPending ? (
                  <Spinner size={14} />
                ) : (
                  'آپلود فایل'
                )}
              </button>
            </section>


            {contentLoading ? (
              <SkeletonCard />
            ) : content.length ===
              0 ? (
              <Empty>
                محتوایی ثبت نشده است.
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
                {content.map(
                  (item) => (
                    <article
                      key={item.id}
                      className="card"
                    >
                      <div
                        style={{
                          display:
                            'flex',

                          alignItems:
                            'center',

                          gap:
                            10,
                        }}
                      >
                        <span
                          style={{
                            display:
                              'grid',

                            width:
                              43,

                            height:
                              43,

                            placeItems:
                              'center',

                            borderRadius:
                              14,

                            background:
                              'rgba(139,92,246,.13)',

                            fontSize:
                              20,
                          }}
                        >
                          {typeIcon[
                            item.type
                          ] || '📎'}
                        </span>

                        <div
                          style={{
                            flex:
                              1,
                          }}
                        >
                          <b>
                            {item.description ||
                              item.type}
                          </b>

                          <div
                            style={{
                              color:
                                'var(--txm)',

                              fontSize:
                                9,

                              marginTop:
                                3,
                            }}
                          >
                            {item.extra_info ||
                              ''}

                            {' • '}

                            {number(
                              item.downloads
                            )}{' '}

                            دانلود
                          </div>
                        </div>

                        <DeleteButton
                          pending={
                            mutation
                              .isPending
                          }
                          onClick={() => {
                            const accepted =
                              window.confirm(
                                'محتوا حذف شود؟'
                              );

                            if (accepted) {
                              mutation
                                .mutate({
                                  type:
                                    'content-delete',

                                  id:
                                    item.id,
                                });
                            }
                          }}
                        />
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


/* مدیریت رفرنس‌ها */

export function ReferencesAdmin() {
  const [
    subject,
    setSubject,
  ] = useState(null);

  const [
    book,
    setBook,
  ] = useState(null);

  const [
    name,
    setName,
  ] = useState('');

  const [
    upload,
    setUpload,
  ] = useState({
    lang: 'fa',
    volume: 1,
    description: '',
    file: null,
  });

  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();


  const {
    data: subjects = [],
    isLoading,
  } = useQuery({
    queryKey: [
      'ref-admin-subjects',
    ],

    queryFn: () =>
      api
        .get(
          '/api/content/references/subjects'
        )
        .then(
          (response) =>
            response.data
              ?.subjects || []
        ),
  });


  const {
    data: books = [],
  } = useQuery({
    queryKey: [
      'ref-admin-books',
      subject?.id,
    ],

    queryFn: () =>
      api
        .get(
          `/api/content/references/subjects/${subject.id}/books`
        )
        .then(
          (response) =>
            response.data
              ?.books || []
        ),

    enabled:
      Boolean(subject?.id),
  });


  const {
    data: files = [],
  } = useQuery({
    queryKey: [
      'ref-admin-files',
      book?.id,
    ],

    queryFn: () =>
      api
        .get(
          `/api/content/references/books/${book.id}/files`
        )
        .then(
          (response) =>
            response.data
              ?.files || []
        ),

    enabled:
      Boolean(book?.id),
  });


  const refresh = async () => {
    await Promise.all([
      queryClient
        .invalidateQueries({
          queryKey: [
            'ref-admin-subjects',
          ],
        }),

      queryClient
        .invalidateQueries({
          queryKey: [
            'ref-admin-books',
          ],
        }),

      queryClient
        .invalidateQueries({
          queryKey: [
            'ref-admin-files',
          ],
        }),
    ]);
  };


  const mutation = useMutation({
    mutationFn: async ({
      type,
      id,
    }) => {
      if (
        type === 'subject-add'
      ) {
        return api.post(
          '/api/content/references/subjects',

          {
            name:
              name.trim(),
          }
        );
      }

      if (
        type === 'subject-delete'
      ) {
        return api.delete(
          `/api/content/references/subjects/${id}`
        );
      }

      if (
        type === 'book-add'
      ) {
        return api.post(
          `/api/content/references/subjects/${subject.id}/books`,

          {
            name:
              name.trim(),
          }
        );
      }

      if (
        type === 'book-delete'
      ) {
        return api.delete(
          `/api/content/references/books/${id}`
        );
      }

      if (
        type === 'file-delete'
      ) {
        return api.delete(
          `/api/content/references/files/${id}`
        );
      }

      const body =
        new FormData();

      body.append(
        'lang',
        upload.lang
      );

      body.append(
        'volume',
        String(upload.volume)
      );

      body.append(
        'description',
        upload.description
      );

      body.append(
        'file',
        upload.file
      );

      return api.post(
        `/api/content/references/books/${book.id}/files`,

        body
      );
    },

    onSuccess: async () => {
      toast(
        'عملیات انجام شد ✅',
        'success'
      );

      setName('');

      setUpload({
        lang: 'fa',
        volume: 1,
        description: '',
        file: null,
      });

      await refresh();
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


  const back = () => {
    if (book) {
      setBook(null);

    } else if (subject) {
      setSubject(null);
    }
  };


  return (
    <>
      <Header
        title={
          book?.name ||
          subject?.name ||
          'مدیریت رفرنس‌ها'
        }
        back={
          Boolean(subject)
        }
        onBack={
          subject
            ? back
            : undefined
        }
      />

      <main className="page fade-up">
        <section
          className={
            'card card-glow'
          }
          style={{
            marginBottom:
              13,
          }}
        >
          <div className="sec-title">
            {book
              ? '📤 افزودن جلد'

              : subject
                ? '＋ افزودن کتاب'

                : '＋ افزودن موضوع'}
          </div>

          {book ? (
            <div
              style={{
                display:
                  'grid',

                gap:
                  8,
              }}
            >
              <div className="grid2">
                <select
                  className="inp"
                  value={
                    upload.lang
                  }
                  onChange={(event) =>
                    setUpload({
                      ...upload,

                      lang:
                        event.target
                          .value,
                    })
                  }
                >
                  <option value="fa">
                    فارسی
                  </option>

                  <option value="en">
                    انگلیسی
                  </option>
                </select>

                <input
                  className="inp"
                  type="number"
                  min="1"
                  value={
                    upload.volume
                  }
                  onChange={(event) =>
                    setUpload({
                      ...upload,

                      volume:
                        event.target
                          .value,
                    })
                  }
                  placeholder="جلد"
                />
              </div>

              <input
                className="inp"
                value={
                  upload.description
                }
                onChange={(event) =>
                  setUpload({
                    ...upload,

                    description:
                      event.target
                        .value,
                  })
                }
                placeholder="توضیحات"
              />

              <input
                className="inp"
                type="file"
                onChange={(event) =>
                  setUpload({
                    ...upload,

                    file:
                      event.target
                        .files?.[0] ||
                      null,
                  })
                }
              />

              <button
                className="btn btn-p"
                disabled={
                  !upload.file ||
                  mutation.isPending
                }
                onClick={() =>
                  mutation.mutate({
                    type:
                      'file-add',
                  })
                }
              >
                آپلود جلد
              </button>
            </div>
          ) : (
            <div
              style={{
                display:
                  'flex',

                gap:
                  7,
              }}
            >
              <input
                className="inp"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder={
                  subject
                    ? 'نام کتاب'
                    : 'نام درس یا موضوع'
                }
              />

              <button
                className="btn btn-p"
                disabled={
                  !name.trim() ||
                  mutation.isPending
                }
                onClick={() =>
                  mutation.mutate({
                    type:
                      subject
                        ? 'book-add'
                        : 'subject-add',
                  })
                }
              >
                افزودن
              </button>
            </div>
          )}
        </section>


        {!subject ? (
          isLoading ? (
            <SkeletonCard />
          ) : (
            <section
              style={{
                display:
                  'grid',

                gap:
                  8,
              }}
            >
              {subjects.map((item) => (
                <article
                  key={item.id}
                  className="card"
                >
                  <div
                    style={{
                      display:
                        'flex',

                      alignItems:
                        'center',

                      gap:
                        10,
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          22,
                      }}
                    >
                      🩺
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setSubject(
                          item
                        )
                      }
                      style={{
                        flex:
                          1,

                        textAlign:
                          'right',

                        background:
                          'none',

                        border:
                          0,

                        color:
                          'var(--tx)',
                      }}
                    >
                      <b>
                        {item.name}
                      </b>
                    </button>

                    <DeleteButton
                      pending={
                        mutation
                          .isPending
                      }
                      onClick={() => {
                        const accepted =
                          window.confirm(
                            'موضوع حذف شود؟'
                          );

                        if (accepted) {
                          mutation
                            .mutate({
                              type:
                                'subject-delete',

                              id:
                                item.id,
                            });
                        }
                      }}
                    />
                  </div>
                </article>
              ))}
            </section>
          )
        ) : !book ? (
          <section
            style={{
              display:
                'grid',

              gap:
                8,
            }}
          >
            {books.length ? (
              books.map((item) => (
                <article
                  key={item.id}
                  className="card"
                >
                  <div
                    style={{
                      display:
                        'flex',

                      alignItems:
                        'center',

                      gap:
                        10,
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          22,
                      }}
                    >
                      📕
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setBook(item)
                      }
                      style={{
                        flex:
                          1,

                        textAlign:
                          'right',

                        background:
                          'none',

                        border:
                          0,

                        color:
                          'var(--tx)',
                      }}
                    >
                      <b>
                        {item.name}
                      </b>
                    </button>

                    <DeleteButton
                      pending={
                        mutation
                          .isPending
                      }
                      onClick={() => {
                        const accepted =
                          window.confirm(
                            'کتاب حذف شود؟'
                          );

                        if (accepted) {
                          mutation
                            .mutate({
                              type:
                                'book-delete',

                              id:
                                item.id,
                            });
                        }
                      }}
                    />
                  </div>
                </article>
              ))
            ) : (
              <Empty>
                کتابی ثبت نشده است.
              </Empty>
            )}
          </section>
        ) : (
          <section
            style={{
              display:
                'grid',

              gap:
                8,
            }}
          >
            {files.length ? (
              files.map((item) => (
                <article
                  key={item.id}
                  className="card"
                >
                  <div
                    style={{
                      display:
                        'flex',

                      alignItems:
                        'center',

                      gap:
                        10,
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          22,
                      }}
                    >
                      {item.lang ===
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
                      <b>
                        جلد {item.volume}
                      </b>

                      <div
                        style={{
                          color:
                            'var(--txm)',

                          fontSize:
                            9,
                        }}
                      >
                        {item.description}

                        {' • '}

                        {number(
                          item.downloads
                        )}{' '}

                        دانلود
                      </div>
                    </div>

                    <DeleteButton
                      pending={
                        mutation
                          .isPending
                      }
                      onClick={() => {
                        const accepted =
                          window.confirm(
                            'فایل حذف شود؟'
                          );

                        if (accepted) {
                          mutation
                            .mutate({
                              type:
                                'file-delete',

                              id:
                                item.id,
                            });
                        }
                      }}
                    />
                  </div>
                </article>
              ))
            ) : (
              <Empty>
                فایلی ثبت نشده است.
              </Empty>
            )}
          </section>
        )}
      </main>
    </>
  );
}


/* بانک فایل سؤال */

export function QbankAdmin() {
  const [
    form,
    setForm,
  ] = useState({
    lesson: '',
    topic: '',
    description: '',
    file: null,
  });

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
      'qbank-admin',
    ],

    queryFn: () =>
      api
        .get(
          '/api/content/qbank/files'
        )
        .then(
          (response) =>
            response.data
              ?.files || []
        ),
  });


  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: [
        'qbank-admin',
      ],
    });


  const mutation = useMutation({
    mutationFn: async ({
      type,
      id,
    }) => {
      if (type === 'delete') {
        return api.delete(
          `/api/content/qbank/files/${id}`
        );
      }

      const body =
        new FormData();

      body.append(
        'lesson',
        form.lesson.trim()
      );

      body.append(
        'topic',
        form.topic.trim()
      );

      body.append(
        'description',
        form.description.trim()
      );

      body.append(
        'file',
        form.file
      );

      return api.post(
        '/api/content/qbank/files',
        body
      );
    },

    onSuccess: async () => {
      toast(
        'عملیات انجام شد ✅',
        'success'
      );

      setForm({
        lesson: '',
        topic: '',
        description: '',
        file: null,
      });

      await refresh();
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


  const files =
    Array.isArray(data)
      ? data
      : [];


  return (
    <>
      <Header
        title="بانک فایل سؤال"
        subtitle={`${files.length} فایل`}
      />

      <main className="page fade-up">
        <section
          className={
            'card card-glow'
          }
          style={{
            display:
              'grid',

            gap:
              8,

            marginBottom:
              13,
          }}
        >
          <div className="sec-title">
            📤 فایل جدید
          </div>

          <div className="grid2">
            <input
              className="inp"
              value={form.lesson}
              onChange={(event) =>
                setForm({
                  ...form,

                  lesson:
                    event.target.value,
                })
              }
              placeholder="درس"
            />

            <input
              className="inp"
              value={form.topic}
              onChange={(event) =>
                setForm({
                  ...form,

                  topic:
                    event.target.value,
                })
              }
              placeholder="مبحث"
            />
          </div>

          <input
            className="inp"
            value={
              form.description
            }
            onChange={(event) =>
              setForm({
                ...form,

                description:
                  event.target.value,
              })
            }
            placeholder="توضیحات"
          />

          <input
            className="inp"
            type="file"
            onChange={(event) =>
              setForm({
                ...form,

                file:
                  event.target
                    .files?.[0] ||
                  null,
              })
            }
          />

          <button
            className="btn btn-p"
            disabled={
              !form.lesson.trim() ||
              !form.topic.trim() ||
              !form.file ||
              mutation.isPending
            }
            onClick={() =>
              mutation.mutate({
                type:
                  'add',
              })
            }
          >
            {mutation.isPending ? (
              <Spinner size={14} />
            ) : (
              'آپلود فایل'
            )}
          </button>
        </section>


        {isLoading ? (
          <SkeletonCard />
        ) : isError ? (
          <Empty>
            دریافت فایل‌ها انجام نشد.

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
        ) : files.length === 0 ? (
          <Empty>
            فایلی ثبت نشده است.
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
            {files.map((item) => (
              <article
                key={item.id}
                className="card"
              >
                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap:
                      10,
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        22,
                    }}
                  >
                    {item.file_type ===
                    'video'
                      ? '🎬'

                      : item.file_type ===
                          'voice'
                        ? '🎧'

                        : '📄'}
                  </span>

                  <div
                    style={{
                      flex:
                        1,
                    }}
                  >
                    <b>
                      {item.lesson}
                      {' — '}
                      {item.topic}
                    </b>

                    <div
                      style={{
                        color:
                          'var(--txm)',

                        fontSize:
                          9,

                        marginTop:
                          3,
                      }}
                    >
                      {item.description ||
                        'بدون توضیح'}

                      {' • '}

                      {number(
                        item.downloads
                      )}{' '}

                      دانلود

                      {' • '}

                      {item.upload_date ||
                        '—'}
                    </div>
                  </div>

                  <DeleteButton
                    pending={
                      mutation.isPending
                    }
                    onClick={() => {
                      const accepted =
                        window.confirm(
                          'فایل حذف شود؟'
                        );

                      if (accepted) {
                        mutation.mutate({
                          type:
                            'delete',

                          id:
                            item.id,
                        });
                      }
                    }}
                  />
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}


/* گزارش‌های محتوا */

export function ContentReportsAdmin() {
  const [
    status,
    setStatus,
  ] = useState('new');

  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();


  const {
    data: stats,
  } = useQuery({
    queryKey: [
      'content-report-stats',
    ],

    queryFn: () =>
      api
        .get(
          '/api/content/reports/stats'
        )
        .then(
          (response) =>
            response.data
        ),
  });


  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'content-reports',
      status,
    ],

    queryFn: () =>
      api
        .get(
          '/api/content/reports',

          {
            params: {
              status,
            },
          }
        )
        .then(
          (response) =>
            response.data
              ?.reports || []
        ),
  });


  const mutation = useMutation({
    mutationFn: ({
      id,
      value,
    }) =>
      api.post(
        `/api/content/reports/${id}/status`,

        {
          status:
            value,
        }
      ),

    onSuccess: async () => {
      hapticNotif(
        'success'
      );

      toast(
        'وضعیت گزارش تغییر کرد ✅',
        'success'
      );

      await Promise.all([
        queryClient
          .invalidateQueries({
            queryKey: [
              'content-reports',
            ],
          }),

        queryClient
          .invalidateQueries({
            queryKey: [
              'content-report-stats',
            ],
          }),
      ]);
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


  const reports =
    Array.isArray(data)
      ? data
      : [];


  const tabs = [
    [
      'new',
      'جدید',
    ],

    [
      'reviewing',
      'در بررسی',
    ],

    [
      'resolved',
      'برطرف‌شده',
    ],

    [
      'rejected',
      'ردشده',
    ],
  ];


  return (
    <>
      <Header
        title="گزارش‌های محتوا"
        subtitle={`${
          Number(stats?.new) ||
          0
        } گزارش جدید`}
      />

      <main className="page fade-up">
        <section
          className="grid2"
          style={{
            marginBottom:
              13,
          }}
        >
          <div
            className="card"
            style={{
              textAlign:
                'center',
            }}
          >
            <b
              style={{
                color:
                  'var(--warn)',

                fontSize:
                  20,
              }}
            >
              {number(
                stats?.new
              )}
            </b>

            <div
              style={{
                color:
                  'var(--txm)',

                fontSize:
                  9,
              }}
            >
              جدید
            </div>
          </div>

          <div
            className="card"
            style={{
              textAlign:
                'center',
            }}
          >
            <b
              style={{
                color:
                  'var(--acc2)',

                fontSize:
                  20,
              }}
            >
              {number(
                stats?.reviewing
              )}
            </b>

            <div
              style={{
                color:
                  'var(--txm)',

                fontSize:
                  9,
              }}
            >
              در بررسی
            </div>
          </div>
        </section>


        <div className="tab-bar">
          {tabs.map(
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
                {label}{' '}

                ({number(
                  stats?.[key]
                )})
              </button>
            )
          )}
        </div>


        {isLoading ? (
          <SkeletonCard />
        ) : isError ? (
          <Empty>
            دریافت گزارش‌ها انجام نشد.

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
        ) : reports.length === 0 ? (
          <Empty>
            گزارشی در این وضعیت نیست.
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
            {reports.map((item) => (
              <article
                key={item.id}
                className="card"
              >
                <div
                  style={{
                    display:
                      'flex',

                    gap:
                      8,
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        22,
                    }}
                  >
                    {item.target_type ===
                    'question'
                      ? '🧪'
                      : '📎'}
                  </span>

                  <div
                    style={{
                      flex:
                        1,
                    }}
                  >
                    <b>
                      گزارش #{item.id}
                    </b>

                    <div
                      style={{
                        color:
                          'var(--txm)',

                        fontSize:
                          9,

                        marginTop:
                          3,
                      }}
                    >
                      {item.reason}

                      {' • '}

                      {item.reporter_name ||
                        'ناشناس'}

                      {' • '}

                      {item.created_at ||
                        '—'}
                    </div>
                  </div>

                  <span className="badge b-gray">
                    {status}
                  </span>
                </div>

                {item.note && (
                  <div
                    style={{
                      marginTop:
                        8,

                      padding:
                        '8px 9px',

                      background:
                        'rgba(100,116,139,.08)',

                      borderRadius:
                        10,

                      fontSize:
                        10,
                    }}
                  >
                    {item.note}
                  </div>
                )}

                <div
                  style={{
                    display:
                      'flex',

                    gap:
                      6,

                    marginTop:
                      9,
                  }}
                >
                  {status === 'new' && (
                    <button
                      className={
                        'btn btn-dark'
                      }
                      style={{
                        flex:
                          1,
                      }}
                      onClick={() =>
                        mutation.mutate({
                          id:
                            item.id,

                          value:
                            'reviewing',
                        })
                      }
                    >
                      🔍 بررسی
                    </button>
                  )}

                  {![
                    'resolved',
                    'rejected',
                  ].includes(
                    status
                  ) && (
                    <>
                      <button
                        className="btn btn-g"
                        style={{
                          flex:
                            1,
                        }}
                        onClick={() =>
                          mutation.mutate({
                            id:
                              item.id,

                            value:
                              'resolved',
                          })
                        }
                      >
                        ✅ حل شد
                      </button>

                      <button
                        className="btn btn-d"
                        style={{
                          flex:
                            1,
                        }}
                        onClick={() =>
                          mutation.mutate({
                            id:
                              item.id,

                            value:
                              'rejected',
                          })
                        }
                      >
                        رد
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
