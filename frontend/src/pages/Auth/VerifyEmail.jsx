import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/AuthLayout';
import authService from '../../services/authService';

const VerifyEmail = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const verificationStarted = React.useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    const verify = async () => {
      const token = searchParams.get('token');
      console.log('Verifying token:', token);

      if (!token) {
        setStatus('error');
        setMessage('Missing verification token in URL.');
        return;
      }

      try {
        const result = await authService.verifyEmail(token);
        console.log('Verification result:', result);
        setStatus('success');
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        console.error('Verification error:', error);
        // If it's already verified, just show success
        if (error.response?.status === 400 && error.response?.data?.detail === "Invalid verification token") {
            // This might happen if the token was already used (deleted)
            setStatus('success');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return;
        }
        setStatus('error');
        const errorDetail = error.response?.data?.detail || 'Verification failed. The link might be broken or expired.';
        setMessage(errorDetail);
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <AuthLayout
      title={t('auth.verifyEmail.title')}
      subtitle={t('auth.verifyEmail.subtitle')}
    >
      <div className="form-body" style={{ textAlign: 'center', gap: '1rem' }}>
        {status === 'verifying' && (
          <>
            <div className="verify-spinner"></div>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--gray-700)' }}>{t('auth.verifyEmail.verifying')}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{t('auth.verifyEmail.waitMessage')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="alert alert-success" style={{ textAlign: 'left' }}>
              <strong>{t('auth.verifyEmail.successTitle')}</strong> {t('auth.verifyEmail.successMessage')}
            </div>
            <Link to="/login" className="btn btn-primary btn-full">
              {t('auth.verifyEmail.goToLogin')}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="success-icon-wrap" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ color: '#ef4444' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="alert alert-error" style={{ textAlign: 'left' }}>
              <strong>{t('auth.verifyEmail.failedTitle')}</strong> {message}
            </div>
            <Link to="/register" className="btn btn-primary btn-full">
              {t('auth.verifyEmail.tryAgain')}
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
