import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { companyAPI } from '../api';
import './CompanyProfile.css';

function CompanyProfile() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await companyAPI.getProfile(id);
        setCompany(response.data.company);
        setEvents(response.data.events);
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  if (loading) return <div className="container">Загрузка...</div>;
  if (!company) return <div className="container">Компания не найдена</div>;

  return (
    <div className="container">
      <div className="company-profile">
        <div className="profile-header">
          {company.logo_path && (
            <img src={company.logo_path} alt={company.name} className="company-logo" />
          )}
          <div className="profile-info">
            <h1>{company.name}</h1>
            <p className="city">📍 {company.city}</p>
            {company.website && (
              <p>
                🌐{' '}
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  {company.website}
                </a>
              </p>
            )}
          </div>
        </div>

        {company.description && (
          <div className="description-section">
            <h2>О компании</h2>
            <p>{company.description}</p>
          </div>
        )}

        {events.length > 0 && (
          <div className="events-section">
            <h2>Мероприятия компании</h2>
            <div className="events-list">
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <span className="event-type">{getEventTypeLabel(event.type)}</span>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <p className="deadline">
                    📅 Срок: {new Date(event.application_deadline).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
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

export default CompanyProfile;
