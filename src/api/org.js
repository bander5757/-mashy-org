import api from './axios';

// ─── Auth ──────────────────────────────────────
export const login = (identifier, password) =>
  api.post('/auth/login', { identifier, password });

// ─── المنشآت ───────────────────────────────────
export const getMyOrgs      = ()     => api.get('/orgs/mine');
export const getOrg         = (id)   => api.get(`/orgs/${id}`);
export const getDashboard   = ()     => api.get('/orgs/dashboard');
export const getMyRole      = (id)   => api.get(`/orgs/${id}/my-role`);
export const createOrg      = (data) => api.post('/orgs', data);

// ─── الفروع ────────────────────────────────────
export const getBranches    = (orgId)        => api.get(`/orgs/${orgId}/branches`);
export const createBranch   = (orgId, data)  => api.post(`/orgs/${orgId}/branches`, data);

// ─── المجموعات ─────────────────────────────────
export const getGroups      = (branchId)       => api.get(`/orgs/branches/${branchId}/groups`);
export const createGroup    = (branchId, data) => api.post(`/orgs/branches/${branchId}/groups`, data);

// ─── الأعضاء ───────────────────────────────────
export const getMembers     = (orgId)    => api.get(`/orgs/${orgId}/members`);
export const searchUsers    = (query)    => api.get(`/orgs/users/search?query=${query}`);

// ─── الدعوات ───────────────────────────────────
export const getInvitations  = (orgId) => api.get(`/orgs/invitations?org_id=${orgId}`);
export const createInvitation = (data) => api.post('/orgs/invitations', data);

// ─── الحضور ────────────────────────────────────
export const getAttendance   = (groupId, date) =>
  api.get(`/orgs/groups/${groupId}/attendance?date=${date}`);
export const recordAttendance = (data) => api.post('/orgs/attendance', data);

// ─── طلبات الخروج ──────────────────────────────
export const getPendingExits  = (groupId)        => api.get(`/orgs/groups/${groupId}/exit-requests/pending`);
export const getExitsByDate   = (orgId, date, branchId) =>
  api.get(`/orgs/${orgId}/exit-requests?date=${date}${branchId ? `&branch_id=${branchId}` : ''}`);
export const respondExit      = (id, decision)   => api.patch(`/orgs/exit-requests/${id}/respond`, { decision });

// ─── ولي الأمر ─────────────────────────────────
export const getGuardianLinks  = (orgId)  => api.get(`/orgs/${orgId}/guardian-links`);
export const addGuardianLink   = (data)   => api.post('/orgs/guardian-links', data);
export const verifyGuardianLink = (id)    => api.patch(`/orgs/guardian-links/${id}/verify`, {});
