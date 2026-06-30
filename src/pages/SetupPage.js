import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getBranches, createBranch,
  getGroups, createGroup,
  getManualMembers, addManualMember, deleteManualMember,
} from '../api/org';

export default function SetupPage() {
  const { orgId } = useParams();
  const [branches, setBranches] = useState([]);
  const [expanded, setExpanded] = useState(null); // branch id
  const [groups,   setGroups]   = useState({});   // { branchId: [...] }
  const [members,  setMembers]  = useState({});   // { groupId: [...] }
  const [expGroup, setExpGroup] = useState(null); // group id

  // modals
  const [branchModal, setBranchModal] = useState(false);
  const [groupModal,  setGroupModal]  = useState(null); // branchId
  const [memberModal, setMemberModal] = useState(null); // groupId

  const [branchName, setBranchName] = useState('');
  const [groupName,  setGroupName]  = useState('');
  const [memberForm, setMemberForm] = useState({ name: '', phone: '', role: 'member' });
  const [saving, setSaving] = useState(false);

  // ─── Load branches ───────────────────────────
  const loadBranches = () =>
    getBranches(orgId).then(r => setBranches(r.branches || [])).catch(e => toast.error(e.message));

  useEffect(() => { loadBranches(); }, [orgId]); // eslint-disable-line

  // ─── Load groups for a branch ────────────────
  const loadGroups = async (branchId) => {
    if (groups[branchId]) return;
    try {
      const r = await getGroups(branchId);
      setGroups(g => ({ ...g, [branchId]: r.groups || [] }));
    } catch (e) { toast.error(e.message); }
  };

  const toggleBranch = (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    loadGroups(id);
  };

  // ─── Load members for a group ────────────────
  const loadMembers = async (groupId) => {
    if (members[groupId]) return;
    try {
      const r = await getManualMembers(groupId);
      setMembers(m => ({ ...m, [groupId]: r.members || [] }));
    } catch (e) { toast.error(e.message); }
  };

  const toggleGroup = (id) => {
    if (expGroup === id) { setExpGroup(null); return; }
    setExpGroup(id);
    loadMembers(id);
  };

  // ─── Create branch ───────────────────────────
  const handleCreateBranch = async e => {
    e.preventDefault();
    if (!branchName.trim()) return;
    setSaving(true);
    try {
      await createBranch(orgId, { name: branchName.trim() });
      toast.success('✅ تم إنشاء الفرع');
      setBranchName('');
      setBranchModal(false);
      setBranches([]);
      setGroups({});
      loadBranches();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // ─── Create group ────────────────────────────
  const handleCreateGroup = async e => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setSaving(true);
    try {
      await createGroup(groupModal, { name: groupName.trim() });
      toast.success('✅ تم إنشاء المجموعة');
      setGroupName('');
      setGroupModal(null);
      setGroups(g => ({ ...g, [groupModal]: undefined }));
      loadGroups(groupModal);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // ─── Add manual member ───────────────────────
  const handleAddMember = async e => {
    e.preventDefault();
    if (!memberForm.name.trim()) return toast.error('الاسم مطلوب');
    setSaving(true);
    try {
      const r = await addManualMember(memberModal, memberForm);
      toast.success('✅ تمت الإضافة');
      setMemberForm({ name: '', phone: '', role: 'member' });
      setMemberModal(null);
      setMembers(m => ({ ...m, [memberModal]: [...(m[memberModal] || []), r.member] }));
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteMember = async (groupId, memberId) => {
    if (!window.confirm('حذف العضو؟')) return;
    try {
      await deleteManualMember(memberId);
      setMembers(m => ({ ...m, [groupId]: m[groupId].filter(x => x.id !== memberId) }));
      toast.success('تم الحذف');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div style={{ maxWidth: 750 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>⚙️ إعداد المنشأة</h1>
        <button className="btn btn-primary" onClick={() => setBranchModal(true)}>+ فرع جديد</button>
      </div>

      {branches.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏗️</div>
          <p>لا توجد فروع بعد</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setBranchModal(true)}>
            + أضف أول فرع
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {branches.map(branch => (
            <div key={branch.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Branch header */}
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', cursor: 'pointer', background: 'var(--surface2)' }}
                onClick={() => toggleBranch(branch.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🏢</span>
                  <strong>{branch.name}</strong>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                    onClick={e => { e.stopPropagation(); setGroupModal(branch.id); setGroupName(''); }}>
                    + مجموعة
                  </button>
                  <span style={{ color: 'var(--text-3)' }}>{expanded === branch.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Groups */}
              {expanded === branch.id && (
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {!groups[branch.id] ? (
                    <div className="spinner" style={{ margin: '8px auto' }} />
                  ) : groups[branch.id].length === 0 ? (
                    <p style={{ color: 'var(--text-3)', fontSize: 13 }}>لا توجد مجموعات — اضغط "+ مجموعة" لإضافة</p>
                  ) : groups[branch.id].map(group => (
                    <div key={group.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                      {/* Group header */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', cursor: 'pointer', background: 'var(--bg)' }}
                        onClick={() => toggleGroup(group.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>👥</span>
                          <span style={{ fontWeight: 600 }}>{group.name}</span>
                          {members[group.id] && (
                            <span className="badge badge-purple">{members[group.id].length} عضو</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '3px 8px' }}
                            onClick={e => { e.stopPropagation(); setMemberModal(group.id); setMemberForm({ name: '', phone: '', role: 'member' }); }}>
                            + عضو
                          </button>
                          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{expGroup === group.id ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Members list */}
                      {expGroup === group.id && (
                        <div style={{ padding: '8px 14px 12px' }}>
                          {!members[group.id] ? (
                            <div className="spinner" style={{ margin: '8px auto' }} />
                          ) : members[group.id].length === 0 ? (
                            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>لا يوجد أعضاء — اضغط "+ عضو"</p>
                          ) : (
                            <table style={{ width: '100%', fontSize: 13 }}>
                              <thead>
                                <tr style={{ color: 'var(--text-3)' }}>
                                  <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>الاسم</th>
                                  <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>الجوال</th>
                                  <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>الدور</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {members[group.id].map(m => (
                                  <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '6px 0' }}><strong>{m.name}</strong></td>
                                    <td style={{ color: 'var(--text-2)', direction: 'ltr' }}>{m.phone || '—'}</td>
                                    <td>
                                      <span className={`badge ${m.role === 'supervisor' ? 'badge-blue' : 'badge-green'}`}>
                                        {m.role === 'supervisor' ? 'مشرف' : 'طالب'}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'left' }}>
                                      <button
                                        onClick={() => handleDeleteMember(group.id, m.id)}
                                        style={{ color: 'var(--red)', background: 'none', fontSize: 16, cursor: 'pointer' }}>
                                        ✕
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Branch Modal */}
      {branchModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setBranchModal(false)}>
          <div className="modal">
            <div className="modal-title">🏢 فرع جديد</div>
            <form onSubmit={handleCreateBranch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>اسم الفرع *</label>
                <input placeholder="مثال: الفرع الرئيسي" value={branchName}
                  onChange={e => setBranchName(e.target.value)} autoFocus required />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setBranchModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جارٍ...' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {groupModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setGroupModal(null)}>
          <div className="modal">
            <div className="modal-title">👥 مجموعة جديدة</div>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>اسم المجموعة *</label>
                <input placeholder="مثال: الفصل الأول" value={groupName}
                  onChange={e => setGroupName(e.target.value)} autoFocus required />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setGroupModal(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جارٍ...' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {memberModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setMemberModal(null)}>
          <div className="modal">
            <div className="modal-title">➕ إضافة عضو</div>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>الاسم *</label>
                <input placeholder="اسم الطالب أو المشرف" value={memberForm.name}
                  onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))} autoFocus required />
              </div>
              <div className="field">
                <label>رقم الجوال (اختياري)</label>
                <input placeholder="05xxxxxxxx" value={memberForm.phone}
                  onChange={e => setMemberForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="field">
                <label>الدور</label>
                <select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="member">طالب</option>
                  <option value="supervisor">مشرف</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setMemberModal(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جارٍ...' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
