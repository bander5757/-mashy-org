import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyOrgs, getDashboard } from '../api/org';
import './DashboardPage.css';

const ROLE_LABEL = { org_admin: 'مدير المنشأة', branch_admin: 'مدير الفرع', supervisor: 'مشرف', member: 'عضو' };
const ROLE_COLOR = { org_admin: 'purple', branch_admin: 'blue', supervisor: 'green', member: 'amber' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const [orgs,      setOrgs]      = useState([]);
  const [dashboard, setDashboard] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getMyOrgs(), getDashboard()])
      .then(([orgsRes, dashRes]) => {
        setOrgs(orgsRes.organizations || []);
        setDashboard(dashRes.dashboard || []);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const getDash = orgId => dashboard.find(d => d.org_id === orgId);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>منشآتي</h1>
        <p className="page-sub">اختر منشأة للدخول إلى لوحة التحكم</p>
      </div>

      {orgs.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏢</div>
          <p>لا توجد منشآت مرتبطة بحسابك</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>انضم عبر كود الدعوة من التطبيق</p>
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
    </div>
  );
}
