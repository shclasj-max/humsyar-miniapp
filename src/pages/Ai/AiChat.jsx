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
  Spinner,
} from '../../components/shared/Loading';
import ChatHistorySheet from '../../components/ai/ChatHistorySheet';
import api from '../../lib/api';
import {
  haptic,
  hapticNotif,
} from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';


const FALLBACK_MAX_MEDIA_BYTES = 15 * 1024 * 1024;
const FALLBACK_MAX_INPUT_CHARS = 2000;

// گفت‌وگوی فعال بین نشست‌ها حفظ می‌شود تا کاربر
// دقیقاً از همان‌جایی که رفته بود ادامه دهد
const ACTIVE_CONV_KEY = 'humsyar_ai_conv';
const LEGACY_ID = 'legacy';

// فاصله‌ی مجاز از ته صفحه که هنوز «نزدیک انتها»
// حساب شود — بر اساس آن اسکرول خودکار و چیپ
// پرش تصمیم می‌گیرند
const NEAR_BOTTOM_PX = 90;


/* کارت‌های پیشنهادی حالت خالی — الهام از اپ‌های
   درجه‌ی یک؛ هر کارت یا پرامپت آماده می‌فرستد یا
   مستقیم فایل‌پیکر را باز می‌کند */
const SUGGESTIONS = [
  {
    icon: '📅',
    title: 'برنامه‌ریزی درسی',
    desc: 'برنامه‌ی هفتگی متناسب با درس‌ها',
    prompt:
      'یک برنامه‌ی مطالعه‌ی هفتگی برای دروس ' +
      'اصلی پزشکی طراحی کن؛ با تکنیک‌های ' +
      'مطالعه‌ی مؤثر و مرور فعال.',
  },

  {
    icon: '🩺',
    title: 'پرسش پزشکی',
    desc: 'توضیح ساده‌ی مفاهیم سخت',
    prompt:
      'مبحث پتانسیل عمل را ساده، نکته‌ای و ' +
      'مثال‌دار توضیح بده.',
  },

  {
    icon: '📄',
    title: 'خلاصه‌ی جزوه',
    desc: 'چکیده‌سازی نکته‌محور',
    prompt:
      'چطور از یک فصل جزوه خلاصه‌ی نکته‌محور ' +
      'بگیرم؟ قالب پیشنهادی بده و با یک مثال ' +
      'نشان بده.',
  },

  {
    icon: '📝',
    title: 'آزمون تستی',
    desc: 'سؤال چهارگزینه‌ای با پاسخ',
    prompt:
      'از فیزیولوژی تنفس یک سؤال چهارگزینه‌ای ' +
      'در سطح امتحان بساز و پاسخ تشریحی بده.',
  },

  {
    icon: '🏛️',
    title: 'سؤالات دانشگاه',
    desc: 'سبک امتحانات تشریحی',
    prompt:
      'سه سؤال تشریحی شبیه امتحان دانشگاه از ' +
      'آناتومی قلب طرح کن و معیار نمره‌دهی بگو.',
  },

  {
    icon: '🖼️',
    title: 'تحلیل تصاویر',
    desc: 'عکس سؤال یا دیاگرام بفرست',
    action: 'pick-file',
  },
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


function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail[0]?.msg) {
    return String(detail[0].msg);
  }

  if (error?.code === 'ECONNABORTED') {
    return 'پاسخ هوشیار بیش از حد طول کشید؛ دوباره امتحان کنید';
  }

  return fallback;
}


function fileKind(file) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    type.startsWith('image/')
    || /\.(jpe?g|png|webp)$/.test(name)
  ) {
    return 'image';
  }

  if (
    type.startsWith('audio/')
    || /\.(aac|flac|m4a|mp3|mp4|oga|ogg|wav|webm)$/.test(name)
  ) {
    return 'audio';
  }

  return 'unknown';
}


function fileIcon(kind) {
  if (kind === 'image') return '🖼️';
  if (kind === 'pdf') return '📄';
  if (kind === 'audio') return '🎙️';
  return '📎';
}


function fileLabel(kind) {
  if (kind === 'image') return 'تصویر سؤال';
  if (kind === 'pdf') return 'سند مرجع PDF';
  if (kind === 'audio') return 'پیام یا فایل صوتی';
  return 'فایل';
}


function formatBytes(bytes) {
  const value = Number(bytes || 0);

  if (value < 1024) {
    return `${value} بایت`;
  }

  if (value < 1024 * 1024) {
    return `${Math.ceil(value / 1024)} کیلوبایت`;
  }

  return `${(value / (1024 * 1024)).toLocaleString('fa-IR', {
    maximumFractionDigits: 1,
  })} مگابایت`;
}


function formatDuration(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(value / 60);
  const rest = value % 60;

  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}


function formatDate(value) {
  if (!value) {
    return 'تا ۴۸ ساعت پس از بارگذاری';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'تا ۴۸ ساعت پس از بارگذاری';
  }

  return date.toLocaleString('fa-IR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


// ساعت پیام به سبک اپ‌های چت — فقط HH:MM فارسی
function formatTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}


function messageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}


// اسکرول به ته صفحه — نرم، مگر برای کاربرانی که
// reduced-motion فعال کرده‌اند
function scrollPageToBottom(smooth = true) {
  let reduced = false;

  try {
    reduced = Boolean(
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      )?.matches,
    );

  } catch (_) {
    reduced = false;
  }

  window.scrollTo({
    top:
      document.documentElement.scrollHeight,

    behavior:
      smooth && !reduced
        ? 'smooth'
        : 'auto',
  });
}


// کپی امن در WebView — clipboard API مدرن و
// فالبک execCommand برای کلاینت‌های قدیمی
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;

  } catch (_) {
    // ادامه به فالبک
  }

  try {
    const area = document.createElement('textarea');

    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';

    document.body.appendChild(area);

    area.focus();
    area.select();

    const ok = document.execCommand('copy');

    area.remove();

    return Boolean(ok);

  } catch (_) {
    return false;
  }
}


/* ─────────────────────────────────────────────
   رندر غنی متن پاسخ — فقط React element خالص،
   بدون dangerouslySetInnerHTML

   پشتیبانی: بلوک کد ``` ، بولد ** ، کد این‌لاین ` ،
   تیتر # ، نقل‌قول > ، لیست - و 1. و لینک‌ها
───────────────────────────────────────────── */

const CODE_BLOCK_RE =
  /```(\w*)\n?([\s\S]*?)```/g;

const INLINE_RE = new RegExp(
  '(\\*\\*[^*\\n]+\\*\\*)' +
  '|(`[^`\\n]+`)' +
  '|\\[([^\\]\\n]+)\\]\\((https?:\\/\\/[^)\\s]+)\\)' +
  '|(https?:\\/\\/[^\\s)<]+)',
  'g',
);


// توکن‌های این‌لاین: بولد، کد، لینک markdown و لینک خام
function InlineText({ text }) {
  const parts = [];

  let last = 0;
  let key = 0;

  const regex = new RegExp(INLINE_RE);
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }

    const [
      token,
      bold,
      code,
      linkLabel,
      linkUrl,
      bareUrl,
    ] = match;

    if (bold) {
      parts.push(
        <strong key={key++}>
          {bold.slice(2, -2)}
        </strong>,
      );

    } else if (code) {
      parts.push(
        <code key={key++} className="msg-ic">
          {code.slice(1, -1)}
        </code>,
      );

    } else if (linkUrl) {
      parts.push(
        <a
          key={key++}
          className="msg-link"
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkLabel}
        </a>,
      );

    } else if (bareUrl) {
      parts.push(
        <a
          key={key++}
          className="msg-link"
          href={bareUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {
            bareUrl.length > 42
              ? `${bareUrl.slice(0, 42)}…`
              : bareUrl
          }
        </a>,
      );

    } else {
      parts.push(token);
    }

    last = regex.lastIndex;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return <>{parts}</>;
}


// تجمیع خطوط به پاراگراف/لیست/تیتر/نقل‌قول
function renderTextLines(text) {
  const lines = String(text).split('\n');

  const isUl = (line) =>
    /^\s*[-•*]\s+/.test(line);

  const isOl = (line) =>
    /^\s*\d{1,2}[.)]\s+/.test(line);

  const isQuote = (line) =>
    /^\s*>\s?/.test(line);

  const isHeading = (line) =>
    /^\s*#{1,3}\s+/.test(line);

  const isSpecial = (line) =>
    isUl(line) ||
    isOl(line) ||
    isQuote(line) ||
    isHeading(line);

  const blocks = [];

  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (isUl(line)) {
      const items = [];

      while (
        i < lines.length &&
        isUl(lines[i])
      ) {
        items.push(
          lines[i].replace(
            /^\s*[-•*]\s+/,
            '',
          ),
        );

        i += 1;
      }

      blocks.push(
        <ul className="msg-list" key={key++}>
          {items.map((item, j) => (
            <li key={j}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>,
      );

      continue;
    }

    if (isOl(line)) {
      const items = [];

      while (
        i < lines.length &&
        isOl(lines[i])
      ) {
        items.push(
          lines[i].replace(
            /^\s*\d{1,2}[.)]\s+/,
            '',
          ),
        );

        i += 1;
      }

      blocks.push(
        <ol className="msg-list" key={key++}>
          {items.map((item, j) => (
            <li key={j}>
              <InlineText text={item} />
            </li>
          ))}
        </ol>,
      );

      continue;
    }

    if (isQuote(line)) {
      const quoted = [];

      while (
        i < lines.length &&
        isQuote(lines[i])
      ) {
        quoted.push(
          lines[i].replace(/^\s*>\s?/, ''),
        );

        i += 1;
      }

      blocks.push(
        <div className="msg-quote" key={key++}>
          {quoted.map((item, j) => (
            <div key={j} dir="auto">
              <InlineText text={item} />
            </div>
          ))}
        </div>,
      );

      continue;
    }

    if (isHeading(line)) {
      blocks.push(
        <div className="msg-h" key={key++} dir="auto">
          <InlineText
            text={line.replace(
              /^\s*#{1,3}\s+/,
              '',
            )}
          />
        </div>,
      );

      i += 1;

      continue;
    }

    // خط ساده — خطوط ساده‌ی پشت‌سرهم در یک
    // پاراگراف با حفظ خط‌جدید ادغام می‌شوند
    const plain = [];

    while (
      i < lines.length &&
      lines[i].trim() &&
      !isSpecial(lines[i])
    ) {
      plain.push(lines[i]);
      i += 1;
    }

    blocks.push(
      <p
        key={key++}
        dir="auto"
        style={{
          margin: '0 0 4px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {plain.map((item, j) => (
          <span key={j}>
            {j > 0 ? '\n' : ''}
            <InlineText text={item} />
          </span>
        ))}
      </p>,
    );
  }

  return blocks;
}


function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);


  const copy = async () => {
    const ok = await copyText(code);

    if (ok) {
      haptic('light');

      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        1500,
      );
    }
  };


  return (
    <div className="msg-code">
      <div className="msg-code__bar">
        <span>{lang || 'code'}</span>

        <button
          type="button"
          className="msg-code__copy"
          onClick={copy}
        >
          {
            copied
              ? '✓ کپی شد'
              : 'کپی'
          }
        </button>
      </div>

      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}


function RichText({ text }) {
  const blocks = [];

  let last = 0;
  let key = 0;

  const source = String(text || '');

  const regex = new RegExp(CODE_BLOCK_RE);
  let match;

  while ((match = regex.exec(source)) !== null) {
    if (match.index > last) {
      blocks.push(
        <div key={key++}>
          {renderTextLines(
            source.slice(last, match.index),
          )}
        </div>,
      );
    }

    blocks.push(
      <CodeBlock
        key={key++}
        lang={match[1]}
        code={String(match[2]).replace(/\n$/, '')}
      />,
    );

    last = regex.lastIndex;
  }

  if (last < source.length) {
    blocks.push(
      <div key={key++}>
        {renderTextLines(source.slice(last))}
      </div>,
    );
  }

  return <>{blocks}</>;
}


/* نشانگر تایپینگ — سه نقطه‌ی تنفسی + برچسب
   وضعیت (آپلود/فکر) */
function TypingBubble({ label }) {
  return (
    <div className="msg-row">
      <div className="msg msg--ai msg-in">
        <div className="typing">
          <span className="typing__dots">
            <span className="typing__dot" />
            <span className="typing__dot" />
            <span className="typing__dot" />
          </span>

          <span className="typing__label">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}


/* یک ردیف پیام کامل — حباب، ضمیمه، متن غنی،
   زمان و اکشن‌های پاسخ */
function MessageRow({
  item,
  index,
  reported,
  actionsDisabled,
  onFollowUp,
  onReport,
  onCopy,
}) {
  const isUser = item.role === 'user';

  const time = formatTime(item.at);

  return (
    <article
      className={
        'msg-row' +
        (isUser ? ' msg-row--me' : '')
      }
    >
      <div
        className={
          'msg ' +
          (item.fresh ? 'msg-in ' : '') +
          (isUser ? 'msg--me' : 'msg--ai') +
          (item.failed ? ' msg--failed' : '')
        }
      >
        <div className="msg__head">
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
              <span className="msg__fail">
                ارسال ناموفق
              </span>
            )
          }
        </div>

        {
          item.attachment
          && (
            <div className="msg-attach">
              <span className="msg-attach__icon">
                {fileIcon(item.attachment.kind)}
              </span>

              <span className="msg-attach__info">
                <b>
                  {
                    item.attachment.name
                    || fileLabel(item.attachment.kind)
                  }
                </b>

                {
                  item.attachment.size
                    ? formatBytes(item.attachment.size)
                    : ''
                }
              </span>
            </div>
          )
        }

        <div className="msg__text">
          {
            isUser
              ? (
                <span dir="auto">{item.text}</span>
              )
              : (
                <RichText text={item.text} />
              )
          }
        </div>

        {
          time
          && (
            <div className="msg__time">
              {time}
            </div>
          )
        }

        {
          !isUser
          && item.text
          && (
            <div className="msg__actions">
              <button
                type="button"
                className="msg-act"
                onClick={() => onFollowUp('example')}
                disabled={actionsDisabled}
              >
                مثال
              </button>

              <button
                type="button"
                className="msg-act"
                onClick={() => onFollowUp('summary')}
                disabled={actionsDisabled}
              >
                خلاصه
              </button>

              <button
                type="button"
                className="msg-act"
                onClick={() => onFollowUp('similar')}
                disabled={actionsDisabled}
              >
                سؤال مشابه
              </button>

              <button
                type="button"
                className="msg-act"
                onClick={() => onCopy(item.text)}
              >
                کپی
              </button>

              <button
                type="button"
                className="msg-act msg-act--danger"
                onClick={() => onReport(item, index)}
                disabled={
                  reported
                  || actionsDisabled
                }
              >
                {
                  reported
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


export default function AiChat() {
  // live = پیام‌های گفت‌وگوی فعال — از کوئری
  // بذر می‌شود و بعد به‌صورت خوش‌بینانه رشد
  // می‌کند تا هیچ پرشی دیده نشود
  const [live, setLive] = useState([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reported, setReported] = useState(() => new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');


  const [activeConv, setActiveConv] = useState(
    () => {
      try {
        return (
          window.localStorage
            .getItem(ACTIVE_CONV_KEY)
          || LEGACY_ID
        );

      } catch (_) {
        return LEGACY_ID;
      }
    },
  );

  const [showHistory, setShowHistory] =
    useState(false);

  const [showArchived, setShowArchived] =
    useState(false);

  const [showJump, setShowJump] = useState(false);

  // seedTick با هر بار بذردهی live زیاد می‌شود
  // تا افکت بازیابی اسکرول بعد از پِیِنت اجرا شود
  const [seedTick, setSeedTick] = useState(0);


  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // حافظه‌ی موقعیت اسکرول هر گفت‌وگو — تعویض
  // رشته بدون از‌دست‌دادن جای خواندن
  const scrollMapRef = useRef({});
  const activeConvRef = useRef(activeConv);
  const nearBottomRef = useRef(true);
  const lastSeededRef = useRef(null);
  const skipAutoScrollRef = useRef(false);

  // id رشته‌ای که تازه ساخته‌ایم اما فهرست هنوز
  // ری‌فچ نشده — مانع می‌شود اعتبارسنجی، رشته‌ی
  // تازه را «ناموجود» بشمارد و به مشترک برگرداند
  const pendingNewConvRef = useRef(null);

  const taRef = useRef(null);


  const toast = useUIStore((state) => state.toast);
  const queryClient = useQueryClient();


  useEffect(() => {
    activeConvRef.current = activeConv;

    try {
      window.localStorage.setItem(
        ACTIVE_CONV_KEY,
        activeConv,
      );

    } catch (_) {
      // WebView محدود — فقط حافظه‌ی نشست
    }
  }, [activeConv]);


  const {
    data: status,
    isLoading: statusLoading,
  } = useQuery({
    queryKey: ['ai-status'],

    queryFn: () => api
      .get('/api/ai/status')
      .then((response) => response.data),

    refetchInterval: 60_000,
  });


  // فهرست گفت‌وگوها — با فلگ بایگانی دوباره
  // خوانده می‌شود
  const {
    data: convData,
    isSuccess: convsLoaded,
  } = useQuery({
    queryKey: [
      'ai-conversations',
      showArchived,
    ],

    queryFn: () => api
      .get('/api/ai/conversations', {
        params: {
          include_archived: showArchived,
        },
      })
      .then((response) => response.data),

    staleTime: 15_000,
  });

  const conversations =
    convData?.conversations || [];


  // پیام‌های رشته‌ی فعال — legacy از همان مسیر
  // تاریخچه‌ی مشترک می‌آید؛ بقیه از رشته‌ی خودشان
  const msgsQuery = useQuery({
    queryKey: ['ai-conv-msgs', activeConv],

    queryFn: () =>
      activeConv === LEGACY_ID
        ? api
            .get('/api/ai/history')
            .then((response) =>
              Array.isArray(
                response.data?.messages,
              )
                ? response.data.messages
                : [],
            )
        : api
            .get(
              `/api/ai/conversations/` +
              `${activeConv}/messages`,
            )
            .then((response) =>
              Array.isArray(
                response.data?.messages,
              )
                ? response.data.messages
                : [],
            ),

    // تا مشخص نشود رشته واقعاً وجود دارد، درخواست
    // نزن (مانع ۴۰۴ برای id بایگانی‌شده/حذف‌شده)
    enabled:
      activeConv === LEGACY_ID ||
      conversations.some(
        (item) => item.id === activeConv,
      ),

    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });


  // اگر رشته‌ی فعال دیگر در فهرست نبود (حذف یا
  // بایگانی در جای دیگر) به رشته‌ی مشترک برگرد
  useEffect(() => {
    if (
      activeConv === LEGACY_ID ||
      !convsLoaded
    ) {
      return;
    }

    const found = conversations.some(
      (item) => item.id === activeConv,
    );

    if (found) {
      // رشته‌ی تازه وارد فهرست شد — حفاظ موقت برداشته می‌شود
      if (pendingNewConvRef.current === activeConv) {
        pendingNewConvRef.current = null;
      }

      return;
    }

    // رشته‌ی تازه‌ساخته هنوز در ری‌فچ فهرست نیامده —
    // صبر کن، برنگرد
    if (pendingNewConvRef.current === activeConv) {
      return;
    }

    setActiveConv(LEGACY_ID);
  }, [
    activeConv,
    convsLoaded,
    conversations,
  ]);


  // بذردهی live از کوئری — فقط یک‌بار برای هر
  // رشته؛ رفرش‌های بعدیِ همان رشته نباید پیام‌های
  // خوش‌بینانه‌ی در حال پرواز را بپوشانند
  useEffect(() => {
    if (!msgsQuery.data) {
      return;
    }

    if (lastSeededRef.current === activeConv) {
      return;
    }

    lastSeededRef.current = activeConv;

    skipAutoScrollRef.current = true;

    // انیمیشن ورود فقط برای تازه‌ترین دور پیام‌ها —
    // پخش دوباره‌ی انیمیشن روی کل تاریخچه (تا ۱۲۰
    // حباب) در برگشت به رشته باعث جَنک می‌شود
    const length = msgsQuery.data.length;

    setLive(
      msgsQuery.data.map(
        (item, index) => ({
          ...item,
          id: `${activeConv}-${index}`,
          fresh: index >= length - 2,
        }),
      ),
    );

    setSeedTick((tick) => tick + 1);
  }, [msgsQuery.data, activeConv]);


  // بازیابی موقعیت اسکرول رشته‌ی جدید — بعد از
  // دو فریم، تا ارتفاع محتوا پایدار شده باشد
  useEffect(() => {
    if (seedTick === 0) {
      return;
    }

    const frames = window.requestAnimationFrame(
      () => {
        window.requestAnimationFrame(() => {
          const saved =
            scrollMapRef.current[activeConv];

          if (typeof saved === 'number') {
            window.scrollTo(0, saved);

          } else {
            window.scrollTo(
              0,
              document.documentElement
                .scrollHeight,
            );
          }

          nearBottomRef.current = (
            document.documentElement.scrollHeight -
            (window.scrollY + window.innerHeight)
          ) < NEAR_BOTTOM_PX;
        });
      },
    );

    return () =>
      window.cancelAnimationFrame(frames);
  }, [seedTick, activeConv]);


  // شنونده‌ی اسکرول — ذخیره‌ی موقعیت رشته‌ی
  // فعال + تشخیص نزدیکی به انتها
  useEffect(() => {
    const onScroll = () => {
      scrollMapRef.current[
        activeConvRef.current
      ] = window.scrollY;

      const near = (
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight)
      ) < NEAR_BOTTOM_PX;

      if (near !== nearBottomRef.current) {
        nearBottomRef.current = near;

        if (near) {
          setShowJump(false);
        }
      }
    };

    window.addEventListener(
      'scroll',
      onScroll,
      { passive: true },
    );

    onScroll();

    return () =>
      window.removeEventListener(
        'scroll',
        onScroll,
      );
  }, []);


  const maxMediaBytes = (
    Number(status?.max_media_bytes)
    || FALLBACK_MAX_MEDIA_BYTES
  );

  const maxInputChars = (
    Number(status?.max_input_chars)
    || FALLBACK_MAX_INPUT_CHARS
  );

  const capabilities = status?.capabilities || {};
  const activeReference = status?.active_reference || null;

  const unavailable = (
    !status?.enabled
    || status?.banned
  );

  const selectedKind = fileKind(selectedFile);


  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);


  useEffect(() => () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
    }

    const recorder = recorderRef.current;

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }

    recordingStreamRef.current
      ?.getTracks?.()
      .forEach((track) => track.stop());
  }, []);


  const askMutation = useMutation({
    mutationFn: ({ message, file, conv }) => {
      if (!file) {
        const payload = { message };

        if (conv !== LEGACY_ID) {
          payload.conversation_id = conv;
        }

        return api.post(
          '/api/ai/ask',
          payload,
          { timeout: 120_000 },
        );
      }

      const form = new FormData();

      form.append(
        'message',
        message || '',
      );

      form.append(
        'file',
        file,
        file.name,
      );

      if (conv !== LEGACY_ID) {
        form.append('conversation_id', conv);
      }

      setUploadProgress(1);

      return api.post(
        '/api/ai/ask-media',
        form,
        {
          timeout: 180_000,

          onUploadProgress: (event) => {
            if (!event.total) {
              setUploadProgress(
                (current) => Math.max(current, 12),
              );

              return;
            }

            const percent = Math.round(
              (event.loaded * 100) / event.total,
            );

            setUploadProgress(
              Math.min(
                100,
                Math.max(1, percent),
              ),
            );
          },
        },
      );
    },

    onSuccess: (response, variables) => {
      hapticNotif('success');

      const answer = String(
        response.data?.answer || '',
      );

      const nowIso = new Date().toISOString();

      // پاسخ فقط به live همان رشته‌ای اضافه می‌شود
      // که هنوز باز است — در غیر این صورت کش رشته‌ی
      // مبدأ هم‌گام می‌شود و رشته‌ی فعال آلوده نمی‌شود
      if (activeConvRef.current === variables.conv) {
        setLive((current) => [
          ...current.map((item) => (
            item.id === variables.clientId
              ? {
                  ...item,
                  failed: false,
                }
              : item
          )),

          {
            id: messageId('assistant'),
            role: 'assistant',
            text: answer,
            at: nowIso,
            fresh: true,
          },
        ]);
      }

      // کش همان رشته را هم‌گام نگه می‌داریم تا
      // برگشت بعدی به این رشته لحظه‌ای و بدون
      // لودینگ باشد
      queryClient.setQueryData(
        ['ai-conv-msgs', variables.conv],

        (old) => (
          Array.isArray(old)
            ? [
                ...old,

                {
                  role: 'user',
                  text: variables.echo,
                  at: nowIso,
                },

                {
                  role: 'assistant',
                  text: answer,
                  at: nowIso,
                },
              ]
            : old
        ),
      );

      // عنوان خودکار/پیش‌نمایش/شماره‌ی پیام رشته
      // در فهرست تازه می‌شود
      queryClient.invalidateQueries({
        queryKey: ['ai-conversations'],
      });

      queryClient.invalidateQueries({
        queryKey: ['ai-status'],
      });
    },

    onError: (error, variables) => {
      hapticNotif('error');

      setLive((current) => current.map((item) => (
        item.id === variables.clientId
          ? {
              ...item,
              failed: true,
            }
          : item
      )));

      toast(
        getErrorMessage(
          error,
          'هوشیار نتوانست پاسخ دهد',
        ),
        'error',
        4200,
      );

      queryClient.invalidateQueries({
        queryKey: ['ai-status'],
      });
    },

    onSettled: () => {
      window.setTimeout(
        () => setUploadProgress(0),
        350,
      );
    },
  });


  // اسکرول خودکار نرم — فقط وقتی پیام جدید آمده
  // (live بزرگ‌تر شده یا حباب تایپینگ ظاهر شده)
  // و کاربر نزدیک انتهاست؛ وگرنه چیپ پرش نشان
  // داده می‌شود تا جای خواندنش خراب نشود
  useEffect(() => {
    if (skipAutoScrollRef.current) {
      skipAutoScrollRef.current = false;
      return;
    }

    if (nearBottomRef.current) {
      scrollPageToBottom();

    } else {
      setShowJump(true);
    }

    // فقط رشد لیست و تغییر وضعیت ارسال مهم است
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.length, askMutation.isPending]);


  const clearReferenceMutation = useMutation({
    mutationFn: () => api.delete('/api/ai/reference'),

    onSuccess: async () => {
      hapticNotif('success');

      toast(
        'سند مرجع پاک شد',
        'success',
      );

      await queryClient.invalidateQueries({
        queryKey: ['ai-status'],
      });
    },

    onError: (error) => {
      toast(
        getErrorMessage(
          error,
          'پاک‌کردن سند مرجع انجام نشد',
        ),
        'error',
      );
    },
  });


  const reportMutation = useMutation({
    mutationFn: ({ question, answer }) => api.post(
      '/api/ai/report',
      {
        question,
        answer,
      },
    ),

    onSuccess: (_, variables) => {
      setReported(
        (current) => new Set([
          ...current,
          variables.answerId,
        ]),
      );

      hapticNotif('success');

      toast(
        'گزارش پاسخ ثبت شد',
        'success',
      );
    },

    onError: () => {
      toast(
        'ثبت گزارش انجام نشد',
        'error',
      );
    },
  });


  // ساخت گفت‌وگوی جدید — کش را همان‌جا با آرایه‌ی
  // خالی بذر می‌کنیم تا بدون حتی یک فلش لودینگ،
  // رشته‌ی تازه باز شود
  const createConvMutation = useMutation({
    mutationFn: () =>
      api.post('/api/ai/conversations', {}),

    onSuccess: (response) => {
      const id = String(response.data?.id || '');

      if (!id) {
        return;
      }

      // محافظ موقت تا ری‌فچ فهرست
      pendingNewConvRef.current = id;

      queryClient.setQueryData(
        ['ai-conv-msgs', id],
        [],
      );

      scrollMapRef.current[id] = undefined;

      setActiveConv(id);

      setShowHistory(false);

      hapticNotif('success');

      queryClient.invalidateQueries({
        queryKey: ['ai-conversations'],
      });
    },

    onError: (error) => {
      toast(
        getErrorMessage(
          error,
          'ساخت گفت‌وگوی جدید انجام نشد',
        ),
        'error',
      );
    },
  });


  // پچ مشترک تغییرنام / پین / بایگانی
  const patchConvMutation = useMutation({
    mutationFn: ({ id, patch }) =>
      api.patch(
        `/api/ai/conversations/${id}`,
        patch,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-conversations'],
      });
    },

    onError: (error) => {
      toast(
        getErrorMessage(
          error,
          'ذخیره‌ی تغییر گفت‌وگو انجام نشد',
        ),
        'error',
      );
    },
  });


  const deleteConvMutation = useMutation({
    mutationFn: (item) =>
      api.delete(
        `/api/ai/conversations/${item.id}`,
      ),

    onSuccess: (_, item) => {
      hapticNotif('success');

      queryClient.removeQueries({
        queryKey: ['ai-conv-msgs', item.id],
      });

      delete scrollMapRef.current[item.id];

      if (pendingNewConvRef.current === item.id) {
        pendingNewConvRef.current = null;
      }

      if (item.legacy) {
        // رشته‌ی مشترک محلی هم خالی می‌شود
        setLive([]);
        lastSeededRef.current = LEGACY_ID;

        queryClient.invalidateQueries({
          queryKey: ['ai-status'],
        });

        toast(
          'حافظه‌ی مشترک با ربات پاک شد',
          'info',
        );

      } else {
        toast(
          'گفت‌وگو حذف شد',
          'info',
        );
      }

      // اگر رشته‌ی فعال حذف شد، به مشترک برگرد
      if (
        item.id === activeConv &&
        item.id !== LEGACY_ID
      ) {
        setActiveConv(LEGACY_ID);
      }

      queryClient.invalidateQueries({
        queryKey: ['ai-conversations'],
      });
    },

    onError: (error) => {
      toast(
        getErrorMessage(
          error,
          'حذف گفت‌وگو انجام نشد',
        ),
        'error',
      );
    },
  });


  const sheetBusy = (
    createConvMutation.isPending
    || patchConvMutation.isPending
    || deleteConvMutation.isPending
  );


  const remaining = status?.unlimited
    ? 'نامحدود'
    : `${status?.remaining ?? 0} از ${status?.daily_limit ?? 0}`;

  const canSend = (
    !unavailable
    && !statusLoading
    && !askMutation.isPending
    && !isRecording
    && (
      Boolean(input.trim())
      || Boolean(selectedFile)
    )
  );


  const chooseFile = (file) => {
    if (!file) {
      return;
    }

    const kind = fileKind(file);

    if (kind === 'unknown') {
      toast(
        'فقط عکس، PDF یا فایل صوتی پشتیبانی می‌شود',
        'warning',
      );

      return;
    }

    if (file.size > maxMediaBytes) {
      toast(
        `حجم فایل باید کمتر از ${formatBytes(maxMediaBytes)} باشد`,
        'warning',
      );

      return;
    }

    if (
      kind === 'image'
      && capabilities.image === false
    ) {
      toast(
        'مدل فعلی امکان بررسی تصویر را ندارد',
        'warning',
      );

      return;
    }

    if (
      kind === 'pdf'
      && capabilities.pdf === false
    ) {
      toast(
        'PDF فقط با ارائه‌دهنده Gemini قابل استفاده است',
        'warning',
      );

      return;
    }

    if (
      kind === 'audio'
      && capabilities.audio === false
    ) {
      toast(
        'صدا فقط با ارائه‌دهنده Gemini قابل استفاده است',
        'warning',
      );

      return;
    }

    setSelectedFile(file);
    haptic('light');
  };


  const handleFileInput = (event) => {
    chooseFile(
      event.target.files?.[0],
    );

    event.target.value = '';
  };


  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    haptic('light');
  };


  const send = (
    customMessage,
    options = {},
  ) => {
    const message = String(
      customMessage ?? input,
    ).trim();

    const file = options.ignoreFile
      ? null
      : selectedFile;

    if (
      (!message && !file)
      || askMutation.isPending
      || unavailable
    ) {
      return;
    }

    const id = messageId('user');
    const kind = fileKind(file);

    haptic('medium');

    const echoText = (
      message
      || (
        file
          ? `[${fileLabel(kind)} فرستاده شد]`
          : ''
      )
    );

    setLive((current) => [
      ...current,

      {
        id,
        role: 'user',
        text: echoText,

        attachment: file
          ? {
              kind,
              name: file.name,
              size: file.size,
            }
          : null,

        at: new Date().toISOString(),
        fresh: true,
        failed: false,
      },
    ]);

    setInput('');

    // ارتفاع تکست‌اریا به خط اول برگردد
    if (taRef.current) {
      taRef.current.style.height = 'auto';
    }

    if (file) {
      setSelectedFile(null);
    }

    // فرستنده همیشه پیام خودش را می‌بیند — حتی اگر
    // در حال خواندن تاریخچه‌ی بالاتر بوده باشد
    window.requestAnimationFrame(() => {
      scrollPageToBottom();
    });

    askMutation.mutate({
      clientId: id,
      message,
      file,
      echo: echoText,
      conv: activeConv,
    });
  };


  const runSuggestion = (item) => {
    // کارت «تحلیل تصاویر» مستقیم فایل‌پیکر
    // را باز می‌کند تا مسیر کاربر کوتاه شود
    if (item.action === 'pick-file') {
      haptic('light');

      fileInputRef.current?.click();

      return;
    }

    send(item.prompt, {
      ignoreFile: true,
    });
  };


  const followUp = (type) => {
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
        ignoreFile: true,
      },
    );
  };


  const copyAnswer = async (text) => {
    const ok = await copyText(
      String(text || ''),
    );

    if (ok) {
      hapticNotif('success');

      toast(
        'پاسخ کپی شد',
        'success',
        1600,
      );

    } else {
      toast(
        'کپی انجام نشد',
        'warning',
      );
    }
  };


  const reportAnswer = (
    answer,
    index,
  ) => {
    const previousUser = [
      ...live.slice(0, index),
    ]
      .reverse()
      .find(
        (item) => item.role === 'user',
      );

    reportMutation.mutate({
      question: String(
        previousUser?.text
        || 'پرسش کاربر',
      ).slice(
        0,
        maxInputChars,
      ),

      answer: String(
        answer.text || '',
      ).slice(
        0,
        12000,
      ),

      answerId: answer.id,
    });
  };


  const openConversation = (id) => {
    if (id !== activeConv) {
      haptic('light');

      setActiveConv(id);
    }

    setShowHistory(false);
  };


  const typingLabel = (
    uploadProgress > 0
    && uploadProgress < 100
      ? `در حال بارگذاری فایل... ${uploadProgress.toLocaleString('fa-IR')}٪`
      : uploadProgress === 100
        ? 'فایل رسید؛ هوشیار در حال بررسی است...'
        : 'هوشیار در حال نوشتن است...'
  );


  const stopRecording = () => {
    const recorder = recorderRef.current;

    if (
      recorder
      && recorder.state !== 'inactive'
    ) {
      recorder.stop();
    }
  };


  const startRecording = async () => {
    if (
      askMutation.isPending
      || isRecording
    ) {
      return;
    }

    if (capabilities.audio === false) {
      toast(
        'ضبط صدا فقط با ارائه‌دهنده Gemini قابل استفاده است',
        'warning',
      );

      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia
      || typeof window.MediaRecorder === 'undefined'
    ) {
      toast(
        'مرورگر این دستگاه ضبط صدا را پشتیبانی نمی‌کند؛ فایل صوتی انتخاب کنید',
        'warning',
        4200,
      );

      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });

      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ];

      const mimeType = preferredTypes.find((type) => (
        window.MediaRecorder.isTypeSupported?.(type)
      ));

      const recorder = mimeType
        ? new window.MediaRecorder(
            stream,
            { mimeType },
          )
        : new window.MediaRecorder(
            stream,
          );

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          recordingChunksRef.current.push(
            event.data,
          );
        }
      };

      recorder.onerror = () => {
        toast(
          'ضبط صدا با خطا متوقف شد',
          'error',
        );
      };

      recorder.onstop = () => {
        if (recordingTimerRef.current) {
          window.clearInterval(
            recordingTimerRef.current,
          );

          recordingTimerRef.current = null;
        }

        stream
          .getTracks()
          .forEach(
            (track) => track.stop(),
          );

        recordingStreamRef.current = null;

        setIsRecording(false);
        setRecordingSeconds(0);

        const finalType = (
          recorder.mimeType
          || mimeType
          || 'audio/webm'
        );

        const blob = new Blob(
          recordingChunksRef.current,
          {
            type: finalType,
          },
        );

        recordingChunksRef.current = [];

        if (!blob.size) {
          toast(
            'صدایی ضبط نشد؛ دوباره امتحان کنید',
            'warning',
          );

          return;
        }

        if (blob.size > maxMediaBytes) {
          toast(
            `حجم صدای ضبط‌شده بیشتر از ${formatBytes(maxMediaBytes)} است`,
            'warning',
          );

          return;
        }

        const extension = finalType.includes('mp4')
          ? 'm4a'
          : 'webm';

        chooseFile(
          new File(
            [blob],
            `voice-${Date.now()}.${extension}`,
            {
              type: finalType,
            },
          ),
        );
      };

      recorder.start(500);

      setRecordingSeconds(0);
      setIsRecording(true);

      recordingTimerRef.current = window.setInterval(
        () => {
          setRecordingSeconds(
            (current) => current + 1,
          );
        },
        1000,
      );

      haptic('medium');
    } catch (error) {
      recordingStreamRef.current
        ?.getTracks?.()
        .forEach(
          (track) => track.stop(),
        );

      recordingStreamRef.current = null;

      if (error?.name === 'NotAllowedError') {
        toast(
          'برای ضبط صدا باید دسترسی میکروفون را فعال کنید',
          'warning',
          4200,
        );
      } else {
        toast(
          'شروع ضبط صدا انجام نشد',
          'error',
        );
      }
    }
  };


  const headerAction = (
    <div
      style={{
        display: 'flex',
        gap: 6,
      }}
    >
      <button
        type="button"
        className="btn btn-dark"
        style={{
          minHeight: 32,
          padding: '5px 9px',
          fontSize: 11,
        }}
        onClick={() => {
          haptic('light');

          setShowHistory(true);
        }}
        aria-label="تاریخچه‌ی گفت‌وگوها"
      >
        ☰ گفت‌وگوها
      </button>

      <button
        type="button"
        className="btn btn-p"
        style={{
          minHeight: 32,
          padding: '5px 9px',
          fontSize: 11,
        }}
        onClick={() =>
          createConvMutation.mutate()
        }
        disabled={
          createConvMutation.isPending
          || askMutation.isPending
        }
        aria-label="گفت‌وگوی جدید"
      >
        {
          createConvMutation.isPending
            ? <Spinner size={15} />
            : '＋'
        }

        جدید
      </button>
    </div>
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
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingInline: 12,
        }}
      >
        <section className="ai-strip">
          <span className="ai-orb">
            ✦
          </span>

          <span className="ai-strip__txt">
            <span className="ai-strip__title">
              هوشیار
            </span>

            <span className="ai-strip__sub">
              {
                statusLoading
                  ? 'در حال بررسی وضعیت...'
                  : `مدل ${status?.provider || '—'} · سهمیه امروز: ${remaining}`
              }
            </span>
          </span>

          {
            activeReference
            && (
              <button
                type="button"
                className="ref-chip"
                onClick={() =>
                  clearReferenceMutation.mutate()
                }
                disabled={
                  clearReferenceMutation.isPending
                }
                title={
                  `پاک‌کردن سند مرجع — انقضا: ` +
                  formatDate(activeReference.expires_at)
                }
              >
                📄

                <span>
                  {activeReference.name}
                </span>

                ×
              </button>
            )
          }

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
            <span className="badge-dot" />

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
        </section>

        {
          unavailable
          && !statusLoading
          && (
            <div
              className="card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,

                borderColor:
                  'rgba(239,68,68,.22)',

                background:
                  'rgba(239,68,68,.08)',
              }}
            >
              <span style={{ fontSize: 24 }}>
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
                  style={{
                    marginTop: 4,
                    color: 'var(--tx2)',
                    fontSize: 11,
                    lineHeight: 1.8,
                  }}
                >
                  {
                    status?.banned
                      ? 'برای پیگیری از بخش تیکت با پشتیبانی تماس بگیرید.'
                      : (
                        status?.disabled_message
                        || 'مدیریت در حال آماده‌سازی این بخش است.'
                      )
                  }
                </p>
              </div>
            </div>
          )
        }

        <section
          className="chat-scroll"
          aria-live="polite"
        >
          {
            msgsQuery.isPending
            && (
              <div
                style={{
                  display: 'grid',
                  gap: 9,
                }}
              >
                <div
                  className="skeleton"
                  style={{
                    width: '58%',
                    height: 52,
                    borderRadius: 18,
                  }}
                />

                <div
                  className="skeleton"
                  style={{
                    width: '72%',
                    height: 66,
                    borderRadius: 18,
                    marginInlineStart: 'auto',
                  }}
                />

                <div
                  className="skeleton"
                  style={{
                    width: '64%',
                    height: 52,
                    borderRadius: 18,
                  }}
                />
              </div>
            )
          }

          {
            !msgsQuery.isPending
            && live.length === 0
            && (
              <div className="chat-empty">
                <div className="chat-orb">
                  ✦
                </div>

                <h2 className="chat-empty__title">
                  از هوشیار بپرس
                </h2>

                <p className="chat-empty__text">
                  سؤال را تایپ کن، عکس بفرست، جزوه PDF را مرجع کن یا سؤالت را با صدا بگو.
                </p>

                <div className="sugg-grid">
                  {
                    SUGGESTIONS.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        className="sugg"
                        onClick={() =>
                          runSuggestion(item)
                        }
                        disabled={
                          unavailable
                          || askMutation.isPending
                        }
                      >
                        <span className="sugg__icon">
                          {item.icon}
                        </span>

                        <span className="sugg__txt">
                          <span className="sugg__title">
                            {item.title}
                          </span>

                          <span className="sugg__desc">
                            {item.desc}
                          </span>
                        </span>
                      </button>
                    ))
                  }
                </div>
              </div>
            )
          }

          {
            live.map((item, index) => (
              <MessageRow
                key={
                  item.id
                  || `${item.role}-${index}`
                }
                item={item}
                index={index}
                reported={reported.has(item.id)}
                actionsDisabled={
                  askMutation.isPending
                  || unavailable
                }
                onFollowUp={followUp}
                onReport={reportAnswer}
                onCopy={copyAnswer}
              />
            ))
          }

          {
            askMutation.isPending
            && (
              <TypingBubble label={typingLabel} />
            )
          }
        </section>

        <section className="cmp glass">
          {
            showJump
            && !isRecording
            && (
              <button
                type="button"
                className="jump-chip"
                onClick={() => {
                  haptic('light');

                  setShowJump(false);

                  scrollPageToBottom();
                }}
              >
                ↓ آخرین پیام‌ها
              </button>
            )
          }

          {
            input.length
              > maxInputChars * 0.75
            && (
              <span
                className={
                  'cmp__count' +
                  (
                    input.length
                      > maxInputChars * 0.92
                      ? ' cmp__count--near'
                      : ''
                  )
                }
              >
                {
                  input.length
                    .toLocaleString('fa-IR')
                }

                /

                {
                  maxInputChars
                    .toLocaleString('fa-IR')
                }
              </span>
            )
          }

          {
            selectedFile
            && (
              <div className="cmp-file">
                {
                  selectedKind === 'image'
                  && previewUrl
                    ? (
                      <img
                        src={previewUrl}
                        alt="پیش‌نمایش فایل انتخابی"
                        className="cmp-file__img"
                      />
                    )
                    : (
                      <div className="cmp-file__icon">
                        {fileIcon(selectedKind)}
                      </div>
                    )
                }

                <div className="cmp-file__info">
                  <strong className="cmp-file__name">
                    {selectedFile.name}
                  </strong>

                  <span className="cmp-file__meta">
                    {fileLabel(selectedKind)}

                    {' · '}

                    {formatBytes(selectedFile.size)}

                    {
                      selectedKind === 'pdf'
                        ? ' · مرجع ۴۸ ساعته'
                        : ''
                    }
                  </span>

                  {
                    selectedKind === 'audio'
                    && previewUrl
                    && (
                      <audio
                        controls
                        preload="metadata"
                        src={previewUrl}
                        className="cmp-file__audio"
                      />
                    )
                  }
                </div>

                <button
                  type="button"
                  className="cmp-file__x"
                  onClick={removeSelectedFile}
                  disabled={askMutation.isPending}
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
                <div className="cmp-rec">
                  <span className="cmp-rec__dot" />

                  <div className="cmp-rec__txt">
                    <b>در حال ضبط صدا</b>

                    <span>
                      {formatDuration(recordingSeconds)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-d"
                    onClick={stopRecording}
                    style={{
                      minHeight: 34,
                      padding: '5px 10px',
                      fontSize: 10,
                    }}
                  >
                    ■ پایان ضبط
                  </button>
                </div>
              )
              : (
                <div className="cmp__row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILES}
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                  />

                  <button
                    type="button"
                    className="cmp__tool"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      unavailable
                      || askMutation.isPending
                    }
                    aria-label="انتخاب عکس، PDF یا فایل صوتی"
                    title="پیوست فایل"
                  >
                    📎
                  </button>

                  <button
                    type="button"
                    className="cmp__tool"
                    onClick={startRecording}
                    disabled={
                      unavailable
                      || askMutation.isPending
                      || capabilities.audio === false
                    }
                    aria-label="ضبط پیام صوتی"
                    title="ضبط صدا"
                  >
                    🎙️
                  </button>

                  <textarea
                    ref={taRef}
                    className="cmp__ta"
                    value={input}
                    onChange={
                      (event) => setInput(
                        event.target.value.slice(
                          0,
                          maxInputChars,
                        ),
                      )
                    }
                    onKeyDown={
                      (event) => {
                        if (
                          event.key === 'Enter'
                          && !event.shiftKey
                        ) {
                          event.preventDefault();
                          send();
                        }
                      }
                    }
                    onInput={
                      (event) => {
                        event.currentTarget.style.height = 'auto';

                        event.currentTarget.style.height = `${Math.min(
                          event.currentTarget.scrollHeight,
                          120,
                        )}px`;
                      }
                    }
                    rows={1}
                    maxLength={maxInputChars}
                    placeholder={
                      selectedFile
                        ? 'توضیح یا سؤال درباره‌ی فایل (اختیاری)'
                        : 'سؤالت را از هوشیار بپرس...'
                    }
                    disabled={
                      unavailable
                      || askMutation.isPending
                    }
                    aria-label="متن سؤال"
                  />

                  <button
                    type="button"
                    className="cmp__btn"
                    onClick={() => send()}
                    disabled={!canSend}
                    aria-label="ارسال پیام"
                  >
                    {
                      askMutation.isPending
                        ? (
                          <Spinner
                            size={16}
                            color="#fff"
                          />
                        )
                        : '↑'
                    }
                  </button>
                </div>
              )
          }

          {
            uploadProgress > 0
            && askMutation.isPending
            && (
              <div
                className="pbar cmp__pbar"
              >
                <div
                  className="pbar-f"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>
            )
          }

          <p className="cmp__hint">
            هوشیار ابزار کمک‌آموزشی است؛ پاسخ‌های حساس پزشکی را با منبع درسی بررسی کن.
          </p>
        </section>
      </main>

      {
        showHistory
        && (
          <ChatHistorySheet
            conversations={conversations}
            activeId={activeConv}
            loading={!convsLoaded}
            showArchived={showArchived}
            busy={sheetBusy}
            onToggleArchived={() => {
              haptic('light');

              setShowArchived(
                (current) => !current,
              );
            }}
            onClose={() => setShowHistory(false)}
            onSelect={openConversation}
            onNew={() =>
              createConvMutation.mutate()
            }
            onRename={(id, title) =>
              patchConvMutation.mutate({
                id,
                patch: { title },
              })
            }
            onTogglePin={(item) =>
              patchConvMutation.mutate({
                id: item.id,
                patch: {
                  pinned: !item.pinned,
                },
              })
            }
            onToggleArchive={(item) =>
              patchConvMutation.mutate({
                id: item.id,
                patch: {
                  archived: !item.archived,
                },
              })
            }
            onDelete={(item) =>
              deleteConvMutation.mutate(item)
            }
          />
        )
      }
    </>
  );
}
