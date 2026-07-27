import { useUIStore } from '../../stores/uiStore';

const COLORS = {
  success: { border: 'var(--ok)',   color: 'var(--ok)'   },
  error:   { border: 'var(--err)',  color: 'var(--err)'  },
  info:    { border: 'var(--acc)',  color: 'var(--acc)'  },
};

export default function Toast() {
  const toasts = useUIStore(s => s.toasts);
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed',top:'calc(var(--hdr-h) + 8px)',left:'50%',transform:'translateX(-50%)',zIndex:300,display:'flex',flexDirection:'column',gap:5,width:'92%',maxWidth:440,pointerEvents:'none' }}>
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div key={t.id} className="fade-up" style={{ background:'var(--elev)',border:`1px solid ${c.border}`,color:c.color,borderRadius:'var(--r-md)',padding:'9px 14px',fontSize:13,fontWeight:700,textAlign:'center',boxShadow:'0 4px 20px rgba(0,0,0,.5)' }}>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
