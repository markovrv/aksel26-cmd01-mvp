import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import './AuthPages.css';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password, userType);
      const userData = response.data.user;

      onLogin(userData, response.data.token, userType);
      navigate(userType === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🏭 Промышленный туризм</h1>
        <h2>Вход в систему</h2>

        <div className="user-type-selector">
          <label>
            <input
              type="radio"
              value="student"
              checked={userType === 'student'}
              onChange={(e) => setUserType(e.target.value)}
            />
            Студент
          </label>
          <label>
            <input
              type="radio"
              value="company"
              checked={userType === 'company'}
              onChange={(e) => setUserType(e.target.value)}
            />
            Предприятие
          </label>
          <label>
            <input
              type="radio"
              value="admin"
              checked={userType === 'admin'}
              onChange={(e) => setUserType(e.target.value)}
            />
            Администратор
          </label>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="auth-link">
          Нет аккаунта? <a onClick={() => navigate('/register')}>Зарегистрироваться</a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
