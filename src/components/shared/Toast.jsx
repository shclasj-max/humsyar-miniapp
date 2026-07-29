import {
  useUIStore,
} from '../../stores/uiStore';


const CONFIG = {
  success: {
    icon:
      '✓',

    color:
      '#34D399',

    soft:
      'rgba(16,185,129,.13)',

    border:
      'rgba(16,185,129,.26)',
  },

  error: {
    icon:
      '!',

    color:
      '#FB7185',

    soft:
      'rgba(239,68,68,.13)',

    border:
      'rgba(239,68,68,.26)',
  },

  warning: {
    icon:
      '!',

    color:
      '#FCD34D',

    soft:
      'rgba(245,158,11,.13)',

    border:
      'rgba(245,158,11,.26)',
  },

  info: {
    icon:
      'i',

    color:
      '#70A7FF',

    soft:
      'rgba(59,130,246,.13)',

    border:
      'rgba(59,130,246,.26)',
  },
};


export default function Toast() {
  const toasts =
    useUIStore(
      (state) =>
        state.toasts
    );


  if (
    !Array.isArray(toasts) ||
    toasts.length === 0
  ) {
    return null;
  }


  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position:
          'fixed',

        top:
          'calc(10px + env(safe-area-inset-top))',

        left:
          '50%',

        zIndex:
          1000,

        display:
          'grid',

        width:
          'calc(100% - 24px)',

        maxWidth:
          470,

        gap:
          7,

        transform:
          'translateX(-50%)',

        pointerEvents:
          'none',
      }}
    >
      {toasts.map(
        (
          toast,
          index
        ) => {
          const config =
            CONFIG[
              toast.type
            ] ||
            CONFIG.info;

          return (
            <div
              key={toast.id}
              role={
                toast.type ===
                'error'
                  ? 'alert'
                  : 'status'
              }
              className={
                'glass pop-in'
              }
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                minHeight:
                  52,

                gap:
                  10,

                padding:
                  '9px 11px',

                color:
                  'var(--tx)',

                border:
                  `1px solid ${
                    config.border
                  }`,

                borderRadius:
                  16,

                boxShadow:
                  'var(--shd-3)',

                animationDelay:
                  `${
                    index * 35
                  }ms`,

                pointerEvents:
                  'auto',
              }}
            >
              <span
                style={{
                  display:
                    'grid',

                  flex:
                    '0 0 34px',

                  height:
                    34,

                  placeItems:
                    'center',

                  color:
                    config.color,

                  background:
                    config.soft,

                  borderRadius:
                    11,

                  fontSize:
                    16,

                  fontWeight:
                    900,
                }}
              >
                {config.icon}
              </span>

              <span
                style={{
                  flex:
                    1,

                  fontSize:
                    11,

                  fontWeight:
                    650,

                  lineHeight:
                    1.7,
                }}
              >
                {toast.msg}
              </span>

              <span
                style={{
                  width:
                    4,

                  alignSelf:
                    'stretch',

                  background:
                    config.color,

                  borderRadius:
                    999,

                  opacity:
                    .7,
                }}
              />
            </div>
          );
        }
      )}
    </div>
  );
}
