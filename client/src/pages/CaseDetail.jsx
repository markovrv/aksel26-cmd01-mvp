import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { casesAPI, solutionsAPI } from '../api';
import './CaseDetail.css';

function CaseDetail({ user }) {
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
        const response = await casesAPI.getCaseById(id);
        setCaseData(response.data);
      } catch (err) {
        setError('Failed to load case');
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
        if (user.role === 'student') {
          navigate('/dashboard');
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!caseData) return <div className="container">Case not found</div>;

  const isExpired = new Date(caseData.deadline) < new Date();

  return (
    <div className="container">
      <button onClick={() => navigate('/cases')} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        ← Back to Cases
      </button>

      <div className="case-detail">
        <div className="case-detail-header">
          <div>
            <h1>{caseData.title}</h1>
            <p className="company-info">From: <strong>{caseData.company_name}</strong></p>
          </div>
          <div className="case-status-badge" style={{ backgroundColor: isExpired ? '#dc3545' : '#28a745' }}>
            {isExpired ? 'Expired' : 'Active'}
          </div>
        </div>

        <div className="case-info-grid">
          <div className="info-item">
            <span className="label">Deadline:</span>
            <span className="value">{new Date(caseData.deadline).toLocaleDateString()}</span>
          </div>
          <div className="info-item">
            <span className="label">Status:</span>
            <span className="value">{caseData.status}</span>
          </div>
        </div>

        <div className="case-section">
          <h2>📝 Description</h2>
          <p>{caseData.description}</p>
        </div>

        <div className="case-section">
          <h2>📋 Requirements</h2>
          <p>{caseData.requirements}</p>
        </div>

        {user.role === 'student' && !isExpired && (
          <div className="case-section solution-form">
            <h2>✍️ Submit Your Solution</h2>

            {submitted && (
              <div className="alert alert-success">
                ✅ Solution submitted successfully! Redirecting to dashboard...
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Solution Text (Optional)</label>
                <textarea
                  name="text_content"
                  value={formData.text_content}
                  onChange={handleChange}
                  placeholder="Describe your solution..."
                ></textarea>
              </div>

              <div className="form-group">
                <label>Upload File (Optional)</label>
                <input type="file" onChange={handleFileChange} />
                {formData.file && <p className="file-name">Selected: {formData.file.name}</p>}
              </div>

              <button
                type="submit"
                className="btn btn-success"
                disabled={submitting || (!formData.text_content && !formData.file)}
              >
                {submitting ? 'Submitting...' : 'Submit Solution'}
              </button>
            </form>
          </div>
        )}

        {isExpired && user.role === 'student' && (
          <div className="alert alert-error">
            This case deadline has passed and is no longer accepting submissions.
          </div>
        )}
      </div>
    </div>
  );
}

export default CaseDetail;
