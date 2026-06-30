import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMembers } from '../api/org';

export default function MembersPage() {
  const { orgId } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    getMembers(orgId)
      .then(r => setMembers(r.members || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  const filtered = members.filter(m =>
    m.name?.includes(search) || m.handle?.includes(search)
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>👥 الأعضاء</h1>
        <span className="badge badge-purple">{members.length} عضو</span>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <input
          placeholder="🔍 ابحث عن عضو..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text)',
            padding: '10px 14px', width: '100%', fontSize: 14,
          }}
        />
      </div>

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">👥</div><p>لا يوجد أعضاء</p></div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>العضو</th>
                <th>اليوزرنيم</th>
                <th>الفرع</th>
                <th>الحالة</th>
                <th>تاريخ الانضمام</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--purple-l)', color: 'var(--purple)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, flexShrink: 0,
                      }}>{m.name?.[0] || '؟'}</div>
                      <strong>{m.name}</strong>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-3)' }}>@{m.handle}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{m.branch_id ? '—' : '—'}</td>
                  <td>
                    <span className={`badge ${m.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {m.status === 'active' ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 13 }}>
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString('ar-SA') : '—'}
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
