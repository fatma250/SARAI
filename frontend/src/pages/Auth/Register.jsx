import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/AuthLayout';
import FloatingInput from '../../components/FloatingInput';
import authService from '../../services/authService';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: -1, label: '' });
  const navigate = useNavigate();

  const orgTypes = ["NGO", "Startup", "Company", "Government", "University", "Research Lab"];

  const calculateStrength = (password) => {
    if (!password) return { score: -1, label: '' };

    let score = 0;
    if (password.length > 6) score++;
    if (password.length > 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Cap score at 3 (0-3 scale for 4 bars)
    const finalScore = Math.min(Math.floor(score / 1.3), 3);

    const labels = ['very-weak', 'weak', 'medium', 'strong'];
    return { score: finalScore, label: labels[finalScore] };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      setPasswordStrength(calculateStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      toast.error(t('auth.register.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      await authService.register(formData);
      toast.success(t('auth.register.success'));
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.detail || t('common.error');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
    >
      <form onSubmit={handleSubmit} className="form-body">
        <div className="form-row">
          <FloatingInput
            label={t('auth.register.orgName')}
            name="organization_name"
            value={formData.organization_name}
            onChange={handleChange}
            required
          />
          <div className="fl-field">
            <div className="fl-wrap">
              <select
                id="organization_type"
                name="organization_type"
                value={formData.organization_type}
                onChange={handleChange}
                required
                className="fl-input"
                style={{ appearance: 'none', paddingRight: '2.75rem', cursor: 'pointer' }}
              >
                <option value="" disabled hidden></option>
                {orgTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <label
                htmlFor="organization_type"
                className={`fl-label${formData.organization_type ? ' fl-active' : ''}`}
              >
                {t('auth.register.orgType')}
              </label>
              <span className="fl-select-arrow" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <FloatingInput
          label={t('auth.register.email')}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <FloatingInput
          label={t('auth.register.password')}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          showPasswordToggle
        />

        {formData.password && (
          <div className="password-strength-wrapper">
            <div className={`password-strength-meter strength-${passwordStrength.score}`}>
              <div className="strength-segment"></div>
              <div className="strength-segment"></div>
              <div className="strength-segment"></div>
              <div className="strength-segment"></div>
            </div>
            <div className="password-strength-text">
              <span>{t('auth.register.passwordStrength')}</span>
              <span className={`strength-label ${passwordStrength.label}`}>
                {passwordStrength.label.replace('-', ' ')}
              </span>
            </div>
          </div>
        )}

        <FloatingInput
          label={t('auth.register.confirmPassword')}
          type="password"
          name="confirm_password"
          value={formData.confirm_password}
          onChange={handleChange}
          required
          showPasswordToggle
        />

        <div className="form-options">
          <label className="checkbox-label terms-checkbox">
            <input type="checkbox" required />
            <span className="checkmark"></span>
            <span>{t('auth.register.agreeTo')} <a href="#" className="terms-link">{t('auth.register.terms')}</a> {t('auth.register.and')} <a href="#" className="terms-link">{t('auth.register.privacy')}</a></span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`btn btn-primary btn-full${loading ? ' btn-loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              {t('auth.register.creating')}
            </>
          ) : (
            <>
              {t('auth.register.createAccount')}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>

        <div className="form-footer">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" title="Login" className="switch-btn">
            {t('auth.register.signIn')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
