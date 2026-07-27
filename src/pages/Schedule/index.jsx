import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';

const TYPE_CFG = {
  class:  { icon:'🏫', color:'var(--acc)',  label:'کلاس‌ها'  },
  exam:   { icon:'📝', color:'var(--err)',  label:'امتحانات' },
  makeup: { icon:'🔄', color:'var(--warn)', label:'جبرانی'   },
};

export default function Schedule() {
  const [tab, setTab] = useState('class');

  const { data, isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: () => api.get('/api/schedule').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const items = data?.schedule?.filter(s => s.type === tab) || [];
  const tc = TYPE_CFG[tab];

  return (
    <>
      <Header title="برنامه" subtitle="ترم جاری" />
      <div className="page fade-up">
        <div className="tab-bar">
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <button key={k} onClick={() => { haptic(); setTab(k); }} className="tab-btn"
              style={{ background: tab===k ? v.color : 'transparent', color: tab===k ? '#fff' : 'var(--tx2)' }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : !items.length ? (
          <div className="empty">
            <div style={{ fontSize:40,marginBottom:10 }}>📭</div>
            <div>موردی ثبت نشده</div>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
            {items.map(s => {
              const urgent = s.days_left !== null && s.days_left !== undefined && s.days_left <= 3;
              return (
                <div key={s.id} className="card" style={{ borderColor: urgent ? 'rgba(239,68,68,.3)' : 'var(--bd)' }}>
                  <div style={{ display:'flex',alignItems:'flex-start',gap:12 }}>
                    <div style={{ width:44,height:44,borderRadius:'var(--r-md)',background:tc.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>
                      {tc.icon}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:700,fontSize:14,color: urgent ? 'var(--err)' : 'var(--tx)' }}>
                        {s.lesson}
                      </div>
                      {s.teacher && <div style={{ fontSize:11.5,color:'var(--tx2)',marginTop:2 }}>استاد: {s.teacher}</div>}
                      <div style={{ display:'flex',gap:5,marginTop:6,flexWrap:'wrap' }}>
                        <span className="badge b-acc">{s.date}</span>
                        {s.time && <span className="badge b-gray">{s.time}</span>}
                        {s.group && s.group !== '0' && <span className="badge b-gray">گروه {s.group}</span>}
                      </div>
                      {s.note && <div style={{ fontSize:11,color:'var(--txm)',marginTop:5 }}>{s.note}</div>}
                    </div>
                    {s.days_left !== null && s.days_left !== undefined && (
                      <span className={`badge ${s.days_left===0?'b-red':s.days_left<=3?'b-yel':'b-grn'}`}>
                        {s.days_left===0?'امروز!':s.days_left===1?'فردا!':`${s.days_left} روز`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
