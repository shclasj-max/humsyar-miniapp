import {
  useCallback,
  useEffect,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  tg,
  haptic,
} from '../../lib/telegram';

import {
  navigateBack,
} from '../../lib/navBack';


/* ─────────────────────────────────────────────
   هدر استاندارد کل مینی‌اپ
   - دکمه‌ی برگشت همیشه سمت راست، موقعیت و سایز
     ثابت (توجه RTL: فلش → یعنی بازگشت)
   - حل‌مسیر یکپارچه از lib/navBack
   - BackButton نیتیو تلگرام هم سینک می‌شود تا
     دکمه‌ی فیزیکی Android کاربر را بیرون نیندازد
───────────────────────────────────────────── */


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


  const handleBack =
    useCallback(() => {
      haptic('light');

      navigateBack({
        navigate,
        pathname: location.pathname,
        onBack,
        backTo,
      });

    }, [
      navigate,
      location.pathname,
      onBack,
      backTo,
    ]);


  // سینک دکمه‌ی برگشت پلتفرم (Android hardware
  // back / chevron بالای اپ) با وضعیت همین صفحه
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
          handleBack,
        );
      } else {
        backButton.hide();
      }

    } catch (error) {
      console.warn(
        '[telegram back button]',
        error,
      );
    }


    return () => {
      try {
        backButton.offClick(
          handleBack,
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
            aria-label="بازگشت به صفحه‌ی قبل"
          >
            →
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
