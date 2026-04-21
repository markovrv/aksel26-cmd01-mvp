import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import './AuthPages.css';

function RegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    course: '',
    city: '',
    phone: '',
    name: '',
    inn: '',
    website: '',
    contact_person: '',
    description: '',
    admin_name: '',
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

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      let response;
      if (userType === 'student') {
        response = await authAPI.registerStudent({
          email: formData.email,
          password: formData.password,
          first_name: formData.full_name.split(' ')[0] || formData.full_name,
          last_name: formData.full_name.split(' ').slice(1).join(' ') || '-',
          university: formData.university,
          course: formData.course,
          city: formData.city,
          phone: formData.phone,
        });
        onLogin(response.data.user, response.data.token, userType);
        navigate('/');
      } else if (userType === 'admin') {
        response = await authAPI.registerAdmin({
          email: formData.email,
          password: formData.password,
          name: formData.admin_name,
        });
        onLogin(response.data.user, response.data.token, userType);
        navigate('/admin');
      } else {
        response = await authAPI.registerCompany({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          city: formData.city,
          address: formData.website,
          contact_person: formData.contact_person,
          contact_phone: formData.phone,
          short_description: formData.description,
          full_description: formData.description,
          contact_email: formData.email,
        });
        onLogin(response.data.user, response.data.token, userType);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🏭 Промышленный туризм</h1>
        <h2>Регистрация</h2>

        <div className="user-type-selector">
          <label>
            <input
              type="radio"
              value="student"
              checked={userType === 'student'}
              onChange={(e) => setUserType(e.target.value)}
            />
            Студент
          </label>
          <label>
            <input
              type="radio"
              value="company"
              checked={userType === 'company'}
              onChange={(e) => setUserType(e.target.value)}
            />
            Предприятие
          </label>
          <label>
            <input
              type="radio"
              value="admin"
              checked={userType === 'admin'}
              onChange={(e) => setUserType(e.target.value)}
            />
            Администратор
          </label>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {userType === 'student' ? (
            <>
              <div className="form-group">
                <label>ФИО</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>ВУЗ / Колледж</label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Курс</label>
                <select name="course" value={formData.course} onChange={handleChange}>
                  <option value="">Выберите курс</option>
                  <option value="1">1 курс</option>
                  <option value="2">2 курс</option>
                  <option value="3">3 курс</option>
                  <option value="4">4 курс</option>
                  <option value="5">5 курс</option>
                </select>
              </div>

              <div className="form-group">
                <label>Город</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Телефон</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
            </>
          ) : userType === 'admin' ? (
            <>
              <div className="form-group">
                <label>ФИО</label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Название компании</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>ИНН</label>
                <input type="text" name="inn" value={formData.inn} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Город</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Веб-сайт</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Контактное лицо</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Телефон</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea name="description" value={formData.description} onChange={handleChange}></textarea>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Подтверждение пароля</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-link">
          Уже есть аккаунт? <a onClick={() => navigate('/login')}>Войти</a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
