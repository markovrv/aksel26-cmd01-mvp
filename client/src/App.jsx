import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './api';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CompanyProfile from './pages/CompanyProfile';
import EventDetail from './pages/EventDetail';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        const savedUserType = localStorage.getItem('userType');
        setUserType(savedUserType);

        try {
          const response = await authAPI.getCurrentUser(savedUserType);
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          setToken(null);
          setUserType(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const handleLogin = (userData, newToken, type) => {
    setUser(userData);
    setUserType(type);
    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userType', type);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setUserType(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <Router>
      <div className="app">
        {user && <Navigation user={user} userType={userType} onLogout={handleLogout} />}
        <Routes>
          {!user ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<HomePage user={user} userType={userType} />} />
              <Route path="/company/:id" element={<CompanyProfile />} />
              <Route path="/event/:id" element={<EventDetail user={user} userType={userType} />} />
              {userType === 'student' && <Route path="/dashboard" element={<StudentDashboard user={user} />} />}
              {userType === 'company' && <Route path="/dashboard" element={<CompanyDashboard user={user} />} />}
              {userType === 'admin' && <Route path="/admin" element={<AdminDashboard />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
