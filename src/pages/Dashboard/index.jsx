import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';

function Ring({ pct, size = 72 }) {
  const r = 27, c = 2 * Math.PI * r;
  return (
    <div style={{ position:'relative',width:size,height:size,flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ovr)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--acc)" strokeWidth={6}
          strokeDasharray={`${(pct/100)*c} ${c}`} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'var(--acc)' }}>{pct}٪</div>
    </div>
  );
}

function WeekBar({ data }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display:'flex',alignItems:'flex-end',gap:4,height:50 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2 }}>
          <div style={{ width:'100%',borderRadius:3,background:v>0?'var(--acc)':'var(--ovr)',height:`${Math.max((v/max)*42,v>0?5:3)}px`,transition:'height .5s' }} />
          <div style={{ fontSize:8,color:'var(--txm)' }}>{'دسچپجشی'[i]}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard').then(r => r.data),
    staleTime: 1000 * 60 * 3,
  });

  const { data: weekData } = useQuery({
    queryKey: ['weekly'],
    queryFn: () => api.get('/api/dashboard/weekly').then(r => r.data.weekly),
    staleTime: 1000 * 60 * 5,
  });

  const { data: lbData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/api/dashboard/leaderboard').then(r => r.data.leaderboard),
    staleTime: 1000 * 60 * 5,
    enabled: tab === 'rank',
  });

  return (
    <>
      <Header title="داشبورد"
        subtitle={data ? `ورودی ${data.user.intake} | گروه ${data.user.group}` : ''}
        right={<button onClick={() => { haptic(); refetch(); }} style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,opacity:isRefetching?.5:1 }}>🔄</button>}
      />
      <div className="page fade-up">
        {isLoading ? (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : data ? (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>

            {/* کارت کاربر */}
            <div className="card card-glow">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div>
                  <div style={{ color:'var(--txm)',fontSize:12 }}>سلام 👋</div>
                  <div style={{ fontWeight:800,fontSize:20,marginTop:2 }}>{data.user.name}</div>
                  <div style={{ display:'flex',gap:5,marginTop:7,flexWrap:'wrap' }}>
                    {data.user.role !== 'student' && (
                      <span className="badge b-yel">{data.user.role === 'admin' ? '👑 ادمین' : '🎓 ادمین محتوا'}</span>
                    )}
                    {data.stats.level && (
                      <span style={{ background:data.stats.level.color+'20',color:data.stats.level.color,padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:700 }}>
                        {data.stats.level.icon} {data.stats.level.label}
                      </span>
                    )}
                  </div>
                </div>
                <Ring pct={data.stats.percentage} />
              </div>
            </div>

            {/* تب‌ها */}
            <div className="tab-bar">
              {[['stats','📈 آمار'],['exams','⏳ امتحانات'],['rank','🏅 رتبه']].map(([k,l]) => (
                <button key={k} onClick={() => { haptic(); setTab(k); }} className="tab-btn"
                  style={{ background:tab===k?'var(--acc)':'transparent',color:tab===k?'#fff':'var(--tx2)' }}>
                  {l}
                </button>
              ))}
            </div>

            {tab === 'stats' && (
              <>
                <div className="grid2">
                  {[['🧪',data.stats.total_answers,'سوال','var(--acc)'],['✅',data.stats.correct_answers,'صحیح','var(--ok)'],['📥',data.stats.downloads,'دانلود','var(--info)'],['🔥',data.stats.week_activity,'این هفته','var(--warn)']].map(([ic,v,l,c]) => (
                    <div key={l} className="card" style={{ textAlign:'center',padding:'12px 8px' }}>
                      <div style={{ fontSize:22 }}>{ic}</div>
                      <div style={{ fontSize:21,fontWeight:800,color:c,margin:'3px 0' }}>{v}</div>
                      <div style={{ fontSize:10.5,color:'var(--txm)' }}>{l}</div>
                    </div>
                  ))}
                </div>
                {weekData && (
                  <div className="card">
                    <div style={{ color:'var(--txm)',fontSize:12,marginBottom:8 }}>فعالیت ۷ روز اخیر</div>
                    <WeekBar data={weekData.map(w => w.count)} />
                  </div>
                )}
                {data.stats.weak_topics?.length > 0 && (
                  <div className="card">
                    <div className="sec-title">⚡ نقاط ضعف</div>
                    <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                      {data.stats.weak_topics.map(t => (
                        <button key={t} onClick={() => { haptic(); navigate('/learn/questions?mode=weak'); }}
                          style={{ background:'rgba(239,68,68,.12)',color:'var(--err)',padding:'3px 10px',borderRadius:999,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',fontFamily:'var(--font)' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'exams' && (
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {!data.upcoming_exams?.length ? (
                  <div className="empty"><div style={{ fontSize:40,marginBottom:10 }}>📭</div><div>امتحانی در ۷ روز آینده نیست</div></div>
                ) : data.upcoming_exams.map(e => {
                  const urgent = e.days_left !== null && e.days_left <= 3;
                  return (
                    <div key={e.id} className="card" style={{ borderColor:urgent?'rgba(239,68,68,.3)':'var(--bd)' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                        <div style={{ width:44,height:44,borderRadius:'var(--r-md)',background:urgent?'rgba(239,68,68,.1)':'rgba(59,130,246,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>📝</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700,fontSize:13.5,color:urgent?'var(--err)':'var(--tx)' }}>{e.lesson}</div>
                          <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>{e.date} {e.time && `• ${e.time}`}</div>
                        </div>
                        {e.days_left !== null && (
                          <span className={`badge ${e.days_left===0?'b-red':e.days_left<=3?'b-yel':'b-grn'}`}>
                            {e.days_left===0?'امروز!':e.days_left===1?'فردا!':` ${e.days_left} روز`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'rank' && (
              <>
                <div className="card" style={{ background:'linear-gradient(135deg,rgba(245,158,11,.08),rgba(59,130,246,.06))',borderColor:'rgba(245,158,11,.25)',textAlign:'center',padding:22 }}>
                  <div style={{ fontSize:38 }}>🏅</div>
                  <div style={{ fontSize:26,fontWeight:800,color:'var(--warn)',marginTop:8 }}>در حال بارگذاری...</div>
                </div>
                {lbData && (
                  <div className="card">
                    <div className="sec-title">🏆 برترین‌ها</div>
                    {lbData.map((u, i) => (
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<lbData.length-1?'1px solid var(--bd)':'none' }}>
                        <div style={{ width:26,textAlign:'center',fontWeight:800,color:u.rank<=3?'#FCD34D':'var(--txm)',fontSize:u.rank<=3?16:12 }}>
                          {u.rank===1?'🥇':u.rank===2?'🥈':u.rank===3?'🥉':`#${u.rank}`}
                        </div>
                        <div style={{ flex:1,fontWeight:u.is_me?700:400,color:u.is_me?'var(--acc)':'var(--tx)',fontSize:13 }}>
                          {u.name}{u.is_me&&' (من)'}
                        </div>
                        <div style={{ fontSize:11,color:'var(--txm)',textAlign:'left' }}>
                          <span style={{ color:'var(--ok)',fontWeight:700 }}>{u.correct}</span>/{u.total}
                          <span style={{ color:'var(--warn)',marginRight:6,fontWeight:700 }}>{u.percent}٪</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {data.open_tickets > 0 && (
              <button onClick={() => navigate('/me/tickets')} className="card" style={{ cursor:'pointer',display:'flex',alignItems:'center',gap:12,borderColor:'rgba(245,158,11,.3)',background:'rgba(245,158,11,.04)',width:'100%',textAlign:'right' }}>
                <span style={{ fontSize:22 }}>🎫</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:13 }}>{data.open_tickets} تیکت باز</div>
                  <div style={{ fontSize:11,color:'var(--txm)' }}>برو به پشتیبانی</div>
                </div>
                <span style={{ color:'var(--txm)' }}>←</span>
              </button>
            )}

            <button className="btn btn-p btn-full" onClick={() => { haptic('medium'); navigate('/learn/questions?mode=weak'); }}>
              🧪 تمرین هوشمند
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
