import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesAPI, companyAPI } from '../api';
import MapComponent from '../components/MapComponent';
import './HomePage.css';

function HomePage({ user, userType }) {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  /** Клик по названию в фильтре: открыть балун на карте (nonce — повторный клик по тому же предприятию). */
  const [mapFocus, setMapFocus] = useState({ id: null, nonce: 0 });
  /** Фильтры списка предприятий (поля из company_profiles в API карты) */
  const [companyCity, setCompanyCity] = useState('');
  const [companyCasesFilter, setCompanyCasesFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем кейсы для списка
        const casesResponse = await casesAPI.getAll('case', searchQuery);
        setCases(casesResponse.data);

        // Загружаем предприятия для карты
        const companiesResponse = await companyAPI.getActiveCases();
        setCompanies(companiesResponse.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    const delayTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(delayTimer);
  }, [searchQuery]);

  const cityOptions = useMemo(() => {
    const set = new Set();
    companies.forEach((c) => {
      if (c.city && String(c.city).trim()) set.add(String(c.city).trim());
    });
    return [...set].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [companies]);

  const visibleCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (companyCity && String(c.city || '').trim() !== companyCity) return false;
      const n = Number(c.active_cases_count) || 0;
      if (companyCasesFilter === 'has' && n < 1) return false;
      if (companyCasesFilter === 'none' && n !== 0) return false;
      return true;
    });
  }, [companies, companyCity, companyCasesFilter]);

  useEffect(() => {
    setSelectedCompanyIds((prev) => prev.filter((id) => visibleCompanies.some((c) => c.id === id)));
  }, [visibleCompanies]);

  const clearCompanyAttributeFilters = () => {
    setCompanyCity('');
    setCompanyCasesFilter('all');
  };

  const toggleCompany = (companyId) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  const clearCompanyFilter = () => {
    setSelectedCompanyIds([]);
  };

  const openCompanyOnMap = (companyId) => {
    setMapFocus((prev) => ({ id: companyId, nonce: prev.nonce + 1 }));
  };

  const filteredCases = selectedCompanyIds.length
    ? cases.filter(
        (caseItem) =>
          selectedCompanyIds.includes(caseItem.company_profile_id) ||
          selectedCompanyIds.includes(caseItem.company_user_id)
      )
    : cases;

  const handleCaseClick = (caseId) => {
    navigate(`/case/${caseId}`);
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
              <p>Найдите интересующие вас компании на интерактивной карте Кировской области</p>
            </div>
            <div className="feature">
              <h3>📋 Кейсы и задачи</h3>
              <p>Решайте реальные производственные задачи от предприятий</p>
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
              placeholder="Поиск по названию кейса или предприятия..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters">
            <div className="filter-group">
              <label>Предприятия на карте</label>
              <div className="company-meta-filters">
                <div className="company-meta-row">
                  <span className="company-meta-label">Город</span>
                  <select
                    className="company-meta-select"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                  >
                    <option value="">Все города</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="company-meta-row">
                  <span className="company-meta-label">Активные кейсы</span>
                  <select
                    className="company-meta-select"
                    value={companyCasesFilter}
                    onChange={(e) => setCompanyCasesFilter(e.target.value)}
                  >
                    <option value="all">Любое число</option>
                    <option value="has">Есть (1 и больше)</option>
                    <option value="none">Нет (0)</option>
                  </select>
                </div>
                <div className="company-meta-actions">
                  <button type="button" className="filter-btn" onClick={clearCompanyAttributeFilters}>
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            </div>
            <div className="filter-group">
              <label>Выбор предприятий для списка кейсов</label>
              <div className="company-filter-actions">
                <button className="filter-btn" onClick={clearCompanyFilter}>
                  Сбросить выбор
                </button>
              </div>
              <div className="company-multiselect">
                {visibleCompanies.length === 0 ? (
                  <p className="company-filter-empty">Нет предприятий по фильтрам</p>
                ) : (
                  visibleCompanies.map((company) => (
                    <div key={company.id} className="company-filter-row">
                      <label className="company-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedCompanyIds.includes(company.id)}
                          onChange={() => toggleCompany(company.id)}
                        />
                      </label>
                      <button
                        type="button"
                        className="company-filter-name"
                        onClick={() => openCompanyOnMap(company.id)}
                      >
                        {company.name}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="events-list">
            <h3>Кейсы ({filteredCases.length})</h3>
            {loading ? (
              <p>Загрузка...</p>
            ) : filteredCases.length === 0 ? (
              <p>Кейсы не найдены</p>
            ) : (
              filteredCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="event-item"
                  onClick={() => handleCaseClick(caseItem.id)}
                >
                  <h4>{caseItem.title}</h4>
                  <p className="company-name">🏭 {caseItem.company_name}</p>
                  <p className="event-date">📅 Дедлайн: {new Date(caseItem.application_deadline).toLocaleDateString('ru-RU')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="main-content">
          <MapComponent companies={visibleCompanies} onCompanyClick={handleCompanyClick} focus={mapFocus} />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
