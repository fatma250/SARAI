import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/AuthLayout';
import FloatingInput from '../../components/FloatingInput';
import authService from '../../services/authService';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success(t('auth.forgotPassword.toastSuccess'));
    } catch (error) {
      toast.error(t('auth.forgotPassword.toastError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.forgotPassword.title')}
      subtitle={t('auth.forgotPassword.subtitle')}
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="form-body">
          <FloatingInput
            label={t('auth.forgotPassword.email')}
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            hint={t('auth.forgotPassword.emailHint')}
          />

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary btn-full${loading ? ' btn-loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                {t('auth.forgotPassword.sending')}
              </>
            ) : (
              <>
                {t('auth.forgotPassword.sendLink')}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>

          <div className="form-footer">
            {t('auth.forgotPassword.rememberPassword')}{' '}
            <Link to="/login" className="switch-btn">{t('auth.forgotPassword.signIn')}</Link>
          </div>
        </form>
      ) : (
        <div className="form-body" style={{ textAlign: 'center', gap: '1.25rem' }}>
          <div className="success-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div className="alert alert-success" style={{ textAlign: 'left' }}>
            {t('auth.forgotPassword.checkInbox', { email })}
          </div>
          <Link to="/login" className="btn btn-primary btn-full">
            {t('auth.forgotPassword.returnToLogin')}
          </Link>
          <div className="form-footer">
            <button onClick={() => setSubmitted(false)} className="switch-btn">
              {t('auth.forgotPassword.tryAgain')}
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
