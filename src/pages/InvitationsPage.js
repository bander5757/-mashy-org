import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getInvitations, createInvitation, getBranches, getGroups } from '../api/org';

const ROLES = [
  { value: 'member',       label: 'طالب' },
  { value: 'supervisor',   label: 'مشرف' },
  { value: 'branch_admin', label: 'مدير فرع' },
];

const STATUS_MAP = {
  pending:  { label: 'فعّال',  cls: 'badge-amber' },
  accepted: { label: 'مُقبل', cls: 'badge-green' },
  expired:  { label: 'منتهي', cls: 'badge-red' },
};

export default function InvitationsPage() {
  const { orgId } = useParams();
  const [invitations, setInvitations] = useState([]);
  const [branches,    setBranches]    = useState([]);
  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [form, setForm] = useState({ role: 'member', branch_id: '', group_id: '' });
  const [saving, setSaving] = useState(false);
  const [newCode, setNewCode] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getInvitations(orgId), getBranches(orgId)])
      .then(([invRes, brRes]) => {
        setInvitations(invRes.invitations || []);
        setBranches(brRes.branches || []);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [orgId]); // eslint-disable-line

  const loadGroups = async (branchId) => {
    if (!branchId) { setGroups([]); return; }
    try { setGroups((await getGroups(branchId)).groups || []); }
    catch { setGroups([]); }
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createInvitation({ org_id: orgId, ...form });
      setNewCode(res.invitation?.code);
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>📨 الدعوات</h1>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setNewCode(null); }}>
          + دعوة جديدة
        </button>
      </div>

      {newCode && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--green)', textAlign: 'center' }}>
          <p style={{ color: 'var(--green)', marginBottom: 12, fontWeight: 700 }}>✓ تم إنشاء كود الدعوة</p>
          <div style={{
            fontSize: 32, fontWeight: 900, letterSpacing: 10,
            background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '16px 24px',
            display: 'inline-block', cursor: 'pointer',
          }} onClick={() => copy(newCode)}>{newCode}</div>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 8 }}>اضغط للنسخ</p>
        </div>
      )}

      {loading ? <div className="spinner" /> : invitations.length === 0 ? (
        <div className="empty-state"><div className="icon">📨</div><p>لا توجد دعوات بعد</p></div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>الكود</th><th>الدور</th><th>المجموعة</th><th>الحالة</th><th>الصلاحية</th></tr>
            </thead>
            <tbody>
              {invitations.map(inv => {
                const s = STATUS_MAP[inv.status] || STATUS_MAP.pending;
                return (
                  <tr key={inv.id}>
                    <td>
                      <strong style={{ letterSpacing: 4, cursor: 'pointer' }} onClick={() => copy(inv.code)}>
                        {inv.code}
                      </strong>
                    </td>
                    <td>{ROLES.find(r => r.value === inv.role)?.label || inv.role}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{inv.group_name || '—'}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td style={{ color: 'var(--text-3)', fontSize: 13 }}>
                      {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('ar-SA') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">دعوة جديدة</div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label>الدور</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>الفرع (اختياري)</label>
                <select value={form.branch_id} onChange={e => {
                  setForm(f => ({ ...f, branch_id: e.target.value, group_id: '' }));
                  loadGroups(e.target.value);
                }}>
                  <option value="">بدون فرع</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              {groups.length > 0 && (
                <div className="field">
                  <label>المجموعة (اختياري)</label>
                  <select value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))}>
                    <option value="">بدون مجموعة</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جارٍ الإنشاء...' : 'إنشاء الكود'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
