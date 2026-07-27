import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import QuestionCard from '../../components/shared/QuestionCard';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic, hapticNotif } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

/* ── Explanation ── */
function Explanation({ data, onNext, nextLabel = 'سوال بعدی ←' }) {
  return (
    <div className="card fade-up" style={{ marginBottom:12,borderColor:data.is_correct?'var(--ok)':'var(--err)' }}>
      <div style={{ fontWeight:700,fontSize:15,color:data.is_correct?'var(--ok)':'var(--err)',marginBottom:data.explanation?8:0 }}>
        {data.is_correct ? '✅ آفرین! جواب درسته' : '❌ اشتباه بود'}
      </div>
      {data.explanation && <div style={{ fontSize:13,lineHeight:1.7,color:'var(--tx2)',marginBottom:12 }}>{data.explanation}</div>}
      <button className="btn btn-p btn-full" onClick={() => { haptic(); onNext(); }}>{nextLabel}</button>
    </div>
  );
}

/* ── آزمون سفارشی ── */
function CustomExam({ onExit }) {
  const [step, setStep] = useState(1);
  const [cfg, setCfg]   = useState({ lesson:'', topic:'همه', count:10, minutes:20 });
  const [session, setSess] = useState(null);
  const [question, setQ]  = useState(null);
  const [answered, setAns] = useState(null);
  const [progress, setProg] = useState(0);
  const [finished, setFin] = useState(null);
  const [loading, setLoad] = useState(false);
  const toast = useUIStore(s => s.toast);

  const { data: lessonsData } = useQuery({ queryKey:['lessons'], queryFn:() => api.get('/api/questions/lessons').then(r=>r.data.lessons), staleTime:1000*60*10 });
  const { data: topicsData  } = useQuery({ queryKey:['topics',cfg.lesson], queryFn:() => api.get(`/api/questions/topics/${encodeURIComponent(cfg.lesson)}`).then(r=>r.data.topics), enabled:!!cfg.lesson&&step===2, staleTime:1000*60*10 });

  async function fetchNext(sid) {
    setQ(null); setAns(null);
    const res = await api.get(`/api/questions/custom-exam/${sid}/next`);
    if (res.data.finished) { setFin(res.data); } else { setQ(res.data.question); setProg(res.data.progress); }
  }

  async function startExam() {
    setLoad(true);
    try {
      const res = await api.post('/api/questions/custom-exam/start', { lesson:cfg.lesson, topic:cfg.topic==='همه'?null:cfg.topic, count:cfg.count, minutes:cfg.minutes });
      setSess(res.data); setStep(5); fetchNext(res.data.session_id);
    } catch (err) { toast(err.response?.data?.detail||'خطا','error'); }
    finally { setLoad(false); }
  }

  async function handleAnswer(_, selected) {
    const res = await api.post(`/api/questions/custom-exam/${session.session_id}/answer`, { selected });
    setAns(res.data);
    hapticNotif(res.data.is_correct?'success':'error');
  }

  if (finished) return (
    <div className="page fade-up">
      <div className="card card-glow" style={{ textAlign:'center',padding:26 }}>
        <div style={{ fontSize:48,marginBottom:12 }}>{finished.percentage>=70?'🎉':finished.percentage>=40?'💪':'📚'}</div>
        <div style={{ fontSize:26,fontWeight:800,color:'var(--acc)' }}>{finished.percentage}٪</div>
        <div style={{ color:'var(--txm)',marginTop:4 }}>نتیجه آزمون</div>
        <div className="grid2" style={{ marginTop:18 }}>
          <div className="card" style={{ textAlign:'center' }}><div style={{ fontSize:20,fontWeight:800,color:'var(--ok)' }}>{finished.correct}</div><div style={{ fontSize:11,color:'var(--txm)' }}>صحیح</div></div>
          <div className="card" style={{ textAlign:'center' }}><div style={{ fontSize:20,fontWeight:800,color:'var(--err)' }}>{finished.answered-finished.correct}</div><div style={{ fontSize:11,color:'var(--txm)' }}>اشتباه</div></div>
        </div>
        <button className="btn btn-p btn-full" style={{ marginTop:18 }} onClick={onExit}>بازگشت</button>
      </div>
    </div>
  );

  if (step === 5) return (
    <div className="page fade-up">
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
        <span style={{ fontSize:12,color:'var(--txm)' }}>سوال {progress} از {session?.total}</span>
        {session?.ends_at && <div style={{ background:'var(--acc-soft)',color:'var(--acc)',padding:'3px 10px',borderRadius:999,fontSize:12,fontWeight:700 }}>⏱ {cfg.minutes} دقیقه</div>}
      </div>
      {!question ? <div style={{ textAlign:'center',padding:40 }}><Spinner size={32} /></div> : (
        <>
          <QuestionCard question={question} answered={answered} onAnswer={handleAnswer} showReport={false} />
          {answered && <Explanation data={answered} onNext={() => fetchNext(session.session_id)} nextLabel={progress >= session.total ? 'مشاهده نتیجه 🏁' : 'سوال بعدی ←'} />}
        </>
      )}
    </div>
  );

  const stepTitles = ['','درس را انتخاب کنید','مبحث را انتخاب کنید','تعداد سوالات','زمان آزمون'];
  return (
    <div className="page fade-up">
      <div style={{ display:'flex',gap:4,marginBottom:10 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ flex:1,height:4,borderRadius:999,background:i<=step?'var(--acc)':'var(--ovr)' }} />)}
      </div>
      <div style={{ fontSize:11,color:'var(--txm)',marginBottom:3 }}>گام {step} از ۴</div>
      <div style={{ fontWeight:700,fontSize:15,marginBottom:14 }}>{stepTitles[step]}</div>

      {step===1 && (!lessonsData ? <SkeletonCard /> : (
        <div className="grid2">
          {lessonsData.map(l => (
            <button key={l.name} onClick={() => { haptic(); setCfg(c=>({...c,lesson:l.name})); setStep(2); }}
              style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',padding:'13px 7px',textAlign:'center',cursor:'pointer' }}>
              <div style={{ fontSize:24,marginBottom:5 }}>📖</div>
              <div style={{ fontWeight:700,fontSize:11.5 }}>{l.name}</div>
              <div style={{ fontSize:10,color:'var(--txm)',marginTop:2 }}>{l.count} سوال</div>
            </button>
          ))}
        </div>
      ))}

      {step===2 && (
        <>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <button onClick={() => { haptic(); setCfg(c=>({...c,topic:'همه'})); setStep(3); }} style={{ textAlign:'right',padding:'11px 13px',borderRadius:'var(--r-md)',border:'1px solid var(--bd)',background:'var(--surf)',color:'var(--tx)',fontFamily:'var(--font)',fontSize:13,cursor:'pointer' }}>📂 همه مباحث</button>
            {topicsData?.map(t => (
              <button key={t.name} onClick={() => { haptic(); setCfg(c=>({...c,topic:t.name})); setStep(3); }} style={{ textAlign:'right',padding:'11px 13px',borderRadius:'var(--r-md)',border:'1px solid var(--bd)',background:'var(--surf)',color:'var(--tx)',fontFamily:'var(--font)',fontSize:13,cursor:'pointer',display:'flex',justifyContent:'space-between' }}>
                <span>📌 {t.name}</span><span className="badge b-acc">{t.count}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-dark btn-full" style={{ marginTop:12 }} onClick={() => setStep(1)}>← بازگشت</button>
        </>
      )}

      {step===3 && (
        <>
          <div className="grid2" style={{ marginBottom:14 }}>
            {[5,10,15,20,30,40].map(n => (
              <button key={n} onClick={() => { haptic(); setCfg(c=>({...c,count:n})); }} style={{ padding:'13px 8px',borderRadius:'var(--r-lg)',textAlign:'center',border:`1px solid ${cfg.count===n?'var(--acc)':'var(--bd)'}`,background:cfg.count===n?'var(--acc-glow)':'var(--surf)',cursor:'pointer' }}>
                <div style={{ fontSize:18,fontWeight:800,color:cfg.count===n?'var(--acc)':'var(--tx)' }}>{n}</div>
                <div style={{ fontSize:10,color:'var(--txm)' }}>سوال</div>
              </button>
            ))}
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <button className="btn btn-dark" style={{ flex:1 }} onClick={() => setStep(2)}>← بازگشت</button>
            <button className="btn btn-p" style={{ flex:2 }} onClick={() => setStep(4)}>ادامه ←</button>
          </div>
        </>
      )}

      {step===4 && (
        <>
          <div style={{ display:'flex',flexDirection:'column',gap:7,marginBottom:14 }}>
            {[{l:'بدون محدودیت ⏳',v:0},{l:'۱۰ دقیقه ⏱',v:10},{l:'۲۰ دقیقه ⏱',v:20},{l:'۳۰ دقیقه ⏱',v:30},{l:'۶۰ دقیقه ⏱',v:60},{l:'۹۰ دقیقه ⏱',v:90}].map(t => (
              <button key={t.v} onClick={() => { haptic(); setCfg(c=>({...c,minutes:t.v})); }} style={{ textAlign:'right',padding:'10px 13px',borderRadius:'var(--r-md)',border:`1px solid ${cfg.minutes===t.v?'var(--acc)':'var(--bd)'}`,background:cfg.minutes===t.v?'var(--acc-glow)':'var(--surf)',color:cfg.minutes===t.v?'var(--acc)':'var(--tx)',fontFamily:'var(--font)',fontSize:13,cursor:'pointer' }}>
                {t.l}
              </button>
            ))}
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <button className="btn btn-dark" style={{ flex:1 }} onClick={() => setStep(3)}>← بازگشت</button>
            <button className="btn btn-p" style={{ flex:2 }} onClick={startExam} disabled={loading}>
              {loading ? <Spinner size={16} /> : '🚀 شروع آزمون'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── طراحی سوال ── */
function DesignQuestion({ onBack }) {
  const [lesson, setLesson]   = useState('');
  const [topic, setTopic]     = useState('');
  const [question, setQ]      = useState('');
  const [options, setOpts]    = useState(['','','','']);
  const [correct, setCorrect] = useState(0);
  const [explanation, setExpl] = useState('');
  const [difficulty, setDiff] = useState('متوسط 🟡');
  const toast = useUIStore(s => s.toast);

  const { data: lessonsData } = useQuery({ queryKey:['lessons'], queryFn:() => api.get('/api/questions/lessons').then(r=>r.data.lessons), staleTime:1000*60*10 });
  const { data: topicsData  } = useQuery({ queryKey:['topics',lesson], queryFn:() => api.get(`/api/questions/topics/${encodeURIComponent(lesson)}`).then(r=>r.data.topics), enabled:!!lesson, staleTime:1000*60*10 });

  const submitMutation = useMutation({
    mutationFn: () => api.post('/api/questions/design', { lesson,topic,question,options,correct,explanation,difficulty }).then(r=>r.data),
    onSuccess: (data) => { hapticNotif('success'); toast(data.message,'success',4000); onBack(); },
    onError: (err) => { hapticNotif('error'); toast(err.response?.data?.detail||'خطا','error'); },
  });

  const isValid = lesson && topic && question.trim().length >= 10 && options.every(o => o.trim());
  const LETTERS = ['الف','ب','ج','د'];
  const DIFFS = [['آسان 🟢','🟢 آسان'],['متوسط 🟡','🟡 متوسط'],['سخت 🔴','🔴 سخت']];

  return (
    <div className="page fade-up">
      <button onClick={onBack} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--acc)',fontSize:13,marginBottom:12,padding:0 }}>← بازگشت</button>
      <div style={{ background:'var(--acc-soft)',border:'1px solid var(--bdg)',borderRadius:'var(--r-md)',padding:'10px 12px',marginBottom:14,fontSize:12,color:'var(--tx2)',lineHeight:1.7 }}>
        ✏️ سوال شما پس از تأیید ادمین محتوا در بانک سوال قرار می‌گیرد.
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,color:'var(--txm)',marginBottom:6 }}>درس</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
          {lessonsData?.map(l => (
            <button key={l.name} onClick={() => { haptic(); setLesson(l.name); setTopic(''); }}
              style={{ padding:'5px 11px',borderRadius:999,fontSize:11,fontFamily:'var(--font)',border:`1px solid ${lesson===l.name?'var(--acc)':'var(--bd)'}`,background:lesson===l.name?'var(--acc-glow)':'var(--elev)',color:lesson===l.name?'var(--acc)':'var(--tx2)',cursor:'pointer' }}>
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {lesson && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11,color:'var(--txm)',marginBottom:6 }}>مبحث</div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
            {topicsData?.map(t => (
              <button key={t.name} onClick={() => { haptic(); setTopic(t.name); }}
                style={{ padding:'5px 11px',borderRadius:999,fontSize:11,fontFamily:'var(--font)',border:`1px solid ${topic===t.name?'var(--acc)':'var(--bd)'}`,background:topic===t.name?'var(--acc-glow)':'var(--elev)',color:topic===t.name?'var(--acc)':'var(--tx2)',cursor:'pointer' }}>
                {t.name}
              </button>
            ))}
            <input className="inp" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="یا مبحث جدید بنویس..." style={{ flex:'1 1 140px',minWidth:140 }} />
          </div>
        </div>
      )}

      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,color:'var(--txm)',marginBottom:5 }}>متن سوال</div>
        <textarea className="inp" rows={3} value={question} onChange={e=>setQ(e.target.value)} placeholder="سوال را بنویسید (حداقل ۱۰ کاراکتر)..." style={{ resize:'vertical',lineHeight:1.6 }} />
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,color:'var(--txm)',marginBottom:6 }}>گزینه‌ها (روی حرف بزنید = جواب صحیح)</div>
        {options.map((opt, idx) => (
          <div key={idx} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7 }}>
            <button onClick={() => { haptic(); setCorrect(idx); }} style={{ width:32,height:32,borderRadius:'50%',border:`2px solid ${correct===idx?'var(--ok)':'var(--bd)'}`,background:correct===idx?'rgba(16,185,129,.12)':'var(--elev)',color:correct===idx?'var(--ok)':'var(--txm)',fontWeight:700,cursor:'pointer',flexShrink:0,fontSize:12,fontFamily:'var(--font)' }}>
              {LETTERS[idx]}
            </button>
            <input className="inp" value={opt} onChange={e => setOpts(prev => prev.map((o,i) => i===idx?e.target.value:o))} placeholder={`گزینه ${LETTERS[idx]}`} style={{ flex:1 }} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,color:'var(--txm)',marginBottom:6 }}>سطح سختی</div>
        <div style={{ display:'flex',gap:7 }}>
          {DIFFS.map(([v,l]) => (
            <button key={v} onClick={() => { haptic(); setDiff(v); }} style={{ flex:1,padding:'8px 4px',borderRadius:'var(--r-md)',fontSize:11,fontFamily:'var(--font)',cursor:'pointer',border:`1px solid ${difficulty===v?'var(--acc)':'var(--bd)'}`,background:difficulty===v?'var(--acc-glow)':'var(--elev)',color:difficulty===v?'var(--acc)':'var(--tx2)' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:11,color:'var(--txm)',marginBottom:5 }}>توضیح پاسخ (اختیاری)</div>
        <textarea className="inp" rows={2} value={explanation} onChange={e=>setExpl(e.target.value)} placeholder="چرا این گزینه صحیح است؟" style={{ resize:'vertical',lineHeight:1.6 }} />
      </div>

      <button className="btn btn-p btn-full" disabled={!isValid || submitMutation.isPending} onClick={() => submitMutation.mutate()}>
        {submitMutation.isPending ? <Spinner size={16} /> : '📨 ثبت سوال'}
      </button>
    </div>
  );
}

/* ── Main Questions Page ── */
export default function Questions() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initMode = searchParams.get('mode') || 'menu';

  const [view, setView]       = useState(initMode === 'exam' || initMode === 'design' ? initMode : initMode !== 'menu' ? 'practice' : 'menu');
  const [practiceMode, setPM] = useState(initMode !== 'menu' && initMode !== 'exam' && initMode !== 'design' ? initMode : 'lesson');
  const [selectedLesson, setSL] = useState(null);
  const [question, setQ]      = useState(null);
  const [answered, setAns]    = useState(null);
  const [exclude, setExclude] = useState([]);
  const [qCount, setCount]    = useState(0);
  const [qCorrect, setCorrect] = useState(0);
  const toast = useUIStore(s => s.toast);

  const { data: lessonsData } = useQuery({ queryKey:['lessons'], queryFn:() => api.get('/api/questions/lessons').then(r=>r.data.lessons), staleTime:1000*60*10 });

  const fetchQ = useCallback(async (mode, lesson, excl) => {
    setQ(null); setAns(null);
    try {
      let url = mode==='weak' ? '/api/questions/weak' : mode==='hard' ? `/api/questions/hard?exclude=${excl.join(',')}` : `/api/questions/practice?${lesson?`lesson=${encodeURIComponent(lesson)}&`:''}exclude=${excl.join(',')}`;
      const res = await api.get(url);
      if (!res.data.question) { toast('سوال بیشتری نداریم 🎉','success'); setView('menu'); return; }
      setQ(res.data.question);
    } catch { toast('خطا','error'); }
  }, []);

  const answerMutation = useMutation({
    mutationFn: ({ question_id, selected }) => api.post('/api/questions/answer', { question_id, selected }).then(r=>r.data),
    onSuccess: (data) => {
      setAns(data); setCount(c=>c+1);
      if (data.is_correct) { setCorrect(c=>c+1); hapticNotif('success'); } else hapticNotif('error');
    },
    onError: () => toast('خطا در ثبت','error'),
  });

  function startPractice(mode, lesson=null) {
    setPM(mode); setSL(lesson); setView('practice'); setExclude([]); setCount(0); setCorrect(0);
    fetchQ(mode, lesson, []);
  }

  function nextQ() {
    const newExcl = question ? [...exclude, question.id] : exclude;
    setExclude(newExcl); fetchQ(practiceMode, selectedLesson, newExcl);
  }

  function backToMenu() { haptic(); setView('menu'); setQ(null); setAns(null); }

  if (view === 'exam')   return (<><Header title="آزمون سفارشی" right={<button className="btn btn-dark" style={{ fontSize:11,padding:'5px 10px' }} onClick={backToMenu}>بازگشت</button>} /><CustomExam onExit={backToMenu} /></>);
  if (view === 'design') return (<><Header title="✏️ طراحی سوال" right={<button className="btn btn-dark" style={{ fontSize:11,padding:'5px 10px' }} onClick={backToMenu}>بازگشت</button>} /><DesignQuestion onBack={backToMenu} /></>);

  const modeLabel = practiceMode==='weak'?'⚡ نقاط ضعف':practiceMode==='hard'?'🔴 سطح سخت':selectedLesson||'تمرین آزاد';

  return (
    <>
      <Header
        title={view==='practice' ? modeLabel : 'بانک سوال'}
        subtitle={view==='practice' ? `${qCorrect}/${qCount} صحیح` : undefined}
        right={view==='practice' ? <button className="btn btn-dark" style={{ fontSize:11,padding:'5px 10px' }} onClick={backToMenu}>بازگشت</button> : undefined}
      />
      <div className="page fade-up">
        {view === 'menu' && (
          <>
            <div style={{ display:'flex',flexDirection:'column',gap:9,marginBottom:14 }}>
              {[
                ['⚡','تمرین هوشمند','سوال از نقاط ضعف شما','var(--bdg)','var(--acc-soft)',()=>startPractice('weak')],
                ['🔴','سطح سخت','چالشی‌ترین سوالات','rgba(239,68,68,.28)','rgba(239,68,68,.06)',()=>startPractice('hard')],
                ['📝','آزمون سفارشی','تعداد و زمان دلخواه + تایمر','var(--bd)','var(--surf)',()=>setView('exam')],
              ].map(([ic,t,d,bd,bg,fn]) => (
                <button key={t} onClick={fn} style={{ display:'flex',alignItems:'center',gap:12,padding:14,background:bg,border:`1px solid ${bd}`,borderRadius:'var(--r-lg)',cursor:'pointer',textAlign:'right',width:'100%' }}>
                  <span style={{ fontSize:26 }}>{ic}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:14 }}>{t}</div>
                    <div style={{ fontSize:12,color:'var(--txm)' }}>{d}</div>
                  </div>
                  <span style={{ color:'var(--txm)' }}>←</span>
                </button>
              ))}
            </div>
            <div className="sec-title">انتخاب درس برای تمرین آزاد</div>
            {!lessonsData ? <SkeletonCard /> : (
              <div className="grid2">
                {lessonsData.map(l => (
                  <button key={l.name} onClick={() => startPractice('lesson', l.name)} style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',padding:'13px 7px',textAlign:'center',cursor:'pointer' }}>
                    <div style={{ fontSize:24,marginBottom:5 }}>📖</div>
                    <div style={{ fontWeight:700,fontSize:12 }}>{l.name}</div>
                    <div style={{ fontSize:10,color:'var(--txm)',marginTop:2 }}>{l.count} سوال</div>
                  </button>
                ))}
              </div>
            )}
            <div className="divider" />
            <div style={{ display:'flex',gap:8 }}>
              <button className="btn btn-g" style={{ flex:1 }} onClick={() => setView('design')}>✏️ طراحی سوال</button>
              <button className="btn btn-g" style={{ flex:1 }} onClick={() => toast('فایل از ربات ارسال می‌شود 📱','info')}>📄 PDF</button>
            </div>
          </>
        )}

        {view === 'practice' && (
          <>
            {!question && !answered && <div style={{ textAlign:'center',padding:40 }}><Spinner size={32} /></div>}
            {question && (
              <QuestionCard question={question} answered={answered}
                onAnswer={(qid, sel) => answerMutation.mutate({ question_id:qid, selected:sel })}
                showReport={!!answered}
                onReport={() => navigate(`/me/reports?type=question&id=${question.id}`)}
              />
            )}
            {answered && <Explanation data={answered} onNext={nextQ} />}
            {qCount > 0 && (
              <div className="card" style={{ display:'flex',justifyContent:'space-around',textAlign:'center' }}>
                {[['🧪',qCount,'کل','var(--acc)'],['✅',qCorrect,'صحیح','var(--ok)'],['❌',qCount-qCorrect,'اشتباه','var(--err)'],['📈',qCount?Math.round(qCorrect/qCount*100):0,'درصد','var(--warn)']].map(([ic,v,l,c]) => (
                  <div key={l}>
                    <div style={{ fontSize:18,fontWeight:800,color:c }}>{v}{l==='درصد'?'٪':''}</div>
                    <div style={{ fontSize:10,color:'var(--txm)' }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
