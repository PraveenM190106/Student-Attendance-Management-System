import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page" style={{ flexDirection: 'column', textAlign: 'center' }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ marginBottom: '40px' }}>
          <div 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px', 
              fontSize: '36px', 
              color: '#fff',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)'
            }}
          >
            🎓
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
            Smart Attendance Monitoring System
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Next-generation automated attendance tracking powered by facial recognition, real-time timer sessions, automated leave certificates, and student career profiles.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginTop: '40px' }}>
          {/* Student Portal Card */}
          <div className="glass-panel" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>👨‍🎓</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Student Portal</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', flex: 1 }}>
              Register, mark attendance during active timer sessions, apply for leaves, and submit assignments.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => navigate('/student-auth')}
            >
              Student Portal
            </button>
          </div>

          {/* Department Portal Card */}
          <div className="glass-panel" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏛️</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Department Portal</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', flex: 1 }}>
              Staff portal to view students, verify leave requests, generate leave letters, and grade assignments.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
              onClick={() => navigate('/dept-auth')}
            >
              Department Portal
            </button>
          </div>

          {/* Admin Portal Card */}
          <div className="glass-panel" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🛡️</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Admin Portal</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', flex: 1 }}>
              System administration, student & department approval management, and attendance timer control.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}
              onClick={() => navigate('/admin-auth')}
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
