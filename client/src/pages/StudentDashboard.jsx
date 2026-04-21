import { useState, useEffect } from 'react';
import { solutionsAPI, studentAPI } from '../api';
import './Dashboard.css';

function StudentDashboard({ user }) {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const response = await solutionsAPI.getMy();
        setSolutions(response.data);
      } catch (error) {
        console.error('Error loading solutions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
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
              <strong>ФИО:</strong> {user.first_name} {user.last_name}
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
            {user.specialization && (
              <p>
                <strong>Специализация:</strong> {user.specialization}
              </p>
            )}
            {user.city && (
              <p>
                <strong>Город:</strong> {user.city}
              </p>
            )}
            {user.phone && (
              <p>
                <strong>Телефон:</strong> {user.phone}
              </p>
            )}
          </div>
        </div>

        <div className="applications-section">
          <h2>Мои решения ({solutions.length})</h2>

          {solutions.length === 0 ? (
            <div className="empty-state">
              <p>Вы еще не отправили ни одного решения</p>
            </div>
          ) : (
            <div className="applications-table">
              <table>
                <thead>
                  <tr>
                    <th>Кейс</th>
                    <th>Компания</th>
                    <th>Статус</th>
                    <th>Дата отправки</th>
                  </tr>
                </thead>
                <tbody>
                  {solutions.map((solution) => (
                    <tr key={solution.id}>
                      <td>
                        <strong>{solution.case_title}</strong>
                      </td>
                      <td>{solution.company_name}</td>
                      <td>
                        <span className={`status-badge status-${solution.status}`}>
                          {getStatusLabel(solution.status)}
                        </span>
                      </td>
                      <td>{new Date(solution.created_at).toLocaleDateString('ru-RU')}</td>
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
