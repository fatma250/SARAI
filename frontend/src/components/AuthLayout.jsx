import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/auth.css';

const AuthLayout = ({ children, title, subtitle }) => {
  const { t } = useTranslation();

  return (
    <div className="auth-container">

      {/* ── LEFT: FORM PANEL ── */}
      <div className="auth-forms-panel">
        <div className="auth-forms-inner">

          {/* Page heading */}
          <div className="form-header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {/* Form content */}
          <div className="auth-form active">
            {children}
          </div>
        </div>
      </div>

      {/* ── RIGHT: BRANDING PANEL ── */}
      <div className="auth-branding-panel">
        <div className="branding-content">

          {/* Headline */}
          <h2 className="branding-headline">
            {t('auth.branding.headlineLine1')}<br />
            {t('auth.branding.headlineLine2')} <span>{t('auth.branding.headlineHighlight')}</span>
          </h2>

          <p className="branding-description">
            {t('auth.branding.description')}
          </p>

          {/* Stats */}
          <div className="branding-stats">
            <div className="stat-item">
              <div className="stat-number">22+</div>
              <div className="stat-label">{t('auth.branding.countries')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">{t('auth.branding.aiProjects')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">200+</div>
              <div className="stat-label">{t('auth.branding.stakeholders')}</div>
            </div>
          </div>

          {/* Features */}
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              {t('auth.branding.feature1')}
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              {t('auth.branding.feature2')}
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              {t('auth.branding.feature3')}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="branding-footer">
          <p>{t('auth.branding.footer')}</p>
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
