import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/AuthLayout';
import FloatingInput from '../../components/FloatingInput';
import authService from '../../services/authService';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      toast.error(t('auth.resetPassword.passwordsMismatch'));
      return;
    }

    if (!token) {
      toast.error(t('auth.resetPassword.missingToken'));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, formData.password, formData.confirm_password);
      toast.success(t('auth.resetPassword.success'));
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.resetPassword.title')}
      subtitle={t('auth.resetPassword.subtitle')}
    >
      <form onSubmit={handleSubmit} className="form-body">
        <FloatingInput
          label={t('auth.resetPassword.newPassword')}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          showPasswordToggle
        />

        <FloatingInput
          label={t('auth.resetPassword.confirmPassword')}
          type="password"
          name="confirm_password"
          value={formData.confirm_password}
          onChange={handleChange}
          required
          showPasswordToggle
        />

        <button
          type="submit"
          disabled={loading}
          className={`btn btn-primary btn-full${loading ? ' btn-loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              {t('auth.resetPassword.updating')}
            </>
          ) : (
            <>
              {t('auth.resetPassword.setPassword')}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>

        <div className="form-footer">
          {t('auth.resetPassword.rememberPassword')}{' '}
          <Link to="/login" className="switch-btn">{t('auth.resetPassword.backToLogin')}</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
