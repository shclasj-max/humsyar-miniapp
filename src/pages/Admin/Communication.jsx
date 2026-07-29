import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic, hapticNotif } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

/* ═══════════════════════════════════════════
   📢 ارسال همگانی پیشرفته
   ═══════════════════════════════════════════ */
export function BroadcastAdmin() {
  const toast = useUIStore(s => s.toast);
  const [text, setText] = useState('');
  const [scope, setScope] = useState('all');
  const [intake, setIntake] = useState('');
  const [group, setGroup] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [sendAt, setSendAt] = useState('');
  const [step, setStep] = useState('compose'); // compose | preview | done

  const { data: intakes } = useQuery({
    queryKey: ['admin-intakes-simple'],
    queryFn: () => api.get('/api/admin/intakes').then(r => r.data.intakes),
  });

  const target = { scope, intake: scope !== 'all' ? intake : undefined, group: scope === 'intake_group' ? group : undefined };

  const previewMut = useMutation({
    mutationFn: () => api.post('/api/admin/broadcast/preview', { target }).then(r => r.data),
    onSuccess: () => { setStep('preview'); haptic(); },
    onError: () => toast('خطا در گرفتن پیش‌نمایش','error'),
  });

  const sendMut = useMutation({
    mutationFn: () => api.post('/api/admin/broadcast', {
      text, target, send_at: scheduled && sendAt ? new Date(sendAt).toISOString() : undefined,
    }).then(r => r.data),
    onSuccess: (d) => {
      hapticNotif('success');
      toast(d.scheduled ? `⏰ ${d.queued} پیام برای ارسال زمان‌دار ثبت شد` : `✅ ${d.queued} پیام در صف ارسال قرار گرفت`, 'success', 4000);
      setStep('done'); setText('');
    },
    onError: (e) => toast(e.response?.data?.detail || 'خطا', 'error'),
  });

  const scopeLabel = scope === 'all' ? 'همه‌ی کاربران' : scope === 'intake' ? `ورودی: ${intakes?.find(i=>i.code===intake)?.label||intake}` : `ورودی ${intakes?.find(i=>i.code===intake)?.label||intake} — گروه ${group}`;

  if (step === 'done') return (
    <>
      <Header title="📢 ارسال همگانی" onBack={() => setStep('compose')} />
      <div className="page fade-up">
        <div className="empty"><div style={{ fontSize:40,marginBottom:10 }}>✅</div><div>پیام در صف ارسال قرار گرفت</div></div>
        <button className="btn btn-p btn-full" onClick={() => setStep('compose')}>📢 ارسال جدید</button>
      </div>
    </>
  );

  if (step === 'preview') return (
    <>
      <Header title="پیش‌نمایش" onBack={() => setStep('compose')} />
      <div className="page fade-up">
        <div className="card" style={{ marginBottom:14 }}>
          <div className="sec-title">👀 پیش‌نمایش پیام</div>
          <div style={{ background:'var(--elev)',borderRadius:'var(--r-md)',padding:12,fontSize:13.5,lineHeight:1.8,whiteSpace:'pre-wrap' }} dangerouslySetInnerHTML={{ __html: text }} />
        </div>
        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
            <span style={{ fontSize:12,color:'var(--txm)' }}>مخاطب</span>
            <span style={{ fontSize:12.5,fontWeight:600 }}>{scopeLabel}</span>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between' }}>
            <span style={{ fontSize:12,color:'var(--txm)' }}>تعداد گیرنده</span>
            <span style={{ fontSize:16,fontWeight:800,color:'var(--acc)' }}>{previewMut.data?.recipient_count ?? '—'} نفر</span>
          </div>
          {scheduled && sendAt && (
            <div style={{ display:'flex',justifyContent:'space-between',marginTop:8 }}>
              <span style={{ fontSize:12,color:'var(--txm)' }}>زمان ارسال</span>
              <span style={{ fontSize:12.5,fontWeight:600 }}>⏰ {new Date(sendAt).toLocaleString('fa-IR')}</span>
            </div>
          )}
        </div>
        <button className="btn btn-p btn-full" disabled={sendMut.isPending} onClick={() => sendMut.mutate()}>
          {sendMut.isPending ? <Spinner size={16}/> : scheduled ? '⏰ زمان‌بندی کن' : '✅ بله، ارسال کن'}
        </button>
      </div>
    </>
  );

  return (
    <>
      <Header title="📢 ارسال همگانی" />
      <div className="page fade-up">
        <div className="card" style={{ marginBottom:14 }}>
          <div className="sec-title">👥 مخاطبین</div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <button onClick={() => { haptic(); setScope('all'); }}
              style={{ textAlign:'right',padding:'10px 13px',borderRadius:'var(--r-md)',border:`1px solid ${scope==='all'?'var(--acc)':'var(--bd)'}`,background:scope==='all'?'var(--acc-glow)':'var(--elev)',color:scope==='all'?'var(--acc)':'var(--tx)',fontFamily:'var(--font)',fontSize:13,cursor:'pointer' }}>👥 همه‌ی کاربران</button>
            <button onClick={() => { haptic(); setScope('intake'); }}
              style={{ textAlign:'right',padding:'10px 13px',borderRadius:'var(--r-md)',border:`1px solid ${scope==='intake'?'var(--acc)':'var(--bd)'}`,background:scope==='intake'?'var(--acc-glow)':'var(--elev)',color:scope==='intake'?'var(--acc)':'var(--tx)',fontFamily:'var(--font)',fontSize:13,cursor:'pointer' }}>📅 یک ورودی خاص</button>
            <button onClick={() => { haptic(); setScope('intake_group'); }}
              style={{ textAlign:'right',padding:'10px 13px',borderRadius:'var(--r-md)',border:`1px solid ${scope==='intake_group'?'var(--acc)':'var(--bd)'}`,background:scope==='intake_group'?'var(--acc-glow)':'var(--elev)',color:scope==='intake_group'?'var(--acc)':'var(--tx)',fontFamily:'var(--font)',fontSize:13,cursor:'pointer' }}>🎯 ورودی + گروه خاص</button>
          </div>

          {scope !== 'all' && (
            <select className="inp" style={{ marginTop:10 }} value={intake} onChange={e=>setIntake(e.target.value)}>
              <option value="">انتخاب ورودی...</option>
              {intakes?.map(i => <option key={i.code} value={i.code}>{i.label}</option>)}
            </select>
          )}
          {scope === 'intake_group' && (
            <select className="inp" style={{ marginTop:8 }} value={group} onChange={e=>setGroup(e.target.value)}>
              <option value="">انتخاب گروه...</option>
              <option value="1">گروه ۱</option>
              <option value="2">گروه ۲</option>
            </select>
          )}
        </div>

        <div className="card" style={{ marginBottom:14 }}>
          <div className="sec-title">✍️ متن پیام</div>
          <textarea className="inp" rows={6} value={text} onChange={e=>setText(e.target.value)} placeholder="متن پیام را بنویسید... (HTML تلگرام پشتیبانی می‌شود)" style={{ resize:'vertical',lineHeight:1.7 }} />
        </div>

        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <span className="sec-title" style={{ margin:0 }}>⏰ ارسال زمان‌دار</span>
            <button onClick={() => { haptic(); setScheduled(!scheduled); }}
              style={{ width:42,height:24,borderRadius:12,border:'none',cursor:'pointer',background:scheduled?'var(--acc)':'var(--bd)',position:'relative',transition:'.2s' }}>
              <div style={{ width:18,height:18,borderRadius:9,background:'#fff',position:'absolute',top:3,[scheduled?'right':'left']:3,transition:'.2s' }} />
            </button>
          </div>
          {scheduled && (
            <input className="inp" type="datetime-local" style={{ marginTop:10 }} value={sendAt} onChange={e=>setSendAt(e.target.value)} />
          )}
        </div>

        <button className="btn btn-p btn-full"
          disabled={text.trim().length<5 || (scope!=='all' && !intake) || (scope==='intake_group' && !group) || (scheduled && !sendAt) || previewMut.isPending}
          onClick={() => previewMut.mutate()}>
          {previewMut.isPending ? <Spinner size={16}/> : '👀 پیش‌نمایش'}
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   📊 نظرسنجی کانال
   ═══════════════════════════════════════════ */
export function PollAdmin() {
  const toast = useUIStore(s => s.toast);
  const qc = useQueryClient();
  const [channelInput, setChannelInput] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [anonymous, setAnonymous] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['poll-status'], queryFn: () => api.get('/api/admin/poll/status').then(r=>r.data),
  });

  const setChannelMut = useMutation({
    mutationFn: () => api.post('/api/admin/poll/channel', { channel_id: channelInput }).then(r=>r.data),
    onSuccess: () => { hapticNotif('success'); toast('✅ کانال تنظیم شد','success'); setChannelInput(''); qc.invalidateQueries({queryKey:['poll-status']}); },
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/api/admin/poll', { question, options: options.filter(o=>o.trim()), anonymous }).then(r=>r.data),
    onSuccess: () => { hapticNotif('success'); toast('✅ نظرسنجی ارسال شد','success'); setQuestion(''); setOptions(['','']); },
    onError: (e) => toast(e.response?.data?.detail||'خطا','error'),
  });

  const validOptions = options.filter(o => o.trim()).length;

  return (
    <>
      <Header title="📊 نظرسنجی کانال" />
      <div className="page fade-up">
        {isLoading ? <SkeletonCard /> : !status?.configured ? (
          <div className="card" style={{ marginBottom:14 }}>
            <div className="sec-title">⚠️ کانال تنظیم نشده</div>
            <div style={{ fontSize:12,color:'var(--txm)',lineHeight:1.9,marginBottom:10 }}>
              ۱. یک کانال تلگرام بساز<br/>۲. ربات رو ادمین کانال کن<br/>۳. آیدی کانال رو اینجا وارد کن (مثل <code>@mychannel</code> یا <code>-100xxxx</code>)
            </div>
            <input className="inp" style={{ marginBottom:10 }} placeholder="@channel_username یا -100..." value={channelInput} onChange={e=>setChannelInput(e.target.value)} />
            <button className="btn btn-p btn-full" disabled={!channelInput.trim()||setChannelMut.isPending} onClick={() => setChannelMut.mutate()}>
              {setChannelMut.isPending ? <Spinner size={14}/> : '💾 ذخیره کانال'}
            </button>
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom:14,borderColor:'rgba(16,185,129,.25)' }}>
              <div style={{ fontSize:12,color:'var(--ok)' }}>✅ کانال متصل: <code>{status.channel_id}</code></div>
            </div>

            <div className="card" style={{ marginBottom:14 }}>
              <div className="sec-title">❓ سوال نظرسنجی</div>
              <input className="inp" style={{ marginBottom:12 }} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="مثلاً: کدوم روز برای کلاس جبرانی بهتره؟" />

              <div style={{ fontSize:11,color:'var(--txm)',marginBottom:6 }}>گزینه‌ها</div>
              {options.map((o, i) => (
                <div key={i} style={{ display:'flex',gap:6,marginBottom:7 }}>
                  <input className="inp" style={{ flex:1 }} value={o} placeholder={`گزینه ${i+1}`}
                    onChange={e => setOptions(prev => prev.map((x,xi)=>xi===i?e.target.value:x))} />
                  {options.length > 2 && (
                    <button onClick={() => setOptions(prev => prev.filter((_,xi)=>xi!==i))} style={{ background:'none',border:'none',color:'var(--err)',fontSize:16,cursor:'pointer' }}>✕</button>
                  )}
                </div>
              ))}
              {options.length < 10 && (
                <button className="btn btn-dark btn-full" style={{ marginBottom:12 }} onClick={() => setOptions(prev => [...prev, ''])}>➕ افزودن گزینه</button>
              )}

              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
                <span style={{ fontSize:12.5 }}>🔒 نظرسنجی ناشناس</span>
                <button onClick={() => { haptic(); setAnonymous(!anonymous); }}
                  style={{ width:42,height:24,borderRadius:12,border:'none',cursor:'pointer',background:anonymous?'var(--acc)':'var(--bd)',position:'relative' }}>
                  <div style={{ width:18,height:18,borderRadius:9,background:'#fff',position:'absolute',top:3,[anonymous?'right':'left']:3,transition:'.2s' }} />
                </button>
              </div>

              <button className="btn btn-p btn-full" disabled={!question.trim()||validOptions<2||createMut.isPending} onClick={() => createMut.mutate()}>
                {createMut.isPending ? <Spinner size={16}/> : '📤 ارسال نظرسنجی به کانال'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   🔔 مدیریت اعلان‌ها
   ═══════════════════════════════════════════ */
export function NotificationsAdmin() {
  const toast = useUIStore(s => s.toast);
  const qc = useQueryClient();

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['notif-settings'], queryFn: () => api.get('/api/admin/notifications/settings').then(r=>r.data),
  });
  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['notif-history'], queryFn: () => api.get('/api/admin/notifications/history').then(r=>r.data.runs),
  });

  const updateInterval = useMutation({
    mutationFn: (hours) => api.post('/api/admin/notifications/settings', { interval_hours: hours }).then(r=>r.data),
    onSuccess: () => { hapticNotif('success'); toast('✅ فاصله‌ی اعلان به‌روزرسانی شد','success'); qc.invalidateQueries({queryKey:['notif-settings']}); },
  });

  const retryMut = useMutation({
    mutationFn: (runId) => api.post(`/api/admin/notifications/history/${runId}/retry`).then(r=>r.data),
    onSuccess: (d) => { hapticNotif('success'); toast(`🔁 ${d.requeued} پیام دوباره در صف قرار گرفت`,'success'); qc.invalidateQueries({queryKey:['notif-history']}); },
    onError: (e) => toast(e.response?.data?.detail||'خطا','error'),
  });

  const STATUS_COLOR = { completed:'b-grn', running:'b-acc', failed:'b-red' };

  return (
    <>
      <Header title="🔔 مدیریت اعلان‌ها" />
      <div className="page fade-up">
        <div className="card" style={{ marginBottom:14 }}>
          <div className="sec-title">⏱ فاصله‌ی اعلان منابع جدید</div>
          {loadingSettings ? <Spinner size={14}/> : (
            <>
              <div style={{ display:'flex',gap:7,marginBottom:10 }}>
                {[24,48,72].map(h => (
                  <button key={h} onClick={() => updateInterval.mutate(h)} disabled={updateInterval.isPending}
                    style={{ flex:1,padding:'9px 4px',borderRadius:'var(--r-md)',fontSize:12.5,fontFamily:'var(--font)',cursor:'pointer',border:`1px solid ${settings?.interval_hours===h?'var(--acc)':'var(--bd)'}`,background:settings?.interval_hours===h?'var(--acc-glow)':'var(--elev)',color:settings?.interval_hours===h?'var(--acc)':'var(--tx2)' }}>{h} ساعت</button>
                ))}
              </div>
              <div style={{ fontSize:11,color:'var(--txm)' }}>
                {settings?.last_sent ? `آخرین ارسال: ${settings.last_sent}` : 'هنوز ارسالی ثبت نشده'}
                {settings?.last_error && <div style={{ color:'var(--err)',marginTop:4 }}>⚠️ آخرین خطا: {settings.last_error}</div>}
              </div>
            </>
          )}
        </div>

        <div className="sec-title">📜 تاریخچه‌ی اجراهای اعلان</div>
        {loadingHistory ? <SkeletonCard /> : !history?.length ? (
          <div className="empty"><div style={{ fontSize:36,marginBottom:10 }}>🔔</div><div>هنوز job ای اجرا نشده</div></div>
        ) : history.map(r => (
          <div key={r.id} className="card" style={{ marginBottom:9 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
              <span style={{ fontWeight:700,fontSize:13 }}>{r.job_name}</span>
              <span className={`badge ${STATUS_COLOR[r.status]||'b-gray'}`}>{r.status}</span>
            </div>
            <div style={{ fontSize:11,color:'var(--txm)',marginBottom:8 }}>{r.started_at?.slice(0,16).replace('T',' ')}</div>
            <div style={{ display:'flex',gap:6,marginBottom:r.failed>0?9:0 }}>
              <span className="badge b-grn">✅ {r.sent}</span>
              {r.failed > 0 && <span className="badge b-red">❌ {r.failed}</span>}
              <span className="badge b-gray">Σ {r.total}</span>
            </div>
            {r.failed > 0 && (
              <button className="btn btn-dark btn-full" disabled={retryMut.isPending} onClick={() => retryMut.mutate(r.id)}>
                {retryMut.isPending ? <Spinner size={14}/> : `🔁 تلاش مجدد برای ${r.failed} مورد ناموفق`}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
