import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import api from "../services/api";
import { AttendanceDonutChart } from "../components/AttendanceChart";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("attendance"); // 'attendance', 'assignments', 'analytics', 'chat', 'notifications', 'leave'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active Session & Timer State
  const [sessionInfo, setSessionInfo] = useState({
    active: false,
    remainingSeconds: 0,
  });

  // Attendance & Face Verification State
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [verificationResult, setVerificationResult] = useState(null); // { success, similarityScore, message }
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Choice state after face verification success
  const [attendanceChoice, setAttendanceChoice] = useState(null); // 'PRESENT' or 'ABSENT'

  // Leave Form State
  const [leaveReason, setLeaveReason] = useState("");

  // Data States
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [analytics, setAnalytics] = useState({
    totalClasses: 0,
    presentCount: 0,
    absentCount: 0,
    percentage: 0,
    records: [],
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [viewLetter, setViewLetter] = useState(null); // Leave letter modal

  // Career Profile State
  const [careerProfile, setCareerProfile] = useState({
    hasResume: false,
    resumeFileName: "",
    linkedin: "",
    github: "",
    portfolio: "",
    leetcode: "",
    codechef: "",
    hackerrank: "",
  });
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [careerMsg, setCareerMsg] = useState("");
  const [careerError, setCareerError] = useState("");
  const [careerLoading, setCareerLoading] = useState(false);

  // UI Messages
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Video Ref for Live Webcam Capture
  const videoRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/student-auth");
      return;
    }
    const user = JSON.parse(userStr);
    if (!user || String(user.role).toUpperCase() !== "ROLE_STUDENT") {
      navigate("/student-auth");
      return;
    }
    setStudent(user);
    loadStudentData(user);
  }, [navigate]);

  // Live Timer Countdown - Local 1s tick ONLY when session is active
  useEffect(() => {
    if (!sessionInfo.active) return;

    const timerInterval = setInterval(() => {
      setSessionInfo((prev) => {
        if (!prev || !prev.active) return prev;
        if (prev.remainingSeconds <= 1) {
          fetchActiveSession();
          return { ...prev, active: false, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [sessionInfo.active]);

  const fetchActiveSession = async () => {
    try {
      const res = await api.get("/admin/attendance-session/active");
      setSessionInfo(res);
    } catch (err) {
      // Ignore background timer errors
    }
  };

  const loadStudentData = async (user) => {
    try {
      fetchActiveSession();
      const [ass, subs, ana, lvs, nots, careerRes] = await Promise.all([
        api.get(
          `/student/assignments?department=${encodeURIComponent(user.department || "")}`,
        ),
        api.get(`/student/assignments/my-submissions?studentId=${user.id}`),
        api.get(`/student/analytics?studentId=${user.id}`),
        api.get(`/student/leave-requests?studentId=${user.id}`),
        api.get(
          `/student/notifications?studentId=${user.id}&department=${encodeURIComponent(user.department || "")}`,
        ),
        api.get(`/student/career-profile?studentId=${user.id}`).catch(() => null),
      ]);
      setAssignments(ass);
      setMySubmissions(subs);
      setAnalytics(ana);
      setLeaveRequests(lvs);
      setNotifications(nots);
      if (careerRes) {
        setCareerProfile(careerRes);
      }
    } catch (err) {
      setError(err.message || "Failed to load student data.");
    }
  };

  // Face Verification & Webcam Handlers
  const handleOpenFaceModal = () => {
    setShowFaceModal(true);
    setVerificationResult(null);
    setAttendanceChoice(null);
    setCapturedImage("");
    startWebcam();
  };

  const startWebcam = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          // If webcam access unavailable, allow sample/file capture fallback
        });
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const handleCloseFaceModal = () => {
    stopWebcam();
    setShowFaceModal(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUri);
    }
  };

  const handleVerifyFace = async () => {
    if (!capturedImage) {
      setError("Please capture a webcam snapshot first.");
      return;
    }
    setVerificationLoading(true);
    setError("");
    try {
      const res = await api.post(
        `/student/verify-face?studentId=${student.id}`,
        {
          capturedImage,
        },
      );
      setVerificationResult(res);
    } catch (err) {
      setError(err.message || "Face verification failed.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSelectPresent = async () => {
    try {
      await api.post(
        `/student/mark-attendance?studentId=${student.id}&status=PRESENT&sessionId=${sessionInfo.sessionId || ""}`,
      );
      setMsg("Attendance marked PRESENT successfully!");
      handleCloseFaceModal();
      loadStudentData(student);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectAbsent = () => {
    setAttendanceChoice("ABSENT");
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/student/apply-leave?studentId=${student.id}`, {
        reason: leaveReason,
      });
      setMsg("Leave Application submitted! Pending Department approval.");
      setLeaveReason("");
      handleCloseFaceModal();
      loadStudentData(student);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    try {
      await api.post(
        `/student/assignments/${selectedAssignment.id}/submit?studentId=${student.id}`,
        {
          submissionText,
        },
      );
      setMsg("Assignment submitted successfully!");
      setSelectedAssignment(null);
      setSubmissionText("");
      loadStudentData(student);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResumeFileChange = (e) => {
    setCareerError("");
    setCareerMsg("");
    const file = e.target.files[0];
    if (!file) {
      setSelectedPdf(null);
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setCareerError("⚠️ Only PDF files are allowed.");
      setSelectedPdf(null);
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setCareerError("⚠️ File size exceeds maximum limit of 2 MB.");
      setSelectedPdf(null);
      e.target.value = "";
      return;
    }

    setSelectedPdf(file);
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!selectedPdf) {
      setCareerError("Please select a PDF file first.");
      return;
    }
    setCareerLoading(true);
    setCareerError("");
    setCareerMsg("");

    try {
      const formData = new FormData();
      formData.append("file", selectedPdf);

      const res = await api.post(
        `/student/career-profile/resume?studentId=${student.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setCareerMsg(res.message || "Resume uploaded successfully!");
      if (res.profile) {
        setCareerProfile(res.profile);
      } else {
        loadStudentData(student);
      }
      setSelectedPdf(null);
    } catch (err) {
      setCareerError(err.message || "Failed to upload resume.");
    } finally {
      setCareerLoading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm("Are you sure you want to delete your current resume?"))
      return;
    setCareerLoading(true);
    setCareerError("");
    setCareerMsg("");

    try {
      await api.delete(
        `/student/career-profile/resume?studentId=${student.id}`
      );
      setCareerMsg("Resume deleted successfully.");
      setCareerProfile((prev) => ({
        ...prev,
        hasResume: false,
        resumeFileName: "",
      }));
      setSelectedPdf(null);
    } catch (err) {
      setCareerError(err.message || "Failed to delete resume.");
    } finally {
      setCareerLoading(false);
    }
  };

  const handleSaveLinks = async (e) => {
    e.preventDefault();
    setCareerLoading(true);
    setCareerError("");
    setCareerMsg("");

    try {
      const res = await api.put(
        `/student/career-profile/links?studentId=${student.id}`,
        {
          linkedin: careerProfile.linkedin,
          github: careerProfile.github,
          portfolio: careerProfile.portfolio,
          leetcode: careerProfile.leetcode,
          codechef: careerProfile.codechef,
          hackerrank: careerProfile.hackerrank,
        }
      );

      setCareerMsg("Professional links updated successfully!");
      if (res.profile) {
        setCareerProfile(res.profile);
      }
    } catch (err) {
      setCareerError(err.message || "Failed to save professional links.");
    } finally {
      setCareerLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const formatRemainingTime = (secs) => {
    if (!secs || secs <= 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`sidebar-backdrop ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)} 
      />

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">👨‍🎓</div>
          <div className="sidebar-brand">
            Student Portal
            <span>{student?.department || "Student"}</span>
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setSidebarOpen(false)} 
            aria-label="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-menu">
          <button
            className={`sidebar-link ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => { setActiveTab("attendance"); setSidebarOpen(false); }}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            📸 Mark Attendance
          </button>
          <button
            className={`sidebar-link ${activeTab === "assignments" ? "active" : ""}`}
            onClick={() => { setActiveTab("assignments"); setSidebarOpen(false); }}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            📝 Course Assignments
          </button>
          <button
            className={`sidebar-link ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => { setActiveTab("analytics"); setSidebarOpen(false); }}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            📊 Attendance Analytics
          </button>
          <button
            className={`sidebar-link ${activeTab === "career" ? "active" : ""}`}
            onClick={() => { setActiveTab("career"); setSidebarOpen(false); }}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            💼 Career Profile
          </button>
          <button
            className={`sidebar-link ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => { setActiveTab("notifications"); setSidebarOpen(false); }}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            🔔 System Notifications
          </button>
          <button
            className={`sidebar-link ${activeTab === "leave" ? "active" : ""}`}
            onClick={() => { setActiveTab("leave"); setSidebarOpen(false); }}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            📜 Leave Application & Letters
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          <button
            className="btn btn-danger"
            style={{ width: "100%" }}
            onClick={() => { setSidebarOpen(false); handleLogout(); }}
          >
            Logout Student
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-wrapper">
        <div className="navbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button 
              className="hamburger-btn" 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              aria-label="Toggle Menu"
            >
              <Menu size={22} />
            </button>
            {student?.profileImage && (
              <img
                src={student.profileImage}
                alt="Avatar"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
            <div>
              <span style={{ fontWeight: "700", fontSize: "16px" }}>
                {student?.fullName}
              </span>
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                }}
              >
                ({student?.rollNumber})
              </span>
            </div>
          </div>
          {sessionInfo.active ? (
            <div
              className="badge badge-present"
              style={{ fontSize: "14px", padding: "8px 16px" }}
            >
              🔴 ACTIVE ATTENDANCE SESSION: {sessionInfo.workingDay || "Day 1"}{" "}
              ({formatRemainingTime(sessionInfo.remainingSeconds)})
            </div>
          ) : (
            <div
              className="badge badge-absent"
              style={{ fontSize: "13px", padding: "6px 12px" }}
            >
              ⚪ No Active Attendance Session
            </div>
          )}
        </div>

        <div className="page-content">
          {msg && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                marginBottom: "20px",
              }}
            >
              ✅ {msg}
            </div>
          )}
          {error && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(244, 63, 94, 0.15)",
                color: "#f43f5e",
                marginBottom: "20px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* TAB 1: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Attendance Verification</h1>
                  <p className="page-subtitle">
                    Mark daily attendance using facial recognition during active
                    timer sessions
                  </p>
                </div>
              </div>

              <div
                className="glass-panel"
                style={{
                  padding: "32px",
                  textAlign: "center",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📸</div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "8px",
                  }}
                >
                  Current Attendance Session:{" "}
                  {sessionInfo.workingDay || "Day 1"}
                </h2>

                {sessionInfo.active ? (
                  <div>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        marginBottom: "24px",
                      }}
                    >
                      Active session timer is currently running for{" "}
                      <strong>{sessionInfo.workingDay || "Day 1"}</strong>.
                      Click below to verify your face with your registered
                      profile image.
                    </p>
                    <button
                      className="btn btn-primary"
                      style={{ padding: "14px 28px", fontSize: "16px" }}
                      onClick={handleOpenFaceModal}
                    >
                      Verify Face & Mark Attendance
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      className="badge badge-absent"
                      style={{
                        fontSize: "15px",
                        padding: "10px 20px",
                        marginBottom: "16px",
                      }}
                    >
                      Attendance Session Closed
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                      The attendance button is enabled ONLY when the Admin
                      starts an active attendance session.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNMENTS */}
          {activeTab === "assignments" && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Department Course Assignments</h1>
                  <p className="page-subtitle">
                    View assignments, submit your responses, and review grades &
                    feedback
                  </p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "24px" }}>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Department</th>
                        <th>Due Date</th>
                        <th>My Grade / Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((ass) => {
                        const sub = mySubmissions.find(
                          (s) => s.assignmentId === ass.id,
                        );
                        return (
                          <tr key={ass.id}>
                            <td style={{ fontWeight: "600" }}>{ass.title}</td>
                            <td>{ass.description}</td>
                            <td>{ass.department}</td>
                            <td>{new Date(ass.dueDate).toLocaleString()}</td>
                            <td>
                              {sub ? (
                                <div>
                                  <span className="badge badge-present">
                                    Submitted
                                  </span>
                                  {sub.marks != null && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        marginTop: "4px",
                                        fontWeight: "bold",
                                        color: "#10b981",
                                      }}
                                    >
                                      Marks: {sub.marks} | Feedback:{" "}
                                      {sub.feedback || "None"}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="badge badge-absent">
                                  Not Submitted
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  setSelectedAssignment(ass);
                                  setSubmissionText(sub?.submissionText || "");
                                }}
                              >
                                {sub ? "View / Re-submit" : "Submit Response"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE ANALYTICS */}
          {activeTab === "analytics" && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Attendance Analytics & History</h1>
                  <p className="page-subtitle">
                    Personal attendance overview, weekly breakdown, circular
                    chart, and complete history
                  </p>
                </div>
              </div>

              <div className="stats-grid" style={{ marginBottom: "24px" }}>
                <div className="stat-card glass-panel">
                  <div
                    className="stat-icon-wrapper"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    }}
                  >
                    📅
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {analytics.totalClasses || 0}
                    </div>
                    <div className="stat-label">Total Classes Logged</div>
                  </div>
                </div>
                <div className="stat-card glass-panel">
                  <div
                    className="stat-icon-wrapper"
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                    }}
                  >
                    ✅
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {analytics.presentCount || 0}
                    </div>
                    <div className="stat-label">Total Present</div>
                  </div>
                </div>
                <div className="stat-card glass-panel">
                  <div
                    className="stat-icon-wrapper"
                    style={{
                      background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                    }}
                  >
                    ❌
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {analytics.absentCount || 0}
                    </div>
                    <div className="stat-label">Total Absent</div>
                  </div>
                </div>
                <div className="stat-card glass-panel">
                  <div
                    className="stat-icon-wrapper"
                    style={{
                      background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                    }}
                  >
                    📈
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">
                      {analytics.percentage || 0}%
                    </div>
                    <div className="stat-label">Attendance Percentage</div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                  marginBottom: "24px",
                }}
              >
                <div className="glass-panel" style={{ padding: "24px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      marginBottom: "16px",
                      textAlign: "center",
                    }}
                  >
                    Attendance Breakdown (Circular Donut Chart)
                  </h3>
                  <AttendanceDonutChart
                    present={analytics.presentCount || 0}
                    absent={analytics.absentCount || 0}
                  />
                </div>

                <div className="glass-panel" style={{ padding: "24px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      marginBottom: "16px",
                    }}
                  >
                    6-Day Weekly Attendance Breakdown
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Working Day</th>
                          <th>Present</th>
                          <th>Absent</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analytics.weeklyAttendance || []).map((w, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: "600" }}>{w.day}</td>
                            <td
                              style={{ color: "#10b981", fontWeight: "bold" }}
                            >
                              {w.present}
                            </td>
                            <td
                              style={{ color: "#f43f5e", fontWeight: "bold" }}
                            >
                              {w.absent}
                            </td>
                            <td>{w.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Attendance History Table */}
              <div
                className="glass-panel"
                style={{ padding: "24px", marginBottom: "24px" }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    marginBottom: "16px",
                  }}
                >
                  Attendance History Log
                </h3>
                {!analytics.records || analytics.records.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                    No attendance history logged yet.
                  </p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Working Day</th>
                          <th>Status</th>
                          <th>Verification Method</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.records.map((r, idx) => (
                          <tr key={idx}>
                            <td>{r.attendanceDate}</td>
                            <td style={{ fontWeight: "600" }}>
                              {r.workingDay || "Day 1"}
                            </td>
                            <td>
                              <span
                                className={`badge ${r.status === "PRESENT" ? "badge-present" : "badge-absent"}`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td>{r.verificationMethod}</td>
                            <td>{r.remarks || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CAREER PROFILE */}
          {activeTab === "career" && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">💼 Career Profile</h1>
                  <p className="page-subtitle">
                    Manage your official PDF resume and professional portfolio links
                  </p>
                </div>
              </div>

              {careerMsg && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    marginBottom: "20px",
                  }}
                >
                  ✅ {careerMsg}
                </div>
              )}
              {careerError && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: "rgba(244, 63, 94, 0.15)",
                    color: "#f43f5e",
                    marginBottom: "20px",
                  }}
                >
                  ⚠️ {careerError}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                  alignItems: "start",
                }}
              >
                {/* Resume Section */}
                <div className="glass-panel" style={{ padding: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>
                      📄 Student Resume
                    </h3>
                    <span
                      className={`badge ${careerProfile.hasResume ? "badge-present" : "badge-absent"}`}
                      style={{ fontSize: "12px" }}
                    >
                      {careerProfile.hasResume ? "Uploaded" : "No Resume"}
                    </span>
                  </div>

                  {careerProfile.hasResume ? (
                    <div
                      style={{
                        padding: "20px",
                        borderRadius: "12px",
                        background: "var(--surface-card-subtle)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "40px", marginBottom: "12px" }}>
                        📄
                      </div>
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "16px",
                          marginBottom: "4px",
                          wordBreak: "break-all",
                        }}
                      >
                        {careerProfile.resumeFileName || "Student_Resume.pdf"}
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          marginBottom: "20px",
                        }}
                      >
                        PDF Resume is stored in your career profile. Only 1 resume is allowed per student.
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <a
                          href={`/api/student/career-profile/resume/download?studentId=${student?.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          📥 Download Resume
                        </a>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={handleDeleteResume}
                          disabled={careerLoading}
                        >
                          🗑️ Delete Resume
                        </button>
                      </div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: "16px",
                        }}
                      >
                        To upload a new resume: Delete existing resume first, then upload your new PDF.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleUploadResume}>
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: "12px",
                          background: "var(--surface-card-subtle)",
                          textAlign: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>
                          📤
                        </div>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "var(--text-main)",
                            marginBottom: "16px",
                          }}
                        >
                          No resume uploaded yet. Select a PDF file from your device.
                        </p>
                        <div className="form-group" style={{ marginBottom: "16px" }}>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="form-input"
                            onChange={handleResumeFileChange}
                            disabled={careerLoading}
                          />
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          📌 Accepted format: <strong>PDF only</strong> | Maximum file size: <strong>2 MB</strong>
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "12px" }}
                        disabled={!selectedPdf || careerLoading}
                      >
                        {careerLoading ? "Uploading Resume..." : "📤 Upload Resume"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Professional Links Section */}
                <div className="glass-panel" style={{ padding: "24px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      marginBottom: "16px",
                    }}
                  >
                    🌐 Professional Links
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      marginBottom: "20px",
                    }}
                  >
                    Share your portfolio and coding profiles with faculty and department reviewers
                  </p>

                  <form onSubmit={handleSaveLinks}>
                    <div className="form-group" style={{ marginBottom: "14px" }}>
                      <label className="form-label">🔗 LinkedIn Profile</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://linkedin.com/in/username"
                        value={careerProfile.linkedin || ""}
                        onChange={(e) =>
                          setCareerProfile({
                            ...careerProfile,
                            linkedin: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: "14px" }}>
                      <label className="form-label">💻 GitHub Profile</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://github.com/username"
                        value={careerProfile.github || ""}
                        onChange={(e) =>
                          setCareerProfile({
                            ...careerProfile,
                            github: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: "14px" }}>
                      <label className="form-label">🌐 Portfolio Website</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://yourportfolio.com"
                        value={careerProfile.portfolio || ""}
                        onChange={(e) =>
                          setCareerProfile({
                            ...careerProfile,
                            portfolio: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: "14px" }}>
                      <label className="form-label">🧩 LeetCode Profile</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://leetcode.com/username"
                        value={careerProfile.leetcode || ""}
                        onChange={(e) =>
                          setCareerProfile({
                            ...careerProfile,
                            leetcode: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: "14px" }}>
                      <label className="form-label">👨‍🍳 CodeChef Profile</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://codechef.com/users/username"
                        value={careerProfile.codechef || ""}
                        onChange={(e) =>
                          setCareerProfile({
                            ...careerProfile,
                            codechef: e.target.value,
                          })
                        }
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: "100%", padding: "12px" }}
                      disabled={careerLoading}
                    >
                      {careerLoading ? "Saving..." : "💾 Save Links"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS / ANNOUNCEMENTS */}
          {activeTab === "notifications" && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    System Notifications & Department Announcements
                  </h1>
                  <p className="page-subtitle">
                    Official announcements from department faculty and system
                    alerts
                  </p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "24px" }}>
                {notifications.length === 0 ? (
                  <p style={{ color: "var(--text-muted)" }}>
                    No system notifications or department announcements at this
                    time.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {notifications.map((n) => (
                      <div
                        key={n.id || Math.random()}
                        style={{
                          padding: "20px",
                          borderRadius: "12px",
                          background: "var(--surface-card-subtle)",
                          borderLeft: "4px solid var(--primary-500)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "18px",
                              fontWeight: "700",
                              margin: 0,
                              color: "var(--primary-400)",
                            }}
                          >
                            {n.title}
                          </h4>
                          <span
                            className="badge badge-present"
                            style={{ fontSize: "12px" }}
                          >
                            📅{" "}
                            {n.date ||
                              (n.createdAt
                                ? new Date(n.createdAt).toLocaleDateString()
                                : "Recent")}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "15px",
                            color: "var(--text-main)",
                            margin: "8px 0 12px 0",
                            lineHeight: "1.6",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {n.message}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            paddingTop: "8px",
                          }}
                        >
                          <span>
                            🏛️ <strong>Department:</strong>{" "}
                            {n.department || "All"}
                          </span>
                          <span>
                            👤 <strong>Created By:</strong>{" "}
                            {n.createdBy || "Department Faculty"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: LEAVE STATUS & LETTERS */}
          {activeTab === "leave" && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    Leave Applications & Approved Letters
                  </h1>
                  <p className="page-subtitle">
                    Track submitted leave applications and download official
                    approved leave letters
                  </p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "24px" }}>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Action / Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map((l) => (
                        <tr key={l.id}>
                          <td>{l.attendanceDate}</td>
                          <td>{l.reason}</td>
                          <td>
                            <span
                              className={`badge ${l.status === "APPROVED" ? "badge-present" : l.status === "PENDING" ? "badge-late" : "badge-absent"}`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td>
                            {l.status === "APPROVED" && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => setViewLetter(l)}
                              >
                                📜 View Approved Letter
                              </button>
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

          {/* FACE VERIFICATION MODAL */}
          {showFaceModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(5px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
              }}
            >
              <div
                className="glass-panel"
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  padding: "32px",
                  textAlign: "center",
                }}
              >
                <h3 style={{ marginBottom: "16px" }}>Facial Verification</h3>

                {!verificationResult ? (
                  <div>
                    <div
                      style={{
                        position: "relative",
                        width: "320px",
                        height: "240px",
                        margin: "0 auto 16px",
                        background: "#000",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    {capturedImage && (
                      <div style={{ marginBottom: "16px" }}>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Snapshot Captured:
                        </p>
                        <img
                          src={capturedImage}
                          alt="Snapshot"
                          style={{
                            width: "100px",
                            height: "75px",
                            borderRadius: "8px",
                            border: "2px solid var(--primary-500)",
                          }}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        justifyContent: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <button
                        className="btn btn-secondary"
                        onClick={captureSnapshot}
                      >
                        📷 Capture Snapshot
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleVerifyFace}
                        disabled={!capturedImage || verificationLoading}
                      >
                        {verificationLoading
                          ? "Comparing Face..."
                          : "Verify Face"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {verificationResult.success ? (
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: "16px",
                          background: "rgba(16, 185, 129, 0.15)",
                          border: "1px solid #10b981",
                          marginBottom: "24px",
                        }}
                      >
                        <div style={{ fontSize: "36px", marginBottom: "8px" }}>
                          🎉
                        </div>
                        <h2 style={{ color: "#10b981", marginBottom: "4px" }}>
                          Verification Successful
                        </h2>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "var(--text-main)",
                          }}
                        >
                          Face matched with registered student profile image.
                          You may now mark attendance.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: "16px",
                          background: "rgba(244, 63, 94, 0.15)",
                          border: "1px solid #f43f5e",
                          marginBottom: "24px",
                        }}
                      >
                        <div style={{ fontSize: "36px", marginBottom: "8px" }}>
                          ❌
                        </div>
                        <h2 style={{ color: "#f43f5e", marginBottom: "4px" }}>
                          Verification Failed
                        </h2>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "var(--text-main)",
                          }}
                        >
                          Captured image does not belong to the registered
                          student.
                        </p>
                      </div>
                    )}

                    {verificationResult.success && !attendanceChoice && (
                      <div>
                        <p style={{ marginBottom: "16px", fontWeight: "600" }}>
                          Select your attendance status for today:
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            className="btn btn-primary"
                            style={{
                              padding: "12px 24px",
                              background: "#10b981",
                            }}
                            onClick={handleSelectPresent}
                          >
                            Present
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: "12px 24px" }}
                            onClick={handleSelectAbsent}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    )}

                    {attendanceChoice === "ABSENT" && (
                      <form
                        onSubmit={handleApplyLeave}
                        style={{ marginTop: "20px", textAlign: "left" }}
                      >
                        <h4 style={{ marginBottom: "12px" }}>
                          Leave Application Form (Auto-Filled)
                        </h4>
                        <div
                          style={{
                            fontSize: "13px",
                            background: "var(--surface-card-subtle)",
                            padding: "12px",
                            borderRadius: "8px",
                            marginBottom: "16px",
                          }}
                        >
                          <div>
                            <strong>Student Name:</strong> {student.fullName}
                          </div>
                          <div>
                            <strong>Roll Number:</strong> {student.rollNumber}
                          </div>
                          <div>
                            <strong>Department:</strong> {student.department}
                          </div>
                          <div>
                            <strong>Date:</strong>{" "}
                            {new Date().toLocaleDateString()}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Reason for Absence
                          </label>
                          <textarea
                            className="form-input"
                            rows={3}
                            required
                            placeholder="Enter your reason for leave..."
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          style={{ width: "100%" }}
                        >
                          Submit Leave Application
                        </button>
                      </form>
                    )}
                  </div>
                )}

                <div style={{ marginTop: "20px" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCloseFaceModal}
                  >
                    Cancel / Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT ASSIGNMENT MODAL */}
          {selectedAssignment && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(5px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
              }}
            >
              <div
                className="glass-panel"
                style={{ width: "100%", maxWidth: "500px", padding: "32px" }}
              >
                <h3 style={{ marginBottom: "12px" }}>
                  Submit Assignment: {selectedAssignment.title}
                </h3>
                <form onSubmit={handleSubmitAssignment}>
                  <div className="form-group">
                    <label className="form-label">
                      Submission Content / Text
                    </label>
                    <textarea
                      className="form-input"
                      rows={6}
                      required
                      placeholder="Paste your submission content here..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => setSelectedAssignment(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW APPROVED LEAVE LETTER MODAL */}
          {viewLetter && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(5px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
              }}
            >
              <div
                className="glass-panel"
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  padding: "32px",
                  background: "#fff",
                  color: "#0f172a",
                }}
              >
                <h3
                  style={{
                    textAlign: "center",
                    marginBottom: "16px",
                    color: "#4f46e5",
                  }}
                >
                  Official Approved Leave Letter
                </h3>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    background: "#f8fafc",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    color: "#0f172a",
                  }}
                >
                  {viewLetter.letterContent}
                </pre>
                <div
                  style={{ display: "flex", gap: "12px", marginTop: "20px" }}
                >
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => window.print()}
                  >
                    🖨️ Print Certificate
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setViewLetter(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD BOTTOM: CHATGPT REDIRECT BOX */}
          <div
            className="glass-panel"
            style={{
              marginTop: "40px",
              padding: "24px 32px",
              cursor: "pointer",
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.12))",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "16px",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
            onClick={() => window.open("https://chatgpt.com", "_blank")}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "12px",
                color: "var(--text-main)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Need More Help?
            </h3>
            <div
              style={{
                width: "100%",
                maxWidth: "600px",
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                className="form-input"
                readOnly
                placeholder="Ask with ChatGPT..."
                style={{
                  width: "100%",
                  padding: "14px 20px 14px 48px",
                  borderRadius: "30px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "var(--text-main)",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "18px",
                  fontSize: "18px",
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>
              <span
                style={{
                  position: "absolute",
                  right: "16px",
                  fontSize: "12px",
                  background: "var(--primary-500)",
                  color: "#fff",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontWeight: "600",
                  pointerEvents: "none",
                }}
              >
                Open ChatGPT ↗
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
