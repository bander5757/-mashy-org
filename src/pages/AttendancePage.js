import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getBranches, getGroups, getAttendance, recordAttendance } from '../api/org';
import './AttendancePage.css';

const STATUS_CONFIG = {
  present: { label: 'حاضر',  color: 'green',  emoji: '✅' },
  absent:  { label: 'غائب',  color: 'red',    emoji: '❌' },
  late:    { label: 'متأخر', color: 'amber',  emoji: '⏰' },
  excused: { label: 'معذور', color: 'blue',   emoji: '📋' },
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function AttendancePage() {
  const { orgId } = useParams();
  const [date,       setDate]       = useState(todayStr());
  const [branches,   setBranches]   = useState([]);
  const [groups,     setGroups]     = useState([]);
  const [members,    setMembers]    = useState([]);
  const [statuses,   setStatuses]   = useState({});
  const [selBranch,  setSelBranch]  = useState('');
  const [selGroup,   setSelGroup]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [loadingG,   setLoadingG]   = useState(false);
  const [loadingM,   setLoadingM]   = useState(false);

  useEffect(() => {
    getBranches(orgId).then(r => setBranches(r.branches || [])).catch(e => toast.error(e.message));
  }, [orgId]);

  const loadGroups = useCallback(async (branchId) => {
    setLoadingG(true); setGroups([]); setMembers([]); setSelGroup('');
    try { setGroups((await getGroups(branchId)).groups || []); }
    catch (e) { toast.error(e.message); }
    finally { setLoadingG(false); }
  }, []);

  const loadMembers = useCallback(async (groupId, d) => {
    setLoadingM(true); setMembers([]);
    try {
      const res = await getAttendance(groupId, d);
      const list = res.members || [];
      setMembers(list);
      const init = {};
      list.forEach(m => { init[m.id] = m.status || 'absent'; });
      setStatuses(init);
    } catch (e) { toast.error(e.message); }
    finally { setLoadingM(false); }
  }, []);

  const markAll = (status) =>
    setStatuses(prev => Object.fromEntries(Object.keys(prev).map(k => [k, status])));

  const save = async () => {
    if (!selGroup || !members.length) return;
    setSaving(true);
    try {
      const records = members.map(m => ({ user_id: m.id, status: statuses[m.id] || 'absent' }));
      await recordAttendance({ group_id: selGroup, attendance_date: date, records });
      toast.success('✓ تم حفظ الحضور');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const summary = Object.values(statuses).reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1; return acc;
  }, {});

  return (
    <div className="att-page">
      <div className="page-header">
        <h1>📋 تسجيل الحضور</h1>
      </div>

      {/* شريط الفلاتر */}
      <div className="att-filters card">
        <div className="field">
          <label>التاريخ</label>
          <input type="date" value={date} onChange={e => {
            setDate(e.target.value);
            if (selGroup) loadMembers(selGroup, e.target.value);
          }} />
        </div>
        <div className="field">
          <label>الفرع</label>
          <select value={selBranch} onChange={e => {
            setSelBranch(e.target.value); setSelGroup('');
            if (e.target.value) loadGroups(e.target.value);
          }}>
            <option value="">اختر الفرع</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>المجموعة</label>
          <select value={selGroup} disabled={loadingG || !selBranch} onChange={e => {
            setSelGroup(e.target.value);
            if (e.target.value) loadMembers(e.target.value, date);
          }}>
            <option value="">{loadingG ? 'جارٍ التحميل...' : 'اختر المجموعة'}</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {/* ملخص اليوم */}
      {members.length > 0 && (
        <div className="att-summary">
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <div key={k} className={`summary-chip ${v.color}`}>
              <span>{v.emoji}</span>
              <span>{summary[k] || 0}</span>
              <span>{v.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* أزرار تحديد الكل */}
      {members.length > 0 && (
        <div className="att-bulk-actions">
          <span style={{ color: 'var(--text-2)', fontSize: 13 }}>تحديد الكل:</span>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <button key={k} className={`btn btn-sm bulk-btn ${v.color}`} onClick={() => markAll(k)}>
              {v.emoji} {v.label}
            </button>
          ))}
          <button
            className="btn btn-success"
            onClick={save}
            disabled={saving}
            style={{ marginRight: 'auto' }}
          >
            {saving ? 'جارٍ الحفظ...' : '💾 حفظ الحضور'}
          </button>
        </div>
      )}

      {/* قائمة الطلاب */}
      {loadingM ? <div className="spinner" /> : members.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <p>{selGroup ? 'لا يوجد طلاب في هذه المجموعة' : 'اختر فرعاً ومجموعة أولاً'}</p>
        </div>
      ) : (
        <div className="att-list card">
          {members.map(m => {
            const s = statuses[m.id] || 'absent';
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={m.id} className={`att-row ${s}`}>
                <div className="att-avatar">{m.name?.[0] || '؟'}</div>
                <div className="att-info">
                  <div className="att-name">{m.name}</div>
                  <div className="att-handle">@{m.handle}</div>
                </div>
                <div className="att-buttons">
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <button
                      key={k}
                      className={`status-btn ${k} ${s === k ? 'active' : ''}`}
                      onClick={() => setStatuses(prev => ({ ...prev, [m.id]: k }))}
                      title={v.label}
                    >
                      {v.emoji}
                    </button>
                  ))}
                </div>
                <span className={`badge badge-${cfg.color}`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
