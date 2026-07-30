import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  tg,
  haptic,
} from '../../lib/telegram';


/* ─────────────────────────────────────────────
   آیا تاریخچه مرورگر صفحه‌ی قبلی داخل مینی‌اپ
   دارد؟ (react-router در history.state.idx
   موقعیت فعلی را نگه می‌دارد)
───────────────────────────────────────────── */
function canGoBackInApp() {
  try {
    const state = window.history.state;

    return (
      typeof state?.idx === 'number' &&
      state.idx > 0
    );

  } catch (_) {
    return false;
  }
}


/* ─────────────────────────────────────────────
   مسیر والد را از آدرس فعلی استخراج می‌کند؛
   مثال: /admin/content/questions → /admin/content
         /me/tickets              → /me
───────────────────────────────────────────── */
function deriveParentPath(pathname) {
  const parts = pathname
    .split('/')
    .filter(Boolean);

  parts.pop();

  return parts.length
    ? `/${parts.join('/')}`
    : '/';
}


export default function Header({
  title,
  subtitle,
  right,
  back = true,
  onBack,
  backTo,
}) {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* مسیر برگشت اضطراری: اولویت با
     backTo صریح، بعد مسیر والد خودکار */
  const fallbackPath = useMemo(
    () =>
      backTo ||
      deriveParentPath(
        location.pathname
      ),

    [backTo, location.pathname]
  );


  const handleBack =
    useCallback(() => {
      haptic('light');

      if (
        typeof onBack ===
        'function'
      ) {
        onBack();
        return;
      }

      /* اگر صفحه‌ی قبلی داخل خود مینی‌اپ
         هست، به آن برمی‌گردیم؛ وگرنه (مثل
         باز شدن مستقیم از لینک ربات) به
         مسیر والد می‌رویم تا دکمه بازگشت
         همیشه کار کند. */
      if (canGoBackInApp()) {
        navigate(-1);
      } else if (
        location.pathname !==
        fallbackPath
      ) {
        navigate(
          fallbackPath,
          { replace: true }
        );
      }

    }, [
      navigate,
      onBack,
      fallbackPath,
      location.pathname,
    ]);


  useEffect(() => {
    const backButton =
      tg?.BackButton;

    if (!backButton) {
      return undefined;
    }

    try {
      if (back) {
        backButton.show();

        backButton.onClick(
          handleBack
        );
      } else {
        backButton.hide();
      }

    } catch (error) {
      console.warn(
        '[telegram back button]',
        error
      );
    }


    return () => {
      try {
        backButton.offClick(
          handleBack
        );

        backButton.hide();

      } catch (_) {
        // بعضی نسخه‌های قدیمی تلگرام
        // تمام متدها را ندارند.
      }
    };

  }, [
    back,
    handleBack,
  ]);


  return (
    <header className="app-header glass">
      <div className="app-header__main">
        {back && (
          <button
            type="button"
            className="app-header__back"
            onClick={
              handleBack
            }
            aria-label="بازگشت"
          >
            ←
          </button>
        )}

        <div className="app-header__text">
          <div className="app-header__title">
            {title}
          </div>

          {subtitle && (
            <div className="app-header__subtitle">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {right && (
        <div className="app-header__right">
          {right}
        </div>
      )}
    </header>
  );
}
