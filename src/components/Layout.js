import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const NAV = [
  { to: '/',        icon: '🏠', label: 'الرئيسية' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-m">M</span>
          <span className="logo-text">ماشي أورق</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.name?.[0] || '؟'}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-handle">@{user?.handle}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>خروج</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
