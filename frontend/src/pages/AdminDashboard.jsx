import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'users', 'session'

  // Data states
  const [pendingDepartments, setPendingDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [deptStats, setDeptStats] = useState({ totalDepartments: 0, totalStudents: 0, departmentStudentCounts: {} });
  
  // Session State
  const [workingDay, setWorkingDay] = useState('Day 1');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [activeSessionInfo, setActiveSessionInfo] = useState({ active: false, remainingSeconds: 0, workingDay: 'Day 1' });

  // Modal Edit User State
  const [editUser, setEditUser] = useState(null);

  // Notifications
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/admin-auth');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'ROLE_ADMIN') {
      navigate('/admin-auth');
      return;
    }
    setAdminUser(user);
    loadDashboardData();
  }, [navigate]);

  // Live Timer Countdown - Runs local 1s tick ONLY when session is active
  useEffect(() => {
    if (!activeSessionInfo.active) return;

    const timerInterval = setInterval(() => {
      setActiveSessionInfo((prev) => {
        if (!prev || !prev.active) return prev;
        if (prev.remainingSeconds <= 1) {
          checkActiveSession();
          return { ...prev, active: false, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [activeSessionInfo.active]);

  const loadDashboardData = async () => {
    try {
      const [pDepts, users, dStats] = await Promise.all([
        api.get('/admin/pending-departments'),
        api.get('/admin/users'),
        api.get('/admin/department-stats')
      ]);
      setPendingDepartments(pDepts);
      setAllUsers(users);
      setDeptStats(dStats);
      checkActiveSession();
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    }
  };

  const checkActiveSession = async () => {
    try {
      const res = await api.get('/admin/attendance-session/active');
      setActiveSessionInfo(res);
      if (res.workingDay) {
        setWorkingDay(res.workingDay);
      }
    } catch (err) {
      // Ignore background timer fetch errors
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/users/${id}/approve`);
      setMsg('User approved successfully!');
      loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/admin/users/${id}/reject`);
      setMsg('User rejected.');
      loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setMsg('User deleted successfully.');
      loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${editUser.id}`, {
        fullName: editUser.fullName,
        email: editUser.email,
        department: editUser.department,
        rollNumber: editUser.rollNumber,
        staffId: editUser.staffId
      });
      setMsg('User details updated.');
      setEditUser(null);
      loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartSession = async () => {
    try {
      const res = await api.post('/admin/attendance-session/start', { workingDay, durationMinutes });
      setMsg(`Attendance Session started for ${workingDay} (${durationMinutes} mins)!`);
      checkActiveSession();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEndSession = async () => {
    try {
      await api.post('/admin/attendance-session/end');
      setMsg('Attendance session ended successfully! Unsubmitted students have been automatically marked ABSENT.');
      checkActiveSession();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetWeek = async () => {
    if (!window.confirm('Are you sure you want to reset the weekly attendance cycle back to Day 1? Previous history will remain stored.')) return;
    try {
      await api.post('/admin/attendance-session/reset-week');
      setWorkingDay('Day 1');
      setMsg('Weekly attendance cycle reset to Day 1. Historical attendance logs preserved.');
      checkActiveSession();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const formatRemainingTime = (secs) => {
    if (!secs || secs <= 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">🛡️</div>
          <div className="sidebar-brand">
            Admin Portal
            <span>Administrator</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <button 
            className={`sidebar-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            📋 Pending Approvals ({pendingDepartments.length})
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            👥 User Management ({allUsers.length})
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'session' ? 'active' : ''}`}
            onClick={() => setActiveTab('session')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            ⏱️ Weekly Attendance Control
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleLogout}>
            Logout Admin
          </button>
        </div>
      </div>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="navbar">
          <div>
            <span style={{ fontWeight: '700', fontSize: '18px' }}>System Administrator Dashboard</span>
            <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>({adminUser?.email})</span>
          </div>
          {activeSessionInfo.active && (
            <div className="badge badge-present" style={{ fontSize: '14px', padding: '8px 16px' }}>
              🔴 ACTIVE: {activeSessionInfo.workingDay || workingDay} ({formatRemainingTime(activeSessionInfo.remainingSeconds)})
            </div>
          )}
        </div>

        <div className="page-content">
          {msg && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', marginBottom: '20px' }}>
              ✅ {msg}
            </div>
          )}
          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* TAB 1: PENDING APPROVALS & DEPARTMENT STATS */}
          {activeTab === 'pending' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Pending Account Approvals</h1>
                  <p className="page-subtitle">Review and approve new Department staff registrations (Student registrations are approved directly by their respective Departments)</p>
                </div>
              </div>

              {/* Department Statistics Summary (View-Only) */}
              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>🏛️</div>
                  <div className="stat-info">
                    <div className="stat-value">{deptStats.totalDepartments || 0}</div>
                    <div className="stat-label">Total Departments</div>
                  </div>
                </div>
                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>👨‍🎓</div>
                  <div className="stat-info">
                    <div className="stat-value">{deptStats.totalStudents || 0}</div>
                    <div className="stat-label">Total Students</div>
                  </div>
                </div>
              </div>

              {/* Department-wise Student Count Breakdown */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px' }}>Department-wise Student Breakdown (View-Only)</h3>
                {(!deptStats.departmentStudentCounts || Object.keys(deptStats.departmentStudentCounts).length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No department student statistics available.</p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Total Registered Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(deptStats.departmentStudentCounts).map(([dept, count]) => (
                          <tr key={dept}>
                            <td style={{ fontWeight: '600' }}>🏛️ {dept}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary-400)' }}>{count} Students</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pending Departments */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Pending Department Staff ({pendingDepartments.length})</h3>
                {pendingDepartments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No pending department registrations.</p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Staff Name</th>
                          <th>Staff ID</th>
                          <th>Department</th>
                          <th>Email</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingDepartments.map(dept => (
                          <tr key={dept.id}>
                            <td style={{ fontWeight: '600' }}>{dept.fullName}</td>
                            <td>{dept.staffId}</td>
                            <td>{dept.department}</td>
                            <td>{dept.email}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-sm btn-primary" onClick={() => handleApprove(dept.id)}>
                                  Approve
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleReject(dept.id)}>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">User Management</h1>
                  <p className="page-subtitle">View, edit, or remove system accounts</p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Dept / Roll / Staff ID</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map(user => (
                        <tr key={user.id}>
                          <td style={{ fontWeight: '600' }}>{user.fullName}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className="badge" style={{ background: 'var(--surface-card-subtle)' }}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            {user.department || '-'} / {user.rollNumber || user.staffId || '-'}
                          </td>
                          <td>
                            <span className={`badge ${user.status === 'APPROVED' ? 'badge-present' : user.status === 'PENDING' ? 'badge-late' : 'badge-absent'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            {user.role !== 'ROLE_ADMIN' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => setEditUser(user)}>
                                  Update
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEEKLY ATTENDANCE SYSTEM */}
          {activeTab === 'session' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">6-Day Weekly Attendance System</h1>
                  <p className="page-subtitle">Select working day (Day 1–Day 6), set session duration, start/end attendance, or reset weekly cycle</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="glass-panel" style={{ padding: '32px' }}>
                  <h3 style={{ marginBottom: '20px' }}>Session Controls</h3>

                  <div className="form-group">
                    <label className="form-label">Select Working Day</label>
                    <select 
                      className="form-select"
                      value={workingDay}
                      onChange={(e) => setWorkingDay(e.target.value)}
                    >
                      <option value="Day 1">Day 1</option>
                      <option value="Day 2">Day 2</option>
                      <option value="Day 3">Day 3</option>
                      <option value="Day 4">Day 4</option>
                      <option value="Day 5">Day 5</option>
                      <option value="Day 6">Day 6</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Set Attendance Duration (Minutes)</label>
                    <select 
                      className="form-select"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes (Standard)</option>
                      <option value={90}>90 Minutes</option>
                      <option value={120}>120 Minutes</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '14px', fontSize: '15px' }}
                      onClick={handleStartSession}
                    >
                      🚀 Start Attendance Session ({workingDay})
                    </button>

                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '14px', fontSize: '15px' }}
                      onClick={handleEndSession}
                      disabled={!activeSessionInfo.active}
                    >
                      ⏹️ End Attendance Session
                    </button>

                    <hr style={{ borderColor: 'var(--surface-card-subtle)', margin: '12px 0' }} />

                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '12px', fontSize: '14px' }}
                      onClick={handleResetWeek}
                    >
                      🔄 Reset Week (Begin Day 1 Cycle)
                    </button>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                  {activeSessionInfo.active ? (
                    <div>
                      <div className="badge badge-present" style={{ fontSize: '14px', padding: '6px 16px', marginBottom: '16px' }}>
                        SESSION IN PROGRESS: {activeSessionInfo.workingDay || workingDay}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>REMAINING DURATION</div>
                      <div style={{ fontSize: '56px', fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>
                        {formatRemainingTime(activeSessionInfo.remainingSeconds)}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px', lineHeight: '1.6' }}>
                        Students can log in and submit Present or Leave Request attendance during this timer. Unsubmitted students will be automatically marked ABSENT when time expires or when "End Attendance" is clicked.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="badge badge-absent" style={{ fontSize: '15px', padding: '10px 20px', marginBottom: '16px' }}>
                        ⚪ No Active Attendance Session
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                        Select a Working Day (Day 1–Day 6) and click <strong>Start Attendance Session</strong> to allow student attendance submissions.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EDIT USER MODAL */}
          {editUser && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
                <h3 style={{ marginBottom: '20px' }}>Update User Details</h3>
                <form onSubmit={handleUpdateUser}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editUser.fullName || ''} 
                      onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={editUser.email || ''} 
                      onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editUser.department || ''} 
                      onChange={(e) => setEditUser({ ...editUser, department: e.target.value })} 
                    />
                  </div>
                  {editUser.role === 'ROLE_STUDENT' && (
                    <div className="form-group">
                      <label className="form-label">Roll Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editUser.rollNumber || ''} 
                        onChange={(e) => setEditUser({ ...editUser, rollNumber: e.target.value })} 
                      />
                    </div>
                  )}
                  {editUser.role === 'ROLE_DEPARTMENT' && (
                    <div className="form-group">
                      <label className="form-label">Staff ID</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editUser.staffId || ''} 
                        onChange={(e) => setEditUser({ ...editUser, staffId: e.target.value })} 
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditUser(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
