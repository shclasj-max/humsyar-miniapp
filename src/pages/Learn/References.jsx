import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

export default function References() {
  const [subject, setSubject] = useState(null);
  const [book, setBook]       = useState(null);
  const [dlLoading, setDl]    = useState(null);
  const toast = useUIStore(s => s.toast);

  const { data: subjectsData } = useQuery({ queryKey:['ref-subjects'], queryFn:() => api.get('/api/references/subjects').then(r=>r.data.subjects), staleTime:1000*60*10 });
  const { data: booksData }    = useQuery({ queryKey:['ref-books',subject?.id], queryFn:() => api.get(`/api/references/books/${subject.id}`).then(r=>r.data), staleTime:1000*60*10, enabled:!!subject });
  const { data: filesData }    = useQuery({ queryKey:['ref-files',book?.id],    queryFn:() => api.get(`/api/references/files/${book.id}`).then(r=>r.data), staleTime:1000*60*10, enabled:!!book });

  async function downloadFile(fid) {
    setDl(fid);
    try {
      await api.post(`/api/references/download/${fid}`);
      toast('فایل از ربات ارسال می‌شود 📱','success',3500);
    } catch { toast('خطا','error'); }
    finally { setDl(null); }
  }

  const headerTitle = book ? book.name : subject ? subject.name : 'رفرنس‌های درسی';

  return (
    <>
      <Header title={headerTitle} />
      <div className="page fade-up">
        {/* Breadcrumb */}
        {(subject || book) && (
          <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:13,flexWrap:'wrap' }}>
            <button onClick={() => { haptic(); setSubject(null); setBook(null); }} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--acc)',fontSize:12,padding:0,fontFamily:'var(--font)' }}>📖 رفرنس‌ها</button>
            {subject && <>
              <span style={{ color:'var(--txm)',fontSize:12 }}>←</span>
              <button onClick={() => { haptic(); setBook(null); }} style={{ background:'none',border:'none',cursor:book?'pointer':'default',color:book?'var(--acc)':'var(--tx)',fontSize:12,fontWeight:!book?700:400,padding:0,fontFamily:'var(--font)' }}>{subject.name}</button>
            </>}
            {book && <>
              <span style={{ color:'var(--txm)',fontSize:12 }}>←</span>
              <span style={{ fontSize:12,fontWeight:700,color:'var(--tx)' }}>{book.name}</span>
            </>}
          </div>
        )}

        {!subject && (
          !subjectsData ? <SkeletonCard /> : (
            <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
              {subjectsData.map(s => (
                <button key={s.id} onClick={() => { haptic(); setSubject(s); setBook(null); }}
                  style={{ display:'flex',alignItems:'center',gap:13,padding:14,background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',cursor:'pointer',textAlign:'right',width:'100%' }}>
                  <span style={{ fontSize:28 }}>📖</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:14 }}>{s.name}</div>
                    <div style={{ fontSize:12,color:'var(--txm)',marginTop:2 }}>{s.book_count} کتاب مرجع</div>
                  </div>
                  <span style={{ color:'var(--txm)' }}>←</span>
                </button>
              ))}
            </div>
          )
        )}

        {subject && !book && (
          !booksData ? <SkeletonCard /> : (
            <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
              {booksData.books?.map(b => (
                <button key={b.id} onClick={() => { haptic(); setBook(b); }}
                  style={{ display:'flex',alignItems:'center',gap:13,padding:14,background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'var(--r-lg)',cursor:'pointer',textAlign:'right',width:'100%' }}>
                  <span style={{ fontSize:26 }}>📘</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:14 }}>{b.name}</div>
                    <div style={{ display:'flex',gap:5,marginTop:5 }}>
                      {b.fa_count > 0 && <span className="badge b-grn">🇮🇷 {b.fa_count} جلد فارسی</span>}
                      {b.en_count > 0 && <span className="badge b-acc">🌐 {b.en_count} جلد لاتین</span>}
                    </div>
                  </div>
                  <span style={{ color:'var(--txm)' }}>←</span>
                </button>
              ))}
            </div>
          )
        )}

        {book && (
          !filesData ? <SkeletonCard /> : (
            <>
              {filesData.fa_files?.length > 0 && (
                <>
                  <div className="sec-title">🇮🇷 نسخه فارسی</div>
                  {filesData.fa_files.map(f => (
                    <div key={f.id} className="card" style={{ marginBottom:9,display:'flex',alignItems:'center',gap:12 }}>
                      <div style={{ width:44,height:44,borderRadius:'var(--r-md)',background:'rgba(16,185,129,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>📗</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:13 }}>{book.name} — فارسی{f.volume > 1 ? ` جلد ${f.volume}` : ''}</div>
                        {f.description && <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>{f.description}</div>}
                        <div style={{ fontSize:10,color:'var(--txm)',marginTop:3 }}>📥 {f.downloads} دانلود</div>
                      </div>
                      <button onClick={() => downloadFile(f.id)} className="btn btn-g" style={{ fontSize:11,padding:'6px 11px',flexShrink:0 }}>
                        {dlLoading===f.id ? <Spinner size={14} /> : '⬇️ دانلود'}
                      </button>
                    </div>
                  ))}
                </>
              )}
              {filesData.en_files?.length > 0 && (
                <>
                  <div className="sec-title">🌐 نسخه لاتین</div>
                  {filesData.en_files.map(f => (
                    <div key={f.id} className="card" style={{ marginBottom:9,display:'flex',alignItems:'center',gap:12 }}>
                      <div style={{ width:44,height:44,borderRadius:'var(--r-md)',background:'var(--acc-soft)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>📙</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:13 }}>{book.name} — لاتین{f.volume > 1 ? ` جلد ${f.volume}` : ''}</div>
                        {f.description && <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>{f.description}</div>}
                        <div style={{ fontSize:10,color:'var(--txm)',marginTop:3 }}>📥 {f.downloads} دانلود</div>
                      </div>
                      <button onClick={() => downloadFile(f.id)} className="btn btn-dark" style={{ fontSize:11,padding:'6px 11px',flexShrink:0 }}>
                        {dlLoading===f.id ? <Spinner size={14} /> : '⬇️ دانلود'}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )
        )}
      </div>
    </>
  );
}
