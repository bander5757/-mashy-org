import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage        from './pages/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import AttendancePage   from './pages/AttendancePage';
import MembersPage      from './pages/MembersPage';
import InvitationsPage  from './pages/InvitationsPage';
import GuardiansPage    from './pages/GuardiansPage';
import ExitRequestsPage from './pages/ExitRequestsPage';
import Layout           from './components/Layout';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="org/:orgId/attendance"  element={<AttendancePage />} />
        <Route path="org/:orgId/members"     element={<MembersPage />} />
        <Route path="org/:orgId/invitations" element={<InvitationsPage />} />
        <Route path="org/:orgId/guardians"   element={<GuardiansPage />} />
        <Route path="org/:orgId/exits"       element={<ExitRequestsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1A1A2E', color: '#fff',
              fontFamily: 'Cairo, sans-serif',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
