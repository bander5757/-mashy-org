import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.identifier || !form.password) return toast.error('أدخل البيانات');
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-m" style={{ width: 56, height: 56, fontSize: 26 }}>M</div>
          <h1>ماشي أورق</h1>
          <p>لوحة تحكم المنشآت</p>
        </div>

        <form onSubmit={submit} className="login-form">
          <div className="field">
            <label>البريد الإلكتروني أو اليوزرنيم</label>
            <input
              name="identifier"
              value={form.identifier}
              onChange={handle}
              placeholder="example@email.com"
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label>كلمة المرور</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handle}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
