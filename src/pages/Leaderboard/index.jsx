import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import api from '../../lib/api';
import Header from '../../components/layout/Header';
import NameChip from '../../components/shared/NameChip';

import {
  UsersListSkeleton,
} from '../../components/shared/skeletons';

import { haptic } from '../../lib/telegram';

/* 👑 موج P2 Prestige — میدان رقابت:
   ماتریس بازه × دامنه × تب (کاملاً سرورمحور)
   + ردیف چسبان «من» با Jump هفتگی + رقبا.
   هیچ فرمول رتبه‌بندی در FE نیست. */

const faNum = (value) =>
  String(value ?? '').replace(
    /\d/g,
    (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]
  );

const RANGES = [
  ['week', 'هفته'],
  ['month', 'ماه'],
  ['all', 'کل'],
  ['season', 'سیزن'],
];

const SCOPES = [
  ['all', 'همه'],
  ['intake', 'ورودی من'],
  ['group', 'گروه من'],
];

const TABS = [
  ['xp', '⚡ XP', 'XP'],
  ['acc', '🎯 دقت', '٪'],
  ['exam', '📝 آزمون', 'آزمون'],
  ['contrib', '✍️ مشارکت', 'سؤال'],
];

function ChipRow({ options, value, onPick }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={
            'tab-btn' +
            (value === key ? ' active' : '')
          }
          style={{ fontSize: 11 }}
          onClick={() => {
            haptic();
            onPick(key);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function JumpBadge({ jump }) {
  if (jump == null) {
    return null;
  }

  if (jump === 0) {
    return (
      <span
        style={{
          color: 'var(--txm)',
          fontSize: 9.5,
        }}
      >
        ▬ بدون تغییر
      </span>
    );
  }

  return (
    <span
      style={{
        color:
          jump > 0
            ? 'var(--ok)'
            : 'var(--err)',
        fontSize: 9.5,
        fontWeight: 700,
      }}
    >
      {jump > 0 ? '▲' : '▼'} {faNum(
        Math.abs(jump)
      )}{' '}
      نسبت به هفته‌ی قبل
    </span>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();

  const [range, setRange] =
    useState('week');

  const [scope, setScope] =
    useState('all');

  const [tab, setTab] =
    useState('xp');

  const { data, isLoading } = useQuery({
    queryKey: [
      'leaderboard',
      range,
      scope,
      tab,
    ],
    queryFn: () =>
      api
        .get('/api/dashboard/leaderboard', {
          params: {
            range_: range,
            scope,
            tab,
            limit: 50,
          },
        })
        .then(
          (response) => response.data
        ),
    staleTime: 30 * 1000,
  });

  const tabMeta =
    TABS.find(([key]) => key === tab) ||
    TABS[0];

  const rows = data?.rows || [];

  const me = data?.me;

  const valueLabel = (row) =>
    `${faNum(row.value)} ${tabMeta[2]}`;

  const renderRow = (row) => (
    <div
      key={row.uid}
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        border: row.is_me
          ? '1.5px solid var(--acc)'
          : '1px solid var(--bd)',
      }}
    >
      <b
        style={{
          width: 26,
          textAlign: 'center',
          color:
            row.rank === 1
              ? 'var(--warn)'
              : 'var(--txm)',
          fontSize: 13,
        }}
      >
        {faNum(row.rank)}
      </b>

      <div style={{ flex: 1 }}>
        <NameChip
          icon={row.icon}
          name={
            row.is_me
              ? `${row.name} (تو)`
              : row.name
          }
          color={row.color}
          roman={row.roman}
        />
      </div>

      <div
        style={{
          display: 'grid',
          justifyItems: 'end',
          gap: 2,
        }}
      >
        <b style={{ fontSize: 12 }}>
          {valueLabel(row)}
        </b>

        <JumpBadge jump={row.jump} />
      </div>
    </div>
  );

  return (
    <>
      <Header
        title="🏟️ میدان رقابت"
        onBack={() => navigate(-1)}
      />

      <main className="page fade-up">
        {range === 'season' &&
          data?.season?.label && (
            <div
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                color: 'var(--acc)',
                fontSize: 11,
              }}
            >
              🗓 {data.season.label}
              <span
                style={{
                  color: 'var(--txm)',
                  fontSize: 9,
                }}
              >
                — All-Time هرگز ریست نمی‌شود
              </span>
            </div>
          )}

        <div
          className="card"
          style={{
            display: 'grid',
            gap: 9,
          }}
        >
          <ChipRow
            options={RANGES}
            value={range}
            onPick={setRange}
          />

          <ChipRow
            options={SCOPES}
            value={scope}
            onPick={setScope}
          />

          <ChipRow
            options={TABS.map(
              ([key, label]) => [
                key,
                label,
              ]
            )}
            value={tab}
            onPick={setTab}
          />
        </div>

        {/* ردیف چسبان «من» */}
        {me && (
          <section
            className="card card-glow"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              border:
                '1.5px solid var(--acc)',
            }}
          >
            <b
              style={{
                fontSize: 15,
                color: 'var(--acc)',
              }}
            >
              #{faNum(me.rank)}
            </b>

            <div style={{ flex: 1 }}>
              <NameChip
                icon={me.icon}
                name="تو"
                color={me.color}
                roman={me.roman}
              />
            </div>

            <div
              style={{
                display: 'grid',
                justifyItems: 'end',
                gap: 2,
              }}
            >
              <b style={{ fontSize: 12.5 }}>
                {valueLabel(me)}
              </b>

              <JumpBadge jump={me.jump} />
            </div>
          </section>
        )}

        {/* رقبای نزدیک (با XP مؤثر — منبع state) */}
        {(data?.rival_above ||
          data?.rival_below) && (
          <div
            style={{
              display: 'flex',
              gap: 7,
              color: 'var(--txm)',
              fontSize: 9,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {data?.rival_above && (
              <span>
                ⬆️ {data.rival_above.icon}{' '}
                {data.rival_above.name} · فاصله{' '}
                {faNum(data.rival_above.gap)} XP
              </span>
            )}

            {data?.rival_below && (
              <span>
                ⬇️ {data.rival_below.icon}{' '}
                {data.rival_below.name} · فاصله{' '}
                {faNum(data.rival_below.gap)} XP
              </span>
            )}
          </div>
        )}

        {isLoading && <UsersListSkeleton />}

        {!isLoading &&
          !rows.length && (
            <div
              className="card"
              style={{
                color: 'var(--txm)',
                fontSize: 11,
                textAlign: 'center',
              }}
            >
              هنوز کسی در این جدول نیست —
              اولین نفر باش! 🌱
            </div>
          )}

        <div
          style={{
            display: 'grid',
            gap: 7,
          }}
        >
          {rows.map(renderRow)}
        </div>

        <div
          style={{
            color: 'var(--txm)',
            fontSize: 9,
            textAlign: 'center',
          }}
        >
          {faNum(data?.total_users || 0)}{' '}
          رقبا در این جدول · صدر هفته با بستن
          هفته (دوشنبه ۰۰:۰۰) +۱۰۰ XP می‌گیرد 👑
        </div>
      </main>
    </>
  );
}
