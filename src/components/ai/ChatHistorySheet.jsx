import {
  useEffect,
  useState,
} from 'react';

import {
  haptic,
} from '../../lib/telegram';

import {
  confirmAction,
} from '../../lib/confirm';


/* ─────────────────────────────────────────────
   شیت تاریخچه‌ی گفت‌وگوهای هوشیار
   الگو همان more-sheet طراحی‌شده در سیستم است
   تا گسترش/بستن، بلر و حرکت کاملاً هم‌خانواده
   با بقیه‌ی اپ باشد.
───────────────────────────────────────────── */


/* زمان نسبی فارسی برای متا‌خط هر گفت‌وگو */
function relativeTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const diffMinutes = Math.floor(
    (Date.now() - date.getTime()) / 60000,
  );

  if (diffMinutes < 1) {
    return 'هم‌اکنون';
  }

  if (diffMinutes < 60) {
    return (
      diffMinutes.toLocaleString('fa-IR') +
      ' دقیقه پیش'
    );
  }

  const diffHours = Math.floor(
    diffMinutes / 60,
  );

  if (diffHours < 24) {
    return (
      diffHours.toLocaleString('fa-IR') +
      ' ساعت پیش'
    );
  }

  const diffDays = Math.floor(
    diffHours / 24,
  );

  if (diffDays === 1) {
    return 'دیروز';
  }

  if (diffDays < 30) {
    return (
      diffDays.toLocaleString('fa-IR') +
      ' روز پیش'
    );
  }

  return date.toLocaleDateString('fa-IR', {
    month: 'short',
    day: 'numeric',
  });
}


export default function ChatHistorySheet({
  conversations = [],
  activeId,
  loading = false,
  showArchived = false,
  busy = false,
  onToggleArchived,
  onClose,
  onSelect,
  onNew,
  onRename,
  onTogglePin,
  onToggleArchive,
  onDelete,
}) {
  const [query, setQuery] = useState('');

  // وضعیت تغییرنام این‌لاین — فقط یک ردیف در
  // هر لحظه می‌تواند در حالت ویرایش باشد
  const [renameId, setRenameId] =
    useState(null);

  const [renameDraft, setRenameDraft] =
    useState('');


  // قفل اسکرول بدنه + بستن با Escape — دقیقاً
  // همان قرارداد MoreSheet
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    const closeWithEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';

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


  const normalizedQuery = query.trim();

  const filtered = normalizedQuery
    ? conversations.filter((item) =>
        (
          String(item.title || '') +
          '\n' +
          String(item.preview || '')
        )
          .toLowerCase()
          .includes(
            normalizedQuery.toLowerCase(),
          ),
      )
    : conversations;


  const startRename = (item) => {
    haptic('light');

    setRenameId(item.id);

    setRenameDraft(
      String(item.title || ''),
    );
  };


  const commitRename = () => {
    const title = renameDraft.trim();

    if (
      !title ||
      !renameId
    ) {
      setRenameId(null);
      return;
    }

    onRename(renameId, title);

    setRenameId(null);
  };


  const askDelete = async (item) => {
    haptic('medium');

    const confirmed = item.legacy
      ? await confirmAction(
          'حافظه‌ی مشترک هوشیار در ربات و ' +
          'وب‌اپ کاملاً پاک شود؟ ' +
          'این کار برگشت‌ناپذیر است.',
        )
      : await confirmAction(
          `گفت‌وگوی «${item.title}» ` +
          'برای همیشه حذف شود؟',
        );

    if (confirmed) {
      onDelete(item);
    }
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
        aria-label="تاریخچه‌ی گفت‌وگوها"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="more-sheet__handle" />

        <div className="more-sheet__title">
          گفت‌وگوها
        </div>

        <button
          type="button"
          className="conv-new"
          onClick={onNew}
          disabled={busy}
        >
          ＋ گفت‌وگوی جدید
        </button>

        <input
          className="inp conv-search"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="جست‌وجو در گفت‌وگوها..."
          aria-label="جست‌وجو در گفت‌وگوها"
        />

        <div className="conv-list">
          {
            loading
              ? [0, 1, 2].map((key) => (
                  <div
                    key={key}
                    className="skeleton"
                    style={{
                      height: 56,
                      borderRadius: 13,
                    }}
                  />
                ))
              : filtered.length === 0
                ? (
                  <div className="conv-empty">
                    {
                      normalizedQuery
                        ? 'چیزی با این عبارت پیدا نشد'
                        : 'هنوز گفت‌وگویی نساخته‌ای؛ از دکمه‌ی بالا شروع کن'
                    }
                  </div>
                )
                : filtered.map((item) => {
                    const isActive =
                      item.id === activeId;

                    const renaming =
                      renameId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={
                          'conv' +
                          (
                            isActive
                              ? ' conv--active'
                              : ''
                          ) +
                          (
                            item.archived
                              ? ' conv--archived'
                              : ''
                          )
                        }
                      >
                        <span className="conv__icon">
                          {
                            item.legacy
                              ? '🤖'
                              : item.archived
                                ? '📦'
                                : '💬'
                          }
                        </span>

                        {
                          renaming
                            ? (
                              <div className="conv-rename">
                                <input
                                  className={
                                    'inp ' +
                                    'conv-rename__inp'
                                  }
                                  autoFocus
                                  value={renameDraft}
                                  maxLength={80}
                                  onChange={(event) =>
                                    setRenameDraft(
                                      event.target
                                        .value,
                                    )
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key ===
                                      'Enter'
                                    ) {
                                      commitRename();
                                    }

                                    if (
                                      event.key ===
                                      'Escape'
                                    ) {
                                      setRenameId(
                                        null,
                                      );
                                    }
                                  }}
                                  aria-label="نام جدید گفت‌وگو"
                                />
                              </div>
                            )
                            : (
                              <button
                                type="button"
                                className="conv__main"
                                onClick={() =>
                                  onSelect(item.id)
                                }
                              >
                                <span className="conv__body">
                                  <span className="conv__title">
                                    <span>
                                      {item.title}
                                    </span>

                                    {
                                      item.pinned
                                      && (
                                        <span
                                          className="conv__pin"
                                          title="پین‌شده"
                                        >
                                          📌
                                        </span>
                                      )
                                    }

                                    {
                                      item.legacy
                                      && (
                                        <span className="badge b-pur">
                                          مشترک با ربات
                                        </span>
                                      )
                                    }
                                  </span>

                                  {
                                    item.preview
                                    && (
                                      <span
                                        className="conv__preview"
                                        dir="auto"
                                      >
                                        {item.preview}
                                      </span>
                                    )
                                  }

                                  <span className="conv__meta">
                                    {
                                      relativeTime(
                                        item.updated_at,
                                      )
                                    }

                                    <span className="conv__count">
                                      {
                                        Number(
                                          item.count || 0,
                                        ).toLocaleString(
                                          'fa-IR',
                                        )
                                      }
                                      {' پیام'}
                                    </span>
                                  </span>
                                </span>
                              </button>
                            )
                        }

                        <span className="conv__acts">
                          {
                            renaming
                              ? (
                                <>
                                  <button
                                    type="button"
                                    className={
                                      'conv__act ' +
                                      'conv__act--on'
                                    }
                                    onClick={commitRename}
                                    aria-label="ذخیره‌ی نام"
                                  >
                                    ✓
                                  </button>

                                  <button
                                    type="button"
                                    className="conv__act"
                                    onClick={() =>
                                      setRenameId(null)
                                    }
                                    aria-label="انصراف"
                                  >
                                    ✕
                                  </button>
                                </>
                              )
                              : (
                                <>
                                  {
                                    !item.legacy
                                    && !item.archived
                                    && (
                                      <button
                                        type="button"
                                        className={
                                          'conv__act' +
                                          (
                                            item.pinned
                                              ? ' conv__act--on'
                                              : ''
                                          )
                                        }
                                        onClick={() =>
                                          onTogglePin(item)
                                        }
                                        disabled={busy}
                                        aria-label={
                                          item.pinned
                                            ? 'برداشتن پین'
                                            : 'پین‌کردن'
                                        }
                                      >
                                        📌
                                      </button>
                                    )
                                  }

                                  {
                                    !item.legacy
                                    && (
                                      <button
                                        type="button"
                                        className="conv__act"
                                        onClick={() =>
                                          startRename(item)
                                        }
                                        disabled={busy}
                                        aria-label="تغییر نام"
                                      >
                                        ✏️
                                      </button>
                                    )
                                  }

                                  {
                                    !item.legacy
                                    && (
                                      <button
                                        type="button"
                                        className="conv__act"
                                        onClick={() =>
                                          onToggleArchive(item)
                                        }
                                        disabled={busy}
                                        aria-label={
                                          item.archived
                                            ? 'خروج از بایگانی'
                                            : 'بایگانی'
                                        }
                                      >
                                        {
                                          item.archived
                                            ? '📤'
                                            : '📥'
                                        }
                                      </button>
                                    )
                                  }

                                  <button
                                    type="button"
                                    className={
                                      'conv__act ' +
                                      'conv__act--danger'
                                    }
                                    onClick={() =>
                                      askDelete(item)
                                    }
                                    disabled={busy}
                                    aria-label="حذف گفت‌وگو"
                                  >
                                    🗑
                                  </button>
                                </>
                              )
                          }
                        </span>
                      </div>
                    );
                  })
          }
        </div>

        <button
          type="button"
          className="conv-arch-toggle"
          onClick={onToggleArchived}
        >
          {
            showArchived
              ? '▾ پنهان‌کردن بایگانی‌شده‌ها'
              : '▸ نمایش بایگانی‌شده‌ها'
          }
        </button>
      </div>
    </div>
  );
}
