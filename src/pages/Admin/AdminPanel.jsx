import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic, hapticNotif } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

/* ── Admin Panel Hub ── */
export function AdminPanel() {
  const navigate = useNavigate();
  const toast = useUIStore(s => s.toast);
  const [bcText, setBcText] = useState('');
  const [bcTarget, setBcTarget] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/admin/stats').then(r => r.data),
    staleTime: 1000 * 30,
  });

  const { data: botStatus } = useQuery({
    queryKey: ['bot-status'],
    queryFn: () => api.get('/api/admin/bot-status').then(r => r.data),
    staleTime: 1000 * 30,
    refetchInterval: 60000,
  });

  const exportExcel = useMutation({
    mutationFn: () => api.post('/api/admin/export/excel').then(r => r.data),
    onSuccess: (data) => toast(data.message,'success',4000),
    onError: () => toast('خطا','error'),
  });

  const sendBc = useMutation({
    mutationFn: () => api.post('/api/admin/broadcast', { text: bcText, target: bcTarget }).then(r => r.data),
    onSuccess: (data) => { hapticNotif('success'); toast(`✅ ${data.queued} پیام در صف ارسال قرار گرفت`,'success',4000); setBcText(''); },
    onError: (err) => toast(err.response?.data?.detail||'خطا','error'),
  });

  return (
    <>
      <Header title="👑 پنل ادمین" subtitle="فقط ادمین اصلی" />
      <div className="page fade-up">

        {/* وضعیت سرور */}
        {botStatus && (
          <div className="card" style={{ marginBottom:13,borderColor:'rgba(16,185,129,.2)' }}>
            <div className="sec-title">🖥 وضعیت سرور</div>
            <div style={{ display:'flex',gap:7,marginBottom:botStatus.sys?.cpu_pct?10:0 }}>
              <span className={`badge ${botStatus.db_status?.includes('✅')?'b-grn':'b-red'}`}>🗄 دیتابیس {botStatus.db_ping}</span>
              {botStatus.sys?.uptime && <span className="badge b-acc">⏱ {botStatus.sys.uptime}</span>}
            </div>
            {botStatus.sys?.cpu_pct !== undefined && (
              <>
                <div style={{ fontSize:11,color:'var(--txm)',marginBottom:4 }}>RAM {botStatus.sys.used_ram_pct}٪</div>
                <div className="pbar" style={{ marginBottom:7 }}><div className="pbar-f" style={{ width:`${botStatus.sys.used_ram_pct}%`,background:botStatus.sys.used_ram_pct>85?'var(--err)':'var(--acc)' }} /></div>
                <div style={{ fontSize:11,color:'var(--txm)',marginBottom:4 }}>CPU {botStatus.sys.cpu_pct}٪</div>
                <div className="pbar"><div className="pbar-f" style={{ width:`${botStatus.sys.cpu_pct}%`,background:botStatus.sys.cpu_pct>85?'var(--err)':'var(--acc)' }} /></div>
              </>
            )}
          </div>
        )}

        <div className="tab-bar">
          {[['overview','📊 آمار'],['broadcast','📢 همگانی']].map(([k,l]) => (
            <button key={k} onClick={() => setActiveTab(k)} className="tab-btn"
              style={{ background:activeTab===k?'var(--acc)':'transparent',color:activeTab===k?'#fff':'var(--tx2)' }}>{l}</button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {isLoading ? <SkeletonCard /> : stats && (
              <div className="grid2" style={{ marginBottom:14 }}>
                {[['👥',stats.users?.total,'کاربر فعال','var(--acc)',()=>navigate('/admin/users')],['⏳',stats.users?.pending,'منتظر تأیید','var(--warn)',()=>navigate('/admin/users?pending=1')],['🎫',stats.tickets?.open,'تیکت باز','var(--err)',()=>navigate('/admin/tickets')],['🚩',stats.reports?.open,'گزارش','var(--warn)',null],['✅',stats.questions?.approved,'سوال تأیید شده','var(--ok)',null],['⏳',stats.questions?.pending,'سوال منتظر','var(--warn)',()=>navigate('/admin/content/questions')],['💳',stats.subscriptions?.active,'مشترک','var(--ok)',null]].map(([ic,v,l,c,fn]) => (
                  <button key={l} onClick={fn||undefined} className="card" style={{ textAlign:'center',padding:'11px 7px',border:`1px solid ${c}28`,cursor:fn?'pointer':'default',background:'var(--surf)' }}>
                    <div style={{ fontSize:20 }}>{ic}</div>
                    <div style={{ fontSize:20,fontWeight:800,color:c,margin:'2px 0' }}>{v??0}</div>
                    <div style={{ fontSize:9.5,color:'var(--txm)' }}>{l}</div>
                  </button>
                ))}
              </div>
            )}
            <div className="card" style={{ padding:'0 14px',marginBottom:12 }}>
              <button className="menu-row" onClick={() => navigate('/admin/users')}>
                <span style={{ fontSize:18,width:24,textAlign:'center' }}>👥</span><div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13 }}>مدیریت کاربران</div><div style={{ fontSize:11,color:'var(--txm)' }}>لیست، تأیید، تعلیق</div></div><span style={{ color:'var(--txm)' }}>←</span>
              </button>
              <button className="menu-row" onClick={() => navigate('/admin/tickets')}>
                <span style={{ fontSize:18,width:24,textAlign:'center' }}>🎫</span><div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13 }}>مدیریت تیکت‌ها</div><div style={{ fontSize:11,color:'var(--txm)' }}>پاسخ و بستن تیکت</div></div>{stats?.tickets?.open>0&&<span className="badge b-yel">{stats.tickets.open}</span>}<span style={{ color:'var(--txm)' }}>←</span>
              </button>
              <button className="menu-row" onClick={() => exportExcel.mutate()} style={{ borderBottom:'none' }}>
                <span style={{ fontSize:18,width:24,textAlign:'center' }}>📥</span><div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13 }}>خروجی Excel</div><div style={{ fontSize:11,color:'var(--txm)' }}>دانلود از ربات</div></div>
                {exportExcel.isPending ? <Spinner size={14} /> : <span style={{ color:'var(--txm)' }}>←</span>}
              </button>
            </div>
            <button className="btn btn-g btn-full" onClick={() => navigate('/admin/content')}>🎓 رفتن به پنل محتوا</button>
          </>
        )}

        {activeTab === 'broadcast' && (
          <>
            <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:12 }}>
              {[['all','👥 همه کاربران'],['group_1','1️⃣ گروه ۱'],['group_2','2️⃣ گروه ۲']].map(([v,l]) => (
                <button key={v} onClick={() => { haptic(); setBcTarget(v); }}
                  style={{ textAlign:'right',padding:'10px 13px',borderRadius:'var(--r-md)',border:`1px solid ${bcTarget===v?'var(--acc)':'var(--bd)'}`,background:bcTarget===v?'var(--acc-glow)':'var(--elev)',color:bcTarget===v?'var(--acc)':'var(--tx)',fontFamily:'var(--font)',fontSize:13,cursor:'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,color:'var(--txm)',marginBottom:5 }}>متن پیام (از HTML تلگرام پشتیبانی می‌شود)</div>
              <textarea className="inp" rows={6} value={bcText} onChange={e=>setBcText(e.target.value)} placeholder="متن پیام را بنویسید..." style={{ resize:'vertical',lineHeight:1.7 }} />
            </div>
            <button className="btn btn-p btn-full" disabled={bcText.trim().length<5||sendBc.isPending} onClick={() => sendBc.mutate()}>
              {sendBc.isPending ? <Spinner size={16} /> : '📤 ارسال همگانی'}
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ── Admin Users ── */
export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const qc   = useQueryClient();
  const toast = useUIStore(s => s.toast);
  const isPending = new URLSearchParams(typeof window!=='undefined'?window.location.search:'').get('pending')==='1';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, isPending],
    queryFn: () => api.get(isPending ? '/api/admin/users/pending' : `/api/admin/users${search?`?search=${encodeURIComponent(search)}`:''}`).then(r => r.data),
    staleTime: 1000 * 30,
  });

  function invalidate() { qc.invalidateQueries({ queryKey: ['admin-users'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); }

  async function approve(uid) {
    setLoadingId(uid);
    try { await api.post(`/api/admin/users/${uid}/approve`); hapticNotif('success'); toast('کاربر تأیید شد ✅','success'); invalidate(); }
    catch { toast('خطا','error'); }
    finally { setLoadingId(null); }
  }

  async function reject(uid) {
    setLoadingId(uid);
    try { await api.post(`/api/admin/users/${uid}/reject`); toast('کاربر رد شد','info'); invalidate(); }
    catch { toast('خطا','error'); }
    finally { setLoadingId(null); }
  }

  async function suspend(uid, isSuspended) {
    try { const res = await api.post(`/api/admin/users/${uid}/suspend`); toast(res.data.suspended?'⛔ تعلیق شد':'✅ رفع تعلیق شد','info'); invalidate(); }
    catch { toast('خطا','error'); }
  }

  const users = data?.users || [];
  return (
    <>
      <Header title={isPending?'⏳ منتظر تأیید':'👥 کاربران'} subtitle={`${users.length} نفر`} />
      <div className="page fade-up">
        {!isPending && <input className="inp" style={{ marginBottom:12 }} placeholder="🔍 جستجو..." value={search} onChange={e=>setSearch(e.target.value)} />}
        {isLoading ? <SkeletonCard /> : !users.length ? <div className="empty"><div style={{ fontSize:36,marginBottom:10 }}>👥</div><div>کاربری پیدا نشد</div></div> :
          users.map(u => (
            <div key={u.id} className="card" style={{ marginBottom:10,borderColor:isPending?'rgba(245,158,11,.3)':u.suspended?'rgba(239,68,68,.2)':'var(--bd)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:11,marginBottom:!isPending&&8 }}>
                <div className="avatar" style={{ width:40,height:40,fontSize:16 }}>{u.name?.[0]||'؟'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:13.5 }}>{u.name}</div>
                  <div style={{ fontSize:10.5,color:'var(--txm)',marginTop:1 }}>{u.student_id&&`ش.د: ${u.student_id} • `}گروه {u.group} • ورودی {u.intake}</div>
                  {!isPending && <div style={{ display:'flex',gap:4,marginTop:4 }}>
                    {u.role!=='student'&&<span className="badge b-yel">{u.role}</span>}
                    {u.suspended&&<span className="badge b-red">تعلیق</span>}
                  </div>}
                </div>
              </div>
              <div style={{ display:'flex',gap:7 }}>
                {isPending ? (
                  <>
                    <button className="btn btn-p" style={{ flex:1,padding:'7px 4px',fontSize:12 }} onClick={() => approve(u.id)} disabled={loadingId===u.id}>{loadingId===u.id?<Spinner size={12}/>:'✅ تأیید'}</button>
                    <button className="btn btn-d" style={{ flex:1,padding:'7px 4px',fontSize:12 }} onClick={() => reject(u.id)} disabled={loadingId===u.id}>❌ رد</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-dark" style={{ flex:1,fontSize:11,padding:'6px 4px' }} onClick={() => suspend(u.id, u.suspended)}>{u.suspended?'🔓 رفع تعلیق':'⛔ تعلیق'}</button>
                    <button className="btn btn-dark" style={{ flex:1,fontSize:11,padding:'6px 4px' }} onClick={() => toast('ویرایش کاربر','info')}>✏️ ویرایش</button>
                  </>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </>
  );
}

/* ── Admin Tickets ── */
export function AdminTickets() {
  const [filterStatus, setFilter] = useState('open');
  const [selectedId, setSelId]    = useState(null);
  const [replyText, setReply]     = useState('');
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-tickets', filterStatus],
    queryFn: () => api.get(`/api/admin/tickets${filterStatus?`?status=${filterStatus}`:''}`).then(r => r.data),
    staleTime: 1000 * 30,
  });

  const { data: detail } = useQuery({
    queryKey: ['admin-ticket', selectedId],
    queryFn: () => api.get(`/api/admin/tickets/${selectedId}`).then(r => r.data.ticket),
    staleTime: 1000 * 20,
    enabled: !!selectedId,
    refetchInterval: 15000,
  });

  const replyMut = useMutation({
    mutationFn: () => api.post(`/api/admin/tickets/${selectedId}/reply`, { message: replyText }).then(r => r.data),
    onSuccess: () => { hapticNotif('success'); setReply(''); qc.invalidateQueries({ queryKey: ['admin-ticket', selectedId] }); qc.invalidateQueries({ queryKey: ['admin-tickets'] }); },
    onError: () => toast('خطا','error'),
  });

  const closeMut = useMutation({
    mutationFn: () => api.post(`/api/admin/tickets/${selectedId}/close`).then(r => r.data),
    onSuccess: () => { toast('تیکت بسته شد','success'); qc.invalidateQueries({ queryKey: ['admin-ticket',selectedId] }); qc.invalidateQueries({ queryKey: ['admin-tickets'] }); },
  });

  if (selectedId && detail) return (
    <>
      <Header title={`تیکت #${selectedId}`} right={<button className="btn btn-dark" style={{ fontSize:11,padding:'5px 10px' }} onClick={() => setSelId(null)}>← برگشت</button>} />
      <div className="page fade-up">
        <div className="card" style={{ marginBottom:10,background:'var(--elev)',fontSize:12,color:'var(--tx2)',lineHeight:1.8 }}>
          👤 <b style={{ color:'var(--tx)' }}>{detail.user?.name}</b>{detail.user?.student_id&&` • ش.د: ${detail.user.student_id}`}{detail.user?.group&&` • گروه ${detail.user.group}`}
        </div>
        <div className="card" style={{ marginBottom:11 }}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
            <div style={{ fontWeight:700,fontSize:14 }}>{detail.subject}</div>
            <span className={`badge ${detail.status==='open'?'b-yel':'b-grn'}`}>{detail.status==='open'?'باز':'بسته'}</span>
          </div>
          <div style={{ fontSize:13,color:'var(--tx2)',lineHeight:1.7 }}>{detail.message}</div>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:13 }}>
          {detail.replies?.map((r, i) => (
            <div key={i} style={{ alignSelf:r.sender==='support'?'flex-end':'flex-start',maxWidth:'85%',background:r.sender==='support'?'var(--acc)':'var(--elev)',color:r.sender==='support'?'#fff':'var(--tx)',borderRadius:'var(--r-md)',padding:'9px 13px',fontSize:13,lineHeight:1.6 }}>
              {r.sender==='user'&&<div style={{ fontSize:10,fontWeight:700,color:'var(--warn)',marginBottom:3 }}>🧑‍🎓 {detail.user?.name}</div>}
              {r.text}<div style={{ fontSize:9,marginTop:3,opacity:.7 }}>{r.at}</div>
            </div>
          ))}
        </div>
        {detail.status==='open' ? (
          <>
            <div style={{ display:'flex',gap:8,marginBottom:8 }}>
              <input className="inp" value={replyText} onChange={e=>setReply(e.target.value)} placeholder="پاسخ پشتیبانی..." style={{ flex:1 }} />
              <button className="btn btn-p" onClick={() => replyMut.mutate()} disabled={!replyText.trim()||replyMut.isPending}>{replyMut.isPending?<Spinner size={14}/>:'📤'}</button>
            </div>
            <button className="btn btn-d btn-full" onClick={() => closeMut.mutate()} disabled={closeMut.isPending}>{closeMut.isPending?<Spinner size={14}/>:'🔒 بستن تیکت'}</button>
          </>
        ) : (
          <div className="card" style={{ textAlign:'center',fontSize:12,color:'var(--txm)' }}>تیکت بسته شده است</div>
        )}
      </div>
    </>
  );

  return (
    <>
      <Header title="🎫 مدیریت تیکت‌ها" />
      <div className="page fade-up">
        <div className="tab-bar">
          {[['open','باز'],['closed','بسته'],['','همه']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} className="tab-btn"
              style={{ background:filterStatus===v?'var(--acc)':'transparent',color:filterStatus===v?'#fff':'var(--tx2)' }}>{l}</button>
          ))}
        </div>
        {!data?.tickets?.length ? <div className="empty"><div style={{ fontSize:36,marginBottom:10 }}>🎫</div><div>تیکتی یافت نشد</div></div> :
          data.tickets.map(t => (
            <button key={t.id} onClick={() => { haptic(); setSelId(t.id); }} className="card" style={{ cursor:'pointer',textAlign:'right',borderColor:t.status==='open'?'rgba(245,158,11,.3)':'var(--bd)',marginBottom:8,width:'100%' }}>
              <div style={{ display:'flex',alignItems:'center',gap:11 }}>
                <div style={{ width:40,height:40,borderRadius:'var(--r-md)',background:t.status==='open'?'rgba(245,158,11,.12)':'rgba(16,185,129,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>🎫</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,fontSize:13 }}>#{t.id} — {t.subject}</div>
                  <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>👤 {t.user_name} • {t.created_at}{t.reply_count>0&&` • ${t.reply_count} پاسخ`}</div>
                </div>
                <span className={`badge ${t.status==='open'?'b-yel':'b-grn'}`}>{t.status==='open'?'باز':'بسته'}</span>
              </div>
            </button>
          ))
        }
      </div>
    </>
  );
}
