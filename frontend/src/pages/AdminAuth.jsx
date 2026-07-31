import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminAuth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('praveenbeece098@gmail.com');
  const [password, setPassword] = useState('Praveen2006@');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password
      });

      if (!res || typeof res !== 'object' || String(res.role).toUpperCase() !== 'ROLE_ADMIN') {
        setError('Unauthorized. Only the System Administrator can log in here.');
        setLoading(false);
        return;
      }

      localStorage.setItem('user', JSON.stringify(res));
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Admin Portal</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            System Administrator Authentication
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', fontSize: '13px', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label className="form-label">Admin Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Admin Password</label>
            <input 
              type="password" 
              className="form-input" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }} disabled={loading}>
            {loading ? 'Authenticating Admin...' : 'Login as Admin'}
          </button>
        </form>

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

export default AdminAuth;
