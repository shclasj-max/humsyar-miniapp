import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import api from '../../lib/api';

import {
  haptic,
} from '../../lib/telegram';


const TABS = [
  {
    path: '/',
    icon: '🩺',
    label: 'داشبورد',
  },

  {
    path: '/learn',
    icon: '📖',
    label: 'یادگیری',
  },

  {
    path: '/schedule',
    icon: '📅',
    label: 'برنامه',
  },

  {
    path: '/grades',
    icon: '📊',
    label: 'نمرات',
  },

  {
    path: '/me',
    icon: '🙋',
    label: 'من',
  },
];


const MORE = [
  {
    path: '/ai',
    icon: '🤖',
    label: 'هوشیار',
    desc: 'دستیار آموزشی هوشمند',
  },

  {
    path: '/search',
    icon: '🔍',
    label: 'جست‌وجوی سراسری',
    desc: 'سؤال، منبع و کتاب در یک‌جا',
  },

  {
    path: '/me/profile',
    icon: '👤',
    label: 'پروفایل',
    desc: 'اطلاعات و آمار حساب',
  },

  {
    path: '/me/notifications',
    icon: '🔔',
    label: 'اعلان‌ها',
    desc: 'تنظیم یادآوری‌ها',
  },

  {
    path: '/me/subscription',
    icon: '💳',
    label: 'اشتراک',
    desc: 'مدیریت پلن و خرید',
  },

  {
    path: '/me/tickets',
    icon: '🎫',
    label: 'پشتیبانی',
    desc: 'تیکت و گفت‌وگو',
  },

  {
    path: '/me/faq',
    icon: '❓',
    label: 'سؤالات متداول',
    desc: 'پاسخ‌های سریع',
  },

  {
    path: '/me/reports',
    icon: '🚩',
    label: 'گزارش ایراد',
    desc: 'اعلام خطای محتوا',
  },
];


/* ── فیزیک درگ ناوبری ──
   SNAP: موقعیت‌های نهایی چسبیدن به لبه
   CLAMP: سقف سفر حین درگ (هیچ‌وقت از ناحیه
   امن بیرون نمی‌رود) / RESIST: مقاومت لاستیکی
   THRESH: آستانه‌ی شروع درگ تا تپ ساده خراب
   نشود */
const DRAG_SNAP = 18;
const DRAG_CLAMP = 32;
const DRAG_RESIST = 0.62;
const DRAG_THRESH = 7;
const DRAG_SNAP_AT = 9;

const DRAG_KEY = 'nav_drag_x';


function clamp(value, min, max) {
  return Math.min(
    max,
    Math.max(min, value),
  );
}


function readStoredOffset() {
  try {
    const raw = Number(
      window.sessionStorage
        .getItem(DRAG_KEY),
    );

    if (
      Number.isFinite(raw)
    ) {
      return clamp(
        raw,
        -DRAG_SNAP,
        DRAG_SNAP,
      );
    }

  } catch (_) {
    // WebView محدود → از صفر شروع کن
  }

  return 0;
}


function storeOffset(value) {
  try {
    window.sessionStorage
      .setItem(
        DRAG_KEY,
        String(value),
      );

  } catch (_) {
    // سایلنت — درگ فقط برای نشست جاری می‌ماند
  }
}


function prefersReducedMotion() {
  try {
    return Boolean(
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      )?.matches,
    );

  } catch (_) {
    return false;
  }
}


function matchesPath(
  pathname,
  path,
) {
  if (path === '/') {
    return pathname === '/';
  }

  return (
    pathname === path ||
    pathname.startsWith(
      `${path}/`,
    )
  );
}


function MoreSheet({
  onClose,
  unread = 0,
}) {
  const navigate =
    useNavigate();


  useEffect(() => {
    const previousOverflow =
      document.body
        .style
        .overflow;

    const closeWithEscape = (
      event,
    ) => {
      if (
        event.key === 'Escape'
      ) {
        onClose();
      }
    };

    document.body.style.overflow =
      'hidden';

    window.addEventListener(
      'keydown',
      closeWithEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        closeWithEscape,
      );
    };
  }, [onClose]);


  const open = (path) => {
    haptic('light');

    onClose();

    navigate(path);
  };


  return (
    <div
      className="more-sheet"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={
          'more-sheet__panel ' +
          'glass sheet-in'
        }
        role="dialog"
        aria-modal="true"
        aria-label="منوی بیشتر"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="more-sheet__handle" />

        <div className="more-sheet__title">
          دسترسی سریع
        </div>

        {MORE.map(
          (
            item,
            index,
          ) => (
            <button
              type="button"
              key={item.path}
              className={
                'more-sheet__item ' +
                'pop-in'
              }
              style={{
                animationDelay:
                  `${index * 32}ms`,
              }}
              onClick={() =>
                open(item.path)
              }
            >
              <span className="more-sheet__item-icon">
                {item.icon}
              </span>

              <span className="more-sheet__item-text">
                <span className="more-sheet__item-title">
                  {item.label}
                </span>

                <span className="more-sheet__item-desc">
                  {item.desc}
                </span>
              </span>

              {item.path === '/ai' && (
                <span className="badge b-pur">
                  AI
                </span>
              )}

              {item.path ===
                '/me/tickets' &&
                unread > 0 && (
                  <span className="badge b-red">
                    {unread > 9
                      ? '+9'
                      : unread}{' '}
                    پاسخ جدید
                  </span>
                )}

              <span className="more-sheet__arrow">
                ←
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}


export default function BottomNav() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    showMore,
    setShowMore,
  ] = useState(false);


  const navRef = useRef(null);
  const indicatorRef = useRef(null);

  /* آفست نهایی اسنپ‌شده — منبع حقیقت برای
     ترنسفورم پایه (پالس WAAPI هم روی همین
     می‌نشیند تا هیچ قطع‌وصلی دیده نشود) */
  const offsetRef = useRef(0);

  /* وضعیت درگ — فقط ref؛ هیچ setState ای در
     حین درگ رخ نمی‌دهد تا ۶۰fps واقعی بماند */
  const dragRef = useRef({
    pointerId: null,
    startX: 0,
    base: 0,
    liveX: 0,
    active: false,
  });

  /* بعد از درگ واقعی، کلیکِ فراری دکمه‌ها را
     برای لحظاتی کوتاه دفن می‌کنیم */
  const suppressClickUntilRef =
    useRef(0);


  // بازیابی موقعیت اسنپ‌شده‌ی نشست قبلی — قبل از
  // پِیِنت (layout effect) تا ناوبری در اولین فریم
  // با آفست ذخیره‌شده رسم شود، نه صفر
  useLayoutEffect(() => {
    const stored =
      readStoredOffset();

    offsetRef.current = stored;

    navRef.current?.style
      .setProperty(
        '--drag-x',
        `${stored}px`,
      );
  }, []);


  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);


  // پالس «Dynamic Shape» — با تعویض صفحه،
  // کپسول یک‌بار نفس می‌کشد و در جای خود
  // فرومی‌نشیند (فقط transform؛ بدون ری‌فلو)
  const firstPathRef = useRef(true);

  useEffect(() => {
    if (firstPathRef.current) {
      firstPathRef.current = false;
      return;
    }

    const element = navRef.current;

    if (
      !element ||
      prefersReducedMotion()
    ) {
      return;
    }

    const baseTransform =
      `translateX(-50%) ` +
      `translateX(` +
        `${offsetRef.current}px` +
      `)`;

    element.animate(
      [
        {
          transform:
            `${baseTransform} scale(1)`,
        },

        {
          transform:
            `${baseTransform} ` +
            `scale(1.04)`,
          offset: 0.38,
        },

        {
          transform:
            `${baseTransform} scale(1)`,
        },
      ],

      {
        duration: 320,

        easing:
          'cubic-bezier(.34,1.56,.64,1)',
      },
    );
  }, [location.pathname]);


  // «Flow Motion» — اندیکاتور هنگام حرکت به
  // خانه‌ی جدید کمی کش می‌آید و جمع می‌شود تا
  // حس مایع بودن منتقل شود (روی fade ساده نیست)
  useEffect(() => {
    const indicator =
      indicatorRef.current;

    if (
      !indicator ||
      prefersReducedMotion()
    ) {
      return;
    }

    indicator.animate(
      [
        {
          transform:
            'scaleX(1.24)',
        },

        {
          transform:
            'scaleX(1)',
        },
      ],

      {
        duration: 400,

        easing:
          'cubic-bezier(.34,1.56,.64,1)',
      },
    );
  }, [location.pathname]);


  /* ✅ Badge پاسخ جدید پشتیبانی —
     پولینگ سبک هر ۴۵ ثانیه؛ وقتی کاربر
     گفت‌وگو را باز کند، سمت سرور seen
     می‌شود و Badge خودکار پاک می‌شود */
  const {
    data: unreadData,
  } = useQuery({
    queryKey: ['ticket-unread'],

    queryFn: () =>
      api
        .get('/api/tickets/unread-count')
        .then(
          (response) =>
            response.data,
        ),

    refetchInterval: 45_000,
    staleTime: 20_000,
    retry: false,
  });

  const unread = Math.max(
    0,
    Number(unreadData?.unread) || 0,
  );


  /* ── کنترلر درگ ── */

  const applyDragX = (value) => {
    dragRef.current.liveX = value;

    navRef.current?.style
      .setProperty(
        '--drag-x',
        `${value}px`,
      );
  };


  const onPointerDown = (event) => {
    // فقط دکمه‌ی اصلی/لمس
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      base: offsetRef.current,
      liveX: offsetRef.current,
      active: false,
    };
  };


  const onPointerMove = (event) => {
    const drag = dragRef.current;

    if (
      drag.pointerId === null ||
      event.pointerId !==
        drag.pointerId
    ) {
      return;
    }

    const rawDx =
      event.clientX - drag.startX;

    if (!drag.active) {
      // آستانه‌ی شروع — تپ ساده دست‌نخورده
      if (
        Math.abs(rawDx) <=
        DRAG_THRESH
      ) {
        return;
      }

      drag.active = true;

      try {
        navRef.current
          ?.setPointerCapture(
            event.pointerId,
          );

      } catch (_) {
        // قدیمی‌ترین WebViewها — بدون
        // کپچر هم درگ کار می‌کند
      }

      navRef.current?.classList
        .add('bottom-nav--drag');

      haptic('light');
    }

    event.preventDefault();

    // مقاومت لاستیکی — هرچه بیشتر می‌کشی،
    // کمتر جابه‌جا می‌شود (حس فیزیکی)
    const resisted =
      drag.base +
      rawDx * DRAG_RESIST;

    applyDragX(
      clamp(
        resisted,
        -DRAG_CLAMP,
        DRAG_CLAMP,
      ),
    );
  };


  const endDrag = (event) => {
    const drag = dragRef.current;

    if (
      drag.pointerId === null ||
      (
        event.pointerId !==
          undefined &&
        event.pointerId !==
          drag.pointerId
      )
    ) {
      return;
    }

    const wasActive = drag.active;

    dragRef.current = {
      pointerId: null,
      startX: 0,
      base: drag.base,
      liveX: drag.liveX,
      active: false,
    };

    if (!wasActive) {
      return;
    }

    navRef.current?.classList
      .remove('bottom-nav--drag');

    // اسنپ فنری به نزدیک‌ترین موقعیت —
    // ترنزیشن CSS (spring) حرکت برگشت را
    // نرم می‌کند
    const liveX = drag.liveX;

    const snap =
      liveX > DRAG_SNAP_AT
        ? DRAG_SNAP
        : liveX < -DRAG_SNAP_AT
          ? -DRAG_SNAP
          : 0;

    if (snap !== offsetRef.current) {
      haptic('light');
    }

    offsetRef.current = snap;

    storeOffset(snap);

    applyDragX(snap);

    // کلیک‌های هم‌پوشان با رهاسازی درگ
    // باید نادیده گرفته شوند
    suppressClickUntilRef.current =
      Date.now() + 280;
  };


  if (
    location.pathname.startsWith(
      '/admin',
    )
  ) {
    return null;
  }


  const moreActive =
    MORE.some(
      (item) =>
        matchesPath(
          location.pathname,
          item.path,
        ),
    );


  const tabIndex =
    TABS.findIndex(
      (item) =>
        matchesPath(
          location.pathname,
          item.path,
        ),
    );


  const activeIndex =
    moreActive
      ? TABS.length
      : Math.max(
          0,
          tabIndex,
        );


  const clickSuppressed = () =>
    Date.now() <
    suppressClickUntilRef.current;


  const go = (path) => {
    if (clickSuppressed()) {
      return;
    }

    haptic('light');

    if (
      location.pathname !== path
    ) {
      navigate(path);
    }
  };


  const openMore = () => {
    if (clickSuppressed()) {
      return;
    }

    haptic('light');

    setShowMore(true);
  };


  return (
    <>
      {showMore && (
        <MoreSheet
          unread={unread}
          onClose={() =>
            setShowMore(false)
          }
        />
      )}

      <nav
        ref={navRef}
        className="bottom-nav glass"
        aria-label="ناوبری اصلی"
        style={{
          '--active-index':
            activeIndex,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        <div
          ref={indicatorRef}
          className="bottom-nav__indicator"
          aria-hidden="true"
        />

        {TABS.map(
          (
            tab,
            index,
          ) => {
            const active =
              !moreActive &&
              index ===
                activeIndex;

            return (
              <button
                type="button"
                key={tab.path}
                className={
                  'bottom-nav__item ' +
                  (
                    active
                      ? 'bottom-nav__item--active'
                      : ''
                  )
                }
                onClick={() =>
                  go(tab.path)
                }
                aria-label={
                  tab.label
                }
                aria-current={
                  active
                    ? 'page'
                    : undefined
                }
              >
                <span
                  className="bottom-nav__icon"
                  style={{
                    position:
                      'relative',
                  }}
                >
                  {tab.icon}

                  {tab.path === '/me' &&
                    unread > 0 && (
                      <span
                        className="nav-badge"
                        aria-label={`${unread} پاسخ خوانده‌نشده`}
                      >
                        {unread > 99
                          ? '+99'
                          : unread}
                      </span>
                    )}
                </span>

                <span className="bottom-nav__label">
                  {tab.label}
                </span>
              </button>
            );
          },
        )}

        <button
          type="button"
          className={
            'bottom-nav__item ' +
            (
              moreActive
                ? 'bottom-nav__item--active'
                : ''
            )
          }
          onClick={openMore}
          aria-label="بیشتر"
          aria-expanded={showMore}
        >
          <span className="bottom-nav__icon">
            ☰
          </span>

          <span className="bottom-nav__label">
            بیشتر
          </span>
        </button>
      </nav>
    </>
  );
}
