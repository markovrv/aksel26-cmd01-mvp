import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

function Navigation({ user, userType, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const userName = userType === 'company' ? user.name : user.full_name;
  const displayName = userName || user.email;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🏭 Промышленный туризм
        </Link>
        <div className="navbar-menu">
          <Link to="/" className="nav-link">
            Карта
          </Link>
          {userType === 'student' && <Link to="/dashboard" className="nav-link">
            Мои заявки
          </Link>}
          {userType === 'company' && <Link to="/dashboard" className="nav-link">
            Кабинет компании
          </Link>}
          {userType === 'admin' && <Link to="/admin" className="nav-link">
            Админ-панель
          </Link>}
          <div className="nav-user">
            <span className="user-name">{displayName}</span>
            <span className="user-role">
              {userType === 'student' ? '👤 Студент' : userType === 'company' ? '🏢 Предприятие' : '⚙️ Администратор'}
            </span>
            <button onClick={handleLogout} className="btn-logout">
              Выход
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
