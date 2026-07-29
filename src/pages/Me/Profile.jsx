import { useState } from 'react';
import {
  useQuery,
  useMutation,
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
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
};

const toPercent = (value) =>
  Math.min(100, toNumber(value));

const errorMessage = (
  error,
  fallback = 'انجام عملیات با خطا مواجه شد'
) => {
  const detail = error?.response?.data?.detail;

  return typeof detail === 'string' && detail
    ? detail
    : fallback;
};

function WeekChart({ data = [] }) {
  const rows = Array.isArray(data)
    ? data
    : [];

  if (rows.length === 0) {
    return null;
  }

  const values = rows.map((item) =>
    toNumber(item?.count)
  );

  const max = Math.max(...values, 1);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        height: 50,
      }}
    >
      {rows.map((item, index) => {
        const count = values[index];

        return (
          <div
            key={`${item?.date || 'day'}-${index}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <div
              style={{
                width: '100%',
                borderRadius: 3,
                background:
                  count > 0
                    ? 'var(--acc)'
                    : 'var(--ovr)',
                height: `${Math.max(
                  (count / max) * 42,
                  count > 0 ? 5 : 3
                )}px`,
                transition: 'height .5s',
              }}
            />

            <div
              style={{
                fontSize: 8,
                color: 'var(--txm)',
              }}
            >
              {String(
                item?.date || ''
              ).slice(-2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PickerSheet({
  title,
  options = [],
  current,
  onSelect,
  onClose,
  loading = false,
  pending = false,
}) {
  const safeOptions = Array.isArray(options)
    ? options
    : [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.65)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        className="fade-up"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surf)',
          borderRadius: '20px 20px 0 0',
          padding:
            '18px 14px calc(18px + env(safe-area-inset-bottom))',
        }}
      >
        <div
          style={{
            width: 34,
            height: 4,
            background: 'var(--bd)',
            borderRadius: 999,
            margin: '0 auto 14px',
          }}
        />

        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 12,
          }}
        >
          {title}
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <Spinner size={22} />
          </div>
        ) : safeOptions.length === 0 ? (
          <div className="empty">
            گزینه‌ای برای انتخاب وجود ندارد.
          </div>
        ) : (
          safeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                haptic();

                if (option.value === current) {
                  onClose();
                } else {
                  onSelect(option.value);
                }
              }}
              disabled={pending}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 6px',
                background: 'none',
                border: 'none',
                cursor: pending
                  ? 'default'
                  : 'pointer',
                textAlign: 'right',
                borderBottom:
                  '1px solid var(--bd)',
                color:
                  current === option.value
                    ? 'var(--acc)'
                    : 'var(--tx)',
                fontWeight:
                  current === option.value
                    ? 700
                    : 400,
                fontFamily: 'var(--font)',
                fontSize: 13.5,
                opacity: pending ? 0.6 : 1,
              }}
            >
              {option.label}

              {current === option.value && (
                <span>✓</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const [editName, setEditName] =
    useState(false);

  const [nameValue, setNameValue] =
    useState('');

  const [
    editStudentId,
    setEditStudentId,
  ] = useState(false);

  const [
    studentIdValue,
    setStudentIdValue,
  ] = useState('');

  const [showGroup, setShowGroup] =
    useState(false);

  const [showIntake, setShowIntake] =
    useState(false);

  const toast = useUIStore(
    (state) => state.toast
  );

  const refreshAuthUser = useAuthStore(
    (state) => state.refresh
  );

  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () =>
      api
        .get('/api/profile')
        .then((response) => response.data),
    staleTime: 1000 * 60 * 3,
  });

  const { data: rankData } = useQuery({
    queryKey: ['rank'],
    queryFn: () =>
      api
        .get('/api/profile/rank')
        .then((response) => response.data),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: intakes,
    isLoading: intakesLoading,
  } = useQuery({
    queryKey: ['intakes'],
    queryFn: () =>
      api
        .get('/api/profile/intakes')
        .then(
          (response) =>
            response.data?.intakes || []
        ),
    staleTime: 1000 * 60 * 30,
    enabled: showIntake,
  });

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () =>
      api
        .get('/api/profile/badges')
        .then(
          (response) =>
            response.data?.badges || []
        ),
    staleTime: 1000 * 60 * 10,
  });

  const refreshProfile = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['profile'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['dashboard'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['rank'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['badges'],
      }),
      refreshAuthUser(),
    ]);
  };

  const updateName = useMutation({
    mutationFn: (name) =>
      api
        .patch('/api/profile/name', {
          name,
        })
        .then((response) => response.data),

    onSuccess: async () => {
      hapticNotif('success');
      toast('نام ذخیره شد ✅', 'success');
