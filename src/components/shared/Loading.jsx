export function LoadingScreen() {
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100dvh',gap:16,background:'var(--bg)' }}>
      <div style={{ fontSize:52 }}>🏥</div>
      <div style={{ color:'var(--tx2)',fontSize:16,fontWeight:700 }}>همیار</div>
      <Spinner size={28} />
    </div>
  );
}

export function Spinner({ size = 24 }) {
  return (
    <div style={{ width:size,height:size,border:'2px solid var(--bd)',borderTop:'2px solid var(--acc)',borderRadius:'50%',animation:'spin .7s linear infinite' }} />
  );
}

export function SkeletonLine({ w='100%', h=16, mt=0 }) {
  return <div className="skeleton" style={{ width:w,height:h,marginTop:mt }} />;
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ display:'flex',flexDirection:'column',gap:10,marginBottom:10 }}>
      <SkeletonLine h={16} w="55%" />
      <SkeletonLine h={13} />
      <SkeletonLine h={13} w="75%" />
    </div>
  );
}
