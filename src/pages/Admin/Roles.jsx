import {
  useMemo,
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
import api from '../../lib/api';
import {
  haptic,
  hapticNotif,
} from '../../lib/telegram';
import {
  useUIStore,
} from '../../stores/uiStore';


/* ─────────────────────────────────────────────
   🛡 مدیریت نقش‌ها — موج RBAC-W2 (قرارداد §۶)
   همه‌چیز داینامیک از /api/admin/rbac می‌آید:
   لیست نقش‌ها، رجیستری مجوزها، ساخت/ویرایش/حذف،
   ماتریس سوییچ‌های تکی دسته‌بندی‌شده. هیچ نقش/
   برچسب/رنگ/آیکونی اینجا هاردکد نیست — سرور
   تنها منبع حقیقت است (§۴).
───────────────────────────────────────────── */


const ROLES_KEY = ['rbac-roles'];
const PERMS_KEY = ['rbac-perms'];

const faNum = (value) =>
  String(value ?? '').replace(
    /\d/g,
    (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit],
  );

const faDate = (iso) => {
  if (!iso) return '—';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '—';
  return new Date(iso).toLocaleDateString('fa-IR');
};


/* 🎛 سوییچ کوچک — بدون وابستگی به کلاس‌های خاص
   تا روی هر دیتایی قابل استفاده باشد */
function MiniSwitch({ on, onToggle, color, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      style={{
        width: 32,
        height: 18,
        borderRadius: 99,
        border: '1px solid var(--line)',
        background: on
          ? color || 'rgba(52,211,153,.35)'
          : 'rgba(255,255,255,.06)',
        position: 'relative',
        flexShrink: 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background .15s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          insetInlineStart: on ? 15 : 2,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: on ? '#E8F0FF' : '#7A8DB0',
          transition: 'inset-inline-start .15s ease',
        }}
      />
    </button>
  );
}


export function AdminRoles() {
  const toast = useUIStore((state) => state.toast);
  const queryClient = useQueryClient();

  const [mode, setMode] = useState('list');
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState(
    () => new Set(),
  );


  const rolesQuery = useQuery({
    queryKey: ROLES_KEY,
    queryFn: () =>
      api
        .get('/api/admin/rbac/roles')
        .then((response) => response.data),
    staleTime: 30_000,
  });

  const permsQuery = useQuery({
    queryKey: PERMS_KEY,
    queryFn: () =>
      api
        .get('/api/admin/rbac/permissions')
        .then((response) => response.data),
    staleTime: 300_000,
  });

  const roles = rolesQuery.data?.roles || [];
  const categories = permsQuery.data?.categories || [];
  const allPerms = permsQuery.data?.permissions || [];


  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ROLES_KEY,
    });


  const saveMutation = useMutation({
    mutationFn: (payload) =>
      payload.key
        ? api.patch(
          `/api/admin/rbac/roles/${payload.key}`,
          payload.body,
        )
        : api.post('/api/admin/rbac/roles', payload.body),

    onSuccess: () => {
      hapticNotif('success');
      toast('✅ نقش ذخیره شد', 'success');
      setMode('list');
      setDraft(null);
      refresh();
    },

    onError: (error) => {
      hapticNotif('error');
      const detail = error?.response?.data?.detail;
      toast(
        typeof detail === 'string' && detail
          ? detail
          : 'ذخیره نقش انجام نشد',
        'error',
      );
    },
  });


  const deleteMutation = useMutation({
    mutationFn: (key) =>
      api.delete(`/api/admin/rbac/roles/${key}`),

    onSuccess: () => {
      hapticNotif('success');
      toast('🗑 نقش حذف شد', 'success');
      refresh();
    },

    onError: (error) => {
      hapticNotif('error');
      const detail = error?.response?.data?.detail;
      toast(
        typeof detail === 'string' && detail
          ? detail
          : 'حذف نقش انجام نشد',
        'error',
      );
    },
  });


  /* ✏️ آغاز ویرایش/ساخت — draft با Set از مجوزها */
  const startEdit = (role = null) => {
    haptic('light');
    setSearch('');
    setOpenCats(new Set(categories.map((c) => c.key)));
    setDraft(
      role
        ? {
          key: role.key,
          label: role.label,
          desc: role.desc,
          icon: role.icon,
          color: role.color,
          priority: role.priority,
          perms: new Set(role.perms),
          system: role.system,
        }
        : {
          key: null,
          label: '',
          desc: '',
          icon: '🛡',
          color: '#70A7FF',
          priority: 90,
          perms: new Set(),
          system: false,
        },
    );
    setMode('edit');
  };


  const togglePerm = (key) => {
    haptic('light');
    setDraft((prev) => {
      const perms = new Set(prev.perms);
      if (perms.has(key)) perms.delete(key);
      else perms.add(key);
      return { ...prev, perms };
    });
  };


  const setCatPerms = (catKey, on) => {
    const keys = allPerms
      .filter((p) => p.category === catKey)
      .map((p) => p.key);
    setDraft((prev) => {
      const perms = new Set(prev.perms);
      keys.forEach((key) =>
        on ? perms.add(key) : perms.delete(key),
      );
      return { ...prev, perms };
    });
  };


  const setAllPerms = (on) =>
    setDraft((prev) => ({
      ...prev,
      perms: on
        ? new Set(allPerms.map((p) => p.key))
        : new Set(),
    }));


  /* 🔍 فیلتر جست‌وجو روی ماتریس */
  const visiblePerms = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return allPerms;
    return allPerms.filter((perm) =>
      perm.label.toLowerCase().includes(needle) ||
      perm.key.toLowerCase().includes(needle),
    );
  }, [allPerms, search]);

  const grouped = useMemo(
    () =>
      categories.map((cat) => ({
        ...cat,
        perms: visiblePerms.filter(
          (perm) => perm.category === cat.key,
        ),
      })),
    [categories, visiblePerms],
  );


  const submit = () => {
    if (!draft.label.trim()) {
      toast('نام نقش را بنویس', 'error');
      return;
    }
    const body = {
      label: draft.label.trim(),
      desc: draft.desc.trim(),
      ...(draft.icon.trim()
        ? { icon: draft.icon.trim() }
        : {}),
      color: draft.color.trim() || '#70A7FF',
      priority: Number(draft.priority) || 90,
      perms: [...draft.perms],
    };
    saveMutation.mutate(
      draft.key
        ? { key: draft.key, body }
        : { body },
    );
  };


  /* ════ حالت ویرایشگر (ساخت/ویرایش) ════ */
  if (mode === 'edit' && draft) {
    return (
      <>
        <Header
          title={
            draft.key ? `ویرایش ${draft.label}` : 'نقش جدید'
          }
          subtitle={
            draft.system
              ? 'نقش سیستمی — قابل ویرایش، حذف‌ناپذیر'
              : `${faNum(draft.perms.size)} مجوز انتخاب شده`
          }
          backTo="/admin/roles"
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
          {/* 🪪 مشخصات نقش */}
          <section
            className="card fade-up"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1, minHeight: 36, fontSize: 12 }}
                placeholder="نام نقش (مثل ناظم شب)"
                value={draft.label}
                maxLength={60}
                onChange={(event) =>
                  setDraft({ ...draft, label: event.target.value })
                }
                aria-label="نام نقش"
              />
              <input
                className="input"
                style={{ width: 52, minHeight: 36, fontSize: 15, textAlign: 'center' }}
                value={draft.icon}
                maxLength={2}
                onChange={(event) =>
                  setDraft({ ...draft, icon: event.target.value })
                }
                aria-label="آیکون"
              />
            </div>

            <input
              className="input"
              style={{ minHeight: 34, fontSize: 11 }}
              placeholder="توضیح کوتاه (اختیاری)"
              value={draft.desc}
              maxLength={200}
              onChange={(event) =>
                setDraft({ ...draft, desc: event.target.value })
              }
              aria-label="توضیح نقش"
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10.5,
                  color: 'var(--tx2)',
                }}
              >
                رنگ
                <input
                  type="color"
                  value={draft.color}
                  onChange={(event) =>
                    setDraft({ ...draft, color: event.target.value })
                  }
                  style={{
                    width: 28,
                    height: 24,
                    border: 'none',
                    background: 'none',
                    padding: 0,
                  }}
                  aria-label="رنگ نقش"
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10.5,
                  color: 'var(--tx2)',
                }}
              >
                اولویت
                <input
                  type="number"
                  className="input"
                  style={{ width: 64, minHeight: 30, fontSize: 11 }}
                  min={1}
                  max={999}
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      priority: event.target.value,
                    })
                  }
                  aria-label="اولویت نقش"
                />
              </label>
            </div>
          </section>

          {/* 🎚 نوار ابزار ماتریس مجوزها */}
          <section
            className="card fade-up"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <input
                type="search"
                className="input"
                style={{
                  flex: 1,
                  minWidth: 120,
                  minHeight: 32,
                  fontSize: 11,
                }}
                placeholder="جست‌وجو در مجوزها…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="جست‌وجو در مجوزها"
              />
              <button
                type="button"
                className="tab-btn"
                style={{ fontSize: 9.5, minHeight: 28 }}
                onClick={() => setAllPerms(true)}
              >
                همه روشن
              </button>
              <button
                type="button"
                className="tab-btn"
                style={{ fontSize: 9.5, minHeight: 28 }}
                onClick={() => setAllPerms(false)}
              >
                همه خاموش
              </button>
              <button
                type="button"
                className="tab-btn"
                style={{ fontSize: 9.5, minHeight: 28 }}
                onClick={() =>
                  setOpenCats(
                    new Set(categories.map((c) => c.key)),
                  )
                }
              >
                باز کردن همه
              </button>
              <button
                type="button"
                className="tab-btn"
                style={{ fontSize: 9.5, minHeight: 28 }}
                onClick={() => setOpenCats(new Set())}
              >
                جمع کردن همه
              </button>
            </div>
          </section>

          {/* 🧩 ماتریس دسته‌بندی‌شده — از رجیستری سرور */}
          {grouped.map((cat) =>
            cat.perms.length > 0 && (
              <section
                key={cat.key}
                className="card fade-up"
                style={{ padding: '0 12px 8px' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    haptic('light');
                    setOpenCats((prev) => {
                      const next = new Set(prev);
                      if (next.has(cat.key)) next.delete(cat.key);
                      else next.add(cat.key);
                      return next;
                    });
                  }}
                  style={{
                    all: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    width: '100%',
                    padding: '10px 2px 6px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  aria-expanded={openCats.has(cat.key)}
                >
                  <span>
                    {cat.label}
                  </span>
                  <span
                    className="badge b-gray"
                    style={{ fontSize: 8.5 }}
                  >
                    {faNum(
                      allPerms.filter(
                        (p) =>
                          p.category === cat.key &&
                          draft.perms.has(p.key),
                      ).length,
                    )}
                    {'/'}
                    {faNum(
                      allPerms.filter(
                        (p) => p.category === cat.key,
                      ).length,
                    )}
                  </span>
                  <span style={{ marginInlineStart: 'auto', fontSize: 10, color: 'var(--txm)' }}>
                    {openCats.has(cat.key) ? '▲' : '▼'}
                  </span>
                </button>

                {openCats.has(cat.key) && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        paddingBottom: 6,
                      }}
                    >
                      <button
                        type="button"
                        className="tab-btn"
                        style={{ fontSize: 8.5, minHeight: 24, padding: '2px 7px' }}
                        onClick={() => setCatPerms(cat.key, true)}
                      >
                        همهٔ این دسته روشن
                      </button>
                      <button
                        type="button"
                        className="tab-btn"
                        style={{ fontSize: 8.5, minHeight: 24, padding: '2px 7px' }}
                        onClick={() => setCatPerms(cat.key, false)}
                      >
                        همه خاموش
                      </button>
                    </div>

                    {cat.perms.map((perm) => (
                      <div
                        key={perm.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          padding: '7px 2px',
                          borderTop: '1px solid var(--line)',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10.5 }}>
                            {perm.label}
                          </div>
                          <div
                            style={{
                              fontSize: 8.5,
                              color: 'var(--txm)',
                              direction: 'ltr',
                              textAlign: 'left',
                            }}
                          >
                            {perm.key}
                          </div>
                        </div>
                        <MiniSwitch
                          on={draft.perms.has(perm.key)}
                          onToggle={() => togglePerm(perm.key)}
                          color={`${draft.color}55`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ),
          )}

          {/* 💾 اکشن‌ها */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              position: 'sticky',
              bottom: 10,
            }}
          >
            <button
              type="button"
              className="btn btn-p"
              style={{ flex: 1 }}
              disabled={saveMutation.isPending}
              onClick={submit}
            >
              {saveMutation.isPending
                ? <Spinner size={14} />
                : '💾'}{' '}
              ذخیره نقش
            </button>
            <button
              type="button"
              className="btn btn-d"
              onClick={() => {
                haptic('light');
                setMode('list');
                setDraft(null);
              }}
            >
              انصراف
            </button>
          </div>
        </main>
      </>
    );
  }


  /* ════ حالت لیست ════ */
  return (
    <>
      <Header
        title="مدیریت نقش‌ها"
        subtitle={`${faNum(roles.length)} نقش — RBAC دیتابیس‌محور`}
        backTo="/admin"
        right={
          <button
            type="button"
            className="btn btn-d"
            style={{ minHeight: 32, padding: '5px 10px', fontSize: 10.5 }}
            onClick={() => startEdit()}
          >
            + نقش جدید
          </button>
        }
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
        {rolesQuery.isPending &&
          [0, 1, 2].map((key) => (
            <div
              key={key}
              className="skeleton"
              style={{ height: 86, borderRadius: 14 }}
            />
          ))}

        {rolesQuery.isError && (
          <div className="empty card">
            <div style={{ fontSize: 28 }}>📡</div>
            <p>نقش‌ها بارگذاری نشد</p>
            <button
              type="button"
              className="btn btn-d"
              onClick={() => rolesQuery.refetch()}
            >
              تلاش دوباره
            </button>
          </div>
        )}

        {roles.map((role, index) => (
          <section
            key={role.key}
            className="card pop-in"
            style={{
              padding: '11px 14px',
              animationDelay: `${Math.min(index * 30, 240)}ms`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 13,
                  background: `${role.color}22`,
                  color: role.color,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 17,
                  flexShrink: 0,
                }}
              >
                {role.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <b style={{ fontSize: 12 }}>{role.label}</b>
                  {role.system ? (
                    <span className="badge b-pur" style={{ fontSize: 8 }}>
                      🔒 سیستمی
                    </span>
                  ) : (
                    <span className="badge b-grn" style={{ fontSize: 8 }}>
                      ✨ دلخواه
                    </span>
                  )}
                  {!role.active && (
                    <span className="badge b-red" style={{ fontSize: 8 }}>
                      خاموش
                    </span>
                  )}
                  {!role.visible && (
                    <span className="badge b-gray" style={{ fontSize: 8 }}>
                      مخفی
                    </span>
                  )}
                </div>

                {role.desc ? (
                  <div
                    style={{
                      color: 'var(--tx2)',
                      fontSize: 9.5,
                      marginTop: 2,
                    }}
                  >
                    {role.desc}
                  </div>
                ) : null}

                <div
                  style={{
                    color: 'var(--txm)',
                    fontSize: 8.5,
                    marginTop: 4,
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>🎚 {faNum(role.perm_count)} مجوز</span>
                  <span>👥 {faNum(role.users_count)} کاربر</span>
                  <span>⏫ اولویت {faNum(role.priority)}</span>
                  <span>🗓 {faDate(role.updated_at)}</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  className="btn btn-dark"
                  style={{ minHeight: 30, fontSize: 11, padding: '4px 9px' }}
                  onClick={() => startEdit(role)}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  style={{
                    minHeight: 30,
                    fontSize: 11,
                    padding: '4px 9px',
                    opacity:
                      role.system || role.users_count > 0 ? 0.35 : 1,
                  }}
                  disabled={role.system || role.users_count > 0}
                  title={
                    role.system
                      ? 'نقش سیستمی حذف‌ناپذیر است'
                      : role.users_count > 0
                        ? 'ابتدا نقش را از کاربران بگیر'
                        : 'حذف نقش'
                  }
                  onClick={() => {
                    haptic('light');
                    if (
                      window.confirm(
                        `حذف نقش «${role.label}»؟ این کار برگشت‌ناپذیر است.`,
                      )
                    ) {
                      deleteMutation.mutate(role.key);
                    }
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}


export default AdminRoles;
