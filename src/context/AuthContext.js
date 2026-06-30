import { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin } from '../api/org';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('org_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('org_token'));

  const login = useCallback(async (identifier, password) => {
    const res = await apiLogin(identifier, password);
    const t = res.token || res.data?.token;
    const u = res.user  || res.data?.user;
    if (!t) throw new Error('لم يُستلم توكن');
    localStorage.setItem('org_token', t);
    localStorage.setItem('org_user',  JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('org_token');
    localStorage.removeItem('org_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
