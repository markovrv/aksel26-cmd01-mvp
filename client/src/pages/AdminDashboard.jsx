import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import './Dashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, companiesRes, logsRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getCompanies(),
          adminAPI.getLogs(),
        ]);

        setStats(statsRes.data);
        setCompanies(companiesRes.data);
        setLogs(logsRes.data);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCompanyStatus = async (companyId, newStatus) => {
    try {
      await adminAPI.updateCompanyStatus(companyId, newStatus);
      setCompanies(
        companies.map((c) =>
          c.id === companyId ? { ...c, status: newStatus } : c
        )
      );
    } catch (error) {
      console.error('Error updating company status:', error);
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>⚙️ Админ-панель</h1>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Статистика
          </button>
          <button
            className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            🏢 Компании
          </button>
          <button
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📜 Логи
          </button>
        </div>

        {activeTab === 'stats' && stats && (
          <div className="stats-section">
            <h2>Статистика платформы</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Студенты</h3>
                <p className="stat-number">{stats.students.count}</p>
              </div>
              <div className="stat-card">
                <h3>Активные компании</h3>
                <p className="stat-number">{stats.companies.count}</p>
              </div>
              <div className="stat-card">
                <h3>На модерации</h3>
                <p className="stat-number">{stats.pendingCompanies.count}</p>
              </div>
              <div className="stat-card">
                <h3>Мероприятия</h3>
                <p className="stat-number">{stats.events.count}</p>
              </div>
              <div className="stat-card">
                <h3>Заявки</h3>
                <p className="stat-number">{stats.applications.count}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="companies-section">
            <h2>Управление компаниями</h2>
            {companies.length === 0 ? (
              <p>Компаний не найдено</p>
            ) : (
              <div className="companies-table">
                <table>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Email</th>
                      <th>Город</th>
                      <th>Статус</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td>
                          <strong>{company.name}</strong>
                        </td>
                        <td>{company.email}</td>
                        <td>{company.city}</td>
                        <td>
                          <span className={`status-badge status-${company.status}`}>
                            {getStatusLabel(company.status)}
                          </span>
                        </td>
                        <td>
                          {company.status === 'pending' && (
                            <>
                              <button
                                onClick={() =>
                                  handleCompanyStatus(company.id, 'active')
                                }
                                className="btn-small btn-success"
                              >
                                ✓ Одобрить
                              </button>
                              <button
                                onClick={() =>
                                  handleCompanyStatus(company.id, 'rejected')
                                }
                                className="btn-small btn-danger"
                              >
                                ✕ Отклонить
                              </button>
                            </>
                          )}
                          {company.status === 'active' && (
                            <button
                              onClick={() =>
                                handleCompanyStatus(company.id, 'blocked')
                              }
                              className="btn-small btn-danger"
                            >
                              🚫 Заблокировать
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-section">
            <h2>Логи системы (последние 100)</h2>
            {logs.length === 0 ? (
              <p>Логов не найдено</p>
            ) : (
              <div className="logs-list">
                {logs.map((log) => (
                  <div key={log.id} className="log-item">
                    <span className="log-time">
                      {new Date(log.created_at).toLocaleString('ru-RU')}
                    </span>
                    <span className="log-action">{log.action}</span>
                    {log.user_type && (
                      <span className="log-user">{log.user_type}</span>
                    )}
                    {log.entity_type && (
                      <span className="log-entity">{log.entity_type}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusLabel(status) {
  const labels = {
    pending: 'На модерации',
    active: 'Активна',
    rejected: 'Отклонена',
    blocked: 'Заблокирована',
  };
  return labels[status] || status;
}

export default AdminDashboard;
