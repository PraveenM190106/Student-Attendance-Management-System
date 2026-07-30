import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const StudentAuth = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form State
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  // UI Messages
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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

      if (res.role !== 'ROLE_STUDENT') {
        setError('This email is registered under a non-student role. Please use the appropriate portal.');
        setLoading(false);
        return;
      }

      localStorage.setItem('user', JSON.stringify(res));
      navigate('/student-dashboard');
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

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!profileImage) {
      setError('Please upload a clear profile image for face verification.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register/student', {
        fullName,
        rollNumber,
        department,
        email,
        password,
        confirmPassword,
        profileImage
      });

      setSuccessMsg(res.message || 'Registration successful! Your account status is PENDING admin approval.');
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
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>👨‍🎓</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700" }}>
            Student Portal
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Access attendance, assignments, and career profile
          </p>
        </div>

        {/* Auth Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            background: "var(--surface-card-subtle)",
            padding: "4px",
            borderRadius: "12px",
            marginBottom: "24px",
          }}
        >
          <button
            className={`btn ${activeTab === "login" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, padding: "8px", border: "none" }}
            onClick={() => {
              setActiveTab("login");
              setError("");
              setSuccessMsg("");
            }}
          >
            Student Login
          </button>
          <button
            className={`btn ${activeTab === "register" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, padding: "8px", border: "none" }}
            onClick={() => {
              setActiveTab("register");
              setError("");
              setSuccessMsg("");
            }}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(244, 63, 94, 0.15)",
              color: "#f43f5e",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        {activeTab === "login" ? (
          <form onSubmit={handleLogin} autoComplete="on">
            <div className="form-group">
              <label className="form-label">Student Email Address</label>
              <input
                type="email"
                className="form-input"
                required
                placeholder="student@university.edu"
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
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "12px" }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Login as Student"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="CS2026001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
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
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                required
                name="username"
                autoComplete="username"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                Upload Profile Image (Required for Face Verification)
              </label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={handleImageUpload}
              />
              {profileImage && (
                <div style={{ marginTop: "8px", textAlign: "center" }}>
                  <img
                    src={profileImage}
                    alt="Profile Preview"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--primary-500)",
                    }}
                  />
                </div>
              )}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "12px" }}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Register Account"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "13px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            ← Back to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAuth;
