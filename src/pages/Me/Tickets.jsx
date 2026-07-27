import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic, hapticNotif } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

function TicketList({ tickets, onSelect, onNew }) {
  return (
    <>
      {!tickets.length ? (
        <div className="empty">
          <div style={{ fontSize:40,marginBottom:10 }}>🎫</div>
          <div>هنوز تیکتی ثبت نکرده‌اید</div>
          <button className="btn btn-p" style={{ marginTop:14 }} onClick={onNew}>📝 ثبت اولین تیکت</button>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {tickets.map((t, i) => (
            <button key={t.id} onClick={() => { haptic(); onSelect(t.id); }}
              className="card" style={{ cursor:'pointer',textAlign:'right',borderColor:t.status==='open'?'rgba(245,158,11,.3)':'var(--bd)',width:'100%' }}>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:42,height:42,borderRadius:'var(--r-md)',background:t.status==='open'?'rgba(245,158,11,.12)':'rgba(16,185,129,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>🎫</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,fontSize:13 }}>#{t.id} — {t.subject}</div>
                  <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>{t.created_at}{t.reply_count>0&&` • ${t.reply_count} پاسخ`}</div>
                </div>
                <span className={`badge ${t.status==='open'?'b-yel':'b-grn'}`}>{t.status==='open'?'باز':'بسته'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function NewTicketForm({ subjects, onCreated, onCancel }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const toast = useUIStore(s => s.toast);

  const createMut = useMutation({
    mutationFn: () => api.post('/api/tickets', { subject, message }).then(r => r.data),
    onSuccess: (data) => { hapticNotif('success'); toast('تیکت ثبت شد ✅','success'); onCreated(data.ticket_id); },
    onError: (err) => { hapticNotif('error'); toast(err.response?.data?.detail||'خطا','error'); },
  });

  return (
    <div className="card card-glow fade-up">
      <div className="sec-title">📝 تیکت جدید</div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11,color:'var(--txm)',marginBottom:7 }}>موضوع</div>
        <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
          {subjects.map(s => (
            <button key={s} onClick={() => { haptic(); setSubject(s); }}
              style={{ textAlign:'right',padding:'9px 12px',borderRadius:'var(--r-md)',border:`1px solid ${subject===s?'var(--acc)':'var(--bd)'}`,background:subject===s?'var(--acc-glow)':'var(--elev)',color:subject===s?'var(--acc)':'var(--tx)',fontFamily:'var(--font)',fontSize:13,cursor:'pointer',transition:'all .15s' }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11,color:'var(--txm)',marginBottom:5 }}>توضیحات</div>
        <textarea className="inp" rows={5} value={message} onChange={e=>setMessage(e.target.value)} placeholder="مشکل یا سوال خود را کامل بنویسید..." style={{ resize:'vertical',lineHeight:1.6 }} />
        <div style={{ fontSize:10,color:'var(--txm)',marginTop:3,textAlign:'left' }}>{message.length} کاراکتر</div>
      </div>
      <div style={{ display:'flex',gap:8 }}>
        <button className="btn btn-p" style={{ flex:2 }} disabled={!subject||message.trim().length<10||createMut.isPending} onClick={() => createMut.mutate()}>
          {createMut.isPending ? <Spinner size={16} /> : '📨 ارسال تیکت'}
        </button>
        <button className="btn btn-dark" style={{ flex:1 }} onClick={onCancel}>لغو</button>
      </div>
    </div>
  );
}

function TicketDetail({ ticketId, onBack }) {
  const [replyText, setReply] = useState('');
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => api.get(`/api/tickets/${ticketId}`).then(r => r.data.ticket),
    staleTime: 1000 * 20,
    refetchInterval: 15000,
  });

  const replyMut = useMutation({
    mutationFn: () => api.post(`/api/tickets/${ticketId}/reply`, { message: replyText }).then(r => r.data),
    onSuccess: () => { hapticNotif('success'); setReply(''); qc.invalidateQueries({ queryKey: ['ticket', ticketId] }); },
    onError: () => toast('خطا در ارسال','error'),
  });

  if (isLoading) return <SkeletonCard />;
  if (!data) return null;
  const isClosed = data.status === 'closed';

  return (
    <div className="fade-up">
      <button onClick={() => { haptic(); onBack(); }} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--acc)',fontSize:13,marginBottom:12,padding:0,fontFamily:'var(--font)' }}>← بازگشت</button>
      <div className="card" style={{ marginBottom:11 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7 }}>
          <div style={{ fontWeight:700,fontSize:14 }}>#{data.id} — {data.subject}</div>
          <span className={`badge ${isClosed?'b-grn':'b-yel'}`}>{isClosed?'بسته':'باز'}</span>
        </div>
        <div style={{ fontSize:13,color:'var(--tx2)',lineHeight:1.7 }}>{data.message}</div>
        <div style={{ fontSize:10,color:'var(--txm)',marginTop:7 }}>{data.created_at}</div>
      </div>
      {data.replies?.length > 0 && (
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:13 }}>
          {data.replies.map((r, i) => (
            <div key={i} style={{ alignSelf:r.sender==='support'?'flex-end':'flex-start',maxWidth:'85%',background:r.sender==='support'?'var(--acc)':'var(--elev)',color:r.sender==='support'?'#fff':'var(--tx)',borderRadius:'var(--r-md)',padding:'9px 13px',fontSize:13,lineHeight:1.6 }}>
              {r.sender==='user' && <div style={{ fontSize:10,fontWeight:700,color:'var(--warn)',marginBottom:3 }}>🧑‍🎓 دانشجو</div>}
              {r.text}
              <div style={{ fontSize:9,marginTop:3,opacity:.7 }}>{r.at}</div>
            </div>
          ))}
        </div>
      )}
      {!isClosed ? (
        <div style={{ display:'flex',gap:8 }}>
          <input className="inp" value={replyText} onChange={e=>setReply(e.target.value)} placeholder="پیام خود را بنویسید..." style={{ flex:1 }} />
          <button className="btn btn-p" onClick={() => replyMut.mutate()} disabled={!replyText.trim()||replyMut.isPending}>
            {replyMut.isPending ? <Spinner size={14} /> : '📤'}
          </button>
        </div>
      ) : (
        <div className="card" style={{ textAlign:'center',fontSize:12,color:'var(--txm)' }}>این تیکت بسته شده است</div>
      )}
    </div>
  );
}

export default function Tickets() {
  const [view, setView]         = useState('list');
  const [selectedId, setSelId]  = useState(null);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.get('/api/tickets').then(r => r.data),
    staleTime: 1000 * 30,
  });

  function handleCreated(id) { refetch(); setSelId(id); setView('detail'); }

  return (
    <>
      <Header title={view==='detail'?`تیکت #${selectedId}`:view==='new'?'تیکت جدید':'پشتیبانی'}
        right={view==='list' ? (
          <button className="btn btn-p" style={{ fontSize:11,padding:'5px 12px' }} onClick={() => { haptic(); setView('new'); }}>+ جدید</button>
        ) : undefined}
      />
      <div className="page fade-up">
        {view === 'list' && (
          isLoading ? <SkeletonCard /> : (
            <TicketList tickets={data?.tickets||[]} onSelect={id=>{setSelId(id);setView('detail');}} onNew={() => setView('new')} />
          )
        )}
        {view === 'new' && (
          <NewTicketForm subjects={data?.subjects||[]} onCreated={handleCreated} onCancel={() => setView('list')} />
        )}
        {view === 'detail' && selectedId && (
          <TicketDetail ticketId={selectedId} onBack={() => setView('list')} />
        )}
      </div>
    </>
  );
}
