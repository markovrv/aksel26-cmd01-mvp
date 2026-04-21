import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import './Auth.css';

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    university: '',
    specialization: '',
    company_name: '',
    company_description: '',
    inn: '',
    city: '',
    website: '',
    contact_person: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.register({
        ...formData,
        role,
      });
      onLogin(response.data.user, response.data.token);
      navigate('/cases');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🏭 Industrial Tourism</h1>
        <h2>Register</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Account Type</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="company">Company</option>
            </select>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

{role === 'student' && (
              <>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>University / College</label>
                  <input type="text" name="university" value={formData.university} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Course / Year of Study</label>
                  <input type="number" name="course" value={formData.course} onChange={handleChange} min="1" max="6" />
                </div>

                <div className="form-group">
                  <label>Specialization</label>
                  <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Phone (Optional)</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Resume (PDF)</label>
                  <input type="file" name="resume" accept=".pdf" onChange={handleChange} />
                  <p className="help-text">Upload your resume in PDF format</p>
                </div>
              </>
            )}

            {role === 'company' && (
              <>
                <div className="form-group">
                  <label>Company Name (Full)</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Short Description (up to 500 characters)</label>
                  <textarea name="short_description" value={formData.short_description} onChange={handleChange} maxlength="500"></textarea>
                  <p className="help-text">Brief description of your company</p>
                </div>

                <div className="form-group">
                  <label>Full Description</label>
                  <textarea name="full_description" value={formData.full_description} onChange={handleChange}></textarea>
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Address (for map display)</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Latitude (for map)</label>
                  <input type="number" name="latitude" value={formData.latitude} onChange={handleChange} step="any" />
                </div>

                <div className="form-group">
                  <label>Longitude (for map)</label>
                  <input type="number" name="longitude" value={formData.longitude} onChange={handleChange} step="any" />
                </div>

                <div className="form-group">
                  <label>Company Logo</label>
                  <input type="file" name="logo" accept=".jpg,.jpeg,.png" onChange={handleChange} />
                  <p className="help-text">Upload company logo (JPG, PNG)</p>
                </div>

                <div className="form-group">
                  <label>Contact Person (Full Name)</label>
                  <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Contact Email</label>
                  <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} required />
                </div>
              </>
            )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
