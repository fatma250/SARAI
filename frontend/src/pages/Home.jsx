import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaBrain, FaBuilding, FaProjectDiagram, FaGlobeAmericas, 
  FaBook, FaChartLine, FaArrowRight, FaRocket, FaSearch,
  FaLightbulb, FaShieldAlt, FaNetworkWired, FaUsers, FaDatabase
} from 'react-icons/fa'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ARAB_COUNTRIES = [
  { name: 'Algeria', code: 'dz', flag_url: 'https://flagcdn.com/dz.svg' },
  { name: 'Bahrain', code: 'bh', flag_url: 'https://flagcdn.com/bh.svg' },
  { name: 'Comoros', code: 'km', flag_url: 'https://flagcdn.com/km.svg' },
  { name: 'Djibouti', code: 'dj', flag_url: 'https://flagcdn.com/dj.svg' },
  { name: 'Egypt', code: 'eg', flag_url: 'https://flagcdn.com/eg.svg' },
  { name: 'Iraq', code: 'iq', flag_url: 'https://flagcdn.com/iq.svg' },
  { name: 'Jordan', code: 'jo', flag_url: 'https://flagcdn.com/jo.svg' },
  { name: 'Kuwait', code: 'kw', flag_url: 'https://flagcdn.com/kw.svg' },
  { name: 'Lebanon', code: 'lb', flag_url: 'https://flagcdn.com/lb.svg' },
  { name: 'Libya', code: 'ly', flag_url: 'https://flagcdn.com/ly.svg' },
  { name: 'Mauritania', code: 'mr', flag_url: 'https://flagcdn.com/mr.svg' },
  { name: 'Morocco', code: 'ma', flag_url: 'https://flagcdn.com/ma.svg' },
  { name: 'Oman', code: 'om', flag_url: 'https://flagcdn.com/om.svg' },
  { name: 'Palestine', code: 'ps', flag_url: 'https://flagcdn.com/ps.svg' },
  { name: 'Qatar', code: 'qa', flag_url: 'https://flagcdn.com/qa.svg' },
  { name: 'Saudi Arabia', code: 'sa', flag_url: 'https://flagcdn.com/sa.svg' },
  { name: 'Somalia', code: 'so', flag_url: 'https://flagcdn.com/so.svg' },
  { name: 'Sudan', code: 'sd', flag_url: 'https://flagcdn.com/sd.svg' },
  { name: 'Syria', code: 'sy', flag_url: 'https://flagcdn.com/sy.svg' },
  { name: 'Tunisia', code: 'tn', flag_url: 'https://flagcdn.com/tn.svg' },
  { name: 'United Arab Emirates', code: 'ae', flag_url: 'https://flagcdn.com/ae.svg' },
  { name: 'Yemen', code: 'ye', flag_url: 'https://flagcdn.com/ye.svg' }
]

function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [countries, setCountries] = useState(ARAB_COUNTRIES)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    total_projects: '112',
    total_stakeholders: '90',
    total_countries_active: '22',
    data_nodes: '5.2K'
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)) } catch { setUser(null) }
    }
    
    // Fetch real stats
    fetch(`${API_BASE}/api/analytics/overview`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setStats({
            total_projects: data.total_projects,
            total_stakeholders: data.total_stakeholders,
            total_countries_active: data.total_countries_active,
            data_nodes: '5.2K'
          })
        }
      })
      .catch(err => console.error('Error fetching stats:', err))
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/api/countries/`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setCountries(data)
        }
      })
      .catch(err => console.error('Error fetching countries:', err))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="modern-home">
      {/* Dynamic Hero Section */}
      <section className="hero-section">
        <div className="animated-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        
        <div className="container hero-container">
          <div className="hero-content">
            <div className="badge-wrapper animate-up">
              <span className="hero-badge">
                <span className="dot"></span>
                {t('home.heroBadge')}
              </span>
            </div>
            
            <h1 className="hero-title animate-up delay-1">
              {t('home.heroTitle')} <br />
              <span className="text-highlight">{t('home.heroTitleHighlight')}</span> {t('home.heroTitleEnd')}
            </h1>
            
            <p className="hero-subtitle animate-up delay-2">
              {t('home.heroSubtitle')}
            </p>
            
            <div className="hero-search animate-up delay-3">
              <form onSubmit={handleSearch} className="search-bar">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder={t('home.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn">{t('home.explore')}</button>
              </form>
            </div>

            <div className="hero-cta animate-up delay-4">
              {user && (
                <Link to="/projects" className="cta-btn primary">
                  <FaRocket /> {t('home.submitProject')}
                </Link>
              )}
              <Link to="/map" className="cta-btn secondary">
                <FaGlobeAmericas /> {t('home.interactiveMap')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Stats Bar */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-container">
            {[
              { label: 'Organizations', value: `${stats.total_stakeholders}`, icon: <FaBuilding /> },
              { label: 'Active Projects', value: `${stats.total_projects}`, icon: <FaProjectDiagram /> },
              { label: 'Arab Nations', value: `${stats.total_countries_active}`, icon: <FaGlobeAmericas /> },
              { label: 'Data Nodes', value: `${stats.data_nodes}`, icon: <FaDatabase /> }
            ].map((stat, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-info">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Country Ticker Section - FLUID & COMPACT */}
      <section className="country-ticker-section">
        <div className="ticker-header">
          <h2>Member States</h2>
          <div className="ticker-line"></div>
        </div>
        
        <div className="ticker-container">
          <div className="ticker-track">
            {[...countries, ...countries].map((country, index) => (
              <Link to={`/countries/${country.name}`} key={index} className="ticker-item">
                <div className="ticker-flag">
                  <img src={country.flag_url} alt={country.name} />
                </div>
                <span className="ticker-name">{country.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bento-inspired Modules */}
      <section className="modules-section">
        <div className="container">
          <div className="section-header">
            <h2 className="title">Explore the <span className="text-highlight">Ecosystem</span></h2>
            <p className="subtitle">Structured insights into the regional AI landscape.</p>
          </div>
          
          <div className="modules-grid">
            <Link to="/stakeholders" className="module-card card-main">
              <div className="card-content">
                <div className="card-tag">Directory</div>
                <h3>Stakeholder Directory</h3>
                <p>Connect with startups, research labs, and government agencies leading AI innovation.</p>
                <span className="card-link">View Directory <FaArrowRight /></span>
              </div>
              <FaUsers className="bg-icon" />
            </Link>

            <Link to="/projects" className="module-card card-accent">
              <div className="card-content">
                <div className="card-tag">Initiatives</div>
                <h3>Project Hub</h3>
                <p>Browse regional AI projects across sectors.</p>
                <span className="card-link">Explore <FaArrowRight /></span>
              </div>
              <FaLightbulb className="bg-icon" />
            </Link>

            <Link to="/map" className="module-card card-accent-alt">
              <div className="card-content">
                <div className="card-tag">Geospatial</div>
                <h3>Knowledge Map</h3>
                <p>Visualize AI density and development goals.</p>
                <span className="card-link">Open Map <FaArrowRight /></span>
              </div>
              <FaGlobeAmericas className="bg-icon" />
            </Link>

            <Link to="/resources" className="module-card card-compact">
              <div className="card-content">
                <FaBook className="compact-icon" />
                <h4>Resource Library</h4>
                <p>Policies & Strategies.</p>
              </div>
            </Link>

            <Link to="/analytics" className="module-card card-compact">
              <div className="card-content">
                <FaChartLine className="compact-icon" />
                <h4>Analytics</h4>
                <p>Regional Trends.</p>
              </div>
            </Link>

            <Link to="/sdgs" className="module-card card-compact">
              <div className="card-content">
                <div className="compact-icon" style={{ color: '#E5243B' }}>
                  <img src="https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-01-1024x1024.png" alt="SDG" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </div>
                <h4>SDGs</h4>
                <p>Development Goals.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-text">
              <h2>Ready to contribute?</h2>
              <p>Join the regional effort and showcase your AI initiatives to the world.</p>
            </div>
            <div className="cta-actions">
              <Link to="/register" className="btn-solid">Get Started</Link>
              <Link to="/resources" className="btn-link">Learn More</Link>
            </div>
            <div className="cta-decoration"></div>
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .modern-home {
          --p-primary: #2563eb;
          --p-secondary: #0f172a;
          --p-accent: #3b82f6;
          --p-gradient: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          --p-soft: #f8fafc;
          --p-text: #1e293b;
          --p-text-light: #64728b;
          
          font-family: 'Outfit', sans-serif;
          color: var(--p-text);
          background: #fff;
          overflow-x: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Logo Style */
        .hero-logo-wrapper {
          display: inline-block;
          padding: 10px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          animation: floatLogo 3s infinite ease-in-out;
          border: 1px solid #f1f5f9;
        }
        .hero-logo-wrapper img { width: 140px; display: block; border-radius: 12px; }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          padding: 140px 0 100px;
          background: linear-gradient(160deg, #f0f4ff 0%, #ffffff 45%, #f5f3ff 100%);
          overflow: hidden;
          min-height: 85vh;
          display: flex;
          align-items: center;
        }

        .animated-blobs {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 0;
          filter: blur(80px);
          opacity: 0.4;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          background: var(--p-primary);
          animation: float 20s infinite alternate;
        }

        .blob-1 { width: 400px; height: 400px; top: -100px; right: -50px; background: #3b82f6; }
        .blob-2 { width: 300px; height: 300px; bottom: -50px; left: -50px; background: #60a5fa; animation-delay: -5s; }
        .blob-3 { width: 250px; height: 250px; top: 40%; left: 30%; background: #93c5fd; animation-delay: -10s; }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(100px, 50px) scale(1.1); }
        }

        .hero-container { position: relative; z-index: 1; text-align: center; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.1);
          border-radius: 100px;
          color: var(--p-primary);
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 24px;
        }

        .dot { width: 6px; height: 6px; background: var(--p-primary); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }

        .text-highlight {
          color: var(--p-primary);
          background: linear-gradient(120deg, var(--p-primary), #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--p-text-light);
          max-width: 650px;
          margin: 0 auto 48px;
          line-height: 1.6;
        }

        .hero-search {
          max-width: 600px;
          margin: 0 auto 40px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: #fff;
          padding: 8px 8px 8px 20px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.06);
          border: 1px solid #f1f5f9;
        }

        .search-icon { color: var(--p-text-light); font-size: 1.1rem; }
        .search-bar input {
          flex: 1;
          border: none;
          padding: 12px;
          font-size: 1rem;
          outline: none;
          background: transparent;
        }

        .search-btn {
          background: var(--p-primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
        }

        .search-btn:hover { background: #1d4ed8; }

        .hero-cta { display: flex; gap: 16px; justify-content: center; }

        .cta-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: 0.3s;
        }

        .cta-btn.primary { background: var(--p-secondary); color: white; }
        .cta-btn.secondary { background: #f1f5f9; color: var(--p-secondary); }
        .cta-btn:hover { transform: translateY(-2px); }

        /* Stats Bar */
        .stats-bar { padding: 40px 0; background: #fff; position: relative; z-index: 2; }
        .stats-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          background: #fff;
          padding: 30px;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          border: 1px solid #f1f5f9;
        }

        .stat-card { display: flex; align-items: center; gap: 16px; justify-content: center; }
        .stat-icon {
          width: 48px;
          height: 48px;
          background: rgba(37, 99, 235, 0.05);
          color: var(--p-primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .stat-value { display: block; font-size: 1.5rem; font-weight: 800; color: var(--p-secondary); }
        .stat-label { font-size: 0.85rem; color: var(--p-text-light); font-weight: 500; }

        /* Ticker Style - FLUID & COMPACT */
        .country-ticker-section { padding: 60px 0; background: #fff; }
        .ticker-header { display: flex; align-items: center; gap: 20px; padding: 0 40px 30px; }
        .ticker-header h2 { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: var(--p-text-light); white-space: nowrap; }
        .ticker-line { flex: 1; height: 1px; background: #f1f5f9; }

        .ticker-container {
          width: 100%;
          overflow: hidden;
          background: #fff;
          padding: 10px 0;
          position: relative;
        }

        .ticker-container::before, .ticker-container::after {
          content: '';
          position: absolute;
          top: 0; width: 100px; height: 100%;
          z-index: 2;
        }
        .ticker-container::before { left: 0; background: linear-gradient(to right, #fff, transparent); }
        .ticker-container::after { right: 0; background: linear-gradient(to left, #fff, transparent); }

        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker 60s linear infinite;
        }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 24px;
          text-decoration: none;
          color: var(--p-text);
          transition: 0.3s;
          border-radius: 100px;
        }

        .ticker-item:hover { background: #f8fafc; transform: translateY(-2px); }

        .ticker-flag {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #f1f5f9;
        }
        .ticker-flag img { width: 100%; height: 100%; object-fit: cover; }
        .ticker-name { font-weight: 600; font-size: 0.95rem; }

        /* Modules Section */
        .modules-section { padding: 100px 0; background: #f8fafc; border-radius: 60px 60px 0 0; }
        .section-header { text-align: center; margin-bottom: 60px; }
        .section-header .title { font-size: 2.5rem; font-weight: 800; margin-bottom: 16px; }
        .section-header .subtitle { color: var(--p-text-light); font-size: 1.1rem; }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto;
          gap: 24px;
        }

        .module-card {
          position: relative;
          background: #fff;
          border-radius: 24px;
          padding: 40px;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
          transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid #f1f5f9;
        }

        .module-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.04); }

        .card-main { grid-column: span 2; background: var(--p-secondary); color: white; }
        .card-main .card-tag { background: rgba(255,255,255,0.1); color: white; }
        .card-main p { color: rgba(255,255,255,0.7); }
        .card-main .card-link { color: #fff; }

        .card-accent { background: linear-gradient(140deg, #eff6ff 0%, #ffffff 100%); border-color: #dbeafe; }
        .card-accent-alt { background: linear-gradient(140deg, #f0fdf4 0%, #ffffff 100%); border-color: #bbf7d0; }
        .card-accent .card-link { color: #2563eb; }
        .card-accent-alt .card-link { color: #059669; }
        .card-accent .card-tag { background: rgba(37,99,235,0.07); color: #2563eb; }
        .card-accent-alt .card-tag { background: rgba(5,150,105,0.07); color: #059669; }

        .card-tag {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(37, 99, 235, 0.05);
          color: var(--p-primary);
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .module-card h3 { font-size: 1.75rem; font-weight: 800; margin-bottom: 16px; }
        .module-card p { color: var(--p-text-light); line-height: 1.6; margin-bottom: 24px; }
        
        .card-link { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--p-primary); }

        .bg-icon {
          position: absolute;
          right: -20px;
          bottom: -20px;
          font-size: 10rem;
          opacity: 0.03;
          transition: 0.4s;
        }
        .module-card:hover .bg-icon { transform: rotate(-10deg) scale(1.1); opacity: 0.06; }

        .card-compact { display: flex; align-items: center; justify-content: center; text-align: center; }
        .compact-icon { font-size: 2.5rem; color: var(--p-primary); margin-bottom: 16px; }
        .card-compact h4 { font-size: 1.25rem; font-weight: 800; margin-bottom: 8px; }

        /* CTA Section */
        .cta-section { padding: 100px 0; background: #f8fafc; }
        .cta-box {
          background: var(--p-primary);
          border-radius: 40px;
          padding: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .cta-text h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 16px; }
        .cta-text p { font-size: 1.1rem; color: rgba(255,255,255,0.8); }

        .cta-actions { display: flex; gap: 16px; }
        .btn-solid { background: white; color: var(--p-primary); padding: 16px 32px; border-radius: 16px; font-weight: 700; text-decoration: none; transition: 0.3s; }
        .btn-link { color: white; padding: 16px 32px; font-weight: 700; text-decoration: none; border-radius: 16px; transition: 0.3s; }
        .btn-solid:hover { transform: scale(1.05); }
        .btn-link:hover { background: rgba(255,255,255,0.12); }

        .cta-decoration {
          position: absolute;
          right: -50px;
          top: -50px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.2), transparent 70%);
          border-radius: 50%;
        }

        /* Animations */
        .animate-up { opacity: 0; transform: translateY(30px); animation: fadeInUp 0.8s forwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }

        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .modules-grid { grid-template-columns: 1fr; }
          .card-main { grid-column: span 1; }
          .stats-container { grid-template-columns: repeat(2, 1fr); }
          .cta-box { flex-direction: column; text-align: center; gap: 40px; padding: 40px; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .stats-container { grid-template-columns: 1fr; }
        }

        /* ── DARK MODE ── */
        [data-theme="dark"] .modern-home { background: #0c1220; color: #e2e8f0; }

        [data-theme="dark"] .hero-section { background: linear-gradient(160deg, #111827 0%, #0c1220 50%, #12102a 100%); }
        [data-theme="dark"] .hero-title { color: #f1f5f9; }
        [data-theme="dark"] .hero-subtitle { color: #94a3b8; }
        [data-theme="dark"] .hero-badge { background: rgba(96,165,250,0.1); border-color: rgba(96,165,250,0.2); color: #60a5fa; }
        [data-theme="dark"] .dot { background: #60a5fa; }
        [data-theme="dark"] .search-bar { background: #1e293b; border-color: #334155; box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
        [data-theme="dark"] .search-bar input { color: #e2e8f0; background: transparent; }
        [data-theme="dark"] .search-bar input::placeholder { color: #475569; }
        [data-theme="dark"] .search-icon { color: #475569; }
        [data-theme="dark"] .cta-btn.secondary { background: #1e293b; color: #e2e8f0; }

        [data-theme="dark"] .stats-bar { background: #0c1220; }
        [data-theme="dark"] .stats-container { background: #1e293b; border-color: rgba(255,255,255,0.07); box-shadow: none; }
        [data-theme="dark"] .stat-value { color: #f1f5f9; }
        [data-theme="dark"] .stat-label { color: #64748b; }
        [data-theme="dark"] .stat-icon { background: rgba(96,165,250,0.1); color: #60a5fa; }

        [data-theme="dark"] .country-ticker-section { background: #0c1220; }
        [data-theme="dark"] .ticker-header h2 { color: #475569; }
        [data-theme="dark"] .ticker-line { background: #1e293b; }
        [data-theme="dark"] .ticker-container { background: #0c1220; }
        [data-theme="dark"] .ticker-container::before { background: linear-gradient(to right, #0c1220, transparent); }
        [data-theme="dark"] .ticker-container::after  { background: linear-gradient(to left,  #0c1220, transparent); }
        [data-theme="dark"] .ticker-item { color: #cbd5e1; }
        [data-theme="dark"] .ticker-item:hover { background: #1e293b; }
        [data-theme="dark"] .ticker-flag { border-color: #334155; }
        [data-theme="dark"] .ticker-name { color: #cbd5e1; }

        [data-theme="dark"] .modules-section { background: #111827; }
        [data-theme="dark"] .section-header .title { color: #f1f5f9; }
        [data-theme="dark"] .section-header .subtitle { color: #64748b; }
        [data-theme="dark"] .module-card { background: #1e293b; border-color: rgba(255,255,255,0.07); color: #e2e8f0; }
        [data-theme="dark"] .module-card p { color: #94a3b8; }
        [data-theme="dark"] .module-card:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        [data-theme="dark"] .card-accent     { background: linear-gradient(140deg, #1a2744 0%, #1e293b 100%); border-color: rgba(37,99,235,0.3); }
        [data-theme="dark"] .card-accent-alt { background: linear-gradient(140deg, #0f2e24 0%, #1e293b 100%); border-color: rgba(5,150,105,0.3); }
        [data-theme="dark"] .card-tag { background: rgba(96,165,250,0.1); color: #60a5fa; }
        [data-theme="dark"] .card-accent .card-tag     { background: rgba(37,99,235,0.15);   color: #60a5fa; }
        [data-theme="dark"] .card-accent-alt .card-tag { background: rgba(5,150,105,0.15);   color: #34d399; }
        [data-theme="dark"] .card-accent .card-link     { color: #60a5fa; }
        [data-theme="dark"] .card-accent-alt .card-link { color: #34d399; }
        [data-theme="dark"] .card-compact { background: #1e293b; }
        [data-theme="dark"] .compact-icon { color: #60a5fa; }

        [data-theme="dark"] .cta-section { background: #111827; }
        [data-theme="dark"] .cta-box { background: linear-gradient(135deg, #1d4ed8, #1e40af); }
      `}</style>
    </div>
  )
}

export default Home
