import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaGlobeAmericas, FaHeart, FaCity, FaRocket, FaLeaf, FaShieldAlt, FaMicrochip, FaCalendarAlt, FaExternalLinkAlt, FaBuilding, FaUserTie, FaFilePdf } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getSectorInfo = (sector) => {
  const map = {
    'Health':       { class: 'health', icon: <FaHeart /> },
    'Education':    { class: 'edu',    icon: <FaRocket /> },
    'Agriculture':  { class: 'agri',   icon: <FaGlobeAmericas /> },
    'Finance':      { class: 'fin',    icon: <FaCity /> },
    'Transportation': { class: 'trans',  icon: <FaRocket /> },
    'Energy':       { class: 'energy', icon: <FaRocket /> },
    'Environment':  { class: 'env',    icon: <FaLeaf /> },
    'Security':     { class: 'security', icon: <FaShieldAlt /> },
    'GovTech':      { class: 'fin',    icon: <FaCity /> },
    'Smart Cities': { class: 'fin',    icon: <FaCity /> },
    'Climate':          { class: 'env',    icon: <FaLeaf /> },
    'Entrepreneuriat':  { class: 'fin',    icon: <FaRocket /> }
  }
  return map[sector] || { class: 'default', icon: <FaMicrochip /> }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Ongoing'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function ProjectDetails() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [error, setError] = useState(null)
  const [similarProjects, setSimilarProjects] = useState([])

  useEffect(() => {
    fetchProjectDetails()
  }, [id])

  const fetchProjectDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/projects/${id}/details`)
      if (!response.ok) throw new Error('Project not found')
      const result = await response.json()
      setData(result)
      // Fetch similar projects in background
      fetch(`${API_BASE}/api/projects/${id}/similar`)
        .then(r => r.ok ? r.json() : [])
        .then(setSimilarProjects)
        .catch(() => {})
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (lang = 'fr') => {
    try {
      setGeneratingReport(true)
      const response = await fetch(`${API_BASE}/api/projects/${id}/report?lang=${lang}`)

      if (!response.ok) throw new Error('Failed to generate report')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Project_Report_${data.project.title.replace(/\s+/g, '_')}_${lang}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(t('projectDetails.reportSuccess'))
    } catch (err) {
      toast.error(err.message || 'Error generating report')
    } finally {
      setGeneratingReport(false)
    }
  }
  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>{t('projectDetails.loading')}</p>
    </div>
  )

  if (error || !data) return (
    <div className="error-container">
      <h2>Oops! {error || 'Project not found'}</h2>
      <button onClick={() => navigate('/projects')} className="back-btn">{t('projectDetails.backToProjects')}</button>
    </div>
  )

  const { project, stakeholders } = data
  const sectorInfo = getSectorInfo(project.sector)

  return (
    <div className="project-details-page">
      <div className="container">
        <div className="top-nav">
          <button onClick={() => navigate(-1)} className="back-link">
            <FaArrowLeft /> {t('projectDetails.back')}
          </button>
        </div>

        <header className="project-header animate-up">
          <div className="header-top">
            <div className="header-left-side">
              <div className="header-badges" style={{marginTop: '0'}}>
                <div className={`sector-badge ${sectorInfo.class}`}>
                  {sectorInfo.icon} {project.sector}
                </div>
                <div className={`status-badge ${project.status}`}>
                  {project.status}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="generate-report-btn"
            >
              {generatingReport ? (
                <>
                  <span className="report-btn-spinner"></span>
                  <span className="report-btn-text">{t('projectDetails.preparingDoc')}</span>
                </>
              ) : (
                <>
                  <div className="pdf-icon-wrapper">
                    <FaFilePdf />
                  </div>
                  <div className="btn-content">
                    <span className="btn-title">Project Report</span>
                    <span className="btn-subtitle">{t('projectDetails.downloadPDF')}</span>
                  </div>
                </>
              )}
            </button>
          </div>
          
          <h1>{project.title}</h1>

          <div className="header-meta">
            <div className="meta-item">
              <FaGlobeAmericas /> <span>{project.country_name || 'Regional'}</span>
            </div>
            <div className="meta-item">
              <FaCalendarAlt /> <span>{formatDate(project.start_date)} — {formatDate(project.end_date)}</span>
            </div>
            <div className="meta-item">
              <FaMicrochip /> <span>{project.ai_technology}</span>
            </div>
          </div>
        </header>

        <section className="project-section description-section animate-up delay-1">
          <h2>{t('projectDetails.overview')}</h2>
          <div className="description-card">
            <p>{project.description}</p>
            <div className="description-footer">
              {project.website && (
                <a href={project.website} target="_blank" rel="noopener noreferrer" className="project-website-link">
                  <FaExternalLinkAlt /> {t('projectDetails.visitWebsite')}
                </a>
              )}
              
              {project.documents && project.documents.length > 0 && (
                <div className="project-attachments">
                  <h3>{t('projectDetails.attachments')}</h3>
                  <div className="attachments-list">
                    {project.documents.map((doc, idx) => (
                      <a 
                        key={idx} 
                        href={`${API_BASE}${doc.file_url}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="attachment-item"
                      >
                        <FaRocket /> {doc.original_filename}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="project-section stakeholders-section animate-up delay-2">
          <h2>{t('projectDetails.stakeholdersInvolved')}</h2>
          <div className="stakeholders-grid">
            {stakeholders.length > 0 ? stakeholders.map((s, idx) => (
              <div key={idx} className="stakeholder-card">
                <div className="s-card-header">
                  <div className="s-icon">
                    <FaBuilding />
                  </div>
                  <div className="s-role-badge">
                    <FaUserTie /> {s.role}
                  </div>
                </div>
                <h3>{s.name}</h3>
                <p className="s-type">{s.type}</p>
                <p className="s-location">{s.city}, {s.country}</p>
                {s.website && (
                  <a href={s.website} target="_blank" rel="noopener noreferrer" className="s-link">
                    <FaExternalLinkAlt /> {t('projectDetails.website')}
                  </a>
                )}
              </div>
            )) : (
              <p className="no-stakeholders">{t('projectDetails.noStakeholders')}</p>
            )}
          </div>
        </section>

        {/* ── Similar Projects ── */}
        {similarProjects.length > 0 && (
          <section className="project-section similar-section animate-up delay-3">
            <h2>Similar Projects</h2>
            <div className="similar-grid">
              {similarProjects.map(sp => {
                const si = getSectorInfo(sp.sector)
                return (
                  <Link key={sp.id} to={`/project/${sp.id}`} className="similar-card">
                    <div className={`sc-badge ${si.class}`}>{si.icon} {sp.sector}</div>
                    <h3 className="sc-title">{sp.title}</h3>
                    <div className="sc-meta">
                      {sp.ai_technology && <span className="sc-tech">{sp.ai_technology}</span>}
                      {sp.country_name && <span className="sc-country">📍 {sp.country_name}</span>}
                    </div>
                    <span className="sc-arrow">→ View project</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .project-details-page {
          padding: 80px 0;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Outfit', sans-serif;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .top-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #64728b;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          transition: color 0.3s;
          padding: 0;
        }
        .back-link:hover { color: #2563eb; }

        .project-header {
          background: #fff;
          padding: 40px;
          border-radius: 32px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          border: 1px solid #f1f5f9;
          margin-bottom: 40px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 24px;
        }

        .header-left-side {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .brand-logos {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-aicto-logo {
          height: 54px;
          width: auto;
          object-fit: contain;
        }

        .header-badges {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sector-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
        }

        .status-badge {
          padding: 6px 16px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-badge.ongoing { background: #eff6ff; color: #2563eb; }
        .status-badge.completed { background: #ecfdf5; color: #10b981; }

        /* Generate Report Button - Pro Redesign */
        .generate-report-btn {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          padding: 12px 24px;
          background: #fff;
          color: #0f172a;
          border: 1.5px solid #0f172a;
          border-radius: 16px;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          min-width: 240px;
        }

        .pdf-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #fef2f2;
          color: #ef4444;
          border-radius: 12px;
          font-size: 1.25rem;
          transition: all 0.3s ease;
        }

        .btn-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .btn-title {
          font-weight: 800;
          font-size: 0.95rem;
          letter-spacing: 0.3px;
        }

        .btn-subtitle {
          font-weight: 600;
          font-size: 0.75rem;
          color: #64728b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .generate-report-btn:hover {
          background: #0f172a;
          color: #fff;
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.15);
          border-color: #0f172a;
        }

        .generate-report-btn:hover .pdf-icon-wrapper {
          background: #ef4444;
          color: #fff;
        }

        .generate-report-btn:hover .btn-subtitle {
          color: rgba(255,255,255,0.7);
        }

        .generate-report-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #64728b;
          transform: none;
        }

        .pdf-icon {
          font-size: 1.2rem;
          color: #ef4444;
          transition: color 0.3s;
        }
        .generate-report-btn:hover .pdf-icon {
          color: #fff;
        }

        .report-btn-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(15, 23, 42, 0.1);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .project-header h1 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 24px;
          line-height: 1.1;
        }

        .header-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 32px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #64728b;
          font-weight: 600;
        }
        .meta-item span { color: #1e293b; }
        .meta-item svg { color: #2563eb; font-size: 1.2rem; }

        .project-section {
          margin-bottom: 60px;
        }

        .project-section h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 24px;
        }

        .description-card {
          background: #fff;
          padding: 40px;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .description-card p {
          font-size: 1.15rem;
          line-height: 1.8;
          color: #475569;
          margin-bottom: 24px;
          white-space: pre-line;
        }

        .project-website-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #0f172a;
          color: #fff;
          padding: 14px 28px;
          border-radius: 16px;
          font-weight: 700;
          text-decoration: none;
          transition: 0.3s;
        }
        .project-website-link:hover { transform: translateY(-3px); background: #1e293b; }

        .description-footer {
          display: flex;
          flex-direction: column;
          gap: 32px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
        }

        .project-attachments h3 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 16px;
          color: #0f172a;
        }

        .attachments-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .attachment-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          color: #2563eb;
          text-decoration: none;
          transition: 0.2s;
        }
        .attachment-item:hover {
          background: #fff;
          border-color: #2563eb;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .stakeholders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .stakeholder-card {
          background: #fff;
          padding: 24px;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          transition: 0.3s;
        }
        .stakeholder-card:hover { transform: translateY(-5px); border-color: #cbd5e1; }

        .s-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .s-icon {
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          font-size: 1.2rem;
        }

        .s-role-badge {
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stakeholder-card h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .s-type { color: #2563eb; font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .s-location { color: #64728b; font-weight: 500; font-size: 0.95rem; margin-bottom: 20px; }

        .s-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
        }
        .s-link:hover { text-decoration: underline; }

        .loading-container, .error-container {
          padding: 100px 24px;
          text-align: center;
        }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .back-btn { background: #2563eb; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; margin-top: 20px; }

        .edu { background: #eff6ff; color: #3b82f6; }
        .agri { background: #ecfdf5; color: #10b981; }
        .health { background: #fef2f2; color: #ef4444; }
        .fin { background: #f5f3ff; color: #8b5cf6; }
        .trans { background: #fff7ed; color: #f97316; }
        .energy { background: #fffbeb; color: #f59e0b; }
        .env { background: #f0fdf4; color: #22c55e; }
        .security { background: #f8fafc; color: #475569; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-up { animation: fadeUp 0.5s ease both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }

        /* ── Similar Projects ── */
        .similar-section h2 { border-left: 4px solid #3b82f6; padding-left: 14px; }
        .similar-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;
        }
        .similar-card {
          display: flex; flex-direction: column; gap: 10px;
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px;
          padding: 18px; text-decoration: none; transition: all 0.2s;
        }
        .similar-card:hover {
          border-color: #3b82f6; box-shadow: 0 8px 24px rgba(37,99,235,0.12);
          transform: translateY(-3px);
        }
        .sc-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.7rem; font-weight: 700; padding: 4px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.04em;
          width: fit-content;
        }
        .sc-badge.health  { background: #dcfce7; color: #166534; }
        .sc-badge.edu     { background: #eff6ff; color: #1d4ed8; }
        .sc-badge.agri    { background: #ecfccb; color: #365314; }
        .sc-badge.fin     { background: #fef9c3; color: #713f12; }
        .sc-badge.trans   { background: #ede9fe; color: #5b21b6; }
        .sc-badge.energy  { background: #fff7ed; color: #9a3412; }
        .sc-badge.env     { background: #ecfdf5; color: #065f46; }
        .sc-badge.security{ background: #fef2f2; color: #991b1b; }
        .sc-badge.default { background: #f1f5f9; color: #475569; }
        .sc-title { font-size: 0.88rem; font-weight: 700; color: #1e293b; margin: 0; line-height: 1.35; }
        .sc-meta { display: flex; flex-wrap: wrap; gap: 6px; }
        .sc-tech, .sc-country { font-size: 0.72rem; color: #64748b; font-weight: 500; }
        .sc-arrow { font-size: 0.72rem; font-weight: 700; color: #3b82f6; margin-top: auto; }
        [data-theme="dark"] .similar-card { background: #1e293b; border-color: rgba(255,255,255,0.07); }
        [data-theme="dark"] .similar-card:hover { border-color: #3b82f6; box-shadow: 0 8px 24px rgba(37,99,235,0.2); }
        [data-theme="dark"] .sc-title { color: #e2e8f0; }

        @media (max-width: 768px) {
          .header-top { flex-direction: column; align-items: flex-start; }
          .generate-report-btn { width: 100%; justify-content: center; }
        }

        /* ── Dark mode ── */
        [data-theme="dark"] .project-details-page { background: #0f172a; }
        [data-theme="dark"] .project-header { background: #1e293b; border-color: rgba(255,255,255,0.06); box-shadow: none; }
        [data-theme="dark"] .project-header h1 { color: #f1f5f9; }
        [data-theme="dark"] .header-meta { border-top-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .meta-item span { color: #e2e8f0; }
        [data-theme="dark"] .project-section h2 { color: #f1f5f9; }
        [data-theme="dark"] .description-card { background: #1e293b; border-color: rgba(255,255,255,0.06); box-shadow: none; }
        [data-theme="dark"] .description-footer { border-top-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .project-attachments h3 { color: #f1f5f9; }
        [data-theme="dark"] .attachment-item { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
        [data-theme="dark"] .attachment-item:hover { background: rgba(255,255,255,0.08); border-color: #3b82f6; }
        [data-theme="dark"] .stakeholder-card { background: #1e293b; border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .stakeholder-card:hover { border-color: rgba(255,255,255,0.14); }
        [data-theme="dark"] .stakeholder-card h3 { color: #f1f5f9; }
        [data-theme="dark"] .s-icon { background: rgba(255,255,255,0.07); }
        [data-theme="dark"] .generate-report-btn { background: #1e293b; border-color: rgba(255,255,255,0.1); color: #e2e8f0; }
        [data-theme="dark"] .generate-report-btn:hover { background: #334155; }
        [data-theme="dark"] .status-badge.ongoing { background: rgba(37,99,235,0.1); color: #3b82f6; }
        [data-theme="dark"] .status-badge.completed { background: rgba(16,185,129,0.1); color: #10b981; }
        [data-theme="dark"] .edu { background: rgba(59,130,246,0.1); }
        [data-theme="dark"] .agri { background: rgba(16,185,129,0.1); }
        [data-theme="dark"] .health { background: rgba(239,68,68,0.1); }
        [data-theme="dark"] .fin { background: rgba(139,92,246,0.1); }
        [data-theme="dark"] .trans { background: rgba(249,115,22,0.1); }
        [data-theme="dark"] .energy { background: rgba(245,158,11,0.1); }
        [data-theme="dark"] .env { background: rgba(34,197,94,0.1); }
        [data-theme="dark"] .security { background: rgba(71,85,105,0.15); }
        [data-theme="dark"] .spinner { border-color: #1e293b; border-top-color: #3b82f6; }
      `}</style>
    </div>
  )
}

export default ProjectDetails
