import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getGuardianLinks, addGuardianLink, verifyGuardianLink, searchUsers } from '../api/org';

const STATUS_MAP = {
  pending:  { label: 'في الانتظار', cls: 'badge-amber' },
  active:   { label: 'مفعّل',       cls: 'badge-green' },
  rejected: { label: 'مرفوض',       cls: 'badge-red' },
  revoked:  { label: 'ملغي',        cls: 'badge-red' },
};

export default function GuardiansPage() {
  const { orgId } = useParams();
  const [links,     setLinks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [form, setForm] = useState({
    ward_user_id: '', ward_name: '',
    guardian_phone: '', guardian_name: '',
    notification_channel: 'sms',
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getGuardianLinks(orgId)
      .then(r => setLinks(r.links || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [orgId]); // eslint-disable-line

  const search = async (q) => {
    setUserQuery(q);
    if (q.length < 2) { setUserResults([]); return; }
    try { setUserResults((await searchUsers(q)).users || []); }
    catch { setUserResults([]); }
  };

  const selectUser = (u) => {
    setForm(f => ({ ...f, ward_user_id: u.id, ward_name: u.name }));
    setUserQuery(u.name);
    setUserResults([]);
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.ward_user_id || !form.guardian_phone) return toast.error('الحقول المطلوبة ناقصة');
    setSaving(true);
    try {
      await addGuardianLink({ org_id: orgId, ...form });
      toast.success('✓ تم إضافة ولي الأمر وإرسال رسالة ترحيب');
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const verify = async (id) => {
    try {
      await verifyGuardianLink(id);
      toast.success('✓ تم تفعيل الربط');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>👨‍👦 أولياء الأمور</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ إضافة ربط</button>
      </div>

      {loading ? <div className="spinner" /> : links.length === 0 ? (
        <div className="empty-state"><div className="icon">👨‍👦</div><p>لا توجد روابط بعد</p></div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>الطالب</th><th>ولي الأمر</th><th>الجوال</th><th>القناة</th><th>الحالة</th><th>إجراء</th></tr>
            </thead>
            <tbody>
              {links.map(l => {
                const s = STATUS_MAP[l.status] || STATUS_MAP.pending;
                return (
                  <tr key={l.id}>
                    <td><strong>{l.ward_name}</strong></td>
                    <td>{l.guardian_name || l.guardian_name_user || '—'}</td>
                    <td style={{ direction: 'ltr', textAlign: 'left' }}>{l.guardian_phone}</td>
                    <td>
                      <span className="badge badge-blue">
                        {l.notification_channel === 'sms' ? '📱 SMS' : l.notification_channel === 'whatsapp' ? '💬 واتساب' : '📲 تطبيق'}
                      </span>
                    </td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td>
                      {l.status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => verify(l.id)}>تفعيل</button>
                      )}
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
            <div className="modal-title">ربط ولي أمر بطالب</div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="field" style={{ position: 'relative' }}>
                <label>الطالب</label>
                <input
                  placeholder="ابحث عن الطالب..."
                  value={userQuery}
                  onChange={e => search(e.target.value)}
                  autoComplete="off"
                />
                {userResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, left: 0,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', zIndex: 10, overflow: 'hidden',
                  }}>
                    {userResults.map(u => (
                      <div key={u.id}
                        onClick={() => selectUser(u)}
                        style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 14 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {u.name} <span style={{ color: 'var(--text-3)' }}>@{u.handle}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="field">
                <label>اسم ولي الأمر</label>
                <input placeholder="محمد أحمد" value={form.guardian_name}
                  onChange={e => setForm(f => ({ ...f, guardian_name: e.target.value }))} />
              </div>
              <div className="field">
                <label>جوال ولي الأمر *</label>
                <input placeholder="05xxxxxxxx" value={form.guardian_phone}
                  onChange={e => setForm(f => ({ ...f, guardian_phone: e.target.value }))} required />
              </div>
              <div className="field">
                <label>قناة الإشعار</label>
                <select value={form.notification_channel}
                  onChange={e => setForm(f => ({ ...f, notification_channel: e.target.value }))}>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">واتساب</option>
                  <option value="app">التطبيق</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جارٍ الإضافة...' : 'إضافة وإرسال SMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
