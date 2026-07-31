import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AttendanceDonutChart, AttendancePieChart, WeeklyAttendanceBarChart } from '../components/AttendanceChart';

const DeptDashboard = () => {
  const navigate = useNavigate();
  const [deptUser, setDeptUser] = useState(null);
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'attendance', 'leave', 'assignments', 'reports'

  // Data States
  const [students, setStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedWorkingDayFilter, setSelectedWorkingDayFilter] = useState('All');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({}); // map of assignmentId -> submissions list
  const [deptAnalytics, setDeptAnalytics] = useState({ totalStudents: 0, totalClasses: 0, presentCount: 0, absentCount: 0, overallPercentage: 0, monthlyStats: [], weeklyHistory: [] });
  const [announcements, setAnnouncements] = useState([]);

  // Announcement Modal State
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementDate, setAnnouncementDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [announcementDept, setAnnouncementDept] = useState('');
  const [announcementCreatedBy, setAnnouncementCreatedBy] = useState('');

  // Create / Edit Assignment Modal State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');

  // Grade Modal State
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Career Profile Modal State (Read-Only)
  const [selectedStudentCareer, setSelectedStudentCareer] = useState(null);

  // Messages
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleViewCareerProfile = async (student) => {
    setSelectedStudentCareer({ student, profile: null, loading: true, error: '' });
    try {
      const profile = await api.get(`/department/career-profile?studentId=${student.id}`);
      setSelectedStudentCareer({ student, profile, loading: false, error: '' });
    } catch (err) {
      setSelectedStudentCareer({ student, profile: null, loading: false, error: err.message || 'Failed to fetch student career profile.' });
    }
  };


  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/dept-auth');
      return;
    }
    const user = JSON.parse(userStr);
    if (!user || String(user.role).toUpperCase() !== 'ROLE_DEPARTMENT') {
      navigate('/dept-auth');
      return;
    }
    setDeptUser(user);
    setAnnouncementDept(user.department || '');
    setAnnouncementCreatedBy(user.fullName || 'Faculty Staff');
    loadDeptData(user);
  }, [navigate]);

  const loadDeptData = async (user) => {
    try {
      const dept = user.department || '';
      const [stus, pStus, atts, lvs, ass, ana, anns] = await Promise.all([
        api.get(`/department/students?department=${encodeURIComponent(dept)}`),
        api.get(`/department/pending-students?department=${encodeURIComponent(dept)}`),
        api.get(`/department/attendance-records?department=${encodeURIComponent(dept)}`),
        api.get(`/department/leave-requests?department=${encodeURIComponent(dept)}`),
        api.get(`/department/assignments?department=${encodeURIComponent(dept)}`),
        api.get(`/department/analytics?department=${encodeURIComponent(dept)}`),
        api.get(`/announcements?department=${encodeURIComponent(dept)}`)
      ]);
      setStudents(stus);
      setPendingStudents(pStus);
      setAttendanceRecords(atts);
      setLeaveRequests(lvs);
      setAssignments(ass);
      setDeptAnalytics(ana);
      setAnnouncements(anns);

      // Load submissions for assignments
      for (const a of ass) {
        loadSubmissions(a.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load department data.');
    }
  };

  const handleApproveStudent = async (id) => {
    try {
      await api.post(`/department/students/${id}/approve`);
      setMsg('Student registration approved successfully!');
      loadDeptData(deptUser);
    } catch (err) {
      setError(err.message || 'Failed to approve student.');
    }
  };

  const handleRejectStudent = async (id) => {
    try {
      await api.post(`/department/students/${id}/reject`);
      setMsg('Student registration rejected.');
      loadDeptData(deptUser);
    } catch (err) {
      setError(err.message || 'Failed to reject student.');
    }
  };

  const loadSubmissions = async (assignmentId) => {
    try {
      const subs = await api.get(`/department/assignments/${assignmentId}/submissions`);
      setSubmissions(prev => ({ ...prev, [assignmentId]: subs }));
    } catch (err) {
      // Ignore submission fetch error
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', {
        title: announcementTitle,
        message: announcementMessage,
        date: announcementDate || new Date().toLocaleDateString('en-GB'),
        department: announcementDept || deptUser?.department || 'ALL',
        createdBy: announcementCreatedBy || deptUser?.fullName || 'Faculty Staff'
      });
      setMsg('Announcement posted successfully!');
      setShowAnnouncementModal(false);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      loadDeptData(deptUser);
    } catch (err) {
      setError(err.message || 'Failed to post announcement.');
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      await api.post(`/department/leave-requests/${id}/approve?staffName=${encodeURIComponent(deptUser.fullName)}`);
      setMsg('Leave Request Approved and Official Leave Certificate generated!');
      loadDeptData(deptUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await api.post(`/department/leave-requests/${id}/reject?staffName=${encodeURIComponent(deptUser.fullName)}`);
      setMsg('Leave Request Rejected.');
      loadDeptData(deptUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    try {
      if (editAssignment) {
        await api.put(`/department/assignments/${editAssignment.id}`, {
          title: assignmentTitle,
          description: assignmentDesc,
          dueDate: assignmentDueDate
        });
        setMsg('Assignment updated successfully!');
      } else {
        await api.post('/department/assignments', {
          title: assignmentTitle,
          description: assignmentDesc,
          department: deptUser.department,
          dueDate: assignmentDueDate
        });
        setMsg('Assignment created successfully!');
      }
      setShowAssignmentModal(false);
      setEditAssignment(null);
      setAssignmentTitle('');
      setAssignmentDesc('');
      setAssignmentDueDate('');
      loadDeptData(deptUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/department/assignments/${id}`);
      setMsg('Assignment deleted.');
      loadDeptData(deptUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      await api.post(`/department/submissions/${gradingSubmission.id}/grade`, {
        marks: Number(gradeMarks),
        feedback: gradeFeedback
      });
      setMsg('Submission graded successfully!');
      setGradingSubmission(null);
      setGradeMarks('');
      setGradeFeedback('');
      loadDeptData(deptUser);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">🏛️</div>
          <div className="sidebar-brand">
            Dept Portal
            <span>{deptUser?.department || 'Faculty'}</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <button 
            className={`sidebar-link ${activeTab === 'pendingStudents' ? 'active' : ''}`}
            onClick={() => setActiveTab('pendingStudents')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            📋 Pending Student Approvals ({pendingStudents.length})
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            👥 Department Students ({students.length})
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            📋 Attendance Logs ({attendanceRecords.length})
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'leave' ? 'active' : ''}`}
            onClick={() => setActiveTab('leave')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            📜 Leave Requests ({leaveRequests.filter(l => l.status === 'PENDING').length} Pending)
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            📝 Manage Assignments
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            📢 Department Announcements ({announcements.length})
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            📊 Department Reports
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleLogout}>
            Logout Faculty
          </button>
        </div>
      </div>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="navbar">
          <div>
            <span style={{ fontWeight: '700', fontSize: '18px' }}>Faculty Staff Dashboard</span>
            <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              ({deptUser?.fullName} - {deptUser?.department})
            </span>
          </div>
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

          {/* TAB: PENDING STUDENT APPROVALS */}
          {activeTab === 'pendingStudents' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Pending Student Registrations</h1>
                  <p className="page-subtitle">Review and approve new student account registration requests for {deptUser?.department}</p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                {pendingStudents.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No pending student registration requests for {deptUser?.department}.</p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Avatar</th>
                          <th>Student Name</th>
                          <th>Roll Number</th>
                          <th>Department</th>
                          <th>Email</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingStudents.map(student => (
                          <tr key={student.id}>
                            <td>
                              {student.profileImage ? (
                                <img src={student.profileImage} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                '👤'
                              )}
                            </td>
                            <td style={{ fontWeight: '600' }}>{student.fullName}</td>
                            <td>{student.rollNumber}</td>
                            <td>{student.department}</td>
                            <td>{student.email}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-sm btn-primary" onClick={() => handleApproveStudent(student.id)}>
                                  Approve
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleRejectStudent(student.id)}>
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

          {/* TAB 1: STUDENT LIST */}
          {activeTab === 'students' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Department Students</h1>
                  <p className="page-subtitle">View approved students registered under {deptUser?.department} (Read-Only)</p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Avatar</th>
                        <th>Student Name</th>
                        <th>Roll Number</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id}>
                          <td>
                            {s.profileImage ? (
                              <img src={s.profileImage} alt="Avatar" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              '👤'
                            )}
                          </td>
                          <td style={{ fontWeight: '600' }}>{s.fullName}</td>
                          <td>{s.rollNumber}</td>
                          <td>{s.email}</td>
                          <td><span className="badge badge-present">{s.status}</span></td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleViewCareerProfile(s)}
                            >
                              💼 Career Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE LOGS */}
          {activeTab === 'attendance' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Attendance Logs</h1>
                  <p className="page-subtitle">Grouped attendance records by Working Day (Day 1 – Day 6)</p>
                </div>
              </div>

              {/* Working Day Selector Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {['All', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'].map(day => (
                  <button
                    key={day}
                    className={`btn ${selectedWorkingDayFilter === day ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedWorkingDayFilter(day)}
                    style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '8px' }}
                  >
                    {day === 'All' ? '🌐 All Working Days' : `📅 ${day}`}
                  </button>
                ))}
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Showing records for: <span style={{ color: 'var(--primary-500)' }}>{selectedWorkingDayFilter === 'All' ? 'All Days' : selectedWorkingDayFilter}</span> ({
                    (selectedWorkingDayFilter === 'All' ? attendanceRecords : attendanceRecords.filter(r => (r.workingDay || 'Day 1') === selectedWorkingDayFilter)).length
                  } records)
                </div>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Working Day</th>
                        <th>Student Name</th>
                        <th>Roll Number</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedWorkingDayFilter === 'All' 
                        ? attendanceRecords 
                        : attendanceRecords.filter(r => (r.workingDay || 'Day 1') === selectedWorkingDayFilter)
                      ).map(r => (
                        <tr key={r.id}>
                          <td>{r.attendanceDate}</td>
                          <td style={{ fontWeight: '600' }}>{r.workingDay || 'Day 1'}</td>
                          <td style={{ fontWeight: '600' }}>{r.studentName}</td>
                          <td>{r.rollNumber}</td>
                          <td>
                            <span className={`badge ${r.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td>{r.verificationMethod}</td>
                          <td>{r.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEAVE REQUESTS */}
          {activeTab === 'leave' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Leave Applications</h1>
                  <p className="page-subtitle">Review student leave requests and generate official leave certificates upon approval</p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Student Name</th>
                        <th>Roll Number</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map(l => (
                        <tr key={l.id}>
                          <td>{l.attendanceDate}</td>
                          <td style={{ fontWeight: '600' }}>{l.studentName}</td>
                          <td>{l.rollNumber}</td>
                          <td>{l.reason}</td>
                          <td>
                            <span className={`badge ${l.status === 'APPROVED' ? 'badge-present' : l.status === 'PENDING' ? 'badge-late' : 'badge-absent'}`}>
                              {l.status}
                            </span>
                          </td>
                          <td>
                            {l.status === 'PENDING' ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-sm btn-primary" onClick={() => handleApproveLeave(l.id)}>
                                  Approve & Generate Letter
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleRejectLeave(l.id)}>
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Processed by {l.approvedBy}</span>
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

          {/* TAB 4: ASSIGNMENT MANAGEMENT */}
          {activeTab === 'assignments' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Course Assignments</h1>
                  <p className="page-subtitle">Create, update, delete assignments and grade student submissions</p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditAssignment(null);
                    setAssignmentTitle('');
                    setAssignmentDesc('');
                    setAssignmentDueDate('');
                    setShowAssignmentModal(true);
                  }}
                >
                  ➕ Create New Assignment
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {assignments.map(ass => (
                  <div key={ass.id} className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{ass.title}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Due: {new Date(ass.dueDate).toLocaleString()} | Department: {ass.department}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditAssignment(ass);
                            setAssignmentTitle(ass.title);
                            setAssignmentDesc(ass.description);
                            setAssignmentDueDate(ass.dueDate ? ass.dueDate.substring(0, 16) : '');
                            setShowAssignmentModal(true);
                          }}
                        >
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteAssignment(ass.id)}>
                          Delete
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: '14px', marginBottom: '16px', background: 'var(--surface-card-subtle)', padding: '12px', borderRadius: '8px' }}>
                      {ass.description}
                    </p>

                    {/* Submissions List for this assignment */}
                    <h5 style={{ marginBottom: '8px' }}>Student Submissions ({submissions[ass.id]?.length || 0})</h5>
                    {(!submissions[ass.id] || submissions[ass.id].length === 0) ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No submissions yet.</p>
                    ) : (
                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Roll Number</th>
                              <th>Submission Text</th>
                              <th>Marks</th>
                              <th>Feedback</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submissions[ass.id].map(sub => (
                              <tr key={sub.id}>
                                <td style={{ fontWeight: '600' }}>{sub.studentName}</td>
                                <td>{sub.rollNumber}</td>
                                <td>{sub.submissionText}</td>
                                <td style={{ fontWeight: 'bold', color: '#10b981' }}>{sub.marks ?? 'Un-graded'}</td>
                                <td>{sub.feedback || '-'}</td>
                                <td>
                                  <button 
                                    className="btn btn-sm btn-primary"
                                    onClick={() => {
                                      setGradingSubmission(sub);
                                      setGradeMarks(sub.marks ?? '');
                                      setGradeFeedback(sub.feedback ?? '');
                                    }}
                                  >
                                    Grade
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Department Announcements</h1>
                  <p className="page-subtitle">Broadcast important updates, holiday alerts, exam schedules, and notices to students</p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setAnnouncementTitle('');
                    setAnnouncementMessage('');
                    setAnnouncementDate(new Date().toLocaleDateString('en-GB'));
                    setAnnouncementDept(deptUser?.department || 'ALL');
                    setAnnouncementCreatedBy(deptUser?.fullName || 'Faculty Staff');
                    setShowAnnouncementModal(true);
                  }}
                >
                  ➕ Post New Announcement
                </button>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                {announcements.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No announcements posted yet for {deptUser?.department}.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {announcements.map(a => (
                      <div key={a.id} style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-card-subtle)', borderLeft: '4px solid var(--primary-500)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-400)', margin: 0 }}>{a.title}</h3>
                          <span className="badge badge-present" style={{ fontSize: '12px' }}>
                            📅 Date: {a.date}
                          </span>
                        </div>
                        <p style={{ fontSize: '15px', marginBottom: '12px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {a.message}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                          <span>🏛️ <strong>Department:</strong> {a.department}</span>
                          <span>👤 <strong>Created By:</strong> {a.createdBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REPORTS */}
          {activeTab === 'reports' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Department Attendance Analytics & Reports</h1>
                  <p className="page-subtitle">Overall attendance performance, weekly statistics, and Chart.js analytics for {deptUser?.department}</p>
                </div>
              </div>

              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>👨‍🎓</div>
                  <div className="stat-info">
                    <div className="stat-value">{deptAnalytics.totalStudents || students.length}</div>
                    <div className="stat-label">Active Approved Students</div>
                  </div>
                </div>
                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>✅</div>
                  <div className="stat-info">
                    <div className="stat-value">{deptAnalytics.presentCount || 0}</div>
                    <div className="stat-label">Present Count</div>
                  </div>
                </div>
                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>❌</div>
                  <div className="stat-info">
                    <div className="stat-value">{deptAnalytics.absentCount || 0}</div>
                    <div className="stat-label">Absent Count</div>
                  </div>
                </div>
                <div className="stat-card glass-panel">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>📊</div>
                  <div className="stat-info">
                    <div className="stat-value">{deptAnalytics.overallPercentage || 0}%</div>
                    <div className="stat-label">Overall Department Attendance</div>
                  </div>
                </div>
              </div>

              {/* Chart.js Section: Donut Chart & Pie Chart */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                    Department Attendance (Donut Chart)
                  </h3>
                  <AttendanceDonutChart 
                    present={deptAnalytics.presentCount || 0} 
                    absent={deptAnalytics.absentCount || 0} 
                  />
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                    Department Attendance Distribution (Pie Chart)
                  </h3>
                  <AttendancePieChart 
                    present={deptAnalytics.presentCount || 0} 
                    absent={deptAnalytics.absentCount || 0} 
                  />
                </div>
              </div>

              {/* Weekly 6-Day Attendance Bar Chart */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                  Weekly 6-Day Attendance Breakdown (Bar Chart)
                </h3>
                <WeeklyAttendanceBarChart weeklyStats={deptAnalytics.weeklyStats || []} />
              </div>

              {/* Weekly 6-Day Statistics Table */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                  Weekly 6-Day Attendance Statistics
                </h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Working Day</th>
                        <th>Present Students</th>
                        <th>Absent Students</th>
                        <th>Total Attendance Logs</th>
                        <th>Working Day Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(deptAnalytics.weeklyStats || []).map((w, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{w.day}</td>
                          <td style={{ color: '#10b981', fontWeight: 'bold' }}>{w.present}</td>
                          <td style={{ color: '#f43f5e', fontWeight: 'bold' }}>{w.absent}</td>
                          <td>{w.total}</td>
                          <td><span className="badge badge-present">{w.percentage}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Week-wise Attendance History Table */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                  Week-wise Attendance History
                </h3>
                {(!deptAnalytics.weeklyHistory || deptAnalytics.weeklyHistory.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No completed week history recorded yet.</p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Week</th>
                          <th>Total Logs</th>
                          <th>Present Count</th>
                          <th>Absent Count</th>
                          <th>Attendance %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptAnalytics.weeklyHistory.map((h, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '600' }}>Week {h.weekNumber}</td>
                            <td>{h.totalLogs}</td>
                            <td style={{ color: '#10b981', fontWeight: 'bold' }}>{h.presentCount}</td>
                            <td style={{ color: '#f43f5e', fontWeight: 'bold' }}>{h.absentCount}</td>
                            <td><span className="badge badge-present">{h.attendancePercentage}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CREATE / EDIT ASSIGNMENT MODAL */}
          {showAssignmentModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
                <h3 style={{ marginBottom: '20px' }}>{editAssignment ? 'Edit Assignment' : 'Create New Assignment'}</h3>
                <form onSubmit={handleSaveAssignment}>
                  <div className="form-group">
                    <label className="form-label">Assignment Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description / Instructions</label>
                    <textarea 
                      className="form-input" 
                      rows={4} 
                      required 
                      value={assignmentDesc}
                      onChange={(e) => setAssignmentDesc(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="form-input" 
                      required 
                      value={assignmentDueDate}
                      onChange={(e) => setAssignmentDueDate(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAssignmentModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* GRADE SUBMISSION MODAL */}
          {gradingSubmission && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
                <h3 style={{ marginBottom: '16px' }}>Grade Submission: {gradingSubmission.studentName}</h3>
                <form onSubmit={handleSaveGrade}>
                  <div className="form-group">
                    <label className="form-label">Marks Out of 100</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      min={0}
                      max={100}
                      value={gradeMarks}
                      onChange={(e) => setGradeMarks(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Faculty Feedback</label>
                    <textarea 
                      className="form-input" 
                      rows={3} 
                      placeholder="Excellent work! / Needs improvement..."
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Grade</button>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setGradingSubmission(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ANNOUNCEMENT CREATION MODAL */}
          {showAnnouncementModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '32px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>📢 Post Department Announcement</h3>
                <form onSubmit={handleSaveAnnouncement}>
                  <div className="form-group">
                    <label className="form-label">Announcement Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="e.g. Tomorrow Holiday / Exam Schedule Notice"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message Content</label>
                    <textarea 
                      className="form-input" 
                      rows={4} 
                      required 
                      placeholder="e.g. College will remain closed due to cultural event..."
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        placeholder="DD-MM-YYYY"
                        value={announcementDate}
                        onChange={(e) => setAnnouncementDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        value={announcementDept}
                        onChange={(e) => setAnnouncementDept(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Created By (Faculty Staff)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={announcementCreatedBy}
                      onChange={(e) => setAnnouncementCreatedBy(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>📢 Publish Announcement</button>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAnnouncementModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW STUDENT CAREER PROFILE MODAL (READ-ONLY) */}
          {selectedStudentCareer && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                      💼 Career Profile: {selectedStudentCareer.student.fullName}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Roll No: {selectedStudentCareer.student.rollNumber} | Department: {selectedStudentCareer.student.department}
                    </p>
                  </div>
                  <span className="badge badge-present" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    🔒 Read-Only Access
                  </span>
                </div>

                {selectedStudentCareer.loading ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading student career profile...</p>
                ) : selectedStudentCareer.error ? (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', marginBottom: '20px' }}>
                    ⚠️ {selectedStudentCareer.error}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Resume Section (Read-Only) */}
                    <div style={{ background: 'var(--surface-card-subtle)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📄 Resume File
                      </h4>
                      {selectedStudentCareer.profile?.hasResume ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '15px' }}>
                              {selectedStudentCareer.profile.resumeFileName || 'Student_Resume.pdf'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              PDF Format | Student Uploaded Resume
                            </div>
                          </div>
                          <a
                            href={`/api/department/career-profile/resume/download?studentId=${selectedStudentCareer.student.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            📥 Download Resume
                          </a>
                        </div>
                      ) : (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                          No resume uploaded by student yet.
                        </p>
                      )}
                    </div>

                    {/* Professional Links Section (Read-Only) */}
                    <div style={{ background: 'var(--surface-card-subtle)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
                        🌐 Professional & Coding Links
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { label: 'LinkedIn', url: selectedStudentCareer.profile?.linkedin, icon: '🔗' },
                          { label: 'GitHub', url: selectedStudentCareer.profile?.github, icon: '💻' },
                          { label: 'Portfolio', url: selectedStudentCareer.profile?.portfolio, icon: '🌐' },
                          { label: 'LeetCode', url: selectedStudentCareer.profile?.leetcode, icon: '🧩' },
                          { label: 'CodeChef', url: selectedStudentCareer.profile?.codechef, icon: '👨‍🍳' },
                          { label: 'HackerRank', url: selectedStudentCareer.profile?.hackerrank, icon: '⚡' },
                        ].map((link, idx) => (
                          <div key={idx} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                              {link.icon} {link.label}
                            </div>
                            {link.url ? (
                              <a
                                href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--primary-400)', fontSize: '13px', wordBreak: 'break-all', textDecoration: 'underline' }}
                              >
                                {link.url}
                              </a>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not provided</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedStudentCareer(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeptDashboard;
