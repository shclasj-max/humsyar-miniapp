import {
  Component,
} from 'react';


/* ─────────────────────────────────────────────
   دیوار آتش رندر (Error Boundary)

   قانون طلایی: هیچ exception تک‌نقطه‌ای نباید
   کل مینی‌اپ را به «صفحه‌ی تاریک» تبدیل کند.

   - هر خطای رندر در هر صفحه به‌جای unmountِ
     کامل React، به این صفحه‌ی بازیابی می‌رسد
   - متن خطا (به‌همراه مسیر) نمایش داده می‌شود
     تا اسکرین‌شاتِ گزارش کاربر = سرنخ واقعی
   - آخرین ۸ خطا در localStorage حلقه‌ای نگه
     داشته می‌شود (کاربر در Mini App به DevTools
     دسترسی ندارد — این تنها پنجره‌ی دیباگ ماست)
   - در App با key = pathname رزت می‌شود؛ یعنی
     تغییر مسیر = دیوارِ تازه (خودترمیمی)
───────────────────────────────────────────── */

const LOG_KEY =
  'humsyar_err_log_v1';


function pushErrorLog(entry) {
  try {
    const raw =
      localStorage.getItem(LOG_KEY);

    const list = raw
      ? JSON.parse(raw)
      : [];

    list.unshift(entry);

    localStorage.setItem(
      LOG_KEY,
      JSON.stringify(
        list.slice(0, 8)
      )
    );

  } catch (_) {
    /* WebViewهای سخت‌گیر — مهم نیست */
  }
}


export default class ErrorBoundary
  extends Component {

  state = {
    error: null,
  };


  static getDerivedStateFromError(error) {
    return { error };
  }


  componentDidCatch(error, info) {
    console.error(
      '[humsyar error boundary]',
      error,
      info,
    );

    pushErrorLog({
      at:
        new Date().toISOString(),

      path:
        window.location?.pathname || '?',

      message:
        String(
          error?.message || error
        ).slice(0, 220),

      stack:
        String(
          info?.componentStack || ''
        ).slice(0, 220),
    });
  }


  reset = () =>
    this.setState({ error: null });


  reload = () =>
    window.location.reload();


  goHome = () =>
    window.location.replace('/');


  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    /* fallback سفارشی برای کرومِ اپ (مثل BottomNav):
       خطا در componentDidCatch داخل حلقه‌ی دیباگ ثبت
       شده، ولی به‌جای صفحه‌ی بازیابیِ تمام‌صفحه همین
       مقدار رندر می‌شود تا بقیه‌ی اپ زنده بماند —
       کرش نوار ناوبری = فقط نوار می‌رود، نه کل اپ */
    if (
      this.props.fallback !==
      undefined
    ) {
      return this.props.fallback;
    }

    return (
      <main
        dir="rtl"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: '100dvh',
          padding: '24px 16px',
          color: 'var(--tx)',
          background: 'transparent',
        }}
      >
        <section
          className={
            'card card-glow fade-up'
          }
          style={{
            width: '100%',
            maxWidth: 390,
            padding: 22,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'grid',
              width: 68,
              height: 68,
              placeItems: 'center',
              margin: '0 auto',

              background:
                'rgba(239,68,68,.12)',

              border:
                '1px solid rgba(239,68,68,.3)',

              borderRadius: 22,
              fontSize: 32,
            }}
          >
            🧯
          </div>

          <h1
            style={{
              marginTop: 14,
              fontSize: 17,
              fontWeight: 900,
            }}
          >
            یک خطای غیرمنتظره رخ داد
          </h1>

          <p
            style={{
              marginTop: 7,
              color: 'var(--tx2)',
              fontSize: 10.5,
              lineHeight: 1.9,
            }}
          >
            برنامه متوقف نشده و هیچ
            اطلاعاتی از دست نرفته است؛
            با یکی از دکمه‌های زیر ادامه
            دهید.
          </p>

          {/* متن دقیق خطا — برای اسکرین‌شات
              و ارسال به پشتیبانی */}
          <code
            dir="ltr"
            style={{
              display: 'block',
              maxHeight: 90,
              overflow: 'auto',
              marginTop: 14,
              padding: '9px 11px',

              color: '#FCA5A5',

              background:
                'rgba(3,7,15,.6)',

              border:
                '1px solid rgba(239,68,68,.2)',

              borderRadius: 11,
              fontSize: 9.5,
              lineHeight: 1.7,
              textAlign: 'left',
              wordBreak: 'break-word',
            }}
          >
            {String(
              error?.message || error
            )}
          </code>

          <div
            style={{
              display: 'grid',
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              type="button"
              className={
                'btn btn-p btn-full'
              }
              onClick={this.reset}
            >
              تلاش دوباره
            </button>

            <button
              type="button"
              className={
                'btn btn-dark btn-full'
              }
              onClick={this.goHome}
            >
              بازگشت به داشبورد
            </button>

            <button
              type="button"
              className={
                'btn btn-dark btn-full'
              }
              onClick={this.reload}
            >
              ↻ بارگذاری مجدد
            </button>
          </div>
        </section>
      </main>
    );
  }
}
