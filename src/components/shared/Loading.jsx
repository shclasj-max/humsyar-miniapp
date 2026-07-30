export function Spinner({
  size = 24,
  color = 'var(--acc2)',
  label = 'در حال بارگذاری',
}) {
  const borderSize =
    Math.max(
      2,
      Math.round(
        size / 10
      )
    );

  return (
    <span
      role="status"
      aria-label={label}
      style={{
        display:
          'inline-block',

        width:
          size,

        height:
          size,

        flexShrink:
          0,

        border:
          `${borderSize}px solid rgba(148,163,184,.18)`,

        borderTopColor:
          color,

        borderRadius:
          '50%',

        animation:
          'spin .7s linear infinite',
      }}
    />
  );
}


export function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position:
          'relative',

        display:
          'flex',

        alignItems:
          'center',

        justifyContent:
          'center',

        width:
          '100%',

        minHeight:
          '100dvh',

        overflow:
          'hidden',

        color:
          'var(--tx)',

        /* شفاف — لایه‌ی fixed مشترک body؛
           دقیقاً همان تصویرِ بدون seam بین
           لودینگ و محتوای نهایی */
        background: 'transparent',
      }}
    >
      <div
        style={{
          position:
            'absolute',

          width:
            220,

          height:
            220,

          borderRadius:
            '50%',

          background:
            'rgba(59,130,246,.12)',

          filter:
            'blur(45px)',

          transform:
            'translateY(-35px)',
        }}
      />

      <div
        className="fade-up"
        style={{
          position:
            'relative',

          display:
            'flex',

          flexDirection:
            'column',

          alignItems:
            'center',

          gap:
            13,

          textAlign:
            'center',
        }}
      >
        <div
          style={{
            display:
              'grid',

            width:
              76,

            height:
              76,

            placeItems:
              'center',

            background:
              'var(--grad-brand)',

            border:
              '1px solid rgba(255,255,255,.12)',

            borderRadius:
              24,

            boxShadow:
              'var(--shd-glow)',

            fontSize:
              37,
          }}
        >
          🩺
        </div>

        <div>
          <div
            style={{
              fontSize:
                20,

              fontWeight:
                900,

              letterSpacing:
                '-.4px',
            }}
          >
            هامزیار
          </div>

          <div
            style={{
              color:
                'var(--txm)',

              fontSize:
                10.5,

              marginTop:
                3,
            }}
          >
            همراه هوشمند مسیر پزشکی
          </div>
        </div>

        <Spinner size={26} />

        <span
          style={{
            color:
              'var(--txm)',

            fontSize:
              9.5,
          }}
        >
          در حال آماده‌سازی اطلاعات...
        </span>
      </div>
    </div>
  );
}


export function SkeletonLine({
  width = '100%',
  w,
  height = 14,
  h,
  marginTop = 0,
  mt,
}) {
  return (
    <div
      className="skeleton"
      aria-hidden="true"
      style={{
        width:
          w ?? width,

        height:
          h ?? height,

        marginTop:
          mt ?? marginTop,
      }}
    />
  );
}


export function SkeletonCard({
  lines = 3,
}) {
  return (
    <div
      className="card"
      aria-hidden="true"
      style={{
        display:
          'flex',

        alignItems:
          'center',

        gap:
          11,

        minHeight:
          82,
      }}
    >
      <div
        className="skeleton"
        style={{
          width:
            46,

          height:
            46,

          flexShrink:
            0,

          borderRadius:
            14,
        }}
      />

      <div
        style={{
          display:
            'grid',

          flex:
            1,

          gap:
            8,
        }}
      >
        <SkeletonLine
          width="48%"
          height={13}
        />

        {lines > 1 && (
          <SkeletonLine
            height={10}
          />
        )}

        {lines > 2 && (
          <SkeletonLine
            width="72%"
            height={10}
          />
        )}
      </div>
    </div>
  );
}

/* اسکلتِ هم‌قامت با کارت hero (دایره‌ی ۹۰ + سه خط) —
   برای جابه‌جاییِ بدون پرشِ ارتفاع بین اسکلت و محتوا
   در صفحاتی مثل نمرات (ریشه‌ی Layout Shift) */
export function SkeletonHero() {
  return (
    <div
      className="card"
      aria-hidden="true"
      style={{
        display:
          'flex',

        alignItems:
          'center',

        gap:
          15,

        minHeight:
          124,
      }}
    >
      <div
        className="skeleton"
        style={{
          width:
            90,

          height:
            90,

          flexShrink:
            0,

          borderRadius:
            '50%',
        }}
      />

      <div
        style={{
          display:
            'grid',

          flex:
            1,

          gap:
            9,
        }}
      >
        <SkeletonLine
          width="58%"
          height={13}
        />

        <SkeletonLine
          height={10}
        />

        <SkeletonLine
          width="74%"
          height={10}
        />
      </div>
    </div>
  );
}

