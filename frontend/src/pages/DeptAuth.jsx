import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DeptAuth = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [staffName, setStaffName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail.trim(),
        password: loginPassword
      });

      if (res.role !== 'ROLE_DEPARTMENT') {
        setError('This account is registered under a different role. Please use the correct portal.');
        setLoading(false);
        return;
      }

      localStorage.setItem('user', JSON.stringify(res));
      navigate('/dept-dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials or approval status.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register/department', {
        staffName,
        staffId,
        department,
        email,
        password
      });

      setSuccessMsg(res.message || 'Department staff registered successfully! Account is PENDING admin approval.');
      setActiveTab('login');
      setLoginEmail(email);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏛️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Department Portal</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Faculty staff management & leave verification portal
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-card-subtle)', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
          <button 
            className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', border: 'none', background: activeTab === 'login' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : undefined }}
            onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
          >
            Staff Login
          </button>
          <button 
            className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px', border: 'none', background: activeTab === 'register' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : undefined }}
            onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
          >
            Register Staff
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', fontSize: '13px', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '13px', marginBottom: '20px' }}>
            ✅ {successMsg}
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Faculty Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                required 
                placeholder="staff@university.edu"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Login as Department Faculty'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Staff Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="Prof. Sarah Smith"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Staff ID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="EMP1024"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  className="form-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Tech">Information Tech</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Official Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                required 
                placeholder="staff@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }} disabled={loading}>
              {loading ? 'Submitting...' : 'Register Department Account'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            ← Back to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeptAuth;
