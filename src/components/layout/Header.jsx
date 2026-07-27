export default function Header({ title, subtitle, right }) {
  return (
    <div style={{ background:'linear-gradient(135deg,var(--elev),rgba(59,130,246,.06))',borderBottom:'1px solid var(--bd)',padding:'13px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'fixed',top:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,zIndex:100,height:'var(--hdr-h)' }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:16,fontWeight:800,color:'var(--tx)' }}>{title}</div>
        {subtitle && <div style={{ fontSize:11,color:'var(--txm)',marginTop:1 }}>{subtitle}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
