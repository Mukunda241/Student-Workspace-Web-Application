import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { IcoGraduation, IcoDashboard, IcoCheckSquare, IcoFileText, IcoTrophy } from '../utils/icons';
import '../styles/auth.css';

export const Register = () => {
  const navigate = useNavigate();
  const { register, error: ctxErr } = useContext(AuthContext);
  const [form, setForm]       = useState({ firstName:'', lastName:'', email:'', password:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const ch = (k) => (e) => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!form.firstName||!form.lastName||!form.email||!form.password) { setErr('All fields required'); return; }
    if (form.password.length < 6) { setErr('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match'); return; }
    try {
      setLoading(true);
      await register({ name:`${form.firstName} ${form.lastName}`, email:form.email, password:form.password });
      navigate('/dashboard');
    } catch (e) {
      setErr(e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-inner">
          <div className="auth-logo"><IcoGraduation size={28}/></div>
          <h1 className="auth-h">Join Workspace</h1>
          <p className="auth-sub">Free forever. Start organising your academic life today.</p>
          <div className="auth-features">
            {[
              { Icon: IcoDashboard,   text: 'Personal academic dashboard' },
              { Icon: IcoCheckSquare, text: 'Kanban + Pomodoro task manager' },
              { Icon: IcoFileText,    text: 'Markdown note editor' },
              { Icon: IcoTrophy,      text: 'Contest tracker & reminders' },
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
        <h1>Create account</h1>
        <h2>Free forever, no credit card needed</h2>
        {(err||ctxErr) && <div className="form-error">{err||ctxErr}</div>}
        <form className="auth-form" onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <input value={form.firstName} placeholder="John" disabled={loading} onChange={ch('firstName')} required/>
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input value={form.lastName} placeholder="Doe" disabled={loading} onChange={ch('lastName')} required/>
            </div>
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" value={form.email} placeholder="you@example.com" disabled={loading} onChange={ch('email')} required/>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} placeholder="Min. 6 characters" disabled={loading} onChange={ch('password')} required/>
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input type="password" value={form.confirm} placeholder="Repeat password" disabled={loading} onChange={ch('confirm')} required/>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-auth">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <a href="/login">Sign in</a></p>
      </div>
    </div>
  );
};
export default Register;
