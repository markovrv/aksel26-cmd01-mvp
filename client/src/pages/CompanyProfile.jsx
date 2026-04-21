import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companyAPI } from '../api';
import './CompanyProfile.css';

function CompanyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await companyAPI.getProfile(id);
        setCompany(response.data.company);
        setCases(response.data.cases);
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

        {company.full_description && (
          <div className="description-section">
            <h2>О компании</h2>
            <p>{company.full_description}</p>
          </div>
        )}

        {cases.length > 0 && (
          <div className="events-section">
            <h2>Кейсы компании</h2>
            <div className="events-list">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="event-card">
                  <h3>{caseItem.title}</h3>
                  <p>{caseItem.description}</p>
                  <p className="deadline">
                    📅 Дедлайн: {new Date(caseItem.application_deadline).toLocaleDateString('ru-RU')}
                  </p>
                  <button className="btn btn-primary" onClick={() => navigate(`/case/${caseItem.id}`)}>
                    Подробнее
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



export default CompanyProfile;
