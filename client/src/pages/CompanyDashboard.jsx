import { useState, useEffect } from 'react';
import { companyAPI, applicationsAPI } from '../api';
import './Dashboard.css';

function CompanyDashboard({ user }) {
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashRes = await companyAPI.getDashboard();
        setDashboard(dashRes.data);

        const appsRes = await applicationsAPI.getCompanyApplications();
        setApplications(appsRes.data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>🏢 Кабинет компании</h1>
        </div>

        <div className="profile-card">
          <h2>О компании</h2>
          {dashboard?.company && (
            <div className="profile-info">
              <p>
                <strong>Название:</strong> {dashboard.company.name}
              </p>
              <p>
                <strong>Email:</strong> {dashboard.company.email}
              </p>
              {dashboard.company.city && (
                <p>
                  <strong>Город:</strong> {dashboard.company.city}
                </p>
              )}
              {dashboard.company.website && (
                <p>
                  <strong>Сайт:</strong>{' '}
                  <a href={dashboard.company.website} target="_blank" rel="noopener noreferrer">
                    {dashboard.company.website}
                  </a>
                </p>
              )}
              <p>
                <strong>Статус:</strong>{' '}
                <span className={`status-badge status-${dashboard.company.status}`}>
                  {getCompanyStatusLabel(dashboard.company.status)}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="events-section">
          <div className="section-header">
            <h2>Мои мероприятия ({dashboard?.events?.length || 0})</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary"
            >
              {showCreateForm ? '✕ Отмена' : '➕ Создать мероприятие'}
            </button>
          </div>

          {showCreateForm && (
            <div className="create-form">
              <p>Функция создания мероприятий скоро будет доступна</p>
            </div>
          )}

          {dashboard?.events && dashboard.events.length > 0 ? (
            <div className="events-list">
              {dashboard.events.map((event) => (
                <div key={event.id} className="event-item">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <div className="event-meta">
                    <span>{getEventTypeLabel(event.type)}</span>
                    <span>
                      📅{' '}
                      {new Date(event.application_deadline).toLocaleDateString(
                        'ru-RU'
                      )}
                    </span>
                    <span className={`status-${event.status}`}>{event.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Вы еще не создали ни одного мероприятия</p>
            </div>
          )}
        </div>

        <div className="applications-section">
          <h2>Заявки от студентов ({applications.length})</h2>

          {applications.length === 0 ? (
            <div className="empty-state">
              <p>Заявок пока нет</p>
            </div>
          ) : (
            <div className="applications-table">
              <table>
                <thead>
                  <tr>
                    <th>Мероприятие</th>
                    <th>Студент</th>
                    <th>ВУЗ</th>
                    <th>Статус</th>
                    <th>Дата заявки</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <strong>{app.title}</strong>
                      </td>
                      <td>
                        {app.student_name}
                        <br />
                        <small>{app.student_email}</small>
                      </td>
                      <td>{app.university || '-'}</td>
                      <td>
                        <span className={`status-badge status-${app.status}`}>
                          {getStatusLabel(app.status)}
                        </span>
                      </td>
                      <td>{new Date(app.created_at).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getEventTypeLabel(type) {
  const labels = {
    case: '📋 Кейс',
    internship: '🎓 Стажировка',
    tour: '👁️ Экскурсия',
  };
  return labels[type] || type;
}

function getStatusLabel(status) {
  const labels = {
    new: 'Новая',
    viewed: 'Просмотрена',
    invited: 'Приглашена',
    rejected: 'Отклонена',
  };
  return labels[status] || status;
}

function getCompanyStatusLabel(status) {
  const labels = {
    pending: 'На модерации',
    active: 'Активна',
    rejected: 'Отклонена',
    blocked: 'Заблокирована',
  };
  return labels[status] || status;
}

export default CompanyDashboard;
