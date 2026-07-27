// ═══════════════════════════════════════════════
// 🔔 Notifications Page
// ═══════════════════════════════════════════════
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Header from '../../components/layout/Header';
import { SkeletonCard } from '../../components/shared/Loading';
import { haptic } from '../../lib/telegram';
import { useUIStore } from '../../stores/uiStore';

export function Notifications() {
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notif-settings'],
    queryFn: () => api.get('/api/notifications/settings').then(r => r.data.settings),
    staleTime: 1000 * 60 * 5,
  });

  const update = useMutation({
    mutationFn: settings => api.patch('/api/notifications/settings', { settings }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif-settings'] }),
  });

  const toggleAll = useMutation({
    mutationFn: enabled => api.patch('/api/notifications/settings/all', { enabled }).then(r => r.data),
    onSuccess: (_, enabled) => { toast(enabled?'🔔 همه روشن شد':'🔕 همه خاموش شد','success'); qc.invalidateQueries({ queryKey: ['notif-settings'] }); },
  });

  const allOn = data?.every(n => n.enabled);

  return (
    <>
      <Header title="🔔 اعلان‌ها" />
      <div className="page fade-up">
        <div style={{ display:'flex',gap:8,marginBottom:14 }}>
          <button className="btn btn-g" style={{ flex:1 }} disabled={toggleAll.isPending} onClick={() => toggleAll.mutate(true)}>🔔 همه روشن</button>
          <button className="btn btn-g" style={{ flex:1 }} disabled={toggleAll.isPending} onClick={() => toggleAll.mutate(false)}>🔕 همه خاموش</button>
        </div>
        <div className="card" style={{ padding:'0 14px' }}>
          {isLoading ? <SkeletonCard /> : data?.map((item, i) => (
            <div key={item.key} style={{ display:'flex',alignItems:'center',padding:'12px 0',borderBottom:i<data.length-1?'1px solid var(--bd)':'none' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600,fontSize:13.5 }}>{item.label}</div>
                <div style={{ fontSize:11,color:'var(--txm)',marginTop:1 }}>{item.desc}</div>
              </div>
              <label className="toggle-wrap">
                <input type="checkbox" checked={item.enabled} onChange={e => { haptic(); update.mutate({ [item.key]: e.target.checked }); }} />
                <span className="toggle-sl" />
              </label>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop:13,background:'var(--acc-soft)',borderColor:'var(--bdg)' }}>
          <div style={{ fontSize:12,color:'var(--tx2)',lineHeight:1.7 }}>💡 اعلان‌ها از طریق ربات تلگرام ارسال می‌شوند. مطمئن شوید ربات را block نکرده باشید.</div>
        </div>
      </div>
    </>
  );
}
