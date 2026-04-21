import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { casesAPI } from '../api';
import './CasesList.css';

function CasesList({ user }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await casesAPI.getAllCases();
        setCases(response.data);
      } catch (err) {
        setError('Failed to load cases');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading) return <div className="container">Loading cases...</div>;

  return (
    <div className="container">
      <div className="cases-header">
        <h1>📋 Industrial Cases</h1>
        <p>Find and solve real challenges from local enterprises</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {cases.length === 0 ? (
        <div className="empty-state">
          <p>No cases available yet</p>
        </div>
      ) : (
        <div className="cases-grid">
          {cases.map((caseItem) => (
            <div key={caseItem.id} className="case-card">
              <div className="case-header">
                <h3>{caseItem.title}</h3>
                <span className="case-status">{caseItem.status}</span>
              </div>

              <p className="company-name">From: <strong>{caseItem.company_name}</strong></p>

              <p className="case-description">{caseItem.description.substring(0, 150)}...</p>

              <div className="case-meta">
                <span className="deadline">
                  📅 {new Date(caseItem.deadline).toLocaleDateString()}
                </span>
              </div>

              <Link to={`/cases/${caseItem.id}`} className="btn btn-primary">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CasesList;
