import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyOrgs, getDashboard, createOrg } from '../api/org';
import './DashboardPage.css';

const ROLE_LABEL = { org_admin: 'مدير المنشأة', branch_admin: 'مدير الفرع', supervisor: 'مشرف', member: 'عضو' };
const ROLE_COLOR = { org_admin: 'purple', branch_admin: 'blue', supervisor: 'green', member: 'amber' };

const ORG_TYPES = [
  { value: 'school',  label: 'مدرسة' },
  { value: 'club',    label: 'نادي' },
  { value: 'center',  label: 'مركز' },
  { value: 'company', label: 'شركة' },
  { value: 'other',   label: 'أخرى' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [orgs,      setOrgs]      = useState([]);
  const [dashboard, setDashboard] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({ name: '', short_code: '', type: 'school', address: '', phone: '' });

  const load = () => {
    setLoading(true);
    Promise.all([getMyOrgs(), getDashboard()])
      .then(([orgsRes, dashRes]) => {
        setOrgs(orgsRes.organizations || []);
        setDashboard(dashRes.dashboard || []);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.name || !form.short_code) return toast.error('الاسم والرمز مطلوبان');
    if (form.short_code.length < 2 || form.short_code.length > 5)
      return toast.error('الرمز المختصر بين 2 و 5 أحرف');
    setSaving(true);
    try {
      await createOrg(form);
      toast.success('✅ تم إنشاء المنشأة');
      setShowModal(false);
      setForm({ name: '', short_code: '', type: 'school', address: '', phone: '' });
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;

  const getDash = orgId => dashboard.find(d => d.org_id === orgId);

  return (
    <div className="dashboard">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>منشآتي</h1>
          <p className="page-sub">اختر منشأة للدخول إلى لوحة التحكم</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ إنشاء منشأة</button>
      </div>

      {orgs.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏢</div>
          <p>لا توجد منشآت بعد</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            + إنشاء منشأة جديدة
          </button>
        </div>
      ) : (
        <div className="orgs-grid">
          {orgs.map(org => {
            const d = getDash(org.id);
            return (
              <div key={org.id} className="org-card" onClick={() => navigate(`/org/${org.id}/attendance`)}>
                <div className="org-card-header">
                  <div className="org-icon">{org.name[0]}</div>
                  <div>
                    <div className="org-name">{org.name}</div>
                    <div className="org-code">{org.short_code}</div>
                  </div>
                  <span className={`badge badge-${ROLE_COLOR[org.role] || 'purple'} role-badge`}>
                    {ROLE_LABEL[org.role] || org.role}
                  </span>
                </div>

                {d && (
                  <div className="org-today">
                    <div className="today-label">📅 اليوم</div>
                    <div className="today-stats">
                      <div className="stat-chip green">{d.today?.present || 0} حضر</div>
                      <div className="stat-chip red">{d.today?.absent || 0} غاب</div>
                      <div className="stat-chip amber">{d.today?.late || 0} تأخر</div>
                      {d.pending_exits > 0 && (
                        <div className="stat-chip purple">{d.pending_exits} خروج</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="org-actions">
                  <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/org/${org.id}/setup`); }}>⚙️ الإعداد</button>
                  <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/org/${org.id}/attendance`); }}>📋 الحضور</button>
                  <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/org/${org.id}/exits`); }}>🚪 الخروج</button>
                  <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/org/${org.id}/members`); }}>👥 الأعضاء</button>
                  <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/org/${org.id}/invitations`); }}>📨 الدعوات</button>
                  <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/org/${org.id}/guardians`); }}>👨‍👦 أولياء</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">🏢 إنشاء منشأة جديدة</div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>اسم المنشأة *</label>
                <input placeholder="مثال: أكاديمية النخبة" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="field">
                <label>الرمز المختصر * (2-5 أحرف)</label>
                <input placeholder="مثال: NKB" value={form.short_code} maxLength={5}
                  onChange={e => setForm(f => ({ ...f, short_code: e.target.value.toUpperCase() }))} required />
              </div>
              <div className="field">
                <label>نوع المنشأة</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>العنوان (اختياري)</label>
                <input placeholder="الرياض، حي النزهة" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="field">
                <label>رقم الجوال (اختياري)</label>
                <input placeholder="05xxxxxxxx" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جارٍ الإنشاء...' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
