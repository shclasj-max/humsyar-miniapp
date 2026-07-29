import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { haptic } from '../../lib/telegram';

export default function Learn() {
  const navigate = useNavigate();

  const { data: statsData } = useQuery({
    queryKey: ['stats-by-lesson'],
    queryFn: () => api.get('/api/questions/stats/by-lesson').then(r => r.data.lessons),
    staleTime: 1000 * 60 * 5,
  });

  const quickLinks = [
    { icon:'⚡', label:'نقاط ضعف',    route:'/learn/questions?mode=weak'   },
    { icon:'📝', label:'آزمون سفارشی', route:'/learn/questions?mode=exam'   },
    { icon:'🔴', label:'سطح سخت',     route:'/learn/questions?mode=hard'   },
    { icon:'✏️', label:'طراحی سوال',   route:'/learn/questions?mode=design' },
  ];

  const sections = [
    { icon:'📗', title:'منابع علوم پایه', desc:'جزوه، ویدیو، صوت و تست جلسه‌به‌جلسه', color:'var(--ok)',  route:'/learn/resources' },
    { icon:'📘', title:'رفرنس‌های درسی',  desc:'کتاب‌های مرجع فارسی و لاتین',         color:'var(--acc)', route:'/learn/references' },
  ];

  return (
    <>
      <Header title="یادگیری" subtitle="منابع، رفرنس‌ها و تمرین" back={false} />
      <div className="page fade-up">

        {/* شروع سریع */}
        <div className="sec-title">⚡ شروع سریع</div>
        <div style={{ display:'flex',gap:7,marginBottom:16 }}>
          {quickLinks.map(ql => (
            <button key={ql.label} onClick={() => { haptic(); navigate(ql.route); }}
              style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 4px',borderRadius:'var(--r-md)',border:'1px solid var(--bd)',background:'var(--elev)',cursor:'pointer' }}>
              <span style={{ fontSize:20 }}>{ql.icon}</span>
              <span style={{ fontSize:9.5,color:'var(--tx2)',fontFamily:'var(--font)',fontWeight:600,textAlign:'center',lineHeight:1.3 }}>{ql.label}</span>
            </button>
          ))}
        </div>

        {/* محتوای آموزشی */}
        <div className="sec-title">📚 محتوای آموزشی</div>
        {sections.map(s => (
          <button key={s.title} onClick={() => { haptic(); navigate(s.route); }}
            style={{ display:'flex',alignItems:'center',gap:13,padding:14,background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',cursor:'pointer',textAlign:'right',width:'100%',marginBottom:9 }}>
            <div style={{ width:48,height:48,borderRadius:'var(--r-md)',background:s.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0 }}>{s.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,fontSize:14 }}>{s.title}</div>
              <div style={{ fontSize:12,color:'var(--txm)',marginTop:3 }}>{s.desc}</div>
            </div>
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
        ))}

        <div className="divider" />

        {/* بانک سوال */}
        <div className="sec-title">🧪 بانک سوال</div>
        <button onClick={() => { haptic(); navigate('/learn/questions'); }}
          style={{ display:'flex',alignItems:'center',gap:13,padding:14,background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',cursor:'pointer',textAlign:'right',width:'100%',marginBottom:14 }}>
          <div style={{ width:48,height:48,borderRadius:'var(--r-md)',background:'rgba(139,92,246,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0 }}>🧪</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700,fontSize:14 }}>تمرین و آزمون</div>
            <div style={{ fontSize:12,color:'var(--txm)',marginTop:3 }}>تمرین آزاد، آزمون سفارشی، حالت سخت و طراحی سوال</div>
          </div>
          <span className="badge b-pur">بانک سوال</span>
        </button>

        {/* آمار به تفکیک درس */}
        {statsData?.length > 0 && (
          <>
            <div className="sec-title">📊 آمار من به تفکیک درس</div>
            <div className="card">
              {statsData.map(l => (
                <div key={l.lesson} style={{ marginBottom:11 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                    <span style={{ fontSize:13,fontWeight:600 }}>{l.lesson}</span>
                    <span style={{ fontSize:11,color:'var(--txm)' }}>{l.correct}/{l.total} ({l.percentage}٪)</span>
                  </div>
                  <div className="pbar">
                    <div className="pbar-f" style={{ width:`${l.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
