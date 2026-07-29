import {
  useCallback,
  useEffect,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  tg,
  haptic,
} from '../../lib/telegram';


export default function Header({
  title,
  subtitle,
  right,
  back = true,
  onBack,
}) {
  const navigate =
    useNavigate();


  const handleBack =
    useCallback(() => {
      haptic('light');

      if (
        typeof onBack ===
        'function'
      ) {
        onBack();
      } else {
        navigate(-1);
      }
    }, [
      navigate,
      onBack,
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
