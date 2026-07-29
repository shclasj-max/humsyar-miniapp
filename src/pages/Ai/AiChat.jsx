import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import Header from '../../components/layout/Header';

import {
  SkeletonCard,
  Spinner,
} from '../../components/shared/Loading';

import api from '../../lib/api';

import {
  haptic,
  hapticNotif,
} from '../../lib/telegram';

import {
  useUIStore,
} from '../../stores/uiStore';


const MAX_MEDIA_FALLBACK =
  15 * 1024 * 1024;

const MAX_INPUT_FALLBACK =
  2000;

const SUGGESTIONS = [
  'مبحث پتانسیل عمل را ساده توضیح بده',
  'از فیزیولوژی تنفس یک سؤال چهارگزینه‌ای بساز',
  'برای مرور آناتومی قلب یک برنامه کوتاه بده',
];

const ACCEPTED_FILES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'audio/aac',
  'audio/flac',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-m4a',
  'audio/x-wav',
].join(',');


function errorMessage(
  error,
  fallback,
) {
  const detail =
    error?.response?.data?.detail;

  if (
    typeof detail === 'string'
    && detail.trim()
  ) {
    return detail;
  }

  if (
    Array.isArray(detail)
    && detail[0]?.msg
  ) {
    return String(
      detail[0].msg
    );
  }

  if (
    error?.code === 'ECONNABORTED'
  ) {
    return (
      'پاسخ هوشیار بیش از حد طول کشید؛ '
      + 'دوباره امتحان کنید'
    );
  }

  return fallback;
}


function detectFileKind(file) {
  const type = String(
    file?.type || ''
  ).toLowerCase();

  const name = String(
    file?.name || ''
  ).toLowerCase();

  if (
    type === 'application/pdf'
    || name.endsWith('.pdf')
  ) {
    return 'pdf';
  }

  if (
    type.startsWith('image/')
    || /\.(jpe?g|png|webp)$/.test(
      name
    )
  ) {
    return 'image';
  }

  if (
    type.startsWith('audio/')
    || /\.(aac|flac|m4a|mp3|mp4|oga|ogg|wav|webm)$/.test(
      name
    )
  ) {
    return 'audio';
  }

  return 'unknown';
}


function kindIcon(kind) {
  if (kind === 'image') {
    return '🖼️';
  }

  if (kind === 'pdf') {
    return '📄';
  }

  if (kind === 'audio') {
    return '🎙️';
  }

  return '📎';
}


function kindLabel(kind) {
  if (kind === 'image') {
    return 'تصویر سؤال';
  }

  if (kind === 'pdf') {
    return 'سند مرجع PDF';
  }

  if (kind === 'audio') {
    return 'پیام یا فایل صوتی';
  }

  return 'فایل';
}


function formatBytes(bytes) {
  const value = Number(
    bytes || 0
  );

  if (value < 1024) {
    return `${value} بایت`;
  }

  if (
    value < 1024 * 1024
  ) {
    return (
      `${Math.ceil(value / 1024)} کیلوبایت`
    );
  }

  return `${
    (
      value
      / (1024 * 1024)
    ).toLocaleString(
      'fa-IR',
      {
        maximumFractionDigits: 1,
      }
    )
  } مگابایت`;
}


function formatDuration(seconds) {
  const value = Math.max(
    0,
    Number(seconds || 0)
  );

  const minutes = Math.floor(
    value / 60
  );

  const rest =
    value % 60;

  return `${
    String(minutes).padStart(
      2,
      '0'
    )
  }:${
    String(rest).padStart(
      2,
      '0'
    )
  }`;
}


function formatDate(value) {
  if (!value) {
    return (
      'تا ۴۸ ساعت پس از بارگذاری'
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return (
      'تا ۴۸ ساعت پس از بارگذاری'
    );
  }

  return date.toLocaleString(
    'fa-IR',
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}


function makeId(prefix) {
  return `${
    prefix
  }-${
    Date.now()
  }-${
    Math.random()
      .toString(36)
      .slice(2, 8)
  }`;
}


export default function AiChat() {
  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    input,
    setInput,
  ] = useState('');

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  const [
    reported,
    setReported,
  ] = useState(
    () => new Set()
  );

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(0);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState('');

  const endRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const recorderRef =
    useRef(null);

  const recordingStreamRef =
    useRef(null);

  const recordingChunksRef =
    useRef([]);

  const recordingTimerRef =
    useRef(null);

  const toast =
    useUIStore(
      (state) => state.toast
    );

  const queryClient =
    useQueryClient();

  const {
    data: status,
    isLoading: statusLoading,
  } = useQuery({
    queryKey: [
      'ai-status',
    ],

    queryFn: () =>
      api
        .get(
          '/api/ai/status'
        )
        .then(
          (response) =>
            response.data
        ),

    refetchInterval:
      60_000,
  });

  const {
    isLoading: historyLoading,
  } = useQuery({
    queryKey: [
      'ai-history',
    ],

    queryFn: () =>
      api
        .get(
          '/api/ai/history'
        )
        .then(
          (response) => {
            const history =
              Array.isArray(
                response.data
                  ?.messages
              )
                ? response.data
                    .messages
                : [];

            setMessages(
              history.map(
                (
                  item,
                  index
                ) => ({
                  ...item,

                  id:
                    `history-${index}`,
                })
              )
            );

            return history;
          }
        ),
  });

  const maxMediaBytes =
    Number(
      status
        ?.max_media_bytes
    )
    || MAX_MEDIA_FALLBACK;

  const maxInputChars =
    Number(
      status
        ?.max_input_chars
    )
    || MAX_INPUT_FALLBACK;

  const capabilities =
    status?.capabilities
    || {};

  const activeReference =
    status?.active_reference
    || null;

  const unavailable =
    !status?.enabled
    || status?.banned;

  const selectedKind =
    detectFileKind(
      selectedFile
    );

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');

      return undefined;
    }

    const url =
      URL.createObjectURL(
        selectedFile
      );

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(
        url
      );
    };
  }, [
    selectedFile,
  ]);

  useEffect(() => {
    endRef.current
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
  }, [
    messages,
    uploadProgress,
  ]);

  useEffect(
    () => () => {
      if (
        recordingTimerRef
          .current
      ) {
        window.clearInterval(
          recordingTimerRef
            .current
        );
      }

      const recorder =
        recorderRef.current;

      if (
        recorder
        && recorder.state
          !== 'inactive'
      ) {
        recorder.onstop = null;
        recorder.stop();
      }

      recordingStreamRef
        .current
        ?.getTracks?.()
        .forEach(
          (track) =>
            track.stop()
        );
    },
    []
  );

  const askMutation =
    useMutation({
      mutationFn: ({
        message,
        file,
      }) => {
        if (!file) {
          return api.post(
            '/api/ai/ask',

            {
              message,
            },

            {
              timeout:
                120_000,
            }
          );
        }

        const form =
          new FormData();

        form.append(
          'message',
          message || ''
        );

        form.append(
          'file',
          file,
          file.name
        );

        setUploadProgress(1);

        return api.post(
          '/api/ai/ask-media',
          form,
          {
            timeout:
              180_000,

            onUploadProgress:
              (event) => {
                if (
                  !event.total
                ) {
                  setUploadProgress(
                    (current) =>
                      Math.max(
                        current,
                        12
                      )
                  );

                  return;
                }

                const percent =
                  Math.round(
                    (
                      event.loaded
                      * 100
                    )
                    / event.total
                  );

                setUploadProgress(
                  Math.min(
                    100,
                    Math.max(
                      1,
                      percent
                    )
                  )
                );
              },
          }
        );
      },

      onSuccess: async (
        response,
        variables
      ) => {
        hapticNotif(
          'success'
        );

        setMessages(
          (current) => [
            ...current.map(
              (item) =>
                item.id
                  === variables
                    .clientId
                  ? {
                      ...item,
                      failed:
                        false,
                    }
                  : item
            ),

            {
              id: makeId(
                'assistant'
              ),

              role:
                'assistant',

              text: String(
                response.data
                  ?.answer
                || ''
              ),
            },
          ]
        );

        await Promise.all([
          queryClient
            .invalidateQueries({
              queryKey: [
                'ai-status',
              ],
            }),

          queryClient
            .invalidateQueries({
              queryKey: [
                'ai-history',
              ],
            }),
        ]);
      },

      onError: async (
        error,
        variables
      ) => {
        hapticNotif(
          'error'
        );

        setMessages(
          (current) =>
            current.map(
              (item) =>
                item.id
                  === variables
                    .clientId
                  ? {
                      ...item,
                      failed:
                        true,
                    }
                  : item
            )
        );

        toast(
          errorMessage(
            error,
            'هوشیار نتوانست پاسخ دهد'
          ),
          'error',
          4200
        );

        await queryClient
          .invalidateQueries({
            queryKey: [
              'ai-status',
            ],
          });
      },

      onSettled: () => {
        window.setTimeout(
          () =>
            setUploadProgress(
              0
            ),
          350
        );
      },
    });

  const clearMutation =
    useMutation({
      mutationFn: () =>
        api.delete(
          '/api/ai/history',

          {
            params: {
              clear_reference:
                true,
            },
          }
        ),

      onSuccess:
        async () => {
          setMessages([]);
          setSelectedFile(null);
          setInput('');
          setReported(
            new Set()
          );

          hapticNotif(
            'success'
          );

          toast(
            'گفت‌وگوی جدید شروع شد و سند مرجع قبلی پاک شد',
            'info'
          );

          await Promise.all([
            queryClient
              .invalidateQueries({
                queryKey: [
                  'ai-history',
                ],
              }),

            queryClient
              .invalidateQueries({
                queryKey: [
                  'ai-status',
                ],
              }),
          ]);
        },

      onError: (error) => {
        toast(
          errorMessage(
            error,
            'شروع گفت‌وگوی جدید انجام نشد'
          ),
          'error'
        );
      },
    });

  const clearReferenceMutation =
    useMutation({
      mutationFn: () =>
        api.delete(
          '/api/ai/reference'
        ),

      onSuccess:
        async () => {
          hapticNotif(
            'success'
          );

          toast(
            'سند مرجع پاک شد',
            'success'
          );

          await queryClient
            .invalidateQueries({
              queryKey: [
                'ai-status',
              ],
            });
        },

      onError: (error) => {
        toast(
          errorMessage(
            error,
            'پاک‌کردن سند مرجع انجام نشد'
          ),
          'error'
        );
      },
    });

  const reportMutation =
    useMutation({
      mutationFn: ({
        question,
        answer,
      }) =>
        api.post(
          '/api/ai/report',

          {
            question,
            answer,
          }
        ),

      onSuccess: (
        _,
        variables
      ) => {
        setReported(
          (current) =>
            new Set([
              ...current,
              variables
                .answerId,
            ])
        );

        hapticNotif(
          'success'
        );

        toast(
          'گزارش پاسخ ثبت شد',
          'success'
        );
      },

      onError: () => {
        toast(
          'ثبت گزارش انجام نشد',
          'error'
        );
      },
    });

  const remaining =
    status?.unlimited
      ? 'نامحدود'
      : `${
          status?.remaining
          ?? 0
        } از ${
          status
            ?.daily_limit
          ?? 0
        }`;

  const canSend =
    !unavailable
    && !statusLoading
    && !askMutation
      .isPending
    && !isRecording
    && (
      Boolean(
        input.trim()
      )
      || Boolean(
        selectedFile
      )
    );

  const chooseFile =
    (file) => {
      if (!file) {
        return;
      }

      const kind =
        detectFileKind(
          file
        );

      if (
        kind === 'unknown'
      ) {
        toast(
          'فقط عکس، PDF یا فایل صوتی پشتیبانی می‌شود',
          'warning'
        );

        return;
      }

      if (
        file.size
        > maxMediaBytes
      ) {
        toast(
          `حجم فایل باید کمتر از ${
            formatBytes(
              maxMediaBytes
            )
          } باشد`,
          'warning'
        );

        return;
      }

      if (
        kind === 'image'
        && capabilities
          .image === false
      ) {
        toast(
          'مدل فعلی امکان بررسی تصویر را ندارد',
          'warning'
        );

        return;
      }

      if (
        kind === 'pdf'
        && capabilities
          .pdf === false
      ) {
        toast(
          'PDF فقط با ارائه‌دهنده Gemini قابل استفاده است',
          'warning'
        );

        return;
      }

      if (
        kind === 'audio'
        && capabilities
          .audio === false
      ) {
        toast(
          'صدا فقط با ارائه‌دهنده Gemini قابل استفاده است',
          'warning'
        );

        return;
      }

      setSelectedFile(file);
      haptic('light');
    };

  const handleFileInput =
    (event) => {
      chooseFile(
        event.target
          .files?.[0]
      );

      event.target.value =
        '';
    };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    haptic('light');
  };

  const send = (
    customMessage,
    options = {}
  ) => {
    const message =
      String(
        customMessage
        ?? input
      ).trim();

    const file =
      options.ignoreFile
        ? null
        : selectedFile;

    if (
      (
        !message
        && !file
      )
      || askMutation
        .isPending
      || unavailable
    ) {
      return;
    }

    const id =
      makeId('user');

    const kind =
      detectFileKind(
        file
      );

    haptic('medium');

    setMessages(
      (current) => [
        ...current,

        {
          id,
          role: 'user',

          text:
            message
            || (
              file
                ? `[${
                    kindLabel(
                      kind
                    )
                  } فرستاده شد]`
                : ''
            ),

          attachment:
            file
              ? {
                  kind,
                  name:
                    file.name,
                  size:
                    file.size,
                }
              : null,

          failed: false,
        },
      ]
    );

    setInput('');

    if (file) {
      setSelectedFile(null);
    }

    askMutation.mutate({
      clientId: id,
      message,
      file,
    });
  };

  const followUp =
    (type) => {
      const prompts = {
        example:
          'برای پاسخ قبلی یک مثال بالینی ساده بزن.',

        summary:
          'پاسخ قبلی را خیلی کوتاه و نکته‌ای خلاصه کن.',

        similar:
          'براساس پاسخ قبلی یک سؤال چهارگزینه‌ای مشابه بساز.',
      };

      send(
        prompts[type],
        {
          ignoreFile:
            true,
        }
      );
    };

  const reportAnswer = (
    answer,
    index
  ) => {
    const previousUser = [
      ...messages.slice(
        0,
        index
      ),
    ]
      .reverse()
      .find(
        (item) =>
          item.role
          === 'user'
      );

    reportMutation.mutate({
      question:
        String(
          previousUser
            ?.text
          || 'پرسش کاربر'
        ).slice(
          0,
          maxInputChars
        ),

      answer:
        String(
          answer.text
          || ''
        ).slice(
          0,
          12000
        ),

      answerId:
        answer.id,
    });
  };

  const stopRecording =
    () => {
      const recorder =
        recorderRef.current;

      if (
        recorder
        && recorder.state
          !== 'inactive'
      ) {
        recorder.stop();
      }
    };

  const startRecording =
    async () => {
      if (
        askMutation
          .isPending
        || isRecording
      ) {
        return;
      }

      if (
        capabilities
          .audio === false
      ) {
        toast(
          'ضبط صدا فقط با ارائه‌دهنده Gemini قابل استفاده است',
          'warning'
        );

        return;
      }

      if (
        !navigator
          .mediaDevices
          ?.getUserMedia
        || typeof window
          .MediaRecorder
          === 'undefined'
      ) {
        toast(
          'مرورگر این دستگاه ضبط صدا را پشتیبانی نمی‌کند؛ فایل صوتی انتخاب کنید',
          'warning',
          4200
        );

        return;
      }

      try {
        const stream =
          await navigator
            .mediaDevices
            .getUserMedia({
              audio: {
                echoCancellation:
                  true,

                noiseSuppression:
                  true,

                channelCount:
                  1,
              },
            });

        recordingStreamRef
          .current = stream;

        recordingChunksRef
          .current = [];

        const preferredTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
        ];

        const mimeType =
          preferredTypes.find(
            (type) =>
              window
                .MediaRecorder
                .isTypeSupported
                ? (
                  type
                )
          );

        const recorder =
          mimeType
            ? new window
                .MediaRecorder(
                  stream,
                  {
                    mimeType,
                  }
                )
            : new window
                .MediaRecorder(
                  stream
                );

        recorderRef.current =
          recorder;

        recorder.ondataavailable =
          (event) => {
            if (
              event.data?.size
            ) {
              recordingChunksRef
                .current
                .push(
                  event.data
                );
            }
          };

        recorder.onerror =
          () => {
            toast(
              'ضبط صدا با خطا متوقف شد',
              'error'
            );
          };

        recorder.onstop =
          () => {
            if (
              recordingTimerRef
                .current
            ) {
              window.clearInterval(
                recordingTimerRef
                  .current
              );

              recordingTimerRef
                .current = null;
            }

            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            recordingStreamRef
              .current = null;

            setIsRecording(
              false
            );

            setRecordingSeconds(
              0
            );

            const finalType =
              recorder.mimeType
              || mimeType
              || 'audio/webm';

            const blob =
              new Blob(
                recordingChunksRef
                  .current,
                {
                  type:
                    finalType,
                }
              );

            recordingChunksRef
              .current = [];

            if (!blob.size) {
              toast(
                'صدایی ضبط نشد؛ دوباره امتحان کنید',
                'warning'
              );

              return;
            }

            if (
              blob.size
              > maxMediaBytes
            ) {
              toast(
                `حجم صدای ضبط‌شده بیشتر از ${
                  formatBytes(
                    maxMediaBytes
                  )
                } است`,
                'warning'
              );

              return;
            }

            const extension =
              finalType.includes(
                'mp4'
              )
                ? 'm4a'
                : 'webm';

            chooseFile(
              new File(
                [blob],

                `voice-${
                  Date.now()
                }.${extension}`,

                {
                  type:
                    finalType,
                }
              )
            );
          };

        recorder.start(500);

        setRecordingSeconds(
          0
        );

        setIsRecording(
          true
        );

        recordingTimerRef
          .current =
          window.setInterval(
            () => {
              setRecordingSeconds(
                (current) =>
                  current + 1
              );
            },
            1000
          );

        haptic('medium');
      } catch (error) {
        recordingStreamRef
          .current
          ?.getTracks?.()
          .forEach(
            (track) =>
              track.stop()
          );

        recordingStreamRef
          .current = null;

        if (
          error?.name
          === 'NotAllowedError'
        ) {
          toast(
            'برای ضبط صدا باید دسترسی میکروفون را فعال کنید',
            'warning',
            4200
          );
        } else {
          toast(
            'شروع ضبط صدا انجام نشد',
            'error'
          );
        }
      }
    };

  const headerAction = (
    <button
      type="button"
      className="btn btn-dark"
      style={styles.headerButton}
      onClick={
        () =>
          clearMutation
            .mutate()
      }
      disabled={
        clearMutation
          .isPending
        || askMutation
          .isPending
      }
      aria-label="شروع گفت‌وگوی جدید"
    >
      {
        clearMutation
          .isPending
          ? (
            <Spinner
              size={15}
            />
          )
          : '＋'
      }

      جدید
    </button>
  );

  return (
    <>
      <Header
        title="هوشیار"
        subtitle="دستیار هوشمند هامزیار"
        right={headerAction}
      />

      <main
        className="page"
        style={styles.page}
      >
        <section
          className="card card-glow"
          style={styles.statusCard}
        >
          <div
            style={styles.statusTop}
          >
            <div
              style={styles.aiAvatar}
            >
              ✦
            </div>

            <div
              style={styles.statusText}
            >
              <strong
                style={
                  styles.statusTitle
                }
              >
                هوشیار آماده کمک است
              </strong>

              <span
                style={
                  styles.statusSubtitle
                }
              >
                متن، عکس، PDF و صدای سؤال را بفرست
              </span>
            </div>

            <span
              className={
                `badge ${
                  status?.enabled
                  && !status?.banned
                    ? 'b-grn'
                    : 'b-red'
                }`
              }
            >
              <span
                className="badge-dot"
              />

              {
                statusLoading
                  ? 'بررسی'
                  : status?.banned
                    ? 'مسدود'
                    : status?.enabled
                      ? 'فعال'
                      : 'خاموش'
              }
            </span>
          </div>

          <div
            style={styles.statusMeta}
          >
            <span>
              سهمیه امروز:{' '}
              <b>{remaining}</b>
            </span>

            <span>
              مدل:{' '}
              <b>
                {
                  status?.provider
                  || '—'
                }
              </b>
            </span>
          </div>

          {
            !status?.unlimited
            && (
              <div
                className="pbar"
                style={styles.quotaBar}
              >
                <div
                  className="pbar-f"
                  style={{
                    width:
                      `${
                        Math.min(
                          100,

                          Math.max(
                            0,

                            (
                              (
                                status
                                  ?.used_today
                                || 0
                              )
                              / Math.max(
                                1,

                                status
                                  ?.daily_limit
                                || 1
                              )
                            )
                            * 100
                          )
                        )
                      }%`,
                  }}
                />
              </div>
            )
          }
        </section>

        {
          activeReference
          && (
            <section
              className="card"
              style={
                styles.referenceCard
              }
            >
              <div
                style={
                  styles.referenceIcon
                }
              >
                PDF
              </div>

              <div
                style={
                  styles.referenceText
                }
              >
                <strong
                  style={
                    styles.referenceName
                  }
                >
                  {
                    activeReference
                      .name
                  }
                </strong>

                <span
                  style={
                    styles.referenceHint
                  }
                >
                  سند مرجع فعال است؛ سؤال‌های بعدی با توجه به آن پاسخ داده می‌شوند.
                </span>

                <span
                  style={
                    styles.referenceExpiry
                  }
                >
                  انقضا:{' '}
                  {
                    formatDate(
                      activeReference
                        .expires_at
                    )
                  }
                </span>
              </div>

              <button
                type="button"
                className="btn btn-d"
                style={
                  styles.iconButton
                }
                onClick={
                  () =>
                    clearReferenceMutation
                      .mutate()
                }
                disabled={
                  clearReferenceMutation
                    .isPending
                  || askMutation
                    .isPending
                }
                aria-label="پاک‌کردن سند مرجع"
              >
                {
                  clearReferenceMutation
                    .isPending
                    ? (
                      <Spinner
                        size={16}
                      />
                    )
                    : '×'
                }
              </button>
            </section>
          )
        }

        {
          unavailable
          && !statusLoading
          && (
            <div
              className="card"
              style={
                styles.unavailableCard
              }
            >
              <span
                style={
                  styles.unavailableIcon
                }
              >
                {
                  status?.banned
                    ? '⛔'
                    : '🛠️'
                }
              </span>

              <div>
                <strong>
                  {
                    status?.banned
                      ? 'دسترسی هوشیار برای شما بسته است'
                      : 'هوشیار فعلاً در دسترس نیست'
                  }
                </strong>

                <p
                  style={
                    styles.unavailableText
                  }
                >
                  {
                    status?.banned
                      ? 'برای پیگیری از بخش تیکت با پشتیبانی تماس بگیرید.'
                      : (
                        status
                          ?.disabled_message
                        || 'مدیریت در حال آماده‌سازی این بخش است.'
                      )
                  }
                </p>
              </div>
            </div>
          )
        }

        <section
          style={styles.chatArea}
          aria-live="polite"
        >
          {
            (
              statusLoading
              || historyLoading
            )
            && (
              <div
                style={
                  styles.loadingList
                }
              >
                <SkeletonCard
                  lines={2}
                />

                <SkeletonCard
                  lines={3}
                />
              </div>
            )
          }

          {
            !statusLoading
            && !historyLoading
            && messages.length === 0
            && (
              <div
                style={styles.welcome}
              >
                <div
                  style={
                    styles.welcomeOrb
                  }
                >
                  ✦
                </div>

                <h2
                  style={
                    styles.welcomeTitle
                  }
                >
                  از هوشیار بپرس
                </h2>

                <p
                  style={
                    styles.welcomeText
                  }
                >
                  سؤال را تایپ کن، از برگه عکس بگیر، جزوه PDF را مرجع کن یا سؤال را با صدا بگو.
                </p>

                <div
                  style={
                    styles.capabilityGrid
                  }
                >
                  <span
                    style={
                      styles.capabilityChip
                    }
                  >
                    📝 متن
                  </span>

                  <span
                    style={
                      styles.capabilityChip
                    }
                  >
                    🖼️ عکس
                  </span>

                  <span
                    style={
                      styles.capabilityChip
                    }
                  >
                    📄 PDF
                  </span>

                  <span
                    style={
                      styles.capabilityChip
                    }
                  >
                    🎙️ صدا
                  </span>
                </div>

                <div
                  style={
                    styles.suggestions
                  }
                >
                  {
                    SUGGESTIONS.map(
                      (suggestion) => (
                        <button
                          key={
                            suggestion
                          }
                          type="button"
                          style={
                            styles.suggestion
                          }
                          onClick={
                            () =>
                              send(
                                suggestion
                              )
                          }
                          disabled={
                            unavailable
                            || askMutation
                              .isPending
                          }
                        >
                          <span>
                            ↗
                          </span>

                          {suggestion}
                        </button>
                      )
                    )
                  }
                </div>
              </div>
            )
          }

          {
            messages.map(
              (
                item,
                index
              ) => {
                const isUser =
                  item.role
                  === 'user';

                const isReported =
                  reported.has(
                    item.id
                  );

                return (
                  <article
                    key={
                      item.id
                      || `${
                        item.role
                      }-${index}`
                    }
                    style={{
                      ...styles
                        .messageRow,

                      justifyContent:
                        isUser
                          ? 'flex-start'
                          : 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        ...styles
                          .bubble,

                        ...(
                          isUser
                            ? styles
                                .userBubble
                            : styles
                                .assistantBubble
                        ),

                        ...(
                          item.failed
                            ? styles
                                .failedBubble
                            : {}
                        ),
                      }}
                    >
                      <div
                        style={
                          styles.bubbleHead
                        }
                      >
                        <span>
                          {
                            isUser
                              ? 'شما'
                              : '✦ هوشیار'
                          }
                        </span>

                        {
                          item.failed
                          && (
                            <span
                              style={
                                styles.failedText
                              }
                            >
                              ارسال ناموفق
                            </span>
                          )
                        }
                      </div>

                      {
                        item.attachment
                        && (
                          <div
                            style={
                              styles.messageAttachment
                            }
                          >
                            <span
                              style={
                                styles.messageAttachmentIcon
                              }
                            >
                              {
                                kindIcon(
                                  item
                                    .attachment
                                    .kind
                                )
                              }
                            </span>

                            <span
                              style={
                                styles.messageAttachmentText
                              }
                            >
                              <b>
                                {
                                  item
                                    .attachment
                                    .name
                                  || kindLabel(
                                    item
                                      .attachment
                                      .kind
                                  )
                                }
                              </b>

                              {
                                item
                                  .attachment
                                  .size
                                  ? formatBytes(
                                    item
                                      .attachment
                                      .size
                                  )
                                  : ''
                              }
                            </span>
                          </div>
                        )
                      }

                      <div
                        dir="auto"
                        style={
                          styles.messageText
                        }
                      >
                        {item.text}
                      </div>

                      {
                        !isUser
                        && item.text
                        && (
                          <div
                            style={
                              styles.answerActions
                            }
                          >
                            <button
                              type="button"
                              style={
                                styles.miniAction
                              }
                              onClick={
                                () =>
                                  followUp(
                                    'example'
                                  )
                              }
                              disabled={
                                askMutation
                                  .isPending
                                || unavailable
                              }
                            >
                              مثال
                            </button>

                            <button
                              type="button"
                              style={
                                styles.miniAction
                              }
                              onClick={
                                () =>
                                  followUp(
                                    'summary'
                                  )
                              }
                              disabled={
                                askMutation
                                  .isPending
                                || unavailable
                              }
                            >
                              خلاصه
                            </button>

                            <button
                              type="button"
                              style={
                                styles.miniAction
                              }
                              onClick={
                                () =>
                                  followUp(
                                    'similar'
                                  )
                              }
                              disabled={
                                askMutation
                                  .isPending
                                || unavailable
                              }
                            >
                              سؤال مشابه
                            </button>

                            <button
                              type="button"
                              style={{
                                ...styles
                                  .miniAction,

                                ...styles
                                  .reportAction,
                              }}
                              onClick={
                                () =>
                                  reportAnswer(
                                    item,
                                    index
                                  )
                              }
                              disabled={
                                isReported
                                || reportMutation
                                  .isPending
                              }
                            >
                              {
                                isReported
                                  ? 'گزارش شد ✓'
                                  : 'گزارش'
                              }
                            </button>
                          </div>
                        )
                      }
                    </div>
                  </article>
                );
              }
            )
          }

          {
            askMutation.isPending
            && (
              <div
                style={{
                  ...styles.messageRow,

                  justifyContent:
                    'flex-end',
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...styles
                      .assistantBubble,
                    ...styles
                      .thinkingBubble,
                  }}
                >
                  <Spinner
                    size={18}
                  />

                  <span>
                    {
                      uploadProgress > 0
                      && uploadProgress < 100
                        ? (
                          `در حال بارگذاری فایل... ${
                            uploadProgress
                              .toLocaleString(
                                'fa-IR'
                              )
                          }٪`
                        )
                        : uploadProgress
                          === 100
                          ? 'فایل رسید؛ هوشیار در حال بررسی است...'
                          : 'هوشیار در حال فکر کردن است...'
                    }
                  </span>
                </div>
              </div>
            )
          }

          <div ref={endRef} />
        </section>

        <section
          className="glass"
          style={styles.composer}
        >
          {
            selectedFile
            && (
              <div
                style={
                  styles.selectedFile
                }
              >
                {
                  selectedKind
                    === 'image'
                  && previewUrl
                    ? (
                      <img
                        src={
                          previewUrl
                        }
                        alt="پیش‌نمایش فایل انتخابی"
                        style={
                          styles.imagePreview
                        }
                      />
                    )
                    : (
                      <div
                        style={
                          styles.filePreviewIcon
                        }
                      >
                        {
                          kindIcon(
                            selectedKind
                          )
                        }
                      </div>
                    )
                }

                <div
                  style={
                    styles.selectedFileInfo
                  }
                >
                  <strong
                    style={
                      styles.selectedFileName
                    }
                  >
                    {
                      selectedFile
                        .name
                    }
                  </strong>

                  <span
                    style={
                      styles.selectedFileMeta
                    }
                  >
                    {
                      kindLabel(
                        selectedKind
                      )
                    }

                    {' · '}

                    {
                      formatBytes(
                        selectedFile
                          .size
                      )
                    }

                    {
                      selectedKind
                        === 'pdf'
                        ? ' · مرجع ۴۸ ساعته'
                        : ''
                    }
                  </span>

                  {
                    selectedKind
                      === 'audio'
                    && previewUrl
                    && (
                      <audio
                        controls
                        preload="metadata"
                        src={previewUrl}
                        style={
                          styles.audioPreview
                        }
                      />
                    )
                  }
                </div>

                <button
                  type="button"
                  style={
                    styles.removeFile
                  }
                  onClick={
                    removeFile
                  }
                  disabled={
                    askMutation
                      .isPending
                  }
                  aria-label="حذف فایل انتخابی"
                >
                  ×
                </button>
              </div>
            )
          }

          {
            isRecording
              ? (
                <div
                  style={
                    styles.recordingBar
                  }
                >
                  <span
                    style={
                      styles.recordingDot
                    }
                  />

                  <div
                    style={
                      styles.recordingText
                    }
                  >
                    <strong>
                      در حال ضبط صدا
                    </strong>

                    <span>
                      {
                        formatDuration(
                          recordingSeconds
                        )
                      }
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-d"
                    onClick={
                      stopRecording
                    }
                    style={
                      styles.stopButton
                    }
                  >
                    ■ پایان ضبط
                  </button>
                </div>
              )
              : (
                <>
                  <textarea
                    className="inp"
                    value={input}
                    onChange={
                      (event) =>
                        setInput(
                          event
                            .target
                            .value
                            .slice(
                              0,
                              maxInputChars
                            )
                        )
                    }
                    onKeyDown={
                      (event) => {
                        if (
                          event.key
                            === 'Enter'
                          && !event
                            .shiftKey
                        ) {
                          event
                            .preventDefault();

                          send();
                        }
                      }
                    }
                    onInput={
                      (event) => {
                        event
                          .currentTarget
                          .style
                          .height =
                          'auto';

                        event
                          .currentTarget
                          .style
                          .height =
                          `${
                            Math.min(
                              event
                                .currentTarget
                                .scrollHeight,

                              120
                            )
                          }px`;
                      }
                    }
                    rows={1}
                    maxLength={
                      maxInputChars
                    }
                    placeholder={
                      selectedFile
                        ? 'توضیح یا سؤال درباره فایل (اختیاری)'
                        : 'سؤالت را از هوشیار بپرس...'
                    }
                    disabled={
                      unavailable
                      || askMutation
                        .isPending
                    }
                    style={
                      styles.textarea
                    }
                    aria-label="متن سؤال"
                  />

                  <div
                    style={
                      styles.composerActions
                    }
                  >
                    <div
                      style={
                        styles.mediaActions
                      }
                    >
                      <input
                        ref={
                          fileInputRef
                        }
                        type="file"
                        accept={
                          ACCEPTED_FILES
                        }
                        onChange={
                          handleFileInput
                        }
                        style={
                          styles.hiddenInput
                        }
                        tabIndex={-1}
                      />

                      <button
                        type="button"
                        style={
                          styles.mediaButton
                        }
                        onClick={
                          () =>
                            fileInputRef
                              .current
                              ?.click()
                        }
                        disabled={
                          unavailable
                          || askMutation
                            .isPending
                        }
                        aria-label="انتخاب عکس، PDF یا فایل صوتی"
                        title="انتخاب عکس، PDF یا فایل صوتی"
                      >
                        ＋
                        <span>
                          فایل
                        </span>
                      </button>

                      <button
                        type="button"
                        style={
                          styles.mediaButton
                        }
                        onClick={
                          startRecording
                        }
                        disabled={
                          unavailable
                          || askMutation
                            .isPending
                          || capabilities
                            .audio
                            === false
                        }
                        aria-label="ضبط پیام صوتی"
                        title="ضبط پیام صوتی"
                      >
                        🎙️
                        <span>
                          ضبط
                        </span>
                      </button>
                    </div>

                    <span
                      style={
                        styles.characterCount
                      }
                    >
                      {
                        input.length
                          .toLocaleString(
                            'fa-IR'
                          )
                      }

                      /

                      {
                        maxInputChars
                          .toLocaleString(
                            'fa-IR'
                          )
                      }
                    </span>

                    <button
                      type="button"
                      className="btn btn-p"
                      onClick={
                        () => send()
                      }
                      disabled={
                        !canSend
                      }
                      style={
                        styles.sendButton
                      }
                    >
                      {
                        askMutation
                          .isPending
                          ? (
                            <Spinner
                              size={18}
                              color="#fff"
                            />
                          )
                          : 'ارسال ↑'
                      }
                    </button>
                  </div>
                </>
              )
          }

          {
            uploadProgress > 0
            && askMutation
              .isPending
            && (
              <div
                className="pbar"
                style={
                  styles.uploadBar
                }
              >
                <div
                  className="pbar-f"
                  style={{
                    width:
                      `${uploadProgress}%`,
                  }}
                />
              </div>
            )
          }

          <p
            style={
              styles.disclaimer
            }
          >
            هوشیار ابزار کمک‌آموزشی است؛ پاسخ‌های حساس پزشکی را با منبع درسی بررسی کن.
          </p>
        </section>
      </main>
    </>
  );
}


const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingInline: 12,
  },

  headerButton: {
    minHeight: 32,
    padding: '5px 9px',
    fontSize: 11,
  },

  statusCard: {
    padding: 14,

    background:
      'linear-gradient(145deg, rgba(29,78,216,.23), rgba(16,24,39,.96) 55%, rgba(34,211,238,.08))',
  },

  statusTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  aiAvatar: {
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 42px',
    width: 42,
    height: 42,
    color: '#fff',
    fontSize: 22,
    borderRadius: 14,
    background:
      'var(--grad-brand)',
    boxShadow:
      'var(--shd-glow)',
  },

  statusText: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,
  },

  statusTitle: {
    fontSize: 13.5,
  },

  statusSubtitle: {
    color: 'var(--tx2)',
    fontSize: 10.5,
  },

  statusMeta: {
    display: 'flex',
    justifyContent:
      'space-between',
    gap: 10,
    marginTop: 12,
    color: 'var(--tx2)',
    fontSize: 10.5,
  },

  quotaBar: {
    height: 5,
    marginTop: 8,
  },

  referenceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 11,

    borderColor:
      'rgba(245,158,11,.25)',

    background:
      'linear-gradient(135deg, rgba(245,158,11,.1), rgba(16,24,39,.94) 55%)',
  },

  referenceIcon: {
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 42px',
    width: 42,
    height: 42,
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: 900,

    border:
      '1px solid rgba(245,158,11,.3)',

    borderRadius: 12,

    background:
      'rgba(245,158,11,.1)',
  },

  referenceText: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,
  },

  referenceName: {
    overflow: 'hidden',
    fontSize: 12,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  referenceHint: {
    color: 'var(--tx2)',
    fontSize: 9.5,
    lineHeight: 1.7,
  },

  referenceExpiry: {
    color: '#FCD34D',
    fontSize: 9,
  },

  iconButton: {
    flex: '0 0 32px',
    width: 32,
    minHeight: 32,
    padding: 0,
    fontSize: 20,
  },

  unavailableCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,

    borderColor:
      'rgba(239,68,68,.22)',

    background:
      'rgba(239,68,68,.08)',
  },

  unavailableIcon: {
    fontSize: 24,
  },

  unavailableText: {
    marginTop: 4,
    color: 'var(--tx2)',
    fontSize: 11,
    lineHeight: 1.8,
  },

  chatArea: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '38vh',
    gap: 10,
    padding: '4px 1px',
  },

  loadingList: {
    display: 'grid',
    gap: 10,
  },

  welcome: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    padding:
      '24px 6px 14px',
    textAlign: 'center',
  },

  welcomeOrb: {
    display: 'grid',
    placeItems: 'center',
    width: 62,
    height: 62,
    marginBottom: 12,
    color: '#fff',
    fontSize: 29,

    border:
      '1px solid rgba(34,211,238,.4)',

    borderRadius: 22,

    background:
      'var(--grad-brand)',

    boxShadow:
      '0 12px 38px rgba(59,130,246,.34)',
  },

  welcomeTitle: {
    fontSize: 19,
  },

  welcomeText: {
    maxWidth: 390,
    marginTop: 7,
    color: 'var(--tx2)',
    fontSize: 11.5,
    lineHeight: 2,
  },

  capabilityGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },

  capabilityChip: {
    padding: '5px 9px',
    color: 'var(--tx2)',
    fontSize: 10,

    border:
      '1px solid var(--bd)',

    borderRadius: 999,

    background:
      'rgba(24,34,53,.7)',
  },

  suggestions: {
    display: 'grid',
    width: '100%',
    gap: 7,
    marginTop: 18,
  },

  suggestion: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    padding: '10px 11px',
    color: 'var(--tx2)',
    fontFamily: 'inherit',
    fontSize: 10.5,
    textAlign: 'right',
    cursor: 'pointer',

    border:
      '1px solid var(--bd)',

    borderRadius: 12,

    background:
      'rgba(16,24,39,.72)',
  },

  messageRow: {
    display: 'flex',
    width: '100%',
  },

  bubble: {
    width: 'fit-content',
    maxWidth: '91%',
    padding: '10px 11px',

    border:
      '1px solid var(--bd)',

    borderRadius: 16,

    boxShadow:
      'var(--shd-1)',
  },

  userBubble: {
    color: '#fff',
    borderBottomRightRadius: 5,

    borderColor:
      'rgba(59,130,246,.38)',

    background:
      'linear-gradient(135deg, rgba(29,78,216,.9), rgba(59,130,246,.72))',
  },

  assistantBubble: {
    borderBottomLeftRadius: 5,

    background:
      'rgba(16,24,39,.94)',
  },

  failedBubble: {
    borderColor:
      'rgba(239,68,68,.46)',

    opacity: 0.74,
  },

  bubbleHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 12,
    marginBottom: 5,

    color:
      'rgba(255,255,255,.68)',

    fontSize: 9,
    fontWeight: 800,
  },

  failedText: {
    color: '#FDA4AF',
  },

  messageText: {
    color: 'inherit',
    fontSize: 12,
    lineHeight: 2,
    overflowWrap: 'anywhere',
    textAlign: 'start',
    whiteSpace: 'pre-wrap',
  },

  messageAttachment: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 190,
    marginBottom: 7,
    padding: 8,

    border:
      '1px solid rgba(255,255,255,.13)',

    borderRadius: 11,

    background:
      'rgba(4,9,18,.22)',
  },

  messageAttachmentIcon: {
    fontSize: 22,
  },

  messageAttachmentText: {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: 1,

    color:
      'rgba(255,255,255,.72)',

    fontSize: 9,
  },

  answerActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 9,
    paddingTop: 8,

    borderTop:
      '1px solid var(--bd)',
  },

  miniAction: {
    padding: '4px 7px',
    color: '#70A7FF',
    fontFamily: 'inherit',
    fontSize: 9,
    cursor: 'pointer',

    border:
      '1px solid rgba(59,130,246,.2)',

    borderRadius: 8,

    background:
      'rgba(59,130,246,.08)',
  },

  reportAction: {
    marginRight: 'auto',
    color: '#FCA5A5',

    borderColor:
      'rgba(239,68,68,.18)',

    background:
      'rgba(239,68,68,.07)',
  },

  thinkingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--tx2)',
    fontSize: 10.5,
  },

  composer: {
    position: 'sticky',

    bottom:
      'calc(var(--nav-h) + 8px + env(safe-area-inset-bottom))',

    zIndex: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 2,
    padding: 9,

    border:
      '1px solid rgba(148,163,184,.18)',

    borderRadius: 18,

    boxShadow:
      '0 16px 42px rgba(0,0,0,.42)',
  },

  textarea: {
    minHeight: 43,
    maxHeight: 120,
    resize: 'none',
    padding: '10px 11px',
    fontSize: 12,
    lineHeight: 1.8,
  },

  composerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },

  mediaActions: {
    display: 'flex',
    gap: 5,
  },

  hiddenInput: {
    display: 'none',
  },

  mediaButton: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 34,
    gap: 3,
    padding: '5px 8px',
    color: 'var(--tx2)',
    fontFamily: 'inherit',
    fontSize: 9.5,
    cursor: 'pointer',

    border:
      '1px solid var(--bd)',

    borderRadius: 10,

    background:
      'rgba(24,34,53,.82)',
  },

  characterCount: {
    marginRight: 'auto',
    color: 'var(--txm)',
    fontSize: 8.5,
    direction: 'ltr',
  },

  sendButton: {
    minHeight: 35,
    padding: '6px 12px',
    fontSize: 11,
  },

  selectedFile: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 7,

    border:
      '1px solid rgba(59,130,246,.25)',

    borderRadius: 12,

    background:
      'rgba(59,130,246,.08)',
  },

  imagePreview: {
    flex: '0 0 48px',
    width: 48,
    height: 48,
    objectFit: 'cover',
    borderRadius: 9,
  },

  filePreviewIcon: {
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 48px',
    width: 48,
    height: 48,
    fontSize: 24,
    borderRadius: 9,

    background:
      'rgba(0,0,0,.18)',
  },

  selectedFileInfo: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,
  },

  selectedFileName: {
    overflow: 'hidden',
    fontSize: 10.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  selectedFileMeta: {
    color: 'var(--tx2)',
    fontSize: 8.5,
  },

  audioPreview: {
    width: '100%',
    height: 28,
    marginTop: 3,
  },

  removeFile: {
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 28px',
    width: 28,
    height: 28,
    color: '#FDA4AF',
    fontFamily: 'inherit',
    fontSize: 19,
    cursor: 'pointer',

    border:
      '1px solid rgba(239,68,68,.2)',

    borderRadius: 9,

    background:
      'rgba(239,68,68,.08)',
  },

  recordingBar: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 54,
    gap: 10,
    padding: 8,

    border:
      '1px solid rgba(239,68,68,.25)',

    borderRadius: 12,

    background:
      'rgba(239,68,68,.08)',
  },

  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#FB7185',

    boxShadow:
      '0 0 0 6px rgba(239,68,68,.12)',
  },

  recordingText: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    color: 'var(--tx2)',
    fontSize: 10,
  },

  stopButton: {
    minHeight: 34,
    padding: '5px 9px',
    fontSize: 10,
  },

  uploadBar: {
    height: 4,
  },

  disclaimer: {
    color: 'var(--txm)',
    fontSize: 8.2,
    lineHeight: 1.6,
    textAlign: 'center',
  },
};
