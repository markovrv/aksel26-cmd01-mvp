import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, applicationsAPI } from '../api';
import './EventDetail.css';

function EventDetail({ user, userType }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await eventsAPI.getById(id);
        setEvent(response.data);
        setCompany(response.data);
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userType !== 'student') {
      alert('Только студенты могут подавать заявки');
      return;
    }

    if (!textContent.trim()) {
      alert('Заполните поле заявки');
      return;
    }

    setSubmitting(true);

    try {
      await applicationsAPI.submit({
        event_id: id,
        text_content: textContent,
      });

      setSubmitted(true);
      setTextContent('');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при отправке заявки');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;
  if (!event) return <div className="container">Мероприятие не найдено</div>;

  const isExpired = new Date(event.application_deadline) < new Date();

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="btn-back">
        ← Вернуться на карту
      </button>

      <div className="event-detail">
        <div className="event-header">
          <h1>{event.title}</h1>
          <div className="event-meta">
            <span className="badge">{getEventTypeLabel(event.type)}</span>
            <span className={`status ${isExpired ? 'expired' : 'active'}`}>
              {isExpired ? 'Завершено' : 'Активно'}
            </span>
          </div>
        </div>

        <div className="company-info">
          <h3>🏢 {event.company_name}</h3>
          <p>{event.company_description}</p>
          <p>📍 {event.company_city}</p>
        </div>

        <div className="event-details-grid">
          <div className="detail-card">
            <h4>Описание</h4>
            <p>{event.description}</p>
          </div>

          {event.requirements && (
            <div className="detail-card">
              <h4>Требования</h4>
              <p>{event.requirements}</p>
            </div>
          )}

          <div className="detail-card">
            <h4>Информация</h4>
            <p>
              <strong>Срок подачи:</strong> {new Date(event.application_deadline).toLocaleDateString('ru-RU')}
            </p>
            {event.event_date && (
              <p>
                <strong>Дата события:</strong> {new Date(event.event_date).toLocaleDateString('ru-RU')}
              </p>
            )}
            {event.event_time && (
              <p>
                <strong>Время:</strong> {event.event_time}
              </p>
            )}
            {event.format && (
              <p>
                <strong>Формат:</strong> {event.format === 'online' ? '🌐 Онлайн' : '🏢 Офлайн'}
              </p>
            )}
            {event.max_participants && (
              <p>
                <strong>Максимум участников:</strong> {event.max_participants}
              </p>
            )}
            <p>
              <strong>Просмотров:</strong> {event.view_count || 0}
            </p>
          </div>
        </div>

        {userType === 'student' && !isExpired && (
          <div className="application-form">
            <h3>Отправить заявку</h3>

            {submitted && (
              <div className="alert alert-success">
                ✅ Заявка успешно отправлена! Вы будете перенаправлены на панель...
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Текст заявки</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Расскажите о себе и почему вас интересует это мероприятие..."
                  rows="6"
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </form>
          </div>
        )}

        {isExpired && userType === 'student' && (
          <div className="alert alert-error">
            ⏰ Срок подачи заявок истек
          </div>
        )}

        {userType === 'company' && (
          <div className="company-view">
            <p>ℹ️ Для просмотра заявок перейдите в кабинет компании</p>
          </div>
        )}

        {!user && (
          <div className="alert alert-info">
            Войдите в систему, чтобы подать заявку на это мероприятие
          </div>
        )}
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

export default EventDetail;
