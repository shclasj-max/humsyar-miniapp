import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard } from '../../components/shared/Loading';

export default function Grades() {
  const { data, isLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: () => api.get('/api/grades').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const gradeColor = s => s >= 17 ? 'var(--ok)' : s >= 14 ? 'var(--warn)' : 'var(--err)';
  const gradeLabel = s => s >= 17 ? 'عالی' : s >= 14 ? 'خوب' : 'ضعیف';

  return (
    <>
      <Header title="📊 نمرات من" />
      <div className="page fade-up">
        {isLoading ? (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : !data?.grades?.length ? (
          <div className="empty">
            <div style={{ fontSize:44,marginBottom:12 }}>📊</div>
            <div>هنوز هیچ نمره‌ای ثبت نشده</div>
            <div style={{ fontSize:12,color:'var(--txm)',marginTop:8 }}>ادمین محتوا نمرات را وارد می‌کند</div>
          </div>
        ) : (
          <>
            {/* کارت میانگین */}
            <div className="card card-glow" style={{ textAlign:'center',padding:22,marginBottom:14 }}>
              <div style={{ fontSize:38,fontWeight:800,color:gradeColor(data.avg) }}>{data.avg?.toFixed(2)}</div>
              <div style={{ color:'var(--txm)',fontSize:13,marginTop:4 }}>میانگین کل / ۲۰</div>
              <div style={{ marginTop:12 }}>
                <div className="pbar">
                  <div className="pbar-f" style={{ width:`${(data.avg/20)*100}%`,background:gradeColor(data.avg) }} />
                </div>
              </div>
            </div>

            <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
              {data.grades.map(g => {
                const c = gradeColor(g.score);
                return (
                  <div key={g.id} className="card">
                    <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                      <div style={{ width:52,height:52,borderRadius:'var(--r-md)',background:c+'18',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <div style={{ fontSize:17,fontWeight:800,color:c }}>{g.score}</div>
                        <div style={{ fontSize:8.5,color:'var(--txm)' }}>از {g.max_score}</div>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:700,fontSize:14 }}>{g.lesson}</div>
                        <div style={{ fontSize:12,color:'var(--tx2)',marginTop:2 }}>{g.exam_title}</div>
                        <div style={{ fontSize:11,color:'var(--txm)',marginTop:3 }}>{g.exam_date}</div>
                      </div>
                      <div style={{ padding:'5px 10px',borderRadius:'var(--r-sm)',background:c+'14',fontSize:12,fontWeight:800,color:c }}>
                        {gradeLabel(g.score)}
                      </div>
                    </div>
                    {/* progress برای این نمره */}
                    <div style={{ marginTop:10 }}>
                      <div className="pbar">
                        <div className="pbar-f" style={{ width:`${g.percentage}%`,background:c }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
