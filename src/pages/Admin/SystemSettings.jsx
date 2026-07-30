import {
  useEffect,
  useState,
} from 'react';

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
  haptic,
  hapticNotif,
} from '../../lib/telegram';

import {
  useUIStore,
} from '../../stores/uiStore';


/* ═══════════ سوییچ تاگل ═══════════ */

function Toggle({
  checked,
  disabled,
  danger,
  onChange,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`switch ${
        checked ? 'switch--on' : ''
      } ${danger ? 'switch--danger' : ''}`}
      onClick={() => {
        haptic('light');
        onChange(!checked);
      }}
    >
      <span className="switch__nob" />
    </button>
  );
}


/* ═══════════ ردیف تنظیم ═══════════ */

function SettingRow({
  icon,
  title,
  desc,
  danger,
  checked,
  busy,
  onToggle,
}) {
  return (
    <div
      className="menu-row"
      style={{
        borderColor: danger &&
          checked
          ? 'rgba(239,68,68,.3)'
          : undefined,
      }}
    >
      <span
        style={{
          display: 'grid',
          flex: '0 0 40px',
          height: 40,
          placeItems: 'center',
          borderRadius: 12,
          background: danger
            ? 'rgba(239,68,68,.1)'
            : 'rgba(59,130,246,.1)',
          fontSize: 19,
        }}
      >
        {icon}
      </span>

      <span
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: 'right',
        }}
      >
        <b
          style={{
            display: 'block',
            fontSize: 12.3,
          }}
        >
          {title}
        </b>

        <span
          style={{
            display: 'block',
            color: 'var(--txm)',
            fontSize: 9.6,
            marginTop: 2,
            lineHeight: 1.8,
          }}
        >
          {desc}
        </span>
      </span>

      {busy ? (
        <Spinner size={16} />
      ) : (
        <Toggle
          checked={checked}
          danger={danger}
          onChange={onToggle}
        />
      )}
    </div>
  );
}


/* ═══════════ کارت گروه لاگ ═══════════ */

function LogGroupCard({
  icon,
  title,
  savedId,
  value,
  dirty,
  saving,
  testing,
  onChange,
  onSave,
  onTest,
}) {
  const trimmed = value.trim();
  const invalid =
    trimmed !== '' &&
    !/^-\d+$/.test(trimmed);

  return (
    <div
      className="card"
      style={{ marginBottom: 12 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: 'grid',
            flex: '0 0 40px',
            height: 40,
            placeItems: 'center',
            borderRadius: 12,
            background:
              'rgba(59,130,246,.1)',
            fontSize: 19,
          }}
        >
          {icon}
        </span>

        <span
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <b
            style={{
              display: 'block',
              fontSize: 12.3,
            }}
          >
            {title}
          </b>

          <span
            style={{
              display: 'block',
              color: savedId
                ? '#4ADE80'
                : 'var(--txm)',
              fontSize: 9.6,
              marginTop: 2,
            }}
          >
            {savedId ? (
              <>
                تنظیم شده ✅{' '}
                <code
                  dir="ltr"
                  style={{
                    fontSize: 9.4,
                  }}
                >
                  {savedId}
                </code>
              </>
            ) : (
              'تنظیم نشده — لاگ فقط در دیتابیس ذخیره می‌شود'
            )}
          </span>
        </span>
      </div>

      <input
        className="inp"
        inputMode="numeric"
        dir="ltr"
        placeholder="-1001234567890"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={{
          width: '100%',
          textAlign: 'left',
        }}
      />

      {invalid && (
        <span
          style={{
            display: 'block',
            color: 'var(--err)',
            fontSize: 9,
            marginTop: 6,
          }}
        >
          آیدی گروه باید عدد منفی
          باشد (مثل -1001234567890)
        </span>
      )}

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 10,
        }}
      >
        <button
          className="btn btn-p"
          style={{
            flex: 1,
            minHeight: 34,
            fontSize: 10.5,
          }}
          disabled={
            !dirty || invalid || saving
          }
          onClick={onSave}
        >
          {saving ? (
            <Spinner size={14} />
          ) : (
            '💾 ذخیره'
          )}
        </button>

        <button
          className="btn btn-dark"
          style={{
            minHeight: 34,
            fontSize: 10.5,
          }}
          disabled={!savedId || testing}
          onClick={onTest}
        >
          {testing ? (
            <Spinner size={14} />
          ) : (
            '🧪 تست'
          )}
        </button>
      </div>

      <span
        style={{
          display: 'block',
          color: 'var(--txm)',
          fontSize: 8.8,
          marginTop: 8,
          lineHeight: 1.8,
        }}
      >
        برای حذف تنظیم، فیلد را خالی
        کن و ذخیره بزن. ربات باید عضو
        گروه باشد.
      </span>
    </div>
  );
}


/* ═══════════ صفحه اصلی ═══════════ */

export default function SystemSettings() {
  const toast = useUIStore(
    (state) => state.toast
  );

  const queryClient =
    useQueryClient();


  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-bot-settings'],

    queryFn: () =>
      api
        .get('/api/admin/settings')
        .then(
          (response) =>
            response.data
        ),

    staleTime: 15_000,
  });


  const [maintenanceText, setMaintenanceText] =
    useState('');

  const [textDirty, setTextDirty] =
    useState(false);


  /* گروه‌های لاگ — آیدی خام به‌صورت رشته
     نگه داشته می‌شود تا ورودی کنترل‌شده
     بماند و هنگام ذخیره به عدد تبدیل شود */
  const [logAdmin, setLogAdmin] =
    useState('');

  const [logContent, setLogContent] =
    useState('');

  const [logAdminDirty, setLogAdminDirty] =
    useState(false);

  const [logContentDirty, setLogContentDirty] =
    useState(false);


  /* وقتی تنظیمات لود شد، متن را هم‌گام کن
     (فقط اگر کاربر دست نزده باشد) */
  useEffect(() => {
    if (!textDirty) {
      setMaintenanceText(
        data?.maintenance_text || ''
      );
    }
  }, [
    data?.maintenance_text,
    textDirty,
  ]);


  /* هم‌گام‌سازی فیلدهای گروه لاگ با سرور —
     مثل الگوی متن تعمیر، فقط تا وقتی کاربر
     فیلد را دست نزده باشد */
  useEffect(() => {
    if (!logAdminDirty) {
      setLogAdmin(
        data?.log_group_admin
          ? String(data.log_group_admin)
          : ''
      );
    }
  }, [
    data?.log_group_admin,
    logAdminDirty,
  ]);

  useEffect(() => {
    if (!logContentDirty) {
      setLogContent(
        data?.log_group_content
          ? String(data.log_group_content)
          : ''
      );
    }
  }, [
    data?.log_group_content,
    logContentDirty,
  ]);


  const patchMutation = useMutation({
    mutationFn: (payload) =>
      api.patch(
        '/api/admin/settings',
        payload
      ),

    onSuccess: (_response, payload) => {
      hapticNotif('success');

      queryClient.invalidateQueries({
        queryKey: [
          'admin-bot-settings',
        ],
      });

      if (
        payload.maintenance_mode ===
        true
      ) {
        toast(
          '🔧 حالت تعمیر فعال شد — کاربران پیام تعمیر را می‌بینند',
          'warning',
          3500
        );
      } else if (
        payload.maintenance_mode ===
        false
      ) {
        toast(
          '✅ حالت تعمیر غیرفعال شد',
          'success'
        );
      } else if (
        'log_group_admin' in payload ||
        'log_group_content' in payload
      ) {
        const removed =
          payload.log_group_admin ===
            null ||
          payload.log_group_content ===
            null;
        toast(
          removed
            ? '🗑 تنظیم گروه لاگ حذف شد'
            : '✅ گروه لاگ به‌روزرسانی شد',
          'success'
        );
      } else {
        toast(
          'تنظیمات ذخیره شد',
          'success'
        );
      }
    },

    onError: (error) => {
      toast(
        error?.response?.data
          ?.detail ||
          'ذخیره تنظیمات انجام نشد',
        'error'
      );
    },
  });


  /* تست گروه لاگ — پیام واقعی از مسیر
     کامل وب ← ربات ← گروه می‌رود */
  const testMutation = useMutation({
    mutationFn: (kind) =>
      api.post(
        '/api/admin/settings/test-log-group',
        { kind }
      ),

    onSuccess: (response) => {
      hapticNotif('success');
      toast(
        response.data?.message ||
          '🧪 پیام تست در راه است',
        'success',
        4000
      );
    },

    onError: (error) => {
      hapticNotif('error');
      toast(
        error?.response?.data
          ?.detail ||
          'ارسال پیام تست انجام نشد',
        'error'
      );
    },
  });


  const busyKey =
    patchMutation.isPending
      ? patchMutation.variables
      : null;


  const toggle = (key, value) => {
    patchMutation.mutate({
      [key]: value,
    });
  };


  const saveText = () => {
    haptic('light');
    setTextDirty(false);
    patchMutation.mutate({
      maintenance_text:
        maintenanceText.trim(),
    });
  };


  /* ذخیره گروه لاگ — فیلد خالی یعنی حذف
     تنظیم (null صریح برای بک‌اند) */
  const saveLogGroup = (kind) => {
    haptic('light');

    const raw = (
      kind === 'admin'
        ? logAdmin
        : logContent
    ).trim();

    if (
      raw !== '' &&
      !/^-\d+$/.test(raw)
    ) {
      toast(
        'آیدی گروه باید عدد منفی باشد (مثل -1001234567890)',
        'error'
      );
      return;
    }

    if (kind === 'admin') {
      setLogAdminDirty(false);
    } else {
      setLogContentDirty(false);
    }

    patchMutation.mutate({
      [kind === 'admin'
        ? 'log_group_admin'
        : 'log_group_content']:
        raw === ''
          ? null
          : parseInt(raw, 10),
    });
  };


  const maintenanceOn = Boolean(
    data?.maintenance_mode
  );


  return (
    <>
      <Header
        title="تنظیمات ربات"
        subtitle={
          'سینک کامل با پنل ربات — هر تغییر در هر دو اعمال می‌شود'
        }
      />

      <main className="page fade-up">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : isError ? (
          <div className="empty card">
            دریافت تنظیمات انجام نشد.

            <button
              className="btn btn-p"
              onClick={() => refetch()}
            >
              تلاش دوباره
            </button>
          </div>
        ) : (
          <>
            {maintenanceOn && (
              <div
                className="card fade-up"
                style={{
                  marginBottom: 13,
                  padding:
                    '12px 14px',
                  borderColor:
                    'rgba(239,68,68,.35)',
                  background:
                    'linear-gradient(145deg,rgba(239,68,68,.08),rgba(16,24,39,.95))',
                }}
              >
                <b
                  style={{
                    color: 'var(--err)',
                    fontSize: 12,
                  }}
                >
                  🔧 حالت تعمیر فعال است
                </b>

                <span
                  style={{
                    display: 'block',
                    color: 'var(--txm)',
                    fontSize: 9.8,
                    marginTop: 4,
                    lineHeight: 1.8,
                  }}
                >
                  تا غیرفعال شدن، کاربران
                  فقط پیام تعمیر را در ربات
                  می‌بینند.
                </span>
              </div>
            )}

            <div className="sec-title">
              🛠 وضعیت سرویس
            </div>

            <section
              className="card"
              style={{
                padding: '0 14px',
                marginBottom: 15,
              }}
            >
              <SettingRow
                icon="🔧"
                title="حالت تعمیر"
                desc="موقتاً ربات را برای کاربران غیرفعال و متن تعمیر نمایش می‌دهد"
                danger
                checked={maintenanceOn}
                busy={
                  patchMutation.isPending &&
                  busyKey?.maintenance_mode !==
                    undefined
                }
                onToggle={(value) =>
                  toggle(
                    'maintenance_mode',
                    value
                  )
                }
              />
            </section>

            <div className="sec-title">
              📝 متن حالت تعمیر
            </div>

            <section
              className="card"
              style={{
                marginBottom: 15,
              }}
            >
              <textarea
                className="inp"
                rows={3}
                value={maintenanceText}
                maxLength={400}
                placeholder="پیام پیش‌فرض: در حال به‌روزرسانی هستیم…"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  lineHeight: 1.8,
                }}
                onChange={(event) => {
                  setMaintenanceText(
                    event.target.value
                  );
                  setTextDirty(true);
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'space-between',
                  marginTop: 10,
                }}
              >
                <span
                  style={{
                    color: 'var(--txm)',
                    fontSize: 8.8,
                  }}
                >
                  خالی = متن پیش‌فرض ربات •{' '}
                  {
                    maintenanceText.length
                  }
                  /۴۰۰
                </span>

                <button
                  className="btn btn-p"
                  style={{
                    minHeight: 34,
                    padding: '6px 14px',
                    fontSize: 10.5,
                  }}
                  disabled={
                    !textDirty ||
                    patchMutation.isPending
                  }
                  onClick={saveText}
                >
                  {patchMutation.isPending &&
                  busyKey?.maintenance_text !==
                    undefined ? (
                    <Spinner size={14} />
                  ) : (
                    '💾 ذخیره متن'
                  )}
                </button>
              </div>
            </section>

            <div className="sec-title">
              🎓 ثبت‌نام
            </div>

            <section
              className="card"
              style={{
                padding: '0 14px',
                marginBottom: 15,
              }}
            >
              <SettingRow
                icon="🎓"
                title="الزام شماره دانشجویی"
                desc="کاربران جدید (و قدیمی بدون شماره) باید شماره دانشجویی وارد کنند — هم‌راستا با بات"
                checked={Boolean(
                  data?.require_student_id
                )}
                busy={
                  patchMutation.isPending &&
                  busyKey?.require_student_id !==
                    undefined
                }
                onToggle={(value) =>
                  toggle(
                    'require_student_id',
                    value
                  )
                }
              />
            </section>

            <div className="sec-title">
              🛡 گروه‌های لاگ تلگرام
            </div>

            <LogGroupCard
              icon="🛡"
              title="گروه لاگ مدیریت"
              savedId={
                data?.log_group_admin ||
                null
              }
              value={logAdmin}
              dirty={logAdminDirty}
              saving={
                patchMutation.isPending &&
                busyKey?.log_group_admin !==
                  undefined
              }
              testing={
                testMutation.isPending &&
                testMutation.variables ===
                  'admin'
              }
              onChange={(value) => {
                setLogAdmin(value);
                setLogAdminDirty(true);
              }}
              onSave={() =>
                saveLogGroup('admin')
              }
              onTest={() =>
                testMutation.mutate(
                  'admin'
                )
              }
            />

            <LogGroupCard
              icon="🎓"
              title="گروه لاگ محتوا"
              savedId={
                data?.log_group_content ||
                null
              }
              value={logContent}
              dirty={logContentDirty}
              saving={
                patchMutation.isPending &&
                busyKey?.log_group_content !==
                  undefined
              }
              testing={
                testMutation.isPending &&
                testMutation.variables ===
                  'content'
              }
              onChange={(value) => {
                setLogContent(value);
                setLogContentDirty(
                  true
                );
              }}
              onSave={() =>
                saveLogGroup('content')
              }
              onTest={() =>
                testMutation.mutate(
                  'content'
                )
              }
            />

            <div
              className="page-hint"
              style={{ marginTop: 2 }}
            >
              <span>💡</span>

              <span>
                آیدی گروه همیشه{' '}
                <b>عدد منفی</b> است. برای
                پیدا کردنش، یک پیام از
                گروه را به{' '}
                <b>@RawDataBot</b>{' '}
                فوروارد کن و مقدار{' '}
                <b>chat.id</b> را اینجا
                وارد کن. همه‌ی لاگ‌های ربات
                و پنل وب با یک قالب یکسان به
                همین گروه‌ها می‌رسند.
              </span>
            </div>

            <div
              className="page-hint"
              style={{ marginTop: 14 }}
            >
              <span>🛡</span>

              <span>
                هر تغییر در این صفحه به‌صورت
                خودکار در{' '}
                <b>لاگ فعالیت مدیران</b> با
                سطح حساسیت مناسب (حالت تعمیر =
                بحرانی) ثبت می‌شود — قابل
                پیگیری در «لاگ فعالیت مدیران ←
                پنل مدیریت».
              </span>
            </div>
          </>
        )}
      </main>
    </>
  );
}
