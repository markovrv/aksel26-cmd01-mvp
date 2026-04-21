import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { casesAPI, solutionsAPI } from '../api';
import './CaseDetail.css';

function CaseDetail({ userType }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    text_content: '',
    file: null,
  });

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await casesAPI.getById(id);
        setCaseData(response.data);
      } catch (err) {
        setError('Не удалось загрузить кейс');
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('case_id', id);
      if (formData.text_content) {
        formDataToSend.append('text_content', formData.text_content);
      }
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      await solutionsAPI.submitSolution(formDataToSend);
      setSubmitted(true);
      setFormData({ text_content: '', file: null });

      setTimeout(() => {
        if (userType === 'student') {
          navigate('/dashboard');
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;
  if (!caseData) return <div className="container">Кейс не найден</div>;

  const isExpired = new Date(caseData.application_deadline) < new Date();

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        ← На главную
      </button>

      <div className="case-detail">
        <div className="case-detail-header">
          <div>
            <h1>{caseData.title}</h1>
            <p className="company-info">Компания: <strong>{caseData.company_name}</strong></p>
          </div>
          <div className="case-status-badge" style={{ backgroundColor: isExpired ? '#dc3545' : '#28a745' }}>
            {isExpired ? 'Дедлайн истек' : 'Активен'}
          </div>
        </div>

        <div className="case-info-grid">
          <div className="info-item">
            <span className="label">Дедлайн:</span>
            <span className="value">{new Date(caseData.application_deadline).toLocaleDateString('ru-RU')}</span>
          </div>
          <div className="info-item">
            <span className="label">Статус:</span>
            <span className="value">{caseData.status}</span>
          </div>
        </div>

        <div className="case-section">
          <h2>📝 Описание</h2>
          <p>{caseData.description}</p>
        </div>

        <div className="case-section">
          <h2>📋 Требования</h2>
          <p>{caseData.requirements}</p>
        </div>

        {userType === 'student' && !isExpired && (
          <div className="case-section solution-form">
            <h2>✍️ Отправить решение</h2>

            {submitted && (
              <div className="alert alert-success">
                ✅ Решение отправлено. Переходим в личный кабинет...
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Текст решения</label>
                <textarea
                  name="text_content"
                  value={formData.text_content}
                  onChange={handleChange}
                  placeholder="Опишите ваше решение"
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Файл решения (PDF/DOCX/ZIP, до 10 МБ)</label>
                <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.zip" />
                {formData.file && <p className="file-name">Выбран файл: {formData.file.name}</p>}
              </div>

              <button
                type="submit"
                className="btn btn-success"
                disabled={submitting || !formData.text_content}
              >
                {submitting ? 'Отправка...' : 'Отправить'}
              </button>
            </form>
          </div>
        )}

        {isExpired && userType === 'student' && (
          <div className="alert alert-error">
            Срок подачи решений по этому кейсу уже истек.
          </div>
        )}
      </div>
    </div>
  );
}

export default CaseDetail;
