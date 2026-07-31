import {
  useQuery,
} from '@tanstack/react-query';

import {
  useNavigate,
} from 'react-router-dom';

import api from '../../lib/api';
import Header from '../../components/layout/Header';

import {
} from '../../components/shared/Loading';

import {
  ContentHomeSkeleton,
} from '../../components/shared/skeletons';

import {
  haptic,
} from '../../lib/telegram';


const TOOLS = [
  {
    icon: '🧪',
    title: 'بررسی سؤال‌ها',

    desc:
      'تأیید یا رد سؤال‌های جدید',

    route:
      '/admin/content/questions',

    color:
      '#C4B5FD',

    soft:
      'rgba(139,92,246,.13)',
  },

  {
    icon: '📅',
    title: 'برنامه درسی',

    desc:
      'کلاس، امتحان و زمان منعطف',

    route:
      '/admin/content/schedule',

    color:
      '#70A7FF',

    soft:
      'rgba(59,130,246,.12)',
  },

  {
    icon: '📊',
    title: 'مدیریت نمرات',

    desc:
      'ثبت دسته‌ای، ویرایش و حذف',

    route:
      '/admin/content/grades',

    color:
      '#34D399',

    soft:
      'rgba(16,185,129,.12)',
  },

  {
    icon: '🔬',
    title: 'علوم پایه',

    desc:
      'درس، جلسه و محتوای آموزشی',

    route:
      '/admin/content/basic-science',

    color:
      '#22D3EE',

    soft:
      'rgba(34,211,238,.12)',
  },

  {
    icon: '📘',
    title: 'رفرنس‌ها',

    desc:
      'درس، کتاب و جلدهای فارسی و لاتین',

    route:
      '/admin/content/references',

    color:
      '#70A7FF',

    soft:
      'rgba(59,130,246,.12)',
  },

  {
    icon: '📦',
    title: 'بانک فایل سؤال',

    desc:
      'فایل‌های تست و بانک سؤال',

    route:
      '/admin/content/qbank',

    color:
      '#FCD34D',

    soft:
      'rgba(245,158,11,.12)',
  },

  {
    icon: '❓',
    title: 'سؤالات متداول',

    desc:
      'ایجاد و حذف پاسخ‌های راهنما',

    route:
      '/admin/content/faq',

    color:
      '#C4B5FD',

    soft:
      'rgba(139,92,246,.13)',
  },

  {
    icon: '🚩',
    title: 'گزارش‌های محتوا',

    desc:
      'بررسی و تعیین وضعیت گزارش‌ها',

    route:
      '/admin/content/reports',

    color:
      '#FB7185',

    soft:
      'rgba(239,68,68,.12)',
  },
];


export default function ContentHome() {
  const navigate =
    useNavigate();


  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'content-overview',
    ],

    queryFn: () =>
      api
        .get(
          '/api/content/overview'
        )
        .then(
          (response) =>
            response.data
        ),

    staleTime:
      60_000,
  });


  const open = (route) => {
    haptic('light');
    navigate(route);
  };


  const pending =
    Number(
      data?.pending_questions
    ) || 0;


  return (
    <>
      <Header
        title="مدیریت محتوا"
        subtitle={
          'کتابخانه، سؤال و برنامه'
        }
      />

      <main className="page fade-up">
        <section
          className={
            'card card-glow'
          }
          style={{
            padding:
              18,

            marginBottom:
              14,

            background:
              'linear-gradient(145deg,rgba(16,185,129,.13),rgba(16,24,39,.95) 55%,rgba(34,211,238,.08))',
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                13,
            }}
          >
            <span
              style={{
                display:
                  'grid',

                width:
                  56,

                height:
                  56,

                placeItems:
                  'center',

                borderRadius:
                  18,

                background:
                  'linear-gradient(135deg,#059669,#06B6D4)',

                fontSize:
                  27,
              }}
            >
              🎓
            </span>

            <div
              style={{
                flex:
                  1,
              }}
            >
              <div
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    10,
                }}
              >
                مرکز محتوای آموزشی
              </div>

              <b
                style={{
                  display:
                    'block',

                  fontSize:
                    17,

                  marginTop:
                    2,
                }}
              >
                کنترل کیفیت و انتشار محتوا
              </b>

              <div
                style={{
                  color:
                    'var(--tx2)',

                  fontSize:
                    9.5,

                  marginTop:
                    3,
                }}
              >
                تمام ابزارهای علمی هامزیار
                در یک صفحه
              </div>
            </div>
          </div>
        </section>


        {isLoading ? (
          <ContentHomeSkeleton />
        ) : isError ? (
          <div className="empty card">
            دریافت آمار محتوا انجام نشد.

            <button
              className="btn btn-p"
              style={{
                marginTop:
                  12,
              }}
              onClick={() =>
                refetch()
              }
            >
              تلاش دوباره
            </button>
          </div>
        ) : (
          <section
            className="grid2"
            style={{
              marginBottom:
                16,
            }}
          >
            <div
              className="card"
              style={{
                textAlign:
                  'center',

                padding:
                  12,
              }}
            >
              <b
                style={{
                  color:
                    pending
                      ? 'var(--warn)'
                      : 'var(--ok)',

                  fontSize:
                    20,
                }}
              >
                {pending}
              </b>

              <div
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    9,
                }}
              >
                سؤال در انتظار
              </div>
            </div>

            <div
              className="card"
              style={{
                textAlign:
                  'center',

                padding:
                  12,
              }}
            >
              <b
                style={{
                  color:
                    'var(--ok)',

                  fontSize:
                    20,
                }}
              >
                {Number(
                  data
                    ?.approved_questions
                ) || 0}
              </b>

              <div
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    9,
                }}
              >
                سؤال تأییدشده
              </div>
            </div>

            <div
              className="card"
              style={{
                textAlign:
                  'center',

                padding:
                  12,
              }}
            >
              <b
                style={{
                  color:
                    'var(--acc2)',

                  fontSize:
                    20,
                }}
              >
                {Number(
                  data
                    ?.total_resources
                ) || 0}
              </b>

              <div
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    9,
                }}
              >
                محتوای آموزشی
              </div>
            </div>

            <div
              className="card"
              style={{
                textAlign:
                  'center',

                padding:
                  12,
              }}
            >
              <b
                style={{
                  color:
                    'var(--err)',

                  fontSize:
                    20,
                }}
              >
                {Number(
                  data
                    ?.upcoming_exams
                ) || 0}
              </b>

              <div
                style={{
                  color:
                    'var(--txm)',

                  fontSize:
                    9,
                }}
              >
                امتحان پیش‌رو
              </div>
            </div>
          </section>
        )}


        {pending > 0 && (
          <button
            type="button"
            className={
              'card card-tap'
            }
            onClick={() =>
              open(
                '/admin/content/questions'
              )
            }
            style={{
              display:
                'flex',

              alignItems:
                'center',

              width:
                '100%',

              gap:
                10,

              marginBottom:
                14,

              textAlign:
                'right',

              borderColor:
                'rgba(245,158,11,.28)',
            }}
          >
            <span
              style={{
                fontSize:
                  22,
              }}
            >
              ⏳
            </span>

            <span
              style={{
                flex:
                  1,
              }}
            >
              <b
                style={{
                  color:
                    'var(--warn)',
                }}
              >
                {pending} سؤال منتظر بررسی
                است
              </b>

              <span
                style={{
                  display:
                    'block',

                  color:
                    'var(--txm)',

                  fontSize:
                    9.5,
                }}
              >
                برای حفظ کیفیت بانک سؤال
                بررسی کنید.
              </span>
            </span>

            <span>←</span>
          </button>
        )}


        <div className="sec-title">
          ابزارهای محتوا
        </div>

        <section
          style={{
            display:
              'grid',

            gap:
              9,
          }}
        >
          {TOOLS.map(
            (
              item,
              index
            ) => (
              <button
                type="button"
                key={item.route}
                className={
                  'card card-tap pop-in'
                }
                onClick={() =>
                  open(item.route)
                }
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  width:
                    '100%',

                  gap:
                    11,

                  padding:
                    13,

                  textAlign:
                    'right',

                  animationDelay:
                    `${
                      index * 28
                    }ms`,
                }}
              >
                <span
                  style={{
                    display:
                      'grid',

                    width:
                      45,

                    height:
                      45,

                    placeItems:
                      'center',

                    borderRadius:
                      14,

                    color:
                      item.color,

                    background:
                      item.soft,

                    fontSize:
                      21,
                  }}
                >
                  {item.icon}
                </span>

                <span
                  style={{
                    flex:
                      1,
                  }}
                >
                  <b
                    style={{
                      display:
                        'block',

                      fontSize:
                        12.5,
                    }}
                  >
                    {item.title}
                  </b>

                  <span
                    style={{
                      display:
                        'block',

                      color:
                        'var(--txm)',

                      fontSize:
                        9.5,

                      marginTop:
                        3,
                    }}
                  >
                    {item.desc}
                  </span>
                </span>

                {item.route ===
                  '/admin/content/questions' &&
                  pending > 0 && (
                  <span className="badge b-yel">
                    {pending}
                  </span>
                )}

                <span
                  style={{
                    color:
                      'var(--txm)',
                  }}
                >
                  ←
                </span>
              </button>
            )
          )}
        </section>
      </main>
    </>
  );
}
