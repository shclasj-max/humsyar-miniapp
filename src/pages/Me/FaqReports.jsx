// ═══ FAQ ═══
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

export function Faq() {
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['faq'],
    queryFn: () => api.get('/api/faq').then(r => r.data),
    staleTime: 1000 * 60 * 15,
    enabled: search.length < 2,
  });

  const { data: searchData, isLoading: loadingSearch } = useQuery({
    queryKey: ['faq-search', search],
    queryFn: () => api.get(`/api/faq/search?q=${encodeURIComponent(search)}`).then(r => r.data.results),
    staleTime: 1000 * 30,
    enabled: search.length >= 2,
  });

  function toggle(id) { haptic(); setOpenId(prev => prev === id ? null : id); }

  return (
    <>
      <Header title="❓ سوالات متداول" />
      <div className="page fade-up">
        <input className="inp" placeholder="🔍 جستجو در سوالات..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom:13 }} />

        {search.length >= 2 ? (
          loadingSearch ? <SkeletonCard /> : !searchData?.length ? (
            <div className="empty"><div style={{ fontSize:36,marginBottom:10 }}>🔍</div><div>نتیجه‌ای پیدا نشد</div></div>
          ) : searchData.map((item, i) => (
            <div key={i} className="card" style={{ marginBottom:8,padding:0,overflow:'hidden' }}>
              <button onClick={() => toggle(i)} style={{ width:'100%',display:'flex',alignItems:'center',gap:9,padding:'12px 13px',background:'none',border:'none',cursor:'pointer',textAlign:'right' }}>
                <span style={{ fontSize:15 }}>❓</span>
                <div style={{ flex:1,fontWeight:600,fontSize:13,color:'var(--tx)',lineHeight:1.4 }}>{item.question}</div>
                <span style={{ color:'var(--txm)',fontSize:15,transition:'transform .2s',transform:openId===i?'rotate(180deg)':'none' }}>▾</span>
              </button>
              {openId===i && <div style={{ padding:'0 13px 13px 38px',fontSize:12.5,color:'var(--tx2)',lineHeight:1.8,borderTop:'1px solid var(--bd)',paddingTop:10 }}>{item.answer}</div>}
            </div>
          ))
        ) : isLoading ? <SkeletonCard /> : (
          data?.categories?.map(cat => (
            <div key={cat.name} style={{ marginBottom:18 }}>
              <div className="sec-title">{cat.name}</div>
              {cat.items.map((item, i) => {
                const uid = cat.name + i;
                return (
                  <div key={i} className="card" style={{ marginBottom:8,padding:0,overflow:'hidden' }}>
                    <button onClick={() => toggle(uid)} style={{ width:'100%',display:'flex',alignItems:'center',gap:9,padding:'12px 13px',background:'none',border:'none',cursor:'pointer',textAlign:'right' }}>
                      <span style={{ fontSize:15 }}>❓</span>
                      <div style={{ flex:1,fontWeight:600,fontSize:13,color:'var(--tx)',lineHeight:1.4 }}>{item.question}</div>
                      <span style={{ color:'var(--txm)',fontSize:15,transition:'transform .2s',transform:openId===uid?'rotate(180deg)':'none' }}>▾</span>
                    </button>
                    {openId===uid && <div style={{ padding:'0 13px 13px 38px',fontSize:12.5,color:'var(--tx2)',lineHeight:1.8,borderTop:'1px solid var(--bd)',paddingTop:10 }}>{item.answer}</div>}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ═══ Reports ═══
export function Reports() {
  const [params] = typeof window !== 'undefined'
    ? [new URLSearchParams(window.location.search)]
    : [new URLSearchParams()];
  const initType = params.get('type') || null;
  const initId   = params.get('id')   || null;
  const [view, setView]   = useState(initType && initId ? 'form' : 'list');
  const [reason, setReason] = useState('');
  const [note, setNote]     = useState('');
  const toast = useUIStore(s => s.toast);

  const { data: reasonsData } = useQuery({
    queryKey: ['report-reasons'],
    queryFn: () => api.get('/api/reports/reasons').then(r => r.data.reasons),
    staleTime: Infinity,
  });

  const { data: myReports, isLoading } = useQuery({
    queryKey: ['my-reports'],
    queryFn: () => api.get('/api/reports/my').then(r => r.data.reports),
    staleTime: 1000 * 30,
    enabled: view === 'list',
  });

  const submitMut = useMutation({
    mutationFn: () => api.post('/api/reports', { target_type: initType||'question', target_id: initId||'', reason, note }).then(r => r.data),
    onSuccess: (data) => { toast(data.message,'success',4000); setView('list'); },
    onError: (err) => toast(err.response?.data?.detail||'خطا','error'),
  });

  const STATUS_MAP = { new:['در انتظار','b-yel'], reviewing:['در بررسی','b-acc'], resolved:['برطرف شد','b-grn'], rejected:['رد شد','b-red'] };

  return (
    <>
      <Header title="🚩 گزارش ایراد محتوا"
        right={<button className="btn btn-dark" style={{ fontSize:11,padding:'5px 10px' }} onClick={() => setView(v => v==='form'?'list':'form')}>{view==='form'?'📋 سابقه':'+ گزارش جدید'}</button>}
      />
      <div className="page fade-up">
        {view === 'form' ? (
          <div className="card card-glow">
            <div className="sec-title">🚩 ثبت گزارش</div>
            <div style={{ fontSize:12,color:'var(--txm)',marginBottom:13,lineHeight:1.7 }}>
              {initType==='question'?'در این سوال مشکلی دیدی؟':'این فایل مشکل داره؟'} گزارش بده تا بررسی شود.
            </div>
            <div style={{ marginBottom:13 }}>
              <div style={{ fontSize:11,color:'var(--txm)',marginBottom:7 }}>دلیل گزارش</div>
              {!reasonsData ? <div className="skeleton" style={{ height:120,borderRadius:'var(--r-md)' }} /> : (
                <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                  {reasonsData.map(r => (
                    <button key={r.key} onClick={() => { haptic(); setReason(r.key); }}
                      style={{ textAlign:'right',padding:'9px 12px',borderRadius:'var(--r-md)',border:`1px solid ${reason===r.key?'var(--acc)':'var(--bd)'}`,background:reason===r.key?'var(--acc-glow)':'var(--elev)',color:reason===r.key?'var(--acc)':'var(--tx)',fontFamily:'var(--font)',fontSize:13,cursor:'pointer' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11,color:'var(--txm)',marginBottom:5 }}>توضیح اضافه (اختیاری)</div>
              <textarea className="inp" rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="جزئیات بیشتر..." style={{ resize:'vertical',lineHeight:1.6 }} />
            </div>
            <button className="btn btn-p btn-full" disabled={!reason||submitMut.isPending} onClick={() => submitMut.mutate()}>
              {submitMut.isPending ? '...' : '📨 ثبت گزارش'}
            </button>
          </div>
        ) : (
          isLoading ? <SkeletonCard /> : !myReports?.length ? (
            <div className="empty"><div style={{ fontSize:40,marginBottom:10 }}>🚩</div><div>هنوز گزارشی ثبت نکرده‌اید</div></div>
          ) : myReports.map(r => {
            const [label, cls] = STATUS_MAP[r.status]||['نامشخص','b-gray'];
            return (
              <div key={r.id} className="card" style={{ marginBottom:9 }}>
                <div style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
                  <span style={{ fontSize:20,marginTop:2 }}>🚩</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600,fontSize:13 }}>{r.reason}</div>
                    <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>{r.target_type==='question'?'سوال':'فایل'} • {r.created_at}</div>
                    {r.note && <div style={{ fontSize:12,color:'var(--tx2)',marginTop:4 }}>{r.note}</div>}
                  </div>
                  <span className={`badge ${cls}`}>{label}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
