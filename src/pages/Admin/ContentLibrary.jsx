import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic, hapticNotif } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

const CONTENT_TYPE_LABELS = {
  video: '🎥 ویدیو کلاس', ppt: '📊 پاورپوینت', pdf: '📄 جزوه PDF',
  note: '📝 نکات', test: '🧪 تست', voice: '🎙 ویس استاد',
};

function EmptyState({ icon, text }) {
  return <div className="empty"><div style={{ fontSize:36,marginBottom:10 }}>{icon}</div><div>{text}</div></div>;
}

function AddForm({ fields, onSubmit, submitting, submitLabel = '➕ افزودن' }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(f => [f.key, f.default ?? ''])));
  const set = (k, v) => setValues(s => ({ ...s, [k]: v }));
  const canSubmit = fields.every(f => !f.required || String(values[f.key] ?? '').trim());
  return (
    <div className="card" style={{ marginBottom:14 }}>
      <div className="sec-title">➕ افزودن جدید</div>
      {fields.map(f => (
        <div key={f.key} style={{ marginBottom:9 }}>
          {f.label && <div style={{ fontSize:11,color:'var(--txm)',marginBottom:4 }}>{f.label}</div>}
          {f.type === 'select' ? (
            <select className="inp" value={values[f.key]} onChange={e => set(f.key, e.target.value)}>
              {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : f.type === 'file' ? (
            <input className="inp" type="file" accept={f.accept} onChange={e => set(f.key, e.target.files?.[0] || null)} />
          ) : (
            <input className="inp" type={f.type || 'text'} placeholder={f.placeholder || ''} value={values[f.key]} onChange={e => set(f.key, e.target.value)} />
          )}
        </div>
      ))}
      <button className="btn btn-p btn-full" disabled={!canSubmit || submitting} onClick={() => onSubmit(values, () => setValues(Object.fromEntries(fields.map(f => [f.key, f.default ?? '']))))}>
        {submitting ? <Spinner size={14} /> : submitLabel}
      </button>
    </div>
  );
}

function ListRow({ title, subtitle, badge, onClick, onDelete }) {
  return (
    <div className="card" style={{ marginBottom:9,display:'flex',alignItems:'center',gap:8 }}>
      <button onClick={onClick} style={{ flex:1,textAlign:'right',background:'none',border:'none',cursor:onClick?'pointer':'default',padding:0 }}>
        <div style={{ fontWeight:700,fontSize:13.5 }}>{title}</div>
        {subtitle && <div style={{ fontSize:10.5,color:'var(--txm)',marginTop:2 }}>{subtitle}</div>}
      </button>
      {badge}
      {onClick && <span style={{ color:'var(--txm)' }}>←</span>}
      {onDelete && <button className="btn btn-d" style={{ fontSize:11,padding:'6px 9px' }} onClick={onDelete}>🗑</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   🧬 مدیریت علوم پایه
   ═══════════════════════════════════════════ */
export function BasicScienceAdmin() {
  const toast = useUIStore(s => s.toast);
  const qc = useQueryClient();
  const [term, setTerm] = useState(null);
  const [lesson, setLesson] = useState(null);   // {id,name}
  const [session, setSession] = useState(null); // {id,topic}

  const level = session ? 'content' : lesson ? 'sessions' : term ? 'lessons' : 'terms';

  const { data: terms } = useQuery({ queryKey:['bs-terms'], queryFn:() => api.get('/api/content/basic-science/terms').then(r=>r.data.terms) });

  const { data: lessons, isLoading: loadingLessons } = useQuery({
    queryKey: ['bs-lessons', term], queryFn: () => api.get(`/api/content/basic-science/lessons?term=${encodeURIComponent(term)}`).then(r=>r.data.lessons),
    enabled: level==='lessons',
  });
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['bs-sessions', lesson?.id], queryFn: () => api.get(`/api/content/basic-science/lessons/${lesson.id}/sessions`).then(r=>r.data.sessions),
    enabled: level==='sessions',
  });
  const { data: contents, isLoading: loadingContent } = useQuery({
    queryKey: ['bs-content', session?.id], queryFn: () => api.get(`/api/content/basic-science/sessions/${session.id}/content`).then(r=>r.data.content),
    enabled: level==='content',
  });

  const addLesson = useMutation({
    mutationFn: (v) => api.post('/api/content/basic-science/lessons', { term, name:v.name, teacher:v.teacher }).then(r=>r.data),
    onSuccess: (_, __, ctx) => { hapticNotif('success'); toast('✅ اضافه شد','success'); qc.invalidateQueries({queryKey:['bs-lessons',term]}); },
    onError: (e) => toast(e.response?.data?.detail || 'خطا','error'),
  });
  const delLesson = useMutation({
    mutationFn: (id) => api.delete(`/api/content/basic-science/lessons/${id}`).then(r=>r.data),
    onSuccess: () => { toast('🗑 حذف شد','info'); qc.invalidateQueries({queryKey:['bs-lessons',term]}); },
  });
  const addSession = useMutation({
    mutationFn: (v) => api.post(`/api/content/basic-science/lessons/${lesson.id}/sessions`, { number:Number(v.number), topic:v.topic, teacher:v.teacher }).then(r=>r.data),
    onSuccess: () => { hapticNotif('success'); toast('✅ اضافه شد','success'); qc.invalidateQueries({queryKey:['bs-sessions',lesson.id]}); },
  });
  const delSession = useMutation({
    mutationFn: (id) => api.delete(`/api/content/basic-science/sessions/${id}`).then(r=>r.data),
    onSuccess: () => { toast('🗑 حذف شد','info'); qc.invalidateQueries({queryKey:['bs-sessions',lesson.id]}); },
  });
  const addContent = useMutation({
    mutationFn: (v) => {
      const fd = new FormData();
      fd.append('ctype', v.ctype); fd.append('description', v.description); fd.append('extra_info', v.extra_info); fd.append('file', v.file);
      return api.post(`/api/content/basic-science/sessions/${session.id}/content`, fd).then(r=>r.data);
    },
    onSuccess: () => { hapticNotif('success'); toast('✅ فایل آپلود شد','success'); qc.invalidateQueries({queryKey:['bs-content',session.id]}); },
    onError: (e) => toast(e.response?.data?.detail || 'خطا در آپلود','error'),
  });
  const delContent = useMutation({
    mutationFn: (id) => api.delete(`/api/content/basic-science/content/${id}`).then(r=>r.data),
    onSuccess: () => { toast('🗑 حذف شد','info'); qc.invalidateQueries({queryKey:['bs-content',session.id]}); },
  });

  const titles = { terms:'🧬 علوم پایه', lessons:term, sessions:lesson?.name, content:`جلسه ${session?.number}` };
  const backFns = {
    terms: undefined,
    lessons: () => setTerm(null),
    sessions: () => setLesson(null),
    content: () => setSession(null),
  };

  return (
    <>
      <Header title={titles[level]} onBack={backFns[level]} />
      <div className="page fade-up">
        {level === 'terms' && (!terms ? <SkeletonCard /> : terms.map(t => (
          <ListRow key={t} title={t} onClick={() => { haptic(); setTerm(t); }} />
        )))}

        {level === 'lessons' && (
          <>
            <AddForm submitting={addLesson.isPending}
              fields={[{key:'name',label:'نام درس',placeholder:'مثلاً فیزیولوژی',required:true},{key:'teacher',label:'استاد (اختیاری)'}]}
              onSubmit={(v,reset) => addLesson.mutate(v, { onSuccess: reset })} />
            {loadingLessons ? <SkeletonCard /> : !lessons?.length ? <EmptyState icon="📚" text="هنوز درسی اضافه نشده" /> :
              lessons.map(l => (
                <ListRow key={l.id} title={l.name} subtitle={l.teacher||'—'}
                  onClick={() => { haptic(); setLesson(l); }}
                  onDelete={() => { if (confirm(`درس «${l.name}» و همه‌ی جلساتش حذف بشه؟`)) delLesson.mutate(l.id); }} />
              ))}
          </>
        )}

        {level === 'sessions' && (
          <>
            <AddForm submitting={addSession.isPending}
              fields={[{key:'number',label:'شماره جلسه',type:'number',required:true},{key:'topic',label:'موضوع',required:true},{key:'teacher',label:'استاد (اختیاری)'}]}
              onSubmit={(v,reset) => addSession.mutate(v, { onSuccess: reset })} />
            {loadingSessions ? <SkeletonCard /> : !sessions?.length ? <EmptyState icon="📌" text="هنوز جلسه‌ای اضافه نشده" /> :
              sessions.map(s => (
                <ListRow key={s.id} title={`جلسه ${s.number} — ${s.topic}`} subtitle={s.teacher||'—'}
                  onClick={() => { haptic(); setSession(s); }}
                  onDelete={() => { if (confirm('این جلسه و فایل‌هاش حذف بشه؟')) delSession.mutate(s.id); }} />
              ))}
          </>
        )}

        {level === 'content' && (
          <>
            <AddForm submitting={addContent.isPending} submitLabel="📤 آپلود فایل"
              fields={[
                {key:'ctype',label:'نوع محتوا',type:'select',default:'pdf',options:Object.entries(CONTENT_TYPE_LABELS).map(([value,label])=>({value,label}))},
                {key:'description',label:'توضیح (اختیاری)'},
                {key:'extra_info',label:'اطلاعات اضافه (اختیاری)'},
                {key:'file',label:'فایل',type:'file',required:true},
              ]}
              onSubmit={(v,reset) => { if(!v.file){toast('فایل رو انتخاب کن','error');return;} addContent.mutate(v, { onSuccess: reset }); }} />
            {loadingContent ? <SkeletonCard /> : !contents?.length ? <EmptyState icon="📎" text="هنوز فایلی آپلود نشده" /> :
              contents.map(c => (
                <ListRow key={c.id} title={CONTENT_TYPE_LABELS[c.type]||c.type} subtitle={`${c.description||'—'} • 📥 ${c.downloads} دانلود`}
                  onDelete={() => { if (confirm('این فایل حذف بشه؟')) delContent.mutate(c.id); }} />
              ))}
          </>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   📖 مدیریت رفرنس‌ها
   ═══════════════════════════════════════════ */
export function ReferencesAdmin() {
  const toast = useUIStore(s => s.toast);
  const qc = useQueryClient();
  const [subject, setSubject] = useState(null);
  const [book, setBook] = useState(null);

  const level = book ? 'files' : subject ? 'books' : 'subjects';

  const { data: subjects, isLoading: loadingSubjects } = useQuery({
    queryKey:['ref-subjects'], queryFn:() => api.get('/api/content/references/subjects').then(r=>r.data.subjects),
    enabled: level==='subjects',
  });
  const { data: books, isLoading: loadingBooks } = useQuery({
    queryKey:['ref-books', subject?.id], queryFn:() => api.get(`/api/content/references/subjects/${subject.id}/books`).then(r=>r.data.books),
    enabled: level==='books',
  });
  const { data: files, isLoading: loadingFiles } = useQuery({
    queryKey:['ref-files', book?.id], queryFn:() => api.get(`/api/content/references/books/${book.id}/files`).then(r=>r.data.files),
    enabled: level==='files',
  });

  const addSubject = useMutation({
    mutationFn: (v) => api.post('/api/content/references/subjects', { name:v.name }).then(r=>r.data),
    onSuccess: () => { hapticNotif('success'); toast('✅ اضافه شد','success'); qc.invalidateQueries({queryKey:['ref-subjects']}); },
    onError: (e) => toast(e.response?.data?.detail||'خطا','error'),
  });
  const delSubject = useMutation({
    mutationFn: (id) => api.delete(`/api/content/references/subjects/${id}`).then(r=>r.data),
    onSuccess: () => { toast('🗑 حذف شد','info'); qc.invalidateQueries({queryKey:['ref-subjects']}); },
  });
  const addBook = useMutation({
    mutationFn: (v) => api.post(`/api/content/references/subjects/${subject.id}/books`, { name:v.name }).then(r=>r.data),
    onSuccess: () => { hapticNotif('success'); toast('✅ اضافه شد','success'); qc.invalidateQueries({queryKey:['ref-books',subject.id]}); },
  });
  const delBook = useMutation({
    mutationFn: (id) => api.delete(`/api/content/references/books/${id}`).then(r=>r.data),
    onSuccess: () => { toast('🗑 حذف شد','info'); qc.invalidateQueries({queryKey:['ref-books',subject.id]}); },
  });
  const addFile = useMutation({
    mutationFn: (v) => {
      const fd = new FormData();
      fd.append('lang', v.lang); fd.append('volume', v.volume||1); fd.append('description', v.description); fd.append('file', v.file);
      return api.post(`/api/content/references/books/${book.id}/files`, fd).then(r=>r.data);
    },
    onSuccess: () => { hapticNotif('success'); toast('✅ فایل آپلود شد','success'); qc.invalidateQueries({queryKey:['ref-files',book.id]}); },
    onError: (e) => toast(e.response?.data?.detail||'خطا در آپلود','error'),
  });
  const delFile = useMutation({
    mutationFn: (id) => api.delete(`/api/content/references/files/${id}`).then(r=>r.data),
    onSuccess: () => { toast('🗑 حذف شد','info'); qc.invalidateQueries({queryKey:['ref-files',book.id]}); },
  });

  const titles = { subjects:'📖 رفرنس‌ها', books:subject?.name, files:book?.name };
  const backFns = { subjects: undefined, books: () => setSubject(null), files: () => setBook(null) };

  return (
    <>
      <Header title={titles[level]} onBack={backFns[level]} />
      <div className="page fade-up">
        {level === 'subjects' && (
          <>
            <AddForm submitting={addSubject.isPending} fields={[{key:'name',label:'نام موضوع',placeholder:'مثلاً آناتومی',required:true}]}
              onSubmit={(v,reset) => addSubject.mutate(v, { onSuccess: reset })} />
            {loadingSubjects ? <SkeletonCard /> : !subjects?.length ? <EmptyState icon="📖" text="هنوز موضوعی اضافه نشده" /> :
              subjects.map(s => (
                <ListRow key={s.id} title={s.name} onClick={() => { haptic(); setSubject(s); }}
                  onDelete={() => { if (confirm(`موضوع «${s.name}» حذف بشه؟`)) delSubject.mutate(s.id); }} />
              ))}
          </>
        )}

        {level === 'books' && (
          <>
            <AddForm submitting={addBook.isPending} fields={[{key:'name',label:'نام کتاب',required:true}]}
              onSubmit={(v,reset) => addBook.mutate(v, { onSuccess: reset })} />
            {loadingBooks ? <SkeletonCard /> : !books?.length ? <EmptyState icon="📕" text="هنوز کتابی اضافه نشده" /> :
              books.map(b => (
                <ListRow key={b.id} title={b.name} onClick={() => { haptic(); setBook(b); }}
                  onDelete={() => { if (confirm(`کتاب «${b.name}» حذف بشه؟`)) delBook.mutate(b.id); }} />
              ))}
          </>
        )}

        {level === 'files' && (
          <>
            <AddForm submitting={addFile.isPending} submitLabel="📤 آپلود جلد"
              fields={[
                {key:'lang',label:'زبان',type:'select',default:'fa',options:[{value:'fa',label:'🇮🇷 فارسی'},{value:'en',label:'🌐 لاتین'}]},
                {key:'volume',label:'جلد',type:'number',default:1},
                {key:'description',label:'توضیح (اختیاری)'},
                {key:'file',label:'فایل',type:'file',required:true},
              ]}
              onSubmit={(v,reset) => { if(!v.file){toast('فایل رو انتخاب کن','error');return;} addFile.mutate(v, { onSuccess: reset }); }} />
            {loadingFiles ? <SkeletonCard /> : !files?.length ? <EmptyState icon="📄" text="هنوز فایلی آپلود نشده" /> :
              files.map(f => (
                <ListRow key={f.id} title={`${f.lang==='fa'?'🇮🇷 فارسی':'🌐 لاتین'} — جلد ${f.volume}`} subtitle={`${f.description||'—'} • 📥 ${f.downloads} دانلود`}
                  onDelete={() => { if (confirm('این فایل حذف بشه؟')) delFile.mutate(f.id); }} />
              ))}
          </>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   🧪 بانک سوال — فایل‌ها
   ═══════════════════════════════════════════ */
export function QbankAdmin() {
  const toast = useUIStore(s => s.toast);
  const qc = useQueryClient();

  const { data: files, isLoading } = useQuery({
    queryKey: ['qbank-files'], queryFn: () => api.get('/api/content/qbank/files').then(r=>r.data.files),
  });

  const addFile = useMutation({
    mutationFn: (v) => {
      const fd = new FormData();
      fd.append('lesson', v.lesson); fd.append('topic', v.topic); fd.append('description', v.description); fd.append('file', v.file);
      return api.post('/api/content/qbank/files', fd).then(r=>r.data);
    },
    onSuccess: () => { hapticNotif('success'); toast('✅ فایل آپلود شد','success'); qc.invalidateQueries({queryKey:['qbank-files']}); },
    onError: (e) => toast(e.response?.data?.detail||'خطا در آپلود','error'),
  });
  const delFile = useMutation({
    mutationFn: (id) => api.delete(`/api/content/qbank/files/${id}`).then(r=>r.data),
    onSuccess: () => { toast('🗑 حذف شد','info'); qc.invalidateQueries({queryKey:['qbank-files']}); },
  });

  return (
    <>
      <Header title="🧪 فایل‌های بانک سوال" subtitle={files?`${files.length} فایل`:''} />
      <div className="page fade-up">
        <AddForm submitting={addFile.isPending} submitLabel="📤 آپلود فایل"
          fields={[
            {key:'lesson',label:'درس',placeholder:'مثلاً فیزیولوژی',required:true},
            {key:'topic',label:'موضوع',placeholder:'مثلاً کلیه',required:true},
            {key:'description',label:'توضیح (اختیاری)'},
            {key:'file',label:'فایل',type:'file',required:true},
          ]}
          onSubmit={(v,reset) => { if(!v.file){toast('فایل رو انتخاب کن','error');return;} addFile.mutate(v, { onSuccess: reset }); }} />
        {isLoading ? <SkeletonCard /> : !files?.length ? <EmptyState icon="🧪" text="هنوز فایلی آپلود نشده" /> :
          files.map(f => (
            <ListRow key={f.id} title={`${f.lesson} — ${f.topic}`} subtitle={`${f.description||'—'} • 📥 ${f.downloads} دانلود • ${f.upload_date}`}
              onDelete={() => { if (confirm('این فایل حذف بشه؟')) delFile.mutate(f.id); }} />
          ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   🚩 گزارش‌های ایراد
   ═══════════════════════════════════════════ */
export function ContentReportsAdmin() {
  const toast = useUIStore(s => s.toast);
  const qc = useQueryClient();
  const [status, setStatus] = useState('new');

  const { data: stats } = useQuery({ queryKey:['reports-stats'], queryFn:() => api.get('/api/content/reports/stats').then(r=>r.data) });
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports-list', status], queryFn: () => api.get(`/api/content/reports${status?`?status=${status}`:''}`).then(r=>r.data.reports),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.post(`/api/content/reports/${id}/status`, { status }).then(r=>r.data),
    onSuccess: () => { hapticNotif('success'); toast('✅ به‌روزرسانی شد','success'); qc.invalidateQueries({queryKey:['reports-list']}); qc.invalidateQueries({queryKey:['reports-stats']}); },
  });

  const STATUS_TABS = [['new','🆕 جدید','b-yel'],['reviewing','🔍 بررسی','b-acc'],['resolved','✅ برطرف شد','b-grn'],['rejected','❌ رد شد','b-red']];

  return (
    <>
      <Header title="🚩 گزارش‌های ایراد" subtitle={stats ? `${stats.new} گزارش جدید` : ''} />
      <div className="page fade-up">
        <div style={{ display:'flex',gap:6,marginBottom:14,overflowX:'auto' }}>
          {STATUS_TABS.map(([val,label]) => (
            <button key={val} onClick={() => { haptic(); setStatus(val); }}
              style={{ flexShrink:0,padding:'7px 12px',borderRadius:999,fontSize:11.5,fontWeight:600,
                border:`1px solid ${status===val?'var(--acc)':'var(--bd)'}`,
                background:status===val?'var(--acc-glow)':'var(--elev)',color:status===val?'var(--acc)':'var(--txm)' }}>
              {label} {stats && stats[val] != null ? `(${stats[val]})` : ''}
            </button>
          ))}
        </div>

        {isLoading ? <SkeletonCard /> : !reports?.length ? <EmptyState icon="🚩" text="گزارشی در این وضعیت نیست" /> :
          reports.map(r => (
            <div key={r.id} className="card" style={{ marginBottom:9 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                <span style={{ fontWeight:700,fontSize:13 }}>{r.target_type==='question'?'🧪 سوال':'📎 جزوه'} #{r.id}</span>
                <span style={{ fontSize:10.5,color:'var(--txm)' }}>{r.created_at}</span>
              </div>
              <div style={{ fontSize:12,marginBottom:4 }}><b>دلیل:</b> {r.reason}</div>
              {r.note && <div style={{ fontSize:11.5,color:'var(--txm)',marginBottom:6 }}>«{r.note}»</div>}
              <div style={{ fontSize:11,color:'var(--txm)',marginBottom:9 }}>گزارش‌دهنده: {r.reporter_name}</div>
              {r.status !== 'resolved' && r.status !== 'rejected' && (
                <div style={{ display:'flex',gap:7 }}>
                  {r.status==='new' && <button className="btn btn-dark" style={{ flex:1,fontSize:11,padding:'6px 4px' }} onClick={() => updateStatus.mutate({id:r.id,status:'reviewing'})}>🔍 در حال بررسی</button>}
                  <button className="btn btn-p" style={{ flex:1,fontSize:11,padding:'6px 4px' }} onClick={() => updateStatus.mutate({id:r.id,status:'resolved'})}>✅ برطرف شد</button>
                  <button className="btn btn-d" style={{ flex:1,fontSize:11,padding:'6px 4px' }} onClick={() => updateStatus.mutate({id:r.id,status:'rejected'})}>❌ رد</button>
                </div>
              )}
            </div>
          ))}
      </div>
    </>
  );
}
