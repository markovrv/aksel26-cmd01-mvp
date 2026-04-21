import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import './Dashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes] = await Promise.all([
          adminAPI.getStats(),
        ]);

        setStats(statsRes.data);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [companiesRes, studentsRes, eventsRes, applicationsRes, adminsRes, logsRes] = await Promise.all([
        adminAPI.getCompanies(),
        adminAPI.getStudents(),
        adminAPI.getEvents(),
        adminAPI.getApplications(),
        adminAPI.getAdmins(),
        adminAPI.getLogs(),
      ]);

      setCompanies(companiesRes.data);
      setStudents(studentsRes.data);
      setEvents(eventsRes.data);
      setApplications(applicationsRes.data);
      setAdmins(adminsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    if (activeTab !== 'stats') {
      fetchAllData();
    }
  }, [activeTab]);

  const handleCompanyStatus = async (companyId, newStatus) => {
    try {
      await adminAPI.updateCompanyStatus(companyId, newStatus);
      setCompanies(companies.map((c) =>
        c.id === companyId ? { ...c, status: newStatus } : c
      ));
    } catch (error) {
      console.error('Error updating company status:', error);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Вы уверены, что хотите удалить этого студента?')) return;
    try {
      await adminAPI.deleteStudent(studentId);
      setStudents(students.filter((s) => s.id !== studentId));
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleEventStatus = async (eventId, newStatus) => {
    try {
      await adminAPI.updateEventStatus(eventId, newStatus);
      setEvents(events.map((e) =>
        e.id === eventId ? { ...e, status: newStatus } : e
      ));
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Вы уверены, что хотите удалить это мероприятие?')) return;
    try {
      await adminAPI.deleteEvent(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleApplicationStatus = async (applicationId, newStatus) => {
    try {
      await adminAPI.updateApplicationStatus(applicationId, newStatus);
      setApplications(applications.map((a) =>
        a.id === applicationId ? { ...a, status: newStatus } : a
      ));
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  if (loading) return <div className="container">З��грузка...</div>;

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
            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            👤 Студенты
          </button>
          <button
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            📅 Мероприятия
          </button>
          <button
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            📝 Заявки
          </button>
          <button
            className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            ⚙️ Админы
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

        {activeTab === 'students' && (
          <div className="students-section">
            <h2>Управление студентами</h2>
            {students.length === 0 ? (
              <p>Студентов не найдено</p>
            ) : (
              <div className="companies-table">
                <table>
                  <thead>
                    <tr>
                      <th>ФИО</th>
                      <th>Email</th>
                      <th>ВУЗ / Колледж</th>
                      <th>Курс</th>
                      <th>Город</th>
                      <th>Дата регистрации</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <strong>{student.full_name}</strong>
                        </td>
                        <td>{student.email}</td>
                        <td>{student.university || '-'}</td>
                        <td>{student.course || '-'}</td>
                        <td>{student.city || '-'}</td>
                        <td>
                          {student.created_at
                            ? new Date(student.created_at).toLocaleDateString('ru-RU')
                            : '-'}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="btn-small btn-danger"
                          >
                            🗑️ Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="events-section">
            <h2>Управление мероприятиями</h2>
            {events.length === 0 ? (
              <p>Мероприятий не найдено</p>
            ) : (
              <div className="companies-table">
                <table>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Компания</th>
                      <th>Тип</th>
                      <th>Дата</th>
                      <th>Статус</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <strong>{event.title}</strong>
                        </td>
                        <td>{event.company_name}</td>
                        <td>{event.event_type || '-'}</td>
                        <td>
                          {event.event_date
                            ? new Date(event.event_date).toLocaleDateString('ru-RU')
                            : '-'}
                        </td>
                        <td>
                          <span className={`status-badge status-${event.status}`}>
                            {getEventStatusLabel(event.status)}
                          </span>
                        </td>
                        <td>
                          {event.status === 'active' && (
                            <button
                              onClick={() => handleEventStatus(event.id, 'hidden')}
                              className="btn-small btn-warning"
                            >
                              Скрыть
                            </button>
                          )}
                          {event.status === 'hidden' && (
                            <button
                              onClick={() => handleEventStatus(event.id, 'active')}
                              className="btn-small btn-success"
                            >
                              Показать
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="btn-small btn-danger"
                          >
                            🗑️ Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="applications-section">
            <h2>Управление заявками</h2>
            {applications.length === 0 ? (
              <p>Заявок не найдено</p>
            ) : (
              <div className="companies-table">
                <table>
                  <thead>
                    <tr>
                      <th>Студент</th>
                      <th>Email</th>
                      <th>ВУЗ</th>
                      <th>Мероприятие</th>
                      <th>Компания</th>
                      <th>Статус</th>
                      <th>Дата</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>{app.student_name}</td>
                        <td>{app.student_email}</td>
                        <td>{app.university || '-'}</td>
                        <td>{app.event_title}</td>
                        <td>{app.company_name}</td>
                        <td>
                          <span className={`status-badge status-${app.status}`}>
                            {getApplicationStatusLabel(app.status)}
                          </span>
                        </td>
                        <td>
                          {app.created_at
                            ? new Date(app.created_at).toLocaleDateString('ru-RU')
                            : '-'}
                        </td>
                        <td>
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() =>
                                  handleApplicationStatus(app.id, 'approved')
                                }
                                className="btn-small btn-success"
                              >
                                ✓ Одобрить
                              </button>
                              <button
                                onClick={() =>
                                  handleApplicationStatus(app.id, 'rejected')
                                }
                                className="btn-small btn-danger"
                              >
                                ✕ Отклонить
                              </button>
                            </>
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

        {activeTab === 'admins' && (
          <div className="admins-section">
            <h2>Управление администраторами</h2>
            {admins.length === 0 ? (
              <p>Администраторов не найдено</p>
            ) : (
              <div className="companies-table">
                <table>
                  <thead>
                    <tr>
                      <th>Имя</th>
                      <th>Email</th>
                      <th>Дата создания</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td>
                          <strong>{admin.name}</strong>
                        </td>
                        <td>{admin.email}</td>
                        <td>
                          {admin.created_at
                            ? new Date(admin.created_at).toLocaleDateString('ru-RU')
                            : '-'}
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

function getEventStatusLabel(status) {
  const labels = {
    active: 'Активно',
    hidden: 'Скрыто',
    closed: 'Завершено',
  };
  return labels[status] || status;
}

function getApplicationStatusLabel(status) {
  const labels = {
    pending: 'На рассмотрении',
    approved: 'Одобрено',
    rejected: 'Отклонено',
  };
  return labels[status] || status;
}

export default AdminDashboard;