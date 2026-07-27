import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard, Spinner } from '../../components/shared/Loading';
import { haptic, hapticNotif } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const toast = useUIStore(s => s.toast);

  const { data, isLoading } = useQuery({
    queryKey: ['sub-status'],
    queryFn: () => api.get('/api/subscription/status').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const buyMutation = useMutation({
    mutationFn: () => api.post('/api/subscription/buy', {
      plan_id: selectedPlan,
      discount_code: discountCode || null,
    }).then(r => r.data),
    onSuccess: (res) => {
      hapticNotif('success');
      toast(`✅ ${res.message}`, 'success', 5000);
      setSelectedPlan(null);
      setDiscountCode('');
    },
    onError: (err) => {
      hapticNotif('error');
      toast(err.response?.data?.detail || 'خطا در ثبت درخواست', 'error');
    },
  });

  return (
    <>
      <Header title="💳 اشتراک" />
      <div className="page fade-up">
        {isLoading ? (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <>
            {/* وضعیت اشتراک فعلی */}
            {data?.active ? (
              <div className="card" style={{ background:'rgba(16,185,129,.06)',borderColor:'rgba(16,185,129,.25)',textAlign:'center',padding:22,marginBottom:14 }}>
                <div style={{ fontSize:38 }}>✅</div>
                <div style={{ fontSize:22,fontWeight:800,color:'var(--ok)',marginTop:8 }}>اشتراک فعال</div>
                <div style={{ fontSize:14,color:'var(--tx2)',marginTop:4 }}>{data.plan_name}</div>
                <div style={{ fontSize:28,fontWeight:800,color:'var(--ok)',margin:'12px 0 4px' }}>{data.days_left}</div>
                <div style={{ fontSize:12,color:'var(--txm)' }}>روز مانده • انقضا: {data.expires}</div>
                <div className="divider" />
                <div style={{ fontSize:12,color:'var(--txm)',lineHeight:1.7 }}>
                  با اشتراک فعال، دسترسی کامل به منابع علوم پایه و بانک سوال را دارید.
                </div>
              </div>
            ) : (
              <div style={{ background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:'var(--r-lg)',padding:14,marginBottom:14 }}>
                <div style={{ fontWeight:700,fontSize:14,color:'var(--err)',marginBottom:4 }}>🔒 اشتراک فعال نیست</div>
                <div style={{ fontSize:12.5,color:'var(--tx2)',lineHeight:1.7 }}>
                  برای دسترسی به منابع درسی و بانک سوال، یکی از پلن‌های زیر را انتخاب کنید.
                </div>
              </div>
            )}

            {/* پلن‌ها */}
            {data?.plans?.length > 0 && (
              <>
                <div className="sec-title">{data.active ? '🔄 تمدید یا ارتقاء' : '📦 انتخاب پلن'}</div>
                <div style={{ display:'flex',flexDirection:'column',gap:9,marginBottom:14 }}>
                  {data.plans.map(plan => (
                    <button key={plan.id} onClick={() => { haptic(); setSelectedPlan(selectedPlan===plan.id?null:plan.id); }}
                      className="card" style={{ cursor:'pointer',textAlign:'right',borderColor:selectedPlan===plan.id?'var(--acc)':'var(--bd)',background:selectedPlan===plan.id?'var(--acc-glow)':'var(--surf)',width:'100%' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                        <div style={{ width:48,height:48,borderRadius:'var(--r-md)',background:'var(--acc-soft)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>💳</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700,fontSize:14,color:selectedPlan===plan.id?'var(--acc)':'var(--tx)' }}>{plan.name}</div>
                          <div style={{ fontSize:12,color:'var(--txm)',marginTop:2 }}>{plan.days} روز دسترسی کامل</div>
                        </div>
                        <div style={{ textAlign:'left' }}>
                          <div style={{ fontWeight:800,fontSize:16,color:selectedPlan===plan.id?'var(--acc)':'var(--tx)' }}>
                            {plan.price.toLocaleString()}
                          </div>
                          <div style={{ fontSize:10,color:'var(--txm)' }}>تومان</div>
                        </div>
                      </div>
                      {selectedPlan===plan.id && (
                        <div style={{ marginTop:12,padding:'9px 11px',background:'rgba(59,130,246,.08)',borderRadius:'var(--r-md)',fontSize:12,color:'var(--tx2)',lineHeight:1.7 }}>
                          📱 پس از ثبت درخواست، اطلاعات حساب بانکی برای واریز از ربات ارسال می‌شود. رسید پرداخت را ارسال کنید.
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* کد تخفیف */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11,color:'var(--txm)',marginBottom:5 }}>🎟 کد تخفیف (اختیاری)</div>
                  <input className="inp" value={discountCode} onChange={e=>setDiscountCode(e.target.value)} placeholder="کد تخفیف را وارد کنید..." />
                </div>

                {data.has_pending_payment && (
                  <div style={{ background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',borderRadius:'var(--r-md)',padding:12,marginBottom:12,fontSize:12,color:'var(--warn)' }}>
                    ⏳ یک درخواست پرداخت در انتظار بررسی دارید.
                  </div>
                )}

                <button className="btn btn-p btn-full" disabled={!selectedPlan || buyMutation.isPending || data.has_pending_payment}
                  onClick={() => buyMutation.mutate()}>
                  {buyMutation.isPending ? <Spinner size={16} /> : selectedPlan ? `خرید ${data.plans.find(p=>p.id===selectedPlan)?.name}` : 'پلن را انتخاب کنید'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
