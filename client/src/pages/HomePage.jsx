import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api';
import MapComponent from '../components/MapComponent';
import './HomePage.css';

function HomePage({ user, userType }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventsAPI.getAll(selectedType, selectedCity, searchQuery);
        setEvents(response.data);

        // Extract unique cities
        const uniqueCities = [...new Set(response.data.map(e => e.company_city))].filter(Boolean);
        setCities(uniqueCities);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    const delayTimer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(delayTimer);
  }, [selectedType, selectedCity, searchQuery]);

  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/company/${companyId}`);
  };

  if (!user) {
    return (
      <div className="homepage guest-view">
        <div className="hero-section">
          <h1>🏭 Промышленный туризм Кировской области</h1>
          <p>Платформа для связи студентов с предприятиями региона</p>
          <div className="hero-buttons">
            <button onClick={() => navigate('/login')} className="btn btn-primary btn-large">
              Вход в систему
            </button>
            <button onClick={() => navigate('/register')} className="btn btn-secondary btn-large">
              Регистрация
            </button>
          </div>
        </div>

        <div className="features-section">
          <h2>Что вы сможете делать</h2>
          <div className="features-grid">
            <div className="feature">
              <h3>📍 Карта предприятий</h3>
              <p>Найдите интересующие вас компании на интерактивной карте</p>
            </div>
            <div className="feature">
              <h3>📋 Кейсы и задачи</h3>
              <p>Решайте реальные задачи от промышленных предприятий</p>
            </div>
            <div className="feature">
              <h3>🎓 Стажировки</h3>
              <p>Получайте опыт работы в крупных компаниях</p>
            </div>
            <div className="feature">
              <h3>👁️ Экскурсии</h3>
              <p>Посещайте производства и узнавайте о работе изнутри</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <div className="homepage-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>🔍 Поиск мероприятий</h2>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters">
            <div className="filter-group">
              <label>Тип мероприятия</label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${selectedType === null ? 'active' : ''}`}
                  onClick={() => setSelectedType(null)}
                >
                  Все
                </button>
                <button
                  className={`filter-btn ${selectedType === 'case' ? 'active' : ''}`}
                  onClick={() => setSelectedType('case')}
                >
                  Кейсы
                </button>
                <button
                  className={`filter-btn ${selectedType === 'internship' ? 'active' : ''}`}
                  onClick={() => setSelectedType('internship')}
                >
                  Стажировки
                </button>
                <button
                  className={`filter-btn ${selectedType === 'tour' ? 'active' : ''}`}
                  onClick={() => setSelectedType('tour')}
                >
                  Экскурсии
                </button>
              </div>
            </div>

            <div className="filter-group">
              <label>Город</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="city-select"
              >
                <option value="">Все города</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="events-list">
            <h3>Мероприятия ({events.length})</h3>
            {loading ? (
              <p>Загрузка...</p>
            ) : events.length === 0 ? (
              <p>Мероприятия не найдены</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="event-item"
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="event-type-badge">{getEventTypeLabel(event.type)}</div>
                  <h4>{event.title}</h4>
                  <p className="company-name">📍 {event.company_name}</p>
                  <p className="event-date">📅 {new Date(event.application_deadline).toLocaleDateString('ru-RU')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="main-content">
          <MapComponent events={events} onEventClick={handleEventClick} />
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

export default HomePage;
