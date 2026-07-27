import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { haptic } from '../../lib/telegram';

const TABS = [
  { path: '/',        icon: '🩺', label: 'داشبورد' },
  { path: '/learn',   icon: '📖', label: 'یادگیری' },
  { path: '/schedule',icon: '📅', label: 'برنامه'  },
  { path: '/grades',  icon: '📊', label: 'نمرات'   },
  { path: '/me',      icon: '🙋', label: 'من'       },
];

const MORE = [
  { path: '/me/subscription', icon: '💳', label: 'اشتراک',        desc: 'مدیریت پلن و خرید' },
  { path: '/me/tickets',      icon: '🎫', label: 'پشتیبانی',      desc: 'تیکت و گفتگو' },
  { path: '/me/faq',          icon: '❓', label: 'سوالات متداول', desc: 'پاسخ سریع' },
  { path: '/me/reports',      icon: '🚩', label: 'گزارش ایراد',   desc: 'خطا در محتوا' },
];

function MoreSheet({ onClose }) {
  const navigate = useNavigate();
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()} className="fade-up" style={{ width:'100%',maxWidth:480,background:'var(--surf)',borderRadius:'20px 20px 0 0',padding:'18px 14px calc(18px + env(safe-area-inset-bottom))' }}>
        <div style={{ width:34,height:4,background:'var(--bd)',borderRadius:999,margin:'0 auto 14px' }} />
        <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>بیشتر</div>
        {MORE.map(item => (
          <button key={item.path} onClick={() => { haptic(); navigate(item.path); onClose(); }} style={{ width:'100%',display:'flex',alignItems:'center',gap:12,padding:'12px 6px',background:'none',border:'none',cursor:'pointer',textAlign:'right',borderBottom:'1px solid var(--bd)' }}>
            <span style={{ fontSize:24 }}>{item.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600,fontSize:13.5,color:'var(--tx)' }}>{item.label}</div>
              <div style={{ fontSize:11,color:'var(--txm)',marginTop:1 }}>{item.desc}</div>
            </div>
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const moreActive = MORE.some(m => location.pathname.startsWith(m.path));

  function go(path) { haptic('light'); navigate(path); }

  return (
    <>
      {showMore && <MoreSheet onClose={() => setShowMore(false)} />}
      <nav style={{ position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,height:'var(--nav-h)',background:'var(--surf)',borderTop:'1px solid var(--bd)',display:'flex',alignItems:'center',justifyContent:'space-around',padding:'0 4px',paddingBottom:'env(safe-area-inset-bottom)',zIndex:100 }}>
        {TABS.map(tab => {
          const active = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
          return (
            <button key={tab.path} onClick={() => go(tab.path)} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'5px 0',border:'none',background:'transparent',cursor:'pointer',flex:1,position:'relative' }}>
              {active && <div style={{ position:'absolute',top:0,width:28,height:3,background:'var(--acc)',borderRadius:'0 0 4px 4px' }} />}
              <span style={{ fontSize:21,lineHeight:1 }}>{tab.icon}</span>
              <span style={{ fontSize:9.5,fontFamily:'var(--font)',fontWeight:active?700:400,color:active?'var(--acc)':'var(--txm)' }}>{tab.label}</span>
            </button>
          );
        })}
        <button onClick={() => { haptic('light'); setShowMore(true); }} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'5px 0',border:'none',background:'transparent',cursor:'pointer',flex:1,position:'relative' }}>
          {moreActive && <div style={{ position:'absolute',top:0,width:28,height:3,background:'var(--acc)',borderRadius:'0 0 4px 4px' }} />}
          <span style={{ fontSize:21,lineHeight:1 }}>☰</span>
          <span style={{ fontSize:9.5,fontFamily:'var(--font)',fontWeight:moreActive?700:400,color:moreActive?'var(--acc)':'var(--txm)' }}>بیشتر</span>
        </button>
      </nav>
    </>
  );
}
