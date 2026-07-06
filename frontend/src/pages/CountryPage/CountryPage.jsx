import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaArrowLeft, FaBuilding, FaProjectDiagram, FaGlobeAmericas, FaBook, FaArrowRight, FaExternalLinkAlt, FaHeart, FaLightbulb, FaCity, FaRocket, FaLeaf, FaShieldAlt, FaMicrochip } from 'react-icons/fa'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const COUNTRIES_INFO = {
  DZA: { name: 'Algeria', flag: 'https://flagcdn.com/dz.svg' },
  BHR: { name: 'Bahrain', flag: 'https://flagcdn.com/bh.svg' },
  COM: { name: 'Comoros', flag: 'https://flagcdn.com/km.svg' },
  DJI: { name: 'Djibouti', flag: 'https://flagcdn.com/dj.svg' },
  EGY: { name: 'Egypt', flag: 'https://flagcdn.com/eg.svg' },
  IRQ: { name: 'Iraq', flag: 'https://flagcdn.com/iq.svg' },
  JOR: { name: 'Jordan', flag: 'https://flagcdn.com/jo.svg' },
  KWT: { name: 'Kuwait', flag: 'https://flagcdn.com/kw.svg' },
  LBN: { name: 'Lebanon', flag: 'https://flagcdn.com/lb.svg' },
  LBY: { name: 'Libya', flag: 'https://flagcdn.com/ly.svg' },
  MRT: { name: 'Mauritania', flag: 'https://flagcdn.com/mr.svg' },
  MAR: { name: 'Morocco', flag: 'https://flagcdn.com/ma.svg' },
  OMN: { name: 'Oman', flag: 'https://flagcdn.com/om.svg' },
  PSE: { name: 'Palestine', flag: 'https://flagcdn.com/ps.svg' },
  QAT: { name: 'Qatar', flag: 'https://flagcdn.com/qa.svg' },
  SAU: { name: 'Saudi Arabia', flag: 'https://flagcdn.com/sa.svg' },
  SOM: { name: 'Somalia', flag: 'https://flagcdn.com/so.svg' },
  SDN: { name: 'Sudan', flag: 'https://flagcdn.com/sd.svg' },
  SYR: { name: 'Syria', flag: 'https://flagcdn.com/sy.svg' },
  TUN: { name: 'Tunisia', flag: 'https://flagcdn.com/tn.svg' },
  ARE: { name: 'United Arab Emirates', flag: 'https://flagcdn.com/ae.svg' },
  YEM: { name: 'Yemen', flag: 'https://flagcdn.com/ye.svg' }
}

const getSectorInfo = (sector) => {
  const map = {
    'Health':       { class: 'health', icon: <FaHeart /> },
    'Education':    { class: 'edu',    icon: <FaLightbulb /> },
    'Agriculture':  { class: 'agri',   icon: <FaGlobeAmericas /> },
    'Finance':      { class: 'fin',    icon: <FaCity /> },
    'Transportation': { class: 'trans',  icon: <FaRocket /> },
    'Energy':       { class: 'energy', icon: <FaLightbulb /> },
    'Environment':  { class: 'env',    icon: <FaLeaf /> },
    'Security':     { class: 'security', icon: <FaShieldAlt /> },
    'GovTech':      { class: 'fin',    icon: <FaCity /> },
    'Smart Cities': { class: 'fin',    icon: <FaCity /> },
    'Climate':      { class: 'env',    icon: <FaLeaf /> }
  }
  return map[sector] || { class: 'default', icon: <FaMicrochip /> }
}

const getSDGNumber = (sdgStr) => {
  if (!sdgStr) return ''
  const match = sdgStr.match(/SDG\s*(\d+)/)
  return match ? `SDG${match[1]}` : 'SDG'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Ongoing'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

const COUNTRY_BY_NAME = Object.fromEntries(
  Object.entries(COUNTRIES_INFO).map(([code, data]) => [data.name.toLowerCase(), code])
)

const getCountryInfo = (codeOrName) => {
  const key = codeOrName?.toUpperCase() || codeOrName?.toLowerCase()
  if (COUNTRIES_INFO[key]) {
    return COUNTRIES_INFO[key]
  }
  const code = COUNTRY_BY_NAME[key?.toLowerCase()]
  return code ? COUNTRIES_INFO[code] : null
}

function CountryPage() {
  const { code } = useParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [stakeholders, setStakeholders] = useState([])
  
  const country = getCountryInfo(code)
  const apiCountry = country?.name || code

  useEffect(() => {
    setLoading(true)
    setProjects([])
    setStakeholders([])
    
    fetch(`${API_BASE}/api/projects/?country=${encodeURIComponent(apiCountry)}`)
      .then(res => res.json())
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching projects:', err)
        setLoading(false)
      })

    fetch(`${API_BASE}/api/stakeholders/?country=${encodeURIComponent(apiCountry)}`)
      .then(res => res.json())
      .then(data => setStakeholders(data))
      .catch(err => console.error('Error fetching stakeholders:', err))
  }, [code])

  if (!country) {
    return (
      <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <h1>Country not found</h1>
        <p>The country "{code}" is not part of the Arab region.</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    )
  }

  return (
    <div className="country-page">
      <section className="country-hero">
        <div className="container">
          <Link to="/" className="back-link">
            <FaArrowLeft /> Back to Home
          </Link>
          <div className="country-header">
            <div className="country-flag">
              <img src={`${country.flag}`} alt={country.name} />
            </div>
            <div className="country-info">
              <h1>{country.name}</h1>
              <p>AI Projects & Stakeholders in the Arab Region</p>
            </div>
          </div>
        </div>
      </section>

      <section className="country-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <FaProjectDiagram className="stat-icon" style={{ color: '#059669' }} />
              <div className="stat-value">{projects.length}</div>
              <div className="stat-label">Projects</div>
            </div>
            <div className="stat-card">
              <FaBuilding className="stat-icon" style={{ color: '#2563eb' }} />
              <div className="stat-value">{stakeholders.length}</div>
              <div className="stat-label">Stakeholders</div>
            </div>
          </div>
        </div>
      </section>

      <section className="country-projects section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">AI Projects in {country.name}</h2>
          </div>
          
          {loading ? (
            <div className="loading">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects found for {country.name}.</p>
              <Link to="/projects" className="btn btn-primary">
                Submit a Project
              </Link>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => {
                const info = getSectorInfo(project.sector)
                return (
                  <div key={project.id} className="modern-project-card">
                    <div className="card-top">
                      <div className={`sector-icon-box ${info.class}`}>
                        {info.icon}
                      </div>
                      <span className="status-dot-badge">
                        <span className={`dot ${project.status}`}></span>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="card-mid">
                      <span className="sector-text">{project.sector}</span>
                      <h3>{project.title}</h3>
                      <p className="project-dates">
                        {formatDate(project.start_date)} — {formatDate(project.end_date)}
                      </p>
                      <p className="project-desc">{project.description}</p>
                    </div>

                    <div className="stakeholders-list">
                      <div className="stakeholder-avatars">
                        {project.stakeholder_associations && project.stakeholder_associations.slice(0, 3).map((assoc, idx) => (
                                                <div key={idx} className="stakeholder-tag" title={assoc.stakeholder.name}>
                                                  {assoc.stakeholder.name.substring(0, 2).toUpperCase()}
                                                </div>
                                              ))}
                                              {project.stakeholder_associations && project.stakeholder_associations.length > 3 && (
                                                <div className="stakeholder-tag more">+{project.stakeholder_associations.length - 3}</div>
                                              )}
                                            </div>
                                            <span className="stakeholder-count">
                                              {project.stakeholder_associations?.length || 0} Stakeholder(s)
                                            </span>                    </div>

                    <div className="card-bottom">
                      <div className="meta-info">
                        <div className="meta-col">
                          <span className="meta-label">Technology</span>
                          <span className="meta-value">{project.ai_technology}</span>
                        </div>
                      </div>
                      <div className="sdg-badge">
                        {getSDGNumber(project.sdg_alignment)}
                      </div>
                    </div>

                    <div className="card-actions">
                      <Link to={`/project/${project.id}`} className="learn-more-btn">
                        Learn More <FaArrowRight />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {!loading && stakeholders.length > 0 && (
        <section className="country-stakeholders section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Stakeholders in {country.name}</h2>
            </div>
            <div className="stakeholders-grid">
              {stakeholders.map(stakeholder => (
                <Link 
                  key={stakeholder.id} 
                  to="/stakeholders"
                  className="stakeholder-card"
                >
                  <h3>{stakeholder.name}</h3>
                  <p>{stakeholder.type}</p>
                  <span className="stakeholder-location">{stakeholder.city}, {stakeholder.country}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <style>{`
        .country-hero {
          background: #0f172a;
          padding: 60px 0;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          margin-bottom: 32px;
          transition: color 0.3s;
        }
        .back-link:hover {
          color: #fff;
        }
        .country-header {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .country-flag {
          width: 120px;
          height: 80px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        .country-flag img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .country-info h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
        }
        .country-info p {
          color: #9ca3af;
          font-size: 1.1rem;
        }
        .country-stats {
          background: #f9fafb;
          padding: 40px 0;
          margin-top: -1px;
        }
        .stats-grid {
          display: flex;
          justify-content: center;
          gap: 64px;
        }
        .stat-card {
          text-align: center;
        }
        .stat-card .stat-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
        }
        .stat-label {
          color: #6b7280;
          font-size: 0.95rem;
        }
        .section {
          padding: 80px 0;
        }
        .section-header {
          margin-bottom: 40px;
        }
        .section-title {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
        }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }

        /* Modern Project Card */
        .modern-project-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #e5e7eb;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: 0.3s;
        }
        .modern-project-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }
        .card-top { display: flex; justify-content: space-between; align-items: center; }
        .sector-icon-box {
          width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }
        .status-dot-badge {
          display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64728b;
          padding: 4px 12px; background: #f8fafc; border-radius: 100px;
        }
        .status-dot-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; }
        .status-dot-badge .dot.ongoing { background: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
        .status-dot-badge .dot.completed { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }

        .card-mid .sector-text { font-size: 0.75rem; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; }
        .card-mid h3 { font-size: 1.25rem; font-weight: 800; margin: 8px 0 4px; line-height: 1.3; color: #0f172a; }
        .card-mid .project-dates { font-size: 0.85rem; color: #64728b; font-weight: 600; margin-bottom: 8px; }
        .card-mid .project-desc { font-size: 0.9rem; color: #6b7280; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

        .stakeholders-list { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 16px; }
        .stakeholder-avatars { display: flex; }
        .stakeholder-tag {
          width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: #fff; border: 2px solid #fff;
          display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 800; margin-left: -8px;
        }
        .stakeholder-tag:first-child { margin-left: 0; }
        .stakeholder-tag.more { background: #64728b; font-size: 0.7rem; }
        .stakeholder-count { font-size: 0.8rem; font-weight: 600; color: #64728b; }

        .card-bottom {
          margin-top: auto; padding-top: 20px; border-top: 1px solid #f1f5f9;
          display: flex; justify-content: space-between; align-items: flex-end;
        }
        .meta-info { display: flex; gap: 20px; }
        .meta-col { display: flex; flex-direction: column; gap: 4px; }
        .meta-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: #64728b; letter-spacing: 0.5px; }
        .meta-value { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
        .sdg-badge { background: #f1f5f9; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; color: #0f172a; }

        .card-actions {
          margin-top: 12px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }

        .learn-more-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px;
          background: #f8fafc;
          color: #2563eb;
          border-radius: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: 0.3s;
          border: 1.5px solid #e2e8f0;
        }
        .learn-more-btn:hover {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
          transform: translateY(-2px);
        }

        /* Sector Colors */
        .edu { background: #eff6ff; color: #3b82f6; }
        .agri { background: #ecfdf5; color: #10b981; }
        .health { background: #fef2f2; color: #ef4444; }
        .fin { background: #f5f3ff; color: #8b5cf6; }
        .trans { background: #fff7ed; color: #f97316; }
        .energy { background: #fffbeb; color: #f59e0b; }
        .env { background: #f0fdf4; color: #22c55e; }
        .security { background: #f8fafc; color: #475569; }

        .stakeholders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .stakeholder-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s;
          color: inherit;
        }
        .stakeholder-card:hover {
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }
        .stakeholder-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }
        .stakeholder-card p {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .stakeholder-location {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .empty-state {
          text-align: center;
          padding: 60px 24px;
          background: #f9fafb;
          border-radius: 16px;
        }
        .loading {
          text-align: center;
          padding: 60px;
          color: #6b7280;
        }
        @media (max-width: 768px) {
          .country-header {
            flex-direction: column;
            text-align: center;
          }
          .country-flag {
            width: 100px;
            height: 60px;
          }
          .country-info h1 {
            font-size: 1.75rem;
          }
          .stats-grid {
            gap: 40px;
          }
          .projects-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Dark mode ── */
        [data-theme="dark"] .country-stats { background: #0f172a; }
        [data-theme="dark"] .stat-value { color: #f1f5f9; }
        [data-theme="dark"] .section-title { color: #f1f5f9; }
        [data-theme="dark"] .modern-project-card { background: #1e293b; border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .modern-project-card:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        [data-theme="dark"] .status-dot-badge { background: rgba(255,255,255,0.06); color: #94a3b8; }
        [data-theme="dark"] .card-mid h3 { color: #f1f5f9; }
        [data-theme="dark"] .card-mid .project-dates { color: #94a3b8; }
        [data-theme="dark"] .card-mid .project-desc { color: #94a3b8; }
        [data-theme="dark"] .stakeholders-list { background: rgba(255,255,255,0.05); }
        [data-theme="dark"] .stakeholder-tag { border-color: #1e293b; }
        [data-theme="dark"] .card-bottom { border-top-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .meta-value { color: #f1f5f9; }
        [data-theme="dark"] .sdg-badge { background: rgba(255,255,255,0.07); color: #e2e8f0; }
        [data-theme="dark"] .card-actions { border-top-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .learn-more-btn { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
        [data-theme="dark"] .learn-more-btn:hover { background: #2563eb; border-color: #2563eb; }
        [data-theme="dark"] .edu { background: rgba(59,130,246,0.1); }
        [data-theme="dark"] .agri { background: rgba(16,185,129,0.1); }
        [data-theme="dark"] .health { background: rgba(239,68,68,0.1); }
        [data-theme="dark"] .fin { background: rgba(139,92,246,0.1); }
        [data-theme="dark"] .trans { background: rgba(249,115,22,0.1); }
        [data-theme="dark"] .energy { background: rgba(245,158,11,0.1); }
        [data-theme="dark"] .env { background: rgba(34,197,94,0.1); }
        [data-theme="dark"] .security { background: rgba(71,85,105,0.15); }
        [data-theme="dark"] .stakeholder-card { background: #1e293b; border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .stakeholder-card:hover { border-color: #3b82f6; box-shadow: 0 10px 20px rgba(0,0,0,0.4); }
        [data-theme="dark"] .stakeholder-card h3 { color: #f1f5f9; }
        [data-theme="dark"] .empty-state { background: #1e293b; }
      `}</style>
    </div>
  )
}

export default CountryPage
