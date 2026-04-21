import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import './Dashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [cases, setCases] = useState([]);
  const [solutions, setSolutions] = useState([]);
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
    const [companiesRes, studentsRes, casesRes, solutionsRes, adminsRes, logsRes] = await Promise.allSettled([
      adminAPI.getCompanies(),
      adminAPI.getStudents(),
      adminAPI.getCases(),
      adminAPI.getSolutions(),
      adminAPI.getAdmins(),
      adminAPI.getLogs(),
    ]);

    if (companiesRes.status === 'fulfilled') setCompanies(companiesRes.value.data || []);
    else console.error('Error loading companies:', companiesRes.reason);

    if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data || []);
    else console.error('Error loading students:', studentsRes.reason);

    if (casesRes.status === 'fulfilled') setCases(casesRes.value.data || []);
    else console.error('Error loading cases:', casesRes.reason);

    if (solutionsRes.status === 'fulfilled') setSolutions(solutionsRes.value.data || []);
    else console.error('Error loading solutions:', solutionsRes.reason);

    if (adminsRes.status === 'fulfilled') setAdmins(adminsRes.value.data || []);
    else console.error('Error loading admins:', adminsRes.reason);

    if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data || []);
    else console.error('Error loading logs:', logsRes.reason);
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
        c.id === companyId ? { ...c, moderation_status: newStatus } : c
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

  const handleCaseStatus = async (caseId, newStatus) => {
    try {
      await adminAPI.updateCaseStatus(caseId, newStatus);
      setCases(cases.map((c) =>
        c.id === caseId ? { ...c, status: newStatus } : c
      ));
    } catch (error) {
      console.error('Error updating case status:', error);
    }
  };

  const handleDeleteCase = async (caseId) => {
    if (!confirm('Вы уверены, что хотите удалить этот кейс?')) return;
    try {
      await adminAPI.deleteCase(caseId);
      setCases(cases.filter((c) => c.id !== caseId));
    } catch (error) {
      console.error('Error deleting case:', error);
    }
  };

  const handleSolutionStatus = async (solutionId, newStatus) => {
    try {
      await adminAPI.updateSolutionStatus(solutionId, newStatus);
      setSolutions(solutions.map((s) =>
        s.id === solutionId ? { ...s, status: newStatus } : s
      ));
    } catch (error) {
      console.error('Error updating solution status:', error);
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
            className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            📋 Кейсы
          </button>
          <button
            className={`tab-btn ${activeTab === 'solutions' ? 'active' : ''}`}
            onClick={() => setActiveTab('solutions')}
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
                <h3>Компании на модерации</h3>
                <p className="stat-number">{stats.pendingCompanies.count}</p>
              </div>
              <div className="stat-card">
                <h3>Активные кейсы</h3>
                <p className="stat-number">{stats.cases.count}</p>
              </div>
              <div className="stat-card">
                <h3>Решения</h3>
                <p className="stat-number">{stats.solutions.count}</p>
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
                          <span className={`status-badge status-${company.moderation_status}`}>
                            {getStatusLabel(company.moderation_status)}
                          </span>
                        </td>
                        <td>
                          {company.moderation_status === 'moderation' && (
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
                          {company.moderation_status === 'active' && (
                            <button
                              onClick={() =>
                                handleCompanyStatus(company.id, 'rejected')
                              }
                              className="btn-small btn-danger"
                            >
                              ✕ Отклонить
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
                          <strong>{student.first_name} {student.last_name}</strong>
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

        {activeTab === 'cases' && (
          <div className="events-section">
            <h2>Управление кейсами</h2>
            {cases.length === 0 ? (
              <p>Кейсов не найдено</p>
            ) : (
              <div className="companies-table">
                <table>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Компания</th>
                      <th>Дедлайн</th>
                      <th>Статус</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((caseItem) => (
                      <tr key={caseItem.id}>
                        <td>
                          <strong>{caseItem.title}</strong>
                        </td>
                        <td>{caseItem.company_name}</td>
                        <td>
                          {new Date(caseItem.application_deadline).toLocaleDateString('ru-RU')}
                        </td>
                        <td>
                          <span className={`status-badge status-${caseItem.status}`}>
                            {getCaseStatusLabel(caseItem.status)}
                          </span>
                        </td>
                        <td>
                          {caseItem.status === 'active' && (
                            <button
                              onClick={() => handleCaseStatus(caseItem.id, 'archived')}
                              className="btn-small btn-warning"
                            >
                              В архив
                            </button>
                          )}
                          {caseItem.status === 'archived' && (
                            <button
                              onClick={() => handleCaseStatus(caseItem.id, 'active')}
                              className="btn-small btn-success"
                            >
                              Активировать
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCase(caseItem.id)}
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

        {activeTab === 'solutions' && (
          <div className="applications-section">
            <h2>Управление решениями</h2>
            {solutions.length === 0 ? (
              <p>Решений не найдено</p>
            ) : (
              <div className="companies-table">
                <table>
                  <thead>
                    <tr>
                      <th>Студент</th>
                      <th>Email</th>
                      <th>ВУЗ</th>
                      <th>Кейс</th>
                      <th>Компания</th>
                      <th>Статус</th>
                      <th>Дата</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solutions.map((solution) => (
                      <tr key={solution.id}>
                        <td>{solution.first_name} {solution.last_name}</td>
                        <td>{solution.email}</td>
                        <td>{solution.university || '-'}</td>
                        <td>{solution.case_title}</td>
                        <td>{solution.company_name}</td>
                        <td>
                          <span className={`status-badge status-${solution.status}`}>
                            {getSolutionStatusLabel(solution.status)}
                          </span>
                        </td>
                        <td>
                          {solution.created_at
                            ? new Date(solution.created_at).toLocaleDateString('ru-RU')
                            : '-'}
                        </td>
                        <td>
                          {solution.status === 'new' && (
                            <>
                              <button
                                onClick={() =>
                                  handleSolutionStatus(solution.id, 'viewed')
                                }
                                className="btn-small btn-warning"
                              >
                                👁️ Просмотрено
                              </button>
                              <button
                                onClick={() =>
                                  handleSolutionStatus(solution.id, 'invited')
                                }
                                className="btn-small btn-success"
                              >
                                ✓ Пригласить
                              </button>
                              <button
                                onClick={() =>
                                  handleSolutionStatus(solution.id, 'rejected')
                                }
                                className="btn-small btn-danger"
                              >
                                ✕ Отклонить
                              </button>
                            </>
                          )}
                          {solution.status === 'viewed' && (
                            <>
                              <button
                                onClick={() =>
                                  handleSolutionStatus(solution.id, 'invited')
                                }
                                className="btn-small btn-success"
                              >
                                ✓ Пригласить
                              </button>
                              <button
                                onClick={() =>
                                  handleSolutionStatus(solution.id, 'rejected')
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
    moderation: 'На модерации',
    active: 'Активна',
    rejected: 'Отклонена',
  };
  return labels[status] || status;
}

function getCaseStatusLabel(status) {
  const labels = {
    draft: 'Черновик',
    active: 'Активен',
    closed: 'Закрыт',
    archived: 'В архиве',
  };
  return labels[status] || status;
}

function getSolutionStatusLabel(status) {
  const labels = {
    new: 'Новое',
    viewed: 'Просмотрено',
    invited: 'Приглашен',
    rejected: 'Отклонено',
  };
  return labels[status] || status;
}

export default AdminDashboard;