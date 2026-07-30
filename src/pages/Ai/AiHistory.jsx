import {
  useState,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useNavigate,
} from 'react-router-dom';

import Header from '../../components/layout/Header';
import {
  Spinner,
} from '../../components/shared/Loading';
import ConvRows from '../../components/ai/ConvRows';
import ConvActionSheet from '../../components/ai/ConvActionSheet';
import useConvActions from './useConvActions';
import api from '../../lib/api';
import {
  haptic,
  hapticNotif,
} from '../../lib/telegram';
import {
  useUIStore,
} from '../../stores/uiStore';


/* ─────────────────────────────────────────────
   صفحه‌ی تاریخچه‌ی گفت‌وگوها — نقطه‌ی ورود /ai
   الگو از ChatGPT: اول فهرست، بعد ورود به چت.
───────────────────────────────────────────── */


function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  return fallback;
}


export default function AiHistory() {
  const navigate = useNavigate();

  const toast = useUIStore(
    (state) => state.toast,
  );

  const queryClient = useQueryClient();


  const [query, setQuery] = useState('');

  const [showArchived, setShowArchived] =
    useState(false);

  const [renameId, setRenameId] =
    useState(null);

  const [actionItem, setActionItem] =
    useState(null);


  const {
    data: convData,
    isPending: convsPending,
  } = useQuery({
    queryKey: [
      'ai-conversations',
      showArchived,
    ],

    queryFn: () => api
      .get('/api/ai/conversations', {
        params: {
          include_archived: showArchived,
        },
      })
      .then((response) => response.data),

    staleTime: 15_000,
  });

  const conversations =
    convData?.conversations || [];


  const {
    runAction,
    busy: actionsBusy,
  } = useConvActions({
    navigate,

    onDeleted: () => {
      // در صفحه‌ی تاریخچه کافی است فهرست تازه
      // شود؛ رشته‌ی حذف‌شده از نمایش بیرون می‌رود
    },
  });


  // ساخت گفت‌وگوی جدید — کش را همان‌جا بذر
  // می‌کنیم تا صفحه‌ی چت بدون فلش لودینگ باز شود
  const createConvMutation = useMutation({
    mutationFn: () =>
      api.post('/api/ai/conversations', {}),

    onSuccess: (response) => {
      const id = String(response.data?.id || '');

      if (!id) {
        return;
      }

      queryClient.setQueryData(
        ['ai-conv-msgs', id],
        [],
      );

      hapticNotif('success');

      queryClient.invalidateQueries({
        queryKey: ['ai-conversations'],
      });

      navigate(`/ai/c/${id}`);
    },

    onError: (error) => {
      toast(
        getErrorMessage(
          error,
          'ساخت گفت‌وگوی جدید انجام نشد',
        ),
        'error',
      );
    },
  });


  const patchRenameMutation = useMutation({
    mutationFn: ({ id, title }) =>
      api.patch(
        `/api/ai/conversations/${id}`,
        { title },
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-conversations'],
      });
    },

    onError: (error) => {
      toast(
        getErrorMessage(
          error,
          'ذخیره‌ی نام انجام نشد',
        ),
        'error',
      );
    },
  });


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


  const openConversation = (item) => {
    haptic('light');

    navigate(`/ai/c/${item.id}`);
  };


  const handleSheetAction = (actionId) => {
    if (!actionItem) {
      return;
    }

    if (actionId === 'rename') {
      haptic('light');

      setRenameId(actionItem.id);

      return;
    }

    runAction(actionItem, actionId);
  };


  const busy =
    actionsBusy
    || createConvMutation.isPending
    || patchRenameMutation.isPending;


  const headerAction = (
    <button
      type="button"
      className="btn btn-p"
      style={{
        minHeight: 32,
        padding: '5px 9px',
        fontSize: 11,
      }}
      onClick={() =>
        createConvMutation.mutate()
      }
      disabled={busy}
      aria-label="گفت‌وگوی جدید"
    >
      {
        createConvMutation.isPending
          ? <Spinner size={15} />
          : '＋'
      }

      جدید
    </button>
  );


  return (
    <>
      <Header
        title="هوشیار"
        subtitle="تاریخچه‌ی گفت‌وگوها"
        right={headerAction}
        backTo="/"
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
        <button
          type="button"
          className="conv-new"
          onClick={() =>
            createConvMutation.mutate()
          }
          disabled={busy}
        >
          {
            createConvMutation.isPending
              ? <Spinner size={16} />
              : '＋'
          }

          شروع گفت‌وگوی جدید
        </button>

        <div className="conv-searchbox">
          <span className="conv-searchbox__icon">
            🔍
          </span>

          <input
            className="inp"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="جست‌وجو در گفت‌وگوها..."
            aria-label="جست‌وجو در گفت‌وگوها"
          />
        </div>

        <div className="conv-list">
          {
            convsPending
              ? [0, 1, 2, 3].map((key) => (
                  <div
                    key={key}
                    className="skeleton"
                    style={{
                      height: 62,
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
                        : 'هنوز گفت‌وگویی نداری — اولین سؤالت را بپرس'
                    }
                  </div>
                )
                : (
                  <ConvRows
                    items={filtered}
                    renameId={renameId}
                    onRenameDone={() =>
                      setRenameId(null)
                    }
                    onRename={(id, title) =>
                      patchRenameMutation.mutate({
                        id,
                        title,
                      })
                    }
                    onSelect={openConversation}
                    onOpenActions={(item) => {
                      haptic('light');

                      setActionItem(item);
                    }}
                    busy={busy}
                    page
                  />
                )
          }
        </div>

        {
          !convsPending
          && (
            <button
              type="button"
              className="conv-arch-toggle"
              onClick={() => {
                haptic('light');

                setShowArchived(
                  (current) => !current,
                );
              }}
            >
              {
                showArchived
                  ? '▾ پنهان‌کردن بایگانی‌شده‌ها'
                  : '▸ نمایش بایگانی‌شده‌ها'
              }
            </button>
          )
        }
      </main>

      {
        actionItem
        && (
          <ConvActionSheet
            conv={actionItem}
            busy={busy}
            onClose={() =>
              setActionItem(null)
            }
            onAction={handleSheetAction}
          />
        )
      }
    </>
  );
}
