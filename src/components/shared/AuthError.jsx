export default function AuthError({ error }) {
  const isNotReg  = error === 'not_registered';
  const isPending = error === 'pending_approval';
  const isSuspended = error === 'suspended';
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100dvh',padding:24,textAlign:'center',background:'var(--bg)',gap:20 }}>
      <div style={{ fontSize:64 }}>{isNotReg?'🩺':isPending?'⏳':isSuspended?'🚫':'❌'}</div>
      <div style={{ fontSize:20,fontWeight:800,color:'var(--tx)' }}>
        {isNotReg?'ثبت‌نام نشده‌اید':isPending?'در انتظار تأیید':isSuspended?'حساب تعلیق شده':'خطا در اتصال'}
      </div>
      <div style={{ color:'var(--tx2)',lineHeight:1.8,maxWidth:280,fontSize:13 }}>
        {isNotReg?'برای استفاده از Mini App همیار باید ابتدا در ربات تلگرام ثبت‌نام کنید.':
         isPending?'ثبت‌نام شما دریافت شده و منتظر تأیید ادمین است.':
         isSuspended?'حساب کاربری شما تعلیق شده. برای رفع مشکل با پشتیبانی تماس بگیرید.':
         'مشکلی در اتصال رخ داد. چند دقیقه دیگر دوباره امتحان کنید.'}
      </div>
      {isNotReg && <div style={{ background:'var(--acc-soft)',border:'1px solid var(--bdg)',borderRadius:'var(--r-lg)',padding:14,maxWidth:280,width:'100%',fontSize:13,color:'var(--tx2)',lineHeight:1.7 }}>👈 ربات همیار را پیدا کن و /start بزن</div>}
    </div>
  );
}
