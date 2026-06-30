import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getBranches, getExitsByDate, respondExit } from '../api/org';

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function ExitRequestsPage() {
  const { orgId } = useParams();
  const [date,     setDate]     = useState(todayStr());
  const [branches, setBranches] = useState([]);
  const [selBranch,setSelBranch]= useState('');
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    getBranches(orgId).then(r => setBranches(r.branches || [])).catch(() => {});
  }, [orgId]);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, selBranch]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getExitsByDate(orgId, date, selBranch || undefined);
      setRequests(res.requests || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const respond = async (id, decision) => {
    try {
      await respondExit(id, decision);
      toast.success(decision === 'approved' ? '✓ تمت الموافقة' : '✗ تم الرفض');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const decisionBadge = (d) => {
    if (d === 'approved') return <span className="badge badge-green">موافق</span>;
    if (d === 'refused')  return <span className="badge badge-red">مرفوض</span>;
    return <span className="badge badge-amber">في الانتظار</span>;
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <h1>🚪 طلبات الخروج</h1>
      </div>

      <div className="card" style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>التاريخ</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>الفرع</label>
          <select value={selBranch} onChange={e => setSelBranch(e.target.value)}>
            <option value="">الكل</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="spinner" /> : requests.length === 0 ? (
        <div className="empty-state"><div className="icon">🚪</div><p>لا توجد طلبات لهذا اليوم</p></div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>الطالب</th>
                <th>المجموعة</th>
                <th>السبب</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.member_name}</strong></td>
                  <td>{r.group_name}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{r.reason || '—'}</td>
                  <td>{decisionBadge(r.guardian_decision)}</td>
                  <td>
                    {r.guardian_decision === 'pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => respond(r.id, 'approved')}>✓ موافقة</button>
                        <button className="btn btn-danger  btn-sm" onClick={() => respond(r.id, 'refused')}>✗ رفض</button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-3)', fontSize: 13 }}>
                        {r.decided_at ? new Date(r.decided_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
