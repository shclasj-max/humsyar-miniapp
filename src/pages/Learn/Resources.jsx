import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

const FILE_ICON  = { pdf:'📄', video:'🎬', voice:'🎙️', ppt:'📊', note:'📝', test:'🧪' };
const FILE_COLOR = { pdf:'#EF4444', video:'#8B5CF6', voice:'#10B981', ppt:'#F59E0B', note:'#3B82F6', test:'#06B6D4' };

function Crumb({ parts, onNav }) {
  if (!parts.length) return null;
  return (
    <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:13,flexWrap:'wrap' }}>
      <button onClick={() => onNav(-1)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--acc)',fontSize:12,padding:0,fontFamily:'var(--font)' }}>📚 منابع</button>
      {parts.map((p, i) => (
        <span key={i} style={{ display:'flex',alignItems:'center',gap:4 }}>
          <span style={{ color:'var(--txm)',fontSize:12 }}>←</span>
          <button onClick={() => onNav(i)} style={{ background:'none',border:'none',cursor:i<parts.length-1?'pointer':'default',color:i<parts.length-1?'var(--acc)':'var(--tx)',fontSize:12,fontWeight:i===parts.length-1?700:400,padding:0,fontFamily:'var(--font)' }}>
            {p}
          </button>
        </span>
      ))}
    </div>
  );
}

export default function Resources() {
  const [level, setLevel]   = useState('terms');   // terms | lessons | sessions | files
  const [termName, setTerm] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [session, setSess]  = useState(null);
  const [search, setSearch] = useState('');
  const [dlLoading, setDl]  = useState(null);
  const toast = useUIStore(s => s.toast);

  const { data: termsData }   = useQuery({ queryKey:['terms'],               queryFn:() => api.get('/api/resources/terms').then(r=>r.data.terms),                             staleTime:1000*60*10, enabled:level==='terms' });
  const { data: lessonsData } = useQuery({ queryKey:['lessons-res',termName], queryFn:() => api.get(`/api/resources/lessons/${encodeURIComponent(termName)}`).then(r=>r.data.lessons), staleTime:1000*60*10, enabled:level==='lessons' });
  const { data: sessionsData }= useQuery({ queryKey:['sessions',lesson?._id], queryFn:() => api.get(`/api/resources/sessions/${lesson._id}`).then(r=>r.data.sessions),         staleTime:1000*60*5,  enabled:level==='sessions' });
  const { data: filesData }   = useQuery({ queryKey:['files',session?._id],   queryFn:() => api.get(`/api/resources/files/${session._id}`).then(r=>r.data.files),             staleTime:1000*60*5,  enabled:level==='files' });
  const { data: searchData }  = useQuery({ queryKey:['search-res',search],    queryFn:() => api.get(`/api/resources/search?q=${encodeURIComponent(search)}`).then(r=>r.data.results), staleTime:1000*30, enabled:search.length>=2 });

  function navBack(idx) {
    haptic();
    if (idx === -1) { setLevel('terms'); setTerm(null); setLesson(null); setSess(null); }
    else if (idx === 0) { setLevel('lessons'); setLesson(null); setSess(null); }
    else if (idx === 1) { setLevel('sessions'); setSess(null); }
  }

  const crumbParts = level === 'terms' ? [] : level === 'lessons' ? [termName] : level === 'sessions' ? [termName, lesson?.name] : [termName, lesson?.name, session?.topic];

  const headerTitle = level==='files' ? session?.topic : level==='sessions' ? lesson?.name : level==='lessons' ? termName : 'منابع علوم پایه';

  async function downloadFile(fileId) {
    setDl(fileId);
    try {
      await api.post(`/api/resources/download/${fileId}`);
      toast('فایل تا چند لحظه از ربات ارسال می‌شود 📱', 'success', 3500);
    } catch { toast('خطا در دانلود', 'error'); }
    finally { setDl(null); }
  }

  return (
    <>
      <Header title={headerTitle} />
      <div className="page fade-up">
        <input className="inp" placeholder="🔍 جستجو در منابع..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom:12 }} />
        <Crumb parts={crumbParts} onNav={navBack} />

        {/* حالت جستجو */}
        {search.length >= 2 ? (
          !searchData ? <SkeletonCard /> : !searchData.length ? (
            <div className="empty"><div style={{ fontSize:36,marginBottom:10 }}>🔍</div><div>نتیجه‌ای پیدا نشد</div></div>
          ) : searchData.map(r => (
            <div key={r.id} className="card" style={{ marginBottom:8 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontSize:20 }}>{FILE_ICON[r.type]||'📎'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600,fontSize:13 }}>{r.name}</div>
                  <div style={{ fontSize:11,color:'var(--txm)' }}>{r.lesson} • {r.session}</div>
                </div>
                <button onClick={() => downloadFile(r.id)} className="btn btn-g" style={{ fontSize:11,padding:'5px 10px' }}>
                  {dlLoading===r.id ? <Spinner size={12} /> : '⬇️'}
                </button>
              </div>
            </div>
          ))
        ) : level === 'terms' ? (
          !termsData ? <SkeletonCard /> : (
            <div className="grid2">
              {termsData.map(t => (
                <button key={t.name} onClick={() => { haptic(); setTerm(t.name); setLevel('lessons'); }}
                  style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',padding:'14px 8px',textAlign:'center',cursor:'pointer' }}>
                  <div style={{ fontSize:28,marginBottom:6 }}>📂</div>
                  <div style={{ fontWeight:700,fontSize:13 }}>{t.name}</div>
                  <div style={{ fontSize:10,color:'var(--txm)',marginTop:2 }}>{t.lesson_count} درس</div>
                </button>
              ))}
            </div>
          )
        ) : level === 'lessons' ? (
          !lessonsData ? <SkeletonCard /> : (
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {lessonsData.map(l => (
                <button key={l._id} onClick={() => { haptic(); setLesson(l); setLevel('sessions'); }}
                  style={{ display:'flex',alignItems:'center',gap:12,padding:14,background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',cursor:'pointer',textAlign:'right',width:'100%' }}>
                  <span style={{ fontSize:24 }}>📖</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:13.5 }}>{l.name}</div>
                    {l.teacher && <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>استاد: {l.teacher}</div>}
                  </div>
                  <span className="badge b-acc">{l.session_count} جلسه</span>
                </button>
              ))}
            </div>
          )
        ) : level === 'sessions' ? (
          !sessionsData ? <SkeletonCard /> : (
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {sessionsData.map(s => (
                <button key={s._id} onClick={() => { haptic(); setSess(s); setLevel('files'); }}
                  style={{ display:'flex',alignItems:'center',gap:12,padding:14,background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',cursor:'pointer',textAlign:'right',width:'100%' }}>
                  <div style={{ width:38,height:38,borderRadius:'var(--r-md)',background:'var(--acc-soft)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'var(--acc)',flexShrink:0 }}>{s.number}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:13.5 }}>{s.topic}</div>
                  </div>
                  <span className="badge b-acc">{s.file_count} فایل</span>
                </button>
              ))}
            </div>
          )
        ) : level === 'files' ? (
          !filesData ? <SkeletonCard /> : (
            <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
              {filesData.map(f => {
                const ic = FILE_ICON[f.type] || '📎';
                const fc = FILE_COLOR[f.type] || 'var(--acc)';
                return (
                  <div key={f.id} className="card">
                    <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                      <div style={{ width:46,height:46,borderRadius:'var(--r-md)',background:fc+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>{ic}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:700,fontSize:13 }}>{f.name}</div>
                        {f.description && <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>{f.description}</div>}
                        <div style={{ fontSize:10,color:'var(--txm)',marginTop:3 }}>📥 {f.downloads} دانلود</div>
                      </div>
                      <button onClick={() => downloadFile(f.id)} className="btn btn-g" style={{ fontSize:11,padding:'6px 11px',flexShrink:0 }}>
                        {dlLoading===f.id ? <Spinner size={14} /> : '⬇️ دانلود'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : null}
      </div>
    </>
  );
}
