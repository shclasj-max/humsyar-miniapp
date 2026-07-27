import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic, hapticNotif } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

function WeekChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display:'flex',alignItems:'flex-end',gap:4,height:50 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2 }}>
          <div style={{ width:'100%',borderRadius:3,background:d.count>0?'var(--acc)':'var(--ovr)',height:`${Math.max((d.count/max)*42,d.count>0?5:3)}px`,transition:'height .5s' }} />
          <div style={{ fontSize:8,color:'var(--txm)' }}>{d.date?.slice(-2)||''}</div>
        </div>
      ))}
    </div>
  );
}

function PickerSheet({ title, options, current, onSelect, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <div onClick={e=>e.stopPropagation()} className="fade-up" style={{ width:'100%',maxWidth:480,background:'var(--surf)',borderRadius:'20px 20px 0 0',padding:'18px 14px calc(18px + env(safe-area-inset-bottom))' }}>
        <div style={{ width:34,height:4,background:'var(--bd)',borderRadius:999,margin:'0 auto 14px' }} />
        <div style={{ fontWeight:700,fontSize:15,marginBottom:12 }}>{title}</div>
        {options.map(opt => (
          <button key={opt.value} onClick={() => { haptic(); onSelect(opt.value); onClose(); }}
            style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 6px',background:'none',border:'none',cursor:'pointer',textAlign:'right',borderBottom:`1px solid var(--bd)`,color:current===opt.value?'var(--acc)':'var(--tx)',fontWeight:current===opt.value?700:400,fontFamily:'var(--font)',fontSize:13.5 }}>
            {opt.label}{current===opt.value && <span>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal]   = useState('');
  const [editSid, setEditSid]   = useState(false);
  const [sidVal, setSidVal]     = useState('');
  const [showGroup, setShowGroup]   = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/profile').then(r => r.data),
    staleTime: 1000 * 60 * 3,
  });

  const { data: rankData } = useQuery({
    queryKey: ['rank'],
    queryFn: () => api.get('/api/profile/rank').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: intakesData } = useQuery({
    queryKey: ['intakes'],
    queryFn: () => api.get('/api/profile/intakes').then(r => r.data.intakes),
    staleTime: 1000 * 60 * 30,
    enabled: showIntake,
  });

  const { data: badgesData } = useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/api/profile/badges').then(r => r.data.badges),
    staleTime: 1000 * 60 * 10,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['profile'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['rank'] });
  }

  const updateName = useMutation({
    mutationFn: name => api.patch('/api/profile/name', { name }).then(r => r.data),
    onSuccess: () => { hapticNotif('success'); toast('نام ذخیره شد ✅','success'); setEditName(false); invalidate(); },
    onError: () => { hapticNotif('error'); toast('خطا','error'); },
  });

  const updateSid = useMutation({
    mutationFn: sid => api.patch('/api/profile/student-id', { student_id: sid }).then(r => r.data),
    onSuccess: () => { hapticNotif('success'); toast('شماره ذخیره شد ✅','success'); setEditSid(false); invalidate(); },
    onError: err => { hapticNotif('error'); toast(err.response?.data?.detail||'خطا','error'); },
  });

  const updateGroup = useMutation({
    mutationFn: group => api.patch('/api/profile/group', { group }).then(r => r.data),
    onSuccess: () => { toast('گروه تغییر کرد ✅','success'); invalidate(); },
    onError: () => toast('خطا','error'),
  });

  const updateIntake = useMutation({
    mutationFn: intake => api.patch('/api/profile/intake', { intake }).then(r => r.data),
    onSuccess: () => { toast('ورودی تغییر کرد ✅','success'); invalidate(); },
    onError: () => toast('خطا','error'),
  });

  const user  = data?.user;
  const stats = data?.stats;

  return (
    <>
      <Header title="پروفایل" />

      {showGroup && (
        <PickerSheet title="انتخاب گروه"
          options={[{value:'1',label:'گروه ۱'},{value:'2',label:'گروه ۲'}]}
          current={user?.group} onSelect={v => updateGroup.mutate(v)} onClose={() => setShowGroup(false)} />
      )}
      {showIntake && (
        <PickerSheet title="انتخاب ورودی"
          options={(intakesData||[]).map(i=>({value:i.code,label:i.label}))}
          current={user?.intake} onSelect={v => updateIntake.mutate(v)} onClose={() => setShowIntake(false)} />
      )}

      <div className="page fade-up">
        {isLoading ? (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}><SkeletonCard /><SkeletonCard /></div>
        ) : user && (
          <div style={{ display:'flex',flexDirection:'column',gap:13 }}>

            {/* کارت اصلی */}
            <div className="card card-glow">
              <div style={{ display:'flex',alignItems:'center',gap:13 }}>
                <div className="avatar" style={{ width:52,height:52,fontSize:22 }}>{user.name?.[0]||'؟'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:17 }}>{user.name}</div>
                  <button onClick={() => { haptic(); setSidVal(user.student_id||''); setEditSid(true); }}
                    style={{ background:'none',border:'none',cursor:'pointer',color:'var(--txm)',fontSize:11,padding:0,fontFamily:'var(--font)' }}>
                    شماره دانشجویی: {user.student_id||'—'} ✏️
                  </button>
                  <div style={{ display:'flex',gap:5,marginTop:6,flexWrap:'wrap' }}>
                    <button onClick={() => { haptic(); setShowIntake(true); }}
                      className="badge b-acc" style={{ border:'none',cursor:'pointer',fontFamily:'var(--font)' }}>
                      ورودی {user.intake||'—'} ✏️
                    </button>
                    <button onClick={() => { haptic(); setShowGroup(true); }}
                      className="badge b-acc" style={{ border:'none',cursor:'pointer',fontFamily:'var(--font)' }}>
                      گروه {user.group||'—'} ✏️
                    </button>
                  </div>
                </div>
                <button onClick={() => { haptic(); setNameVal(user.name||''); setEditName(true); }}
                  style={{ background:'none',border:'none',cursor:'pointer',fontSize:18 }}>✏️</button>
              </div>

              {editName && (
                <div style={{ marginTop:14,display:'flex',gap:8 }}>
                  <input className="inp" value={nameVal} onChange={e=>setNameVal(e.target.value)} placeholder="نام جدید" style={{ flex:1 }} autoFocus />
                  <button className="btn btn-p" onClick={() => updateName.mutate(nameVal)} disabled={updateName.isPending||!nameVal.trim()}>
                    {updateName.isPending ? <Spinner size={14} /> : 'ذخیره'}
                  </button>
                  <button className="btn btn-dark" onClick={() => setEditName(false)}>لغو</button>
                </div>
              )}

              {editSid && (
                <div style={{ marginTop:14,display:'flex',gap:8 }}>
                  <input className="inp" value={sidVal} onChange={e=>setSidVal(e.target.value)} placeholder="شماره دانشجویی" inputMode="numeric" style={{ flex:1 }} autoFocus />
                  <button className="btn btn-p" onClick={() => updateSid.mutate(sidVal)} disabled={updateSid.isPending||!sidVal.trim()}>
                    {updateSid.isPending ? <Spinner size={14} /> : 'ذخیره'}
                  </button>
                  <button className="btn btn-dark" onClick={() => setEditSid(false)}>لغو</button>
                </div>
              )}
            </div>

            {/* رتبه */}
            {rankData?.rank && (
              <div className="card" style={{ background:'linear-gradient(135deg,rgba(245,158,11,.08),rgba(59,130,246,.06))',borderColor:'rgba(245,158,11,.25)',display:'flex',alignItems:'center',gap:13 }}>
                <div style={{ fontSize:28 }}>🏅</div>
                <div>
                  <div style={{ fontWeight:800,fontSize:16,color:'var(--warn)' }}>رتبه {rankData.rank} از {rankData.total_users}</div>
                  <div style={{ fontSize:12,color:'var(--txm)' }}>بهتر از {rankData.percentile}٪ دانشجویان</div>
                </div>
              </div>
            )}

            {/* آمار */}
            {stats && (
              <div className="card">
                <div className="sec-title">📊 آمار</div>
                <div style={{ display:'flex',justifyContent:'space-around',marginBottom:13 }}>
                  {[['🧪',stats.total_answers,'سوال','var(--acc)'],['✅',stats.correct_answers,'صحیح','var(--ok)'],['📥',stats.downloads,'دانلود','var(--info)'],['📈',stats.percentage+'٪','موفقیت','var(--warn)']].map(([ic,v,l,c]) => (
                    <div key={l} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:18 }}>{ic}</div>
                      <div style={{ fontSize:17,fontWeight:800,color:c,margin:'2px 0' }}>{v}</div>
                      <div style={{ fontSize:9.5,color:'var(--txm)' }}>{l}</div>
                    </div>
                  ))}
                </div>
                {stats.level && (
                  <div style={{ background:stats.level.color+'15',border:`1px solid ${stats.level.color}40`,borderRadius:'var(--r-md)',padding:'8px 12px',marginBottom:12,display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:20 }}>{stats.level.icon}</span>
                    <div style={{ fontWeight:700,color:stats.level.color,fontSize:14 }}>{stats.level.label}</div>
                    <div style={{ marginRight:'auto',fontSize:11,color:'var(--txm)' }}>سطح کاربری</div>
                  </div>
                )}
                <WeekChart data={stats.weekly_chart} />
                {stats.weak_topics?.length > 0 && (
                  <>
                    <div className="divider" />
                    <div style={{ color:'var(--txm)',fontSize:12,marginBottom:7 }}>⚡ نقاط ضعف</div>
                    <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                      {stats.weak_topics.map(t => <span key={t} className="badge b-red">{t}</span>)}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* بج‌ها */}
            {badgesData && (
              <div className="card">
                <div className="sec-title">🏅 بج‌های پیشرفت</div>
                <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
                  {badgesData.map(b => (
                    <div key={b.id} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4,opacity:b.earned?1:0.3 }}>
                      <div style={{ width:44,height:44,borderRadius:'50%',background:b.earned?'rgba(59,130,246,.14)':'rgba(71,85,105,.1)',border:`2px solid ${b.earned?'rgba(59,130,246,.35)':'var(--bd)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>
                        {b.icon}
                      </div>
                      <div style={{ fontSize:9,color:'var(--tx2)',textAlign:'center' }}>{b.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}
