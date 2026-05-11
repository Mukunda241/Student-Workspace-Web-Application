import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { IcoGraduation, IcoDashboard, IcoCheckSquare, IcoFileText, IcoTrophy } from '../utils/icons';
import '../styles/auth.css';

export const Login = () => {
  const navigate = useNavigate();
  const { login, error: ctxErr } = useContext(AuthContext);
  const [form, setForm]     = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState('');

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!form.email || !form.password) { setErr('All fields are required'); return; }
    try {
      setLoading(true);
      await login(form);
      navigate('/dashboard');
    } catch (e) {
      setErr(e.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-inner">
          <div className="auth-logo"><IcoGraduation size={28}/></div>
          <h1 className="auth-h">Student Workspace</h1>
          <p className="auth-sub">Your all-in-one academic productivity platform — manage projects, tasks, notes and contests.</p>
          <div className="auth-features">
            {[
              { Icon: IcoDashboard,   text: 'Real-time academic dashboard' },
              { Icon: IcoCheckSquare, text: 'Kanban tasks with Pomodoro timer' },
              { Icon: IcoFileText,    text: 'Markdown notes with auto-save' },
              { Icon: IcoTrophy,      text: 'Live coding contest tracker' },
            ].map(({ Icon, text }, i) => (
              <div key={i} className="auth-feat">
                <div className="auth-feat-icon"><Icon size={17}/></div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <h1>Welcome back</h1>
        <h2>Sign in to your account</h2>
        {(err||ctxErr) && <div className="form-error">{err||ctxErr}</div>}
        <form className="auth-form" onSubmit={submit}>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" value={form.email} placeholder="you@example.com" disabled={loading}
              onChange={e => setForm(p=>({...p,email:e.target.value}))} required/>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} placeholder="Your password" disabled={loading}
              onChange={e => setForm(p=>({...p,password:e.target.value}))} required/>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-auth">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="auth-link">No account? <a href="/register">Create one free</a></p>
      </div>
    </div>
  );
};
export default Login;
