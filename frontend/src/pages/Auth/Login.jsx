import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/AuthLayout';
import FloatingInput from '../../components/FloatingInput';
import authService from '../../services/authService';

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      toast.success(t('auth.verifyEmail.successMessage'));
    }
  }, [searchParams, t]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.login(formData);
      toast.success(t('auth.login.title'));
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.detail || t('auth.login.title');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
    >
      <form onSubmit={handleSubmit} className="form-body">

        <FloatingInput
          label={t('auth.login.email')}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoFocus
        />

        <FloatingInput
          label={t('auth.login.password')}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          showPasswordToggle
        />

        {/* Remember me + Forgot password */}
        <div className="form-options">
          <label className="checkbox-label">
            <input type="checkbox" name="remember" />
            <span className="checkmark" />
            {t('auth.login.rememberMe')}
          </label>
          <Link to="/forgot-password" className="forgot-link">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className={`btn btn-primary btn-full${loading ? ' btn-loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              {t('auth.login.signingIn')}
            </>
          ) : (
            <>
              {t('auth.login.signIn')}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>

        {/* Register link */}
        <div className="form-footer">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="switch-btn">
            {t('auth.login.createFree')}
          </Link>
        </div>

      </form>
    </AuthLayout>
  );
};

export default Login;
