import { useState, useEffect } from 'react';
import { applicationsAPI, studentAPI } from '../api';
import './Dashboard.css';

function StudentDashboard({ user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await applicationsAPI.getStudentApplications();
        setApplications(response.data);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>👤 Личный кабинет студента</h1>
        </div>

        <div className="profile-card">
          <h2>Мой профиль</h2>
          <div className="profile-info">
            <p>
              <strong>ФИО:</strong> {user.full_name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            {user.university && (
              <p>
                <strong>ВУЗ:</strong> {user.university}
              </p>
            )}
            {user.course && (
              <p>
                <strong>Курс:</strong> {user.course}
              </p>
            )}
            {user.city && (
              <p>
                <strong>Город:</strong> {user.city}
              </p>
            )}
          </div>
        </div>

        <div className="applications-section">
          <h2>Мои заявки ({applications.length})</h2>

          {applications.length === 0 ? (
            <div className="empty-state">
              <p>Вы еще не отправили ни одной заявки</p>
            </div>
          ) : (
            <div className="applications-table">
              <table>
                <thead>
                  <tr>
                    <th>Мероприятие</th>
                    <th>Тип</th>
                    <th>Компания</th>
                    <th>Статус</th>
                    <th>Дата отправки</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <strong>{app.title}</strong>
                      </td>
                      <td>{getEventTypeLabel(app.type)}</td>
                      <td>{app.company_name}</td>
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

export default StudentDashboard;
