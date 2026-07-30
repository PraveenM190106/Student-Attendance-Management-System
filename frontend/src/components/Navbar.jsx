import React, { useState } from 'react';
import { Menu, Bell, User as UserIcon, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const [darkTheme, setDarkTheme] = useState(false);

  const toggleTheme = () => {
    const nextTheme = !darkTheme;
    setDarkTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme ? 'dark' : 'light');
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px 12px' }}
        >
          <Menu size={20} />
        </button>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Academic Session 2026-2027
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          title="Toggle Dark/Light Mode"
          style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
        >
          {darkTheme ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
        </button>

        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={20} color="var(--text-muted)" />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent-rose)'
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700
          }}>
            {user?.fullName ? user.fullName.charAt(0) : 'U'}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{user?.fullName || 'Teacher / Admin'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.role || 'ROLE_TEACHER'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
