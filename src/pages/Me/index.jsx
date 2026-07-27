import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';
import { useAuthStore } from '../../stores/authStore';

function MenuRow({ icon, title, desc, badge, badgeColor='b-yel', onClick, last }) {
  return (
    <button className="menu-row" onClick={() => { haptic(); onClick(); }} style={{ borderBottom: last ? 'none' : '1px solid var(--bd)' }}>
      <span style={{ fontSize:20,width:26,textAlign:'center',flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:600,fontSize:13.5,color:'var(--tx)' }}>{title}</div>
        {desc && <div style={{ fontSize:11,color:'var(--txm)',marginTop:1 }}>{desc}</div>}
      </div>
      {badge !== undefined && <span className={`badge ${badgeColor}`}>{badge}</span>}
      <span style={{ color:'var(--txm)',fontSize:14 }}>←</span>
    </button>
  );
}

export default function Me() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/profile').then(r => r.data),
    staleTime: 1000 * 60 * 3,
  });

  const { data: rankData } = useQuery({
    queryKey: ['rank'],
    queryFn: () => api.get('/api/profile/rank').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: subData } = useQuery({
    queryKey: ['sub-status'],
    queryFn: () => api.get('/api/subscription/status').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const dbUser = profileData?.user;
  const stats  = profileData?.stats;
  const openTix = profileData?.tickets?.open || 0;

  return (
    <>
      <Header title="من" />
      <div className="page fade-up">
        {isLoading ? (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:13 }}>

            {/* کارت کاربر */}
            <div className="card card-glow" style={{ cursor:'pointer' }} onClick={() => navigate('/me/profile')}>
              <div style={{ display:'flex',alignItems:'center',gap:13,marginBottom:13 }}>
                <div className="avatar" style={{ width:52,height:52,fontSize:22 }}>{dbUser?.name?.[0]||'؟'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:17 }}>{dbUser?.name}</div>
                  <div style={{ display:'flex',gap:5,marginTop:5,flexWrap:'wrap' }}>
                    <span className="badge b-acc">ورودی {dbUser?.intake}</span>
                    <span className="badge b-acc">گروه {dbUser?.group}</span>
                    {stats?.level && (
                      <span style={{ background:stats.level.color+'20',color:stats.level.color,padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:700 }}>
                        {stats.level.icon} {stats.level.label}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color:'var(--txm)' }}>←</span>
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                <span style={{ fontSize:12,color:'var(--txm)' }}>آمادگی تستی</span>
                <span style={{ fontSize:12,fontWeight:700,color:'var(--acc)' }}>{stats?.percentage}٪</span>
              </div>
              <div className="pbar"><div className="pbar-f" style={{ width:`${stats?.percentage||0}%` }} /></div>
              <div style={{ display:'flex',justifyContent:'space-between',marginTop:7 }}>
                <span style={{ fontSize:11,color:'var(--txm)' }}>{stats?.total_answers} سوال • {stats?.correct_answers} صحیح</span>
                {rankData?.rank && <span style={{ fontSize:11,color:'var(--warn)',fontWeight:700 }}>🏅 رتبه {rankData.rank} از {rankData.total_users}</span>}
              </div>
            </div>

            {/* کارت اشتراک */}
            {subData?.active ? (
              <div className="card" style={{ borderColor:'rgba(16,185,129,.25)',background:'rgba(16,185,129,.04)' }}>
                <div style={{ display:'flex',alignItems:'center',gap:11 }}>
                  <span style={{ fontSize:24 }}>💳</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,color:'var(--ok)',fontSize:13.5 }}>اشتراک فعال — {subData.plan_name}</div>
                    <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>{subData.days_left} روز مانده • تا {subData.expires}</div>
                  </div>
                  <button onClick={() => navigate('/me/subscription')} className="btn btn-dark" style={{ fontSize:11,padding:'5px 10px' }}>مدیریت</button>
                </div>
              </div>
            ) : subData && !subData.active ? (
              <button onClick={() => navigate('/me/subscription')} className="card" style={{ cursor:'pointer',borderColor:'rgba(239,68,68,.25)',background:'rgba(239,68,68,.04)',width:'100%',textAlign:'right' }}>
                <div style={{ display:'flex',alignItems:'center',gap:11 }}>
                  <span style={{ fontSize:24 }}>🔒</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,color:'var(--err)',fontSize:13.5 }}>اشتراک فعال نیست</div>
                    <div style={{ fontSize:11,color:'var(--txm)',marginTop:2 }}>برای دسترسی کامل اشتراک بخرید</div>
                  </div>
                  <span className="badge b-acc">خرید</span>
                </div>
              </button>
            ) : null}

            {/* حساب کاربری */}
            <div>
              <div className="sec-title">👤 حساب کاربری</div>
              <div className="card" style={{ padding:'0 14px' }}>
                <MenuRow icon="👤" title="پروفایل" desc="ویرایش نام، گروه، ورودی" onClick={() => navigate('/me/profile')} />
                <MenuRow icon="🔔" title="اعلان‌ها" desc="مدیریت انواع اعلان‌ها" onClick={() => navigate('/me/notifications')} last />
              </div>
            </div>

            {/* پشتیبانی */}
            <div>
              <div className="sec-title">🆘 پشتیبانی</div>
              <div className="card" style={{ padding:'0 14px' }}>
                <MenuRow icon="🎫" title="تیکت پشتیبانی" desc="ارسال مشکل و پیگیری پاسخ"
                  badge={openTix > 0 ? `${openTix} باز` : undefined} onClick={() => navigate('/me/tickets')} />
                <MenuRow icon="❓" title="سوالات متداول" desc="پاسخ سریع" onClick={() => navigate('/me/faq')} />
                <MenuRow icon="🚩" title="گزارش ایراد محتوا" desc="خطا در سوال یا فایل" onClick={() => navigate('/me/reports')} last />
              </div>
            </div>

            {/* پنل ادمین */}
            {(dbUser?.role === 'admin' || dbUser?.role === 'content_admin') && (
              <div>
                <div className="sec-title">⚙️ مدیریت</div>
                <div className="card" style={{ padding:'0 14px',borderColor:'rgba(251,191,36,.2)' }}>
                  {dbUser.role === 'admin' && (
                    <MenuRow icon="👑" title="پنل ادمین" desc="کاربران، تیکت‌ها، broadcast" onClick={() => navigate('/admin')} />
                  )}
                  <MenuRow icon="🎓" title="پنل محتوا" desc="تأیید سوال، برنامه و FAQ" onClick={() => navigate('/admin/content')} last />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
