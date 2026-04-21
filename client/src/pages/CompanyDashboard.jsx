import { useState, useEffect } from 'react';
import { casesAPI, companyAPI, solutionsAPI } from '../api';
import './Dashboard.css';

function CompanyDashboard({ user }) {
  const [dashboard, setDashboard] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    requirements: '',
    application_deadline: '',
  });
  const [editCaseData, setEditCaseData] = useState({ title: '', description: '', requirements: '', application_deadline: '' });
  const [editingCaseId, setEditingCaseId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashRes = await companyAPI.getDashboard();
        setDashboard(dashRes.data);

        const solutionsRes = await solutionsAPI.getCompany();
        setSolutions(solutionsRes.data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      const response = await casesAPI.create(createData);
      setDashboard((prev) => ({ ...prev, cases: [response.data, ...(prev?.cases || [])] }));
      setCreateData({ title: '', description: '', requirements: '', application_deadline: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating case:', error);
      alert(error.response?.data?.error || 'Не удалось создать кейс');
    }
  };

  const handleSolutionStatus = async (solutionId, status) => {
    try {
      await solutionsAPI.updateStatus(solutionId, status);
      setSolutions((prev) => prev.map((s) => (s.id === solutionId ? { ...s, status } : s)));
    } catch (error) {
      console.error('Error updating solution status:', error);
      alert(error.response?.data?.error || 'Не удалось обновить статус');
    }
  };

  const handleEditCase = (caseItem) => {
    setEditCaseData({
      title: caseItem.title,
      description: caseItem.description,
      requirements: caseItem.requirements,
      application_deadline: caseItem.application_deadline.split('T')[0], // Convert to YYYY-MM-DD for date input
    });
    setEditingCaseId(caseItem.id);
  };

  const handleSaveEditedCase = async (e) => {
    e.preventDefault();
    try {
      const response = await casesAPI.update(editingCaseId, editCaseData);
      // Update the case in dashboard state
      setDashboard((prev) => ({
        ...prev,
        cases: prev.cases.map((c) =>
          c.id === editingCaseId ? { ...response.data, ...c } : c
        ),
      }));
      setEditingCaseId(null);
      setEditCaseData({ title: '', description: '', requirements: '', application_deadline: '' });
    } catch (error) {
      console.error('Error updating case:', error);
      alert(error.response?.data?.error || 'Не удалось обновить кейс');
    }
  };

  const handleCancelEdit = () => {
    setEditingCaseId(null);
    setEditCaseData({ title: '', description: '', requirements: '', application_deadline: '' });
  };

  const handleDeleteCase = async (caseId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот кейс? Все связанные решения также будут удалены.')) {
      return;
    }
    try {
      await casesAPI.deleteCompanyCase(caseId);
      // Remove case from dashboard state
      setDashboard((prev) => ({
        ...prev,
        cases: prev.cases.filter((c) => c.id !== caseId),
      }));
    } catch (error) {
      console.error('Error deleting case:', error);
      alert(error.response?.data?.error || 'Не удалось удалить кейс');
    }
  };

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
                <strong>Статус модерации:</strong>{' '}
                <span className={`status-badge status-${dashboard.company.moderation_status}`}>
                  {getCompanyStatusLabel(dashboard.company.moderation_status)}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="events-section">
          <div className="section-header">
            <h2>Мои кейсы ({dashboard?.cases?.length || 0})</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary"
            >
              {showCreateForm ? '✕ Отмена' : '➕ Создать кейс'}
            </button>
          </div>

          {showCreateForm && (
            <div className="create-form">
              <form onSubmit={handleCreateCase}>
                <div className="form-group">
                  <label>Название кейса</label>
                  <input
                    value={createData.title}
                    onChange={(e) => setCreateData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    value={createData.description}
                    onChange={(e) => setCreateData((prev) => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Требования к студенту</label>
                  <textarea
                    value={createData.requirements}
                    onChange={(e) => setCreateData((prev) => ({ ...prev, requirements: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Дедлайн приема решений</label>
                  <input
                    type="date"
                    value={createData.application_deadline}
                    onChange={(e) => setCreateData((prev) => ({ ...prev, application_deadline: e.target.value }))}
                    required
                  />
                </div>
                <button className="btn btn-primary" type="submit">Создать</button>
              </form>
            </div>
          )}

          {dashboard?.cases && dashboard.cases.length > 0 ? (
            <div className="events-list">
              {dashboard.cases.map((caseItem) => (
                <div key={caseItem.id} className="event-item">
                  {editingCaseId === caseItem.id ? (
                    <form onSubmit={handleSaveEditedCase} className="edit-form">
                      <div className="form-group">
                        <label>Название кейса</label>
                        <input
                          value={editCaseData.title}
                          onChange={(e) => setEditCaseData((prev) => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Описание</label>
                        <textarea
                          value={editCaseData.description}
                          onChange={(e) => setEditCaseData((prev) => ({ ...prev, description: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Требования к студенту</label>
                        <textarea
                          value={editCaseData.requirements}
                          onChange={(e) => setEditCaseData((prev) => ({ ...prev, requirements: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Дедлайн приема решений</label>
                        <input
                          type="date"
                          value={editCaseData.application_deadline}
                          onChange={(e) => setEditCaseData((prev) => ({ ...prev, application_deadline: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="case-actions">
                        <button type="submit" className="btn-small btn-success">Сохранить</button>
                        <button type="button" onClick={handleCancelEdit} className="btn-small">Отмена</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3>{caseItem.title}</h3>
                      <p>{caseItem.description}</p>
                      <div className="event-meta">
                        <span>
                          📅 Дедлайн: {new Date(caseItem.application_deadline).toLocaleDateString('ru-RU')}
                        </span>
                        <span className={`status-${caseItem.status}`}>{getCaseStatusLabel(caseItem.status)}</span>
                      </div>
                      <div className="case-actions">
                        <button onClick={() => handleEditCase(caseItem)} className="btn-small btn-warning">Редактировать</button>
                        <button onClick={() => handleDeleteCase(caseItem.id)} className="btn-small btn-danger">Удалить</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Вы еще не создали ни одного кейса</p>
            </div>
          )}
        </div>

        <div className="applications-section">
          <h2>Решения студентов по кейсам</h2>
          {dashboard?.cases?.length === 0 ? (
            <p>У вас нет кейсов, поэтому нет решений.</p>
          ) : (
            dashboard.cases.map((caseItem) => {
              const caseSolutions = solutions.filter((s) => s.case_id === caseItem.id);
              return (
                <div key={caseItem.id} className="case-solutions">
                  <h3>{caseItem.title}</h3>
                  {caseSolutions.length === 0 ? (
                    <p>Решений пока нет</p>
                  ) : (
                    <table className="solutions-table">
                      <thead>
                        <tr>
                          <th>Студент</th>
                          <th>ВУЗ</th>
                          <th>Статус</th>
                          <th>Дата решения</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseSolutions.map((solution) => (
                          <tr key={solution.id}>
                            <td>
                              {solution.first_name} {solution.last_name}
                              <br />
                              <small>{solution.email}</small>
                            </td>
                            <td>{solution.university || '-'}</td>
                            <td>
                              <span className={`status-badge status-${solution.status}`}>
                                {getStatusLabel(solution.status)}
                              </span>
                            </td>
                            <td>{new Date(solution.created_at).toLocaleDateString('ru-RU')}</td>
                            <td>
                              <button className="btn-small btn-warning" onClick={() => handleSolutionStatus(solution.id, 'viewed')}>Просмотрено</button>
                              <button className="btn-small btn-success" onClick={() => handleSolutionStatus(solution.id, 'invited')}>Пригласить</button>
                              <button className="btn-small btn-danger" onClick={() => handleSolutionStatus(solution.id, 'rejected')}>Отклонить</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })
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

function getCompanyStatusLabel(status) {
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
    archived: 'Архив',
  };
  return labels[status] || status;
}

export default CompanyDashboard;
