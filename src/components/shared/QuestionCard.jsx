import { useState, useEffect } from 'react';
import { haptic } from '../../lib/telegram';

const LETTERS = ['الف', 'ب', 'ج', 'د'];

export default function QuestionCard({ question, onAnswer, answered, showReport, onReport }) {
  const [selected, setSelected] = useState(null);
  useEffect(() => { setSelected(null); }, [question?.id]);

  function pick(idx) {
    if (answered != null || selected != null) return;
    setSelected(idx);
    haptic('medium');
    onAnswer?.(question.id, idx);
  }

  return (
    <div className="card card-glow fade-up" style={{ marginBottom:12 }}>
      <div style={{ display:'flex',gap:5,marginBottom:11,flexWrap:'wrap' }}>
        <span className="badge b-acc">{question.lesson}</span>
        {question.topic && <span className="badge b-acc">{question.topic}</span>}
        <span className={`badge ${question.difficulty?.includes('آسان')?'b-grn':question.difficulty?.includes('سخت')?'b-red':'b-yel'}`} style={{ marginRight:'auto' }}>
          {question.difficulty || 'متوسط'}
        </span>
      </div>
      <div style={{ fontSize:14.5,lineHeight:1.7,color:'var(--tx)',marginBottom:14 }}>{question.question}</div>
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        {question.options?.map((opt, idx) => {
          let bg='var(--elev)',bd='var(--bd)',cl='var(--tx)';
          if (answered != null) {
            if (idx === answered.correct_answer) { bg='rgba(16,185,129,.12)'; bd='var(--ok)'; cl='var(--ok)'; }
            else if (idx === selected && idx !== answered.correct_answer) { bg='rgba(239,68,68,.12)'; bd='var(--err)'; cl='var(--err)'; }
          } else if (selected === idx) { bg='var(--acc-glow)'; bd='var(--acc)'; }
          return (
            <button key={idx} onClick={() => pick(idx)} style={{ display:'flex',alignItems:'flex-start',gap:9,padding:'9px 12px',borderRadius:'var(--r-md)',background:bg,border:`1px solid ${bd}`,color:cl,fontFamily:'var(--font)',fontSize:13,textAlign:'right',cursor:answered!=null?'default':'pointer',transition:'all .15s',lineHeight:1.5,width:'100%' }}>
              <span style={{ fontWeight:700,flexShrink:0,color:'var(--txm)' }}>{LETTERS[idx]}</span>
              <span>{opt}</span>
              {answered != null && idx === answered.correct_answer && <span style={{ marginRight:'auto',flexShrink:0 }}>✅</span>}
            </button>
          );
        })}
      </div>
      {answered != null && showReport && (
        <button onClick={onReport} style={{ marginTop:8,background:'none',border:'none',cursor:'pointer',color:'var(--txm)',fontSize:10.5,display:'flex',alignItems:'center',gap:3,padding:0,fontFamily:'var(--font)' }}>
          🚩 گزارش ایراد در این سوال
        </button>
      )}
    </div>
  );
}
