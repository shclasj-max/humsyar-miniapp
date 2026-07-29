import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tg, haptic } from '../../lib/telegram';

/**
 * back = true (پیش‌فرض): دکمه‌ی بازگشت نشون داده می‌شه و با navigate(-1)
 *   کاربر رو دقیقاً به همون جایی که قبلش بود برمی‌گردونه — نه صفحه‌ی اول.
 * back = false: برای صفحات اصلی تب پایین (داشبورد، یادگیری، برنامه، نمرات، من)
 *   که با نوار پایین جابه‌جا می‌شن، نه با "رفتن به جلو".
 * onBack: override اختیاری — برای مواردی که "بازگشت" باید یه state داخلی
 *   (نه مسیر روتر) رو عوض کنه، مثل بازگشت از حالت آزمون به منوی سوالات.
 */
export default function Header({ title, subtitle, right, back = true, onBack }) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  useEffect(() => {
    const bb = tg?.BackButton;
    if (!bb) return;
    if (back) {
      bb.show();
      bb.onClick(handleBack);
    } else {
      bb.hide();
    }
    return () => {
      try { bb.offClick(handleBack); } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [back, onBack]);

  return (
    <div style={{ background:'linear-gradient(135deg,var(--elev),rgba(59,130,246,.06))',borderBottom:'1px solid var(--bd)',padding:'11px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'fixed',top:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,zIndex:100,height:'var(--hdr-h)',gap:8 }}>
      <div style={{ flex:1,display:'flex',alignItems:'center',gap:9,minWidth:0 }}>
        {back && (
          <button
            onClick={() => { haptic('light'); handleBack(); }}
            aria-label="بازگشت"
            style={{ flexShrink:0,width:32,height:32,borderRadius:10,border:'1px solid var(--bd)',background:'var(--elev)',color:'var(--tx)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:16,lineHeight:1 }}
          >←</button>
        )}
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:16,fontWeight:800,color:'var(--tx)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{title}</div>
          {subtitle && <div style={{ fontSize:11,color:'var(--txm)',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{subtitle}</div>}
        </div>
      </div>
      {right && <div style={{ flexShrink:0 }}>{right}</div>}
    </div>
  );
}
