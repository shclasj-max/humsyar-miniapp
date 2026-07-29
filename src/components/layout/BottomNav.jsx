import {
  useEffect,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

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


function matchesPath(
  pathname,
  path
) {
  if (path === '/') {
    return pathname === '/';
  }

  return (
    pathname === path ||
    pathname.startsWith(
      `${path}/`
    )
  );
}


function MoreSheet({
  onClose,
}) {
  const navigate =
    useNavigate();

  useEffect(() => {
    const previousOverflow =
      document.body
        .style
        .overflow;

    const closeWithEscape = (
      event
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
      closeWithEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        closeWithEscape
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
          'glass fade-up'
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
          (item, index) => (
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

              <span className="more-sheet__arrow">
                ←
              </span>
            </button>
          )
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


  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);


  if (
    location.pathname.startsWith(
      '/admin'
    )
  ) {
    return null;
  }


  const moreActive =
    MORE.some(
      (item) =>
        matchesPath(
          location.pathname,
          item.path
        )
    );


  const tabIndex =
    TABS.findIndex(
      (item) =>
        matchesPath(
          location.pathname,
          item.path
        )
    );


  const activeIndex =
    moreActive
      ? TABS.length
      : Math.max(
          0,
          tabIndex
        );


  const go = (path) => {
    haptic('light');

    if (
      location.pathname !== path
    ) {
      navigate(path);
    }
  };


  return (
    <>
      {showMore && (
        <MoreSheet
          onClose={() =>
            setShowMore(false)
          }
        />
      )}

      <nav
        className="bottom-nav glass"
        aria-label="ناوبری اصلی"
        style={{
          '--active-index':
            activeIndex,
        }}
      >
        <div
          className="bottom-nav__indicator"
          aria-hidden="true"
        />

        {TABS.map(
          (tab, index) => {
            const active =
              !moreActive &&
              index === activeIndex;

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
                <span className="bottom-nav__icon">
                  {tab.icon}
                </span>

                <span className="bottom-nav__label">
                  {tab.label}
                </span>
              </button>
            );
          }
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
          onClick={() => {
            haptic('light');
            setShowMore(true);
          }}
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
