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
