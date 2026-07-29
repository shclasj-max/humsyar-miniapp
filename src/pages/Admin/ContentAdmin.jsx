import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic, hapticNotif } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

const LETTERS = ['الف','ب','ج','د'];

/* ── Content Admin Hub ── */
export function ContentAdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin  = user?.role === 'admin';

  const { data } = useQuery({
    queryKey: ['content-overview'],
    queryFn: () => api.get('/api/content/overview').then(r => r.data),
    staleTime: 1000 * 30,
  });

  return (
    <>
      <Header title="🎓 پنل محتوا" subtitle={isAdmin ? 'ادمین اصلی' : 'ادمین محتوا'} />
      <div className="page fade-up">
        {data && (
          <div className="grid2" style={{ marginBottom:16 }}>
            {[['⏳',data.pending_questions,'سوال منتظر','var(--warn)'],['✅',data.approved_questions,'سوال تأیید شده','var(--ok)'],['📚',data.total_resources,'فایل منبع','var(--acc)'],['📅',data.upcoming_exams,'امتحان پیش رو','var(--err)']].map(([ic,v,l,c]) => (
              <div key={l} className="card" style={{ textAlign:'center',padding:'11px 7px',border:`1px solid ${c}28` }}>
                <div style={{ fontSize:20 }}>{ic}</div>
                <div style={{ fontSize:20,fontWeight:800,color:c,margin:'2px 0' }}>{v??0}</div>
                <div style={{ fontSize:9.5,color:'var(--txm)' }}>{l}</div>
              </div>
            ))}
          </div>
        )}

        <div className="sec-title">🧬 علوم پایه</div>
        <div className="card" style={{ padding:'0 14px',marginBottom:14 }}>
          <button className="menu-row" onClick={() => navigate('/admin/content/basic-science')} style={{ borderBottom:'none' }}>
            <span style={{ fontSize:18,width:24,textAlign:'center' }}>🧬</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13.5 }}>مدیریت درس‌ها و محتوا</div><div style={{ fontSize:11,color:'var(--txm)' }}>ترم، درس، جلسه، آپلود فایل</div></div>
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
        </div>

        <div className="sec-title">📖 رفرنس‌ها</div>
        <div className="card" style={{ padding:'0 14px',marginBottom:14 }}>
          <button className="menu-row" onClick={() => navigate('/admin/content/references')} style={{ borderBottom:'none' }}>
            <span style={{ fontSize:18,width:24,textAlign:'center' }}>📖</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13.5 }}>مدیریت رفرنس‌ها</div><div style={{ fontSize:11,color:'var(--txm)' }}>موضوع، کتاب، آپلود جلد</div></div>
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
        </div>

        <div className="sec-title">🧪 بانک سوال</div>
        <div className="card" style={{ padding:'0 14px',marginBottom:14 }}>
          <button className="menu-row" onClick={() => navigate('/admin/content/questions')}>
            <span style={{ fontSize:18,width:24,textAlign:'center' }}>⏳</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13.5 }}>سوالات منتظر تأیید</div><div style={{ fontSize:11,color:'var(--txm)' }}>بررسی و تأیید یا رد</div></div>
            {data?.pending_questions>0&&<span className="badge b-yel">{data.pending_questions}</span>}
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
          <button className="menu-row" onClick={() => navigate('/admin/content/qbank')} style={{ borderBottom:'none' }}>
            <span style={{ fontSize:18,width:24,textAlign:'center' }}>📁</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13.5 }}>فایل‌های بانک سوال</div><div style={{ fontSize:11,color:'var(--txm)' }}>آپلود و مدیریت فایل</div></div>
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
        </div>

        <div className="sec-title">📅 برنامه کلاسی</div>
        <div className="card" style={{ padding:'0 14px',marginBottom:14 }}>
          <button className="menu-row" onClick={() => navigate('/admin/content/schedule')} style={{ borderBottom:'none' }}>
            <span style={{ fontSize:18,width:24,textAlign:'center' }}>📅</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13.5 }}>مدیریت برنامه</div><div style={{ fontSize:11,color:'var(--txm)' }}>افزودن کلاس، امتحان و جبرانی</div></div>
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
        </div>

        <div className="sec-title">📊 نمرات</div>
        <div className="card" style={{ padding:'0 14px',marginBottom:14 }}>
          <button className="menu-row" onClick={() => navigate('/admin/content/grades')} style={{ borderBottom:'none' }}>
            <span style={{ fontSize:18,width:24,textAlign:'center' }}>📊</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13.5 }}>مدیریت نمرات</div><div style={{ fontSize:11,color:'var(--txm)' }}>ثبت دسته‌ای، ویرایش، حذف</div></div>
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
        </div>

        <div className="sec-title">❓ سوالات متداول</div>
        <div className="card" style={{ padding:'0 14px',marginBottom:14 }}>
          <button className="menu-row" onClick={() => navigate('/admin/content/faq')} style={{ borderBottom:'none' }}>
            <span style={{ fontSize:18,width:24,textAlign:'center' }}>❓</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13.5 }}>مدیریت FAQ</div><div style={{ fontSize:11,color:'var(--txm)' }}>افزودن و حذف سوالات متداول</div></div>
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
        </div>

        <div className="sec-title">🚩 گزارش‌های ایراد</div>
        <div className="card" style={{ padding:'0 14px',marginBottom:14 }}>
          <button className="menu-row" onClick={() => navigate('/admin/content/reports')} style={{ borderBottom:'none' }}>
            <span style={{ fontSize:18,width:24,textAlign:'center' }}>🚩</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13.5 }}>گزارشات سوال/جزوه</div><div style={{ fontSize:11,color:'var(--txm)' }}>بررسی و رسیدگی</div></div>
            <span style={{ color:'var(--txm)' }}>←</span>
          </button>
        </div>

        {isAdmin && (
          <button className="btn btn-g btn-full" onClick={() => navigate('/admin')}>👑 رفتن به پنل ادمین</button>
        )}
      </div>
    </>
  );
}

/* ── Content Questions ── */
export function ContentQuestions() {
  const [loadingId, setLoadingId] = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-questions'],
    queryFn: () => api.get('/api/content/questions/pending').then(r => r.data.questions),
    staleTime: 1000 * 30,
  });

  function invalidate() { qc.invalidateQueries({ queryKey: ['pending-questions'] }); qc.invalidateQueries({ queryKey: ['content-overview'] }); }

  async function approve(qid) {
    setLoadingId(qid);
    try { await api.post(`/api/content/questions/${qid}/approve`); hapticNotif('success'); toast('سوال تأیید شد ✅','success'); invalidate(); }
    catch { toast('خطا','error'); }
    finally { setLoadingId(null); }
  }

  async function reject(qid) {
    setLoadingId(qid);
    try { await api.post(`/api/content/questions/${qid}/reject`); toast('سوال رد شد','info'); invalidate(); }
    catch { toast('خطا','error'); }
    finally { setLoadingId(null); }
  }

  return (
    <>
      <Header title="⏳ سوالات منتظر تأیید" subtitle={data ? `${data.length} سوال` : ''} />
      <div className="page fade-up">
        {isLoading ? <div style={{ display:'flex',flexDirection:'column',gap:10 }}>{[1,2].map(i=><SkeletonCard key={i}/>)}</div>
        : !data?.length ? <div className="empty"><div style={{ fontSize:38,marginBottom:12 }}>✅</div><div>هیچ سوال منتظری نیست</div></div>
        : data.map(q => (
          <div key={q.id} className="card" style={{ marginBottom:12 }}>
            <button onClick={() => { haptic(); setExpanded(expanded===q.id?null:q.id); }}
              style={{ width:'100%',background:'none',border:'none',cursor:'pointer',textAlign:'right' }}>
              <div style={{ display:'flex',gap:5,marginBottom:7,flexWrap:'wrap' }}>
                <span className="badge b-acc">{q.lesson}</span>
                <span className="badge b-acc">{q.topic}</span>
                <span className={`badge ${q.difficulty?.includes('آسان')?'b-grn':q.difficulty?.includes('سخت')?'b-red':'b-yel'}`}>{q.difficulty}</span>
                <span style={{ marginRight:'auto',fontSize:10,color:'var(--txm)' }}>✏️ {q.creator_name} • {q.source==='webapp'?'Mini App':'ربات'}</span>
                <span style={{ color:'var(--txm)',fontSize:15,transition:'transform .2s',transform:expanded===q.id?'rotate(180deg)':'none' }}>▾</span>
              </div>
              <div style={{ fontSize:13.5,color:'var(--tx)',lineHeight:1.6,textAlign:'right' }}>{q.question}</div>
            </button>

            {expanded===q.id && (
              <div style={{ marginTop:11,borderTop:'1px solid var(--bd)',paddingTop:11 }}>
                <div style={{ display:'flex',flexDirection:'column',gap:5,marginBottom:10 }}>
                  {q.options?.map((opt, i) => (
                    <div key={i} style={{ padding:'7px 10px',borderRadius:'var(--r-sm)',background:i===q.correct?'rgba(16,185,129,.1)':'var(--elev)',border:`1px solid ${i===q.correct?'var(--ok)':'var(--bd)'}`,fontSize:12.5,color:i===q.correct?'var(--ok)':'var(--tx2)' }}>
                      {LETTERS[i]}) {opt}{i===q.correct?' ✓':''}
                    </div>
                  ))}
                </div>
                {q.explanation && <div style={{ fontSize:11.5,color:'var(--txm)',padding:'7px 10px',background:'var(--elev)',borderRadius:'var(--r-sm)',marginBottom:10,lineHeight:1.6 }}>💡 {q.explanation}</div>}
              </div>
            )}

            <div style={{ display:'flex',gap:8,marginTop:12 }}>
              <button className="btn btn-p" style={{ flex:1 }} onClick={() => approve(q.id)} disabled={loadingId===q.id}>
                {loadingId===q.id?<Spinner size={14}/>:'✅ تأیید'}
              </button>
              <button className="btn btn-d" style={{ flex:1 }} onClick={() => reject(q.id)} disabled={loadingId===q.id}>
                {loadingId===q.id?<Spinner size={14}/>:'❌ رد'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Content Schedule ── */
const EMPTY_SCHED_FORM = { type:'class',lesson:'',teacher:'',date:'',time:'',group:'هر دو',location:'',note:'',flex_type:'fixed' };

export function ContentSchedule() {
  const [tab, setTab]         = useState('class');
  const [view, setView]       = useState('list'); // list | form | flex-list | flex-form
  const [form, setForm]       = useState(EMPTY_SCHED_FORM);
  const [editId, setEditId]   = useState(null);
  const [flexTarget, setFlexTarget] = useState(null); // {id,lesson,...}
  const [flexForm, setFlexForm] = useState({ date:'', time:'', note:'' });
  const [savingId, setSavingId] = useState(null);
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['content-schedule', tab],
    queryFn: () => api.get(`/api/content/schedule?stype=${tab}`).then(r => r.data.schedule),
    staleTime: 1000 * 30,
    enabled: view === 'list',
  });

  const { data: flexItems, isLoading: loadingFlex } = useQuery({
    queryKey: ['content-schedule-flex'],
    queryFn: () => api.get('/api/content/schedule/flex').then(r => r.data.items),
    enabled: view === 'flex-list',
  });

  const saveMut = useMutation({
    mutationFn: () => editId
      ? api.patch(`/api/content/schedule/${editId}`, form).then(r => r.data)
      : api.post('/api/content/schedule', form).then(r => r.data),
    onSuccess: () => { hapticNotif('success'); toast(editId?'✏️ ویرایش شد':'✅ برنامه اضافه شد','success'); setView('list'); setForm(EMPTY_SCHED_FORM); setEditId(null); qc.invalidateQueries({ queryKey: ['content-schedule'] }); },
    onError: err => toast(err.response?.data?.detail||'خطا','error'),
  });

  const flexChangeMut = useMutation({
    mutationFn: () => api.post(`/api/content/schedule/${flexTarget.id}/flex-change`, flexForm).then(r => r.data),
    onSuccess: (d) => { hapticNotif('success'); toast(`✅ اعلام شد — ${d.notified} نفر مطلع شدند`,'success'); setView('list'); setFlexTarget(null); setFlexForm({date:'',time:'',note:''}); qc.invalidateQueries({ queryKey: ['content-schedule'] }); qc.invalidateQueries({ queryKey: ['content-schedule-flex'] }); },
    onError: err => toast(err.response?.data?.detail||'خطا','error'),
  });

  async function delSchedule(id) {
    setSavingId(id);
    try { await api.delete(`/api/content/schedule/${id}`); toast('حذف شد','success'); qc.invalidateQueries({ queryKey: ['content-schedule'] }); }
    catch { toast('خطا','error'); }
    finally { setSavingId(null); }
  }

  function openEdit(s) {
    setForm({ type:s.type, lesson:s.lesson, teacher:s.teacher, date:s.date, time:s.time,
      group:s.group||'هر دو', location:s.location||'', note:s.note||'', flex_type:s.flex_type||'fixed' });
    setEditId(s.id); setView('form'); haptic();
  }

  const TYPE_OPTS = [['class','🏫 کلاس'],['exam','📝 امتحان'],['makeup','🔄 جبرانی']];
  const GROUP_OPTS = [['هر دو','هر دو'],['1','گروه ۱'],['2','گروه ۲']];

  if (view === 'flex-form' && flexTarget) return (
    <>
      <Header title="🔄 اعلام تغییر زمان" onBack={() => setView('flex-list')} />
      <div className="page fade-up">
        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700,fontSize:14,marginBottom:2 }}>{flexTarget.lesson}</div>
          <div style={{ fontSize:11,color:'var(--txm)' }}>زمان فعلی: {flexTarget.date} — {flexTarget.time}</div>
        </div>
        <div className="card">
          <div className="sec-title">📅 زمان جدید</div>
          <div style={{ fontSize:11,color:'var(--txm)',marginBottom:4 }}>تاریخ (YYYY-MM-DD)</div>
          <input className="inp" style={{ marginBottom:9 }} placeholder="2025-09-10" value={flexForm.date} onChange={e=>setFlexForm(f=>({...f,date:e.target.value}))} />
          <div style={{ fontSize:11,color:'var(--txm)',marginBottom:4 }}>ساعت</div>
          <input className="inp" style={{ marginBottom:9 }} placeholder="14:00" value={flexForm.time} onChange={e=>setFlexForm(f=>({...f,time:e.target.value}))} />
          <div style={{ fontSize:11,color:'var(--txm)',marginBottom:4 }}>توضیح (اختیاری)</div>
          <input className="inp" style={{ marginBottom:12 }} value={flexForm.note} onChange={e=>setFlexForm(f=>({...f,note:e.target.value}))} />
          <button className="btn btn-p btn-full" disabled={!flexForm.date||!flexForm.time||flexChangeMut.isPending} onClick={() => flexChangeMut.mutate()}>
            {flexChangeMut.isPending ? <Spinner size={14}/> : '🔔 ثبت و اعلام به همه'}
          </button>
        </div>
      </div>
    </>
  );

  if (view === 'flex-list') return (
    <>
      <Header title="🔄 کلاس‌های منعطف" onBack={() => setView('list')} />
      <div className="page fade-up">
        {loadingFlex ? <SkeletonCard /> : !flexItems?.length ? (
          <div className="empty"><div style={{ fontSize:36,marginBottom:10 }}>🔄</div><div>هیچ کلاس منعطفی ثبت نشده</div><div style={{ fontSize:11,marginTop:6 }}>هنگام افزودن برنامه، نوع زمان‌بندی رو «منعطف» انتخاب کن</div></div>
        ) : flexItems.map(s => (
          <button key={s.id} className="card" style={{ width:'100%',textAlign:'right',marginBottom:9,background:'var(--elev)',border:'1px solid var(--bd)' }}
            onClick={() => { setFlexTarget(s); setFlexForm({date:s.date,time:s.time,note:''}); setView('flex-form'); haptic(); }}>
            <div style={{ fontWeight:700,fontSize:13.5 }}>🔄 {s.lesson}</div>
            <div style={{ fontSize:11,color:'var(--txm)',marginTop:3 }}>{s.date} — {s.time}{s.flex_note?` (${s.flex_note})`:''}</div>
          </button>
        ))}
      </div>
    </>
  );

  if (view === 'form') return (
    <>
      <Header title={editId?'✏️ ویرایش برنامه':'+ افزودن برنامه'} onBack={() => { setView('list'); setEditId(null); setForm(EMPTY_SCHED_FORM); }} />
      <div className="page fade-up">
        <div className="card card-glow">
          <div style={{ display:'flex',gap:6,marginBottom:12 }}>
            {TYPE_OPTS.map(([v,l]) => (
              <button key={v} onClick={() => setForm(f=>({...f,type:v}))} style={{ flex:1,padding:'7px 4px',borderRadius:'var(--r-md)',fontSize:11,fontFamily:'var(--font)',cursor:'pointer',border:`1px solid ${form.type===v?'var(--acc)':'var(--bd)'}`,background:form.type===v?'var(--acc-glow)':'var(--elev)',color:form.type===v?'var(--acc)':'var(--tx2)' }}>{l}</button>
            ))}
          </div>
          {[['lesson','نام درس *','فیزیولوژی ۱'],['teacher','استاد','دکتر احمدی'],['date','تاریخ (YYYY-MM-DD) *','2025-09-01'],['time','ساعت','08:00'],['location','مکان','کلاس ۳'],['note','توضیح','']].map(([k,label,ph]) => (
            <div key={k} style={{ marginBottom:9 }}>
              <div style={{ fontSize:11,color:'var(--txm)',marginBottom:4 }}>{label}</div>
              <input className="inp" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} />
            </div>
          ))}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11,color:'var(--txm)',marginBottom:6 }}>گروه</div>
            <div style={{ display:'flex',gap:6 }}>
              {GROUP_OPTS.map(([v,l]) => (
                <button key={v} onClick={() => setForm(f=>({...f,group:v}))} style={{ flex:1,padding:'7px 4px',borderRadius:'var(--r-md)',fontSize:11,fontFamily:'var(--font)',cursor:'pointer',border:`1px solid ${form.group===v?'var(--acc)':'var(--bd)'}`,background:form.group===v?'var(--acc-glow)':'var(--elev)',color:form.group===v?'var(--acc)':'var(--tx2)' }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11,color:'var(--txm)',marginBottom:6 }}>نوع زمان‌بندی</div>
            <div style={{ display:'flex',gap:6 }}>
              {[['fixed','📌 ثابت'],['flexible','🔄 منعطف']].map(([v,l]) => (
                <button key={v} onClick={() => setForm(f=>({...f,flex_type:v}))} style={{ flex:1,padding:'7px 4px',borderRadius:'var(--r-md)',fontSize:11,fontFamily:'var(--font)',cursor:'pointer',border:`1px solid ${form.flex_type===v?'var(--acc)':'var(--bd)'}`,background:form.flex_type===v?'var(--acc-glow)':'var(--elev)',color:form.flex_type===v?'var(--acc)':'var(--tx2)' }}>{l}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-p btn-full" disabled={!form.lesson||!form.date||saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending?<Spinner size={16}/>:'💾 ذخیره'}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Header title="📅 مدیریت برنامه" />
      <div className="page fade-up">
        <div style={{ display:'flex',gap:8,marginBottom:14 }}>
          <button className="btn btn-p" style={{ flex:1 }} onClick={() => { haptic(); setForm(EMPTY_SCHED_FORM); setEditId(null); setView('form'); }}>+ افزودن برنامه</button>
          <button className="btn btn-dark" style={{ flex:1 }} onClick={() => { haptic(); setView('flex-list'); }}>🔄 اعلام تغییر زمان</button>
        </div>

        <div className="tab-bar">
          {TYPE_OPTS.map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)} className="tab-btn"
              style={{ background:tab===v?'var(--acc)':'transparent',color:tab===v?'#fff':'var(--tx2)' }}>{l}</button>
          ))}
        </div>

        {isLoading ? <SkeletonCard /> : !data?.length ? <div className="empty"><div style={{ fontSize:36,marginBottom:10 }}>📭</div><div>موردی ثبت نشده</div></div> :
          data.map(s => (
            <div key={s.id} className="card" style={{ marginBottom:8,display:'flex',alignItems:'flex-start',gap:11 }}>
              <button onClick={() => openEdit(s)} style={{ flex:1,minWidth:0,textAlign:'right',background:'none',border:'none',cursor:'pointer',padding:0 }}>
                <div style={{ fontWeight:700,fontSize:13.5 }}>{s.flex_type==='flexible'&&'🔄 '}{s.lesson}</div>
                {s.teacher&&<div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>استاد: {s.teacher}{s.location?` • ${s.location}`:''}</div>}
                <div style={{ display:'flex',gap:4,marginTop:5,flexWrap:'wrap' }}>
                  <span className="badge b-acc">{s.date}</span>
                  {s.time&&<span className="badge b-gray">{s.time}</span>}
                  {s.group&&s.group!=='هر دو'&&<span className="badge b-gray">گروه {s.group}</span>}
                </div>
              </button>
              <button onClick={() => delSchedule(s.id)} disabled={savingId===s.id} style={{ background:'rgba(239,68,68,.1)',border:'none',color:'var(--err)',borderRadius:'var(--r-sm)',padding:'6px 10px',cursor:'pointer',fontSize:15,flexShrink:0 }}>
                {savingId===s.id?'...':'🗑'}
              </button>
            </div>
          ))
        }
      </div>
    </>
  );
}

/* ── Content FAQ ── */
export function ContentFaq() {
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ]       = useState('');
  const [newA, setNewA]       = useState('');
  const [newCat, setNewCat]   = useState('❓ سوالات متداول');
  const [delId, setDelId]     = useState(null);
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['content-faq'],
    queryFn: () => api.get('/api/content/faq').then(r => r.data.items),
    staleTime: 1000 * 60,
  });

  const addMut = useMutation({
    mutationFn: () => api.post('/api/content/faq', { category: newCat, question: newQ, answer: newA }).then(r => r.data),
    onSuccess: () => { hapticNotif('success'); toast('FAQ اضافه شد ✅','success'); setShowAdd(false); setNewQ(''); setNewA(''); qc.invalidateQueries({ queryKey: ['content-faq'] }); qc.invalidateQueries({ queryKey: ['faq'] }); },
    onError: () => toast('خطا','error'),
  });

  async function delFaq(id) {
    setDelId(id);
    try { await api.delete(`/api/content/faq/${id}`); toast('حذف شد','success'); qc.invalidateQueries({ queryKey: ['content-faq'] }); }
    catch { toast('خطا','error'); }
    finally { setDelId(null); }
  }

  const CATS = ['🔬 علوم پایه','🧪 بانک سوال','📅 برنامه','💳 اشتراک','👤 پروفایل','⚙️ مشکل فنی','❓ سوالات متداول'];
  const grouped = (data||[]).reduce((acc, item) => { if(!acc[item.category])acc[item.category]=[]; acc[item.category].push(item); return acc; }, {});

  return (
    <>
      <Header title="❓ مدیریت FAQ" subtitle={data?`${data.length} سوال`:''} />
      <div className="page fade-up">
        {showAdd ? (
          <div className="card card-glow" style={{ marginBottom:14 }}>
            <div className="sec-title">+ افزودن سوال متداول</div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,color:'var(--txm)',marginBottom:6 }}>دسته‌بندی</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                {CATS.map(c => <button key={c} onClick={() => setNewCat(c)} style={{ padding:'4px 9px',borderRadius:999,fontSize:11,fontFamily:'var(--font)',cursor:'pointer',border:`1px solid ${newCat===c?'var(--acc)':'var(--bd)'}`,background:newCat===c?'var(--acc-glow)':'var(--elev)',color:newCat===c?'var(--acc)':'var(--tx2)' }}>{c}</button>)}
              </div>
            </div>
            <div style={{ marginBottom:9 }}>
              <div style={{ fontSize:11,color:'var(--txm)',marginBottom:4 }}>سوال</div>
              <input className="inp" value={newQ} onChange={e=>setNewQ(e.target.value)} placeholder="سوال را بنویسید..." />
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,color:'var(--txm)',marginBottom:4 }}>جواب</div>
              <textarea className="inp" rows={3} value={newA} onChange={e=>setNewA(e.target.value)} placeholder="جواب را بنویسید..." style={{ resize:'vertical',lineHeight:1.6 }} />
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button className="btn btn-p" style={{ flex:2 }} disabled={!newQ.trim()||!newA.trim()||addMut.isPending} onClick={() => addMut.mutate()}>
                {addMut.isPending?<Spinner size={16}/>:'💾 ذخیره'}
              </button>
              <button className="btn btn-dark" style={{ flex:1 }} onClick={() => setShowAdd(false)}>لغو</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-p btn-full" style={{ marginBottom:14 }} onClick={() => { haptic(); setShowAdd(true); }}>+ افزودن سوال متداول</button>
        )}

        {isLoading ? <SkeletonCard /> : !data?.length ? <div className="empty"><div style={{ fontSize:36,marginBottom:10 }}>❓</div><div>هنوز سوالی اضافه نشده</div></div> :
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom:16 }}>
              <div className="sec-title">{cat}</div>
              {items.map(item => (
                <div key={item.id} className="card" style={{ marginBottom:7,display:'flex',alignItems:'flex-start',gap:10 }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:600,fontSize:13,marginBottom:4 }}>{item.question}</div>
                    <div style={{ fontSize:12,color:'var(--tx2)',lineHeight:1.6 }}>{item.answer}</div>
                  </div>
                  <button onClick={() => delFaq(item.id)} disabled={delId===item.id} style={{ background:'rgba(239,68,68,.08)',border:'none',color:'var(--err)',borderRadius:'var(--r-sm)',padding:'5px 8px',cursor:'pointer',fontSize:14,flexShrink:0 }}>
                    {delId===item.id?'...':'🗑'}
                  </button>
                </div>
              ))}
            </div>
          ))
        }
      </div>
    </>
  );
}
