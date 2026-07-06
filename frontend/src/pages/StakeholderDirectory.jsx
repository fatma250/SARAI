import { useState, useEffect } from 'react'
import { FaUniversity, FaBriefcase, FaBuilding, FaFlask, FaSearch, FaGlobeAmericas, FaExternalLinkAlt, FaChevronDown, FaChevronUp, FaArrowRight, FaUsers, FaRocket, FaMicrochip } from 'react-icons/fa'
import SearchBar from '../components/SearchBar'
import { useTranslation } from 'react-i18next'

// Static fallback data
const STATIC_STAKEHOLDERS = [
  { id: 1, name: 'Dubai AI Center', type: 'Research Lab', country: 'UAE', category: 'Research', description: 'Leading AI research center focusing on computer vision and NLP.', website: 'https://dubaiai.ae' },
  { id: 2, name: 'Cairo University AI Lab', type: 'University', country: 'Egypt', category: 'Education', description: 'Academic research lab specializing in machine learning.', website: 'https://cu.edu.eg' },
  { id: 3, name: 'Saudi Data Authority', type: 'Government', country: 'Saudi Arabia', category: 'Government', description: 'National authority for data and AI governance.', website: 'https://sda.gov.sa' },
  { id: 4, name: 'TechVenture Morocco', type: 'Startup', country: 'Morocco', category: 'Private', description: 'AI startup focused on FinTech solutions.', website: 'https://techventure.ma' },
  { id: 5, name: 'Jordan AI Association', type: 'NGO', country: 'Jordan', category: 'Civil Society', description: 'Promoting AI adoption across industries in Jordan.', website: 'https://joai.org' },
  { id: 6, name: 'Qatar Computing Research Institute', type: 'Research Lab', country: 'Qatar', category: 'Research', description: 'World-class research center in computing.', website: 'https://qatar.tamu.edu' },
  { id: 7, name: 'Kuwait AI Initiative', type: 'Government', country: 'Kuwait', category: 'Government', description: 'National AI strategy implementation body.', website: 'https://ai.gov.kw' },
  { id: 8, name: 'Tunisian AI Hub', type: 'Startup', country: 'Tunisia', category: 'Private', description: 'AI innovation hub and accelerator.', website: 'https://tunisia-ai.com' },
  { id: 9, name: 'Emirates AI Lab', type: 'Research Lab', country: 'UAE', category: 'Research', description: 'Advanced AI research laboratory.', website: 'https://emiratesailab.ae' },
  { id: 10, name: 'Alexandria University AI Center', type: 'University', country: 'Egypt', category: 'Education', description: 'AI research and education center.', website: 'https://alexu.edu.eg' },
  { id: 11, name: 'Riyadh AI Hub', type: 'Startup', country: 'Saudi Arabia', category: 'Private', description: 'AI startup incubator and accelerator.', website: 'https://riyadh.ai' },
  { id: 12, name: 'Beirut Digital District', type: 'Government', country: 'Lebanon', category: 'Government', description: 'Digital transformation hub.', website: 'https://bdd.gov.lb' }
]

// Arab countries with flags
const ARAB_COUNTRIES = [
  { name: 'Algeria',      flag: 'https://flagcdn.com/w80/dz.png' },
  { name: 'Bahrain',      flag: 'https://flagcdn.com/w80/bh.png' },
  { name: 'Comoros',      flag: 'https://flagcdn.com/w80/km.png' },
  { name: 'Djibouti',     flag: 'https://flagcdn.com/w80/dj.png' },
  { name: 'Egypt',        flag: 'https://flagcdn.com/w80/eg.png' },
  { name: 'Iraq',         flag: 'https://flagcdn.com/w80/iq.png' },
  { name: 'Jordan',       flag: 'https://flagcdn.com/w80/jo.png' },
  { name: 'Kuwait',       flag: 'https://flagcdn.com/w80/kw.png' },
  { name: 'Lebanon',      flag: 'https://flagcdn.com/w80/lb.png' },
  { name: 'Libya',        flag: 'https://flagcdn.com/w80/ly.png' },
  { name: 'Mauritania',   flag: 'https://flagcdn.com/w80/mr.png' },
  { name: 'Morocco',      flag: 'https://flagcdn.com/w80/ma.png' },
  { name: 'Oman',         flag: 'https://flagcdn.com/w80/om.png' },
  { name: 'Palestine',    flag: 'https://flagcdn.com/w80/ps.png' },
  { name: 'Qatar',        flag: 'https://flagcdn.com/w80/qa.png' },
  { name: 'Saudi Arabia', flag: 'https://flagcdn.com/w80/sa.png' },
  { name: 'Somalia',      flag: 'https://flagcdn.com/w80/so.png' },
  { name: 'Sudan',        flag: 'https://flagcdn.com/w80/sd.png' },
  { name: 'Syria',        flag: 'https://flagcdn.com/w80/sy.png' },
  { name: 'Tunisia',      flag: 'https://flagcdn.com/w80/tn.png' },
  { name: 'United Arab Emirates', flag: 'https://flagcdn.com/w80/ae.png' },
  { name: 'Yemen',        flag: 'https://flagcdn.com/w80/ye.png' },
]

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const categories = ['All', 'Research Lab', 'University', 'Government Agency', 'AI Startup', 'Innovation Hub', 'Tech Company', 'NGO']

function getIcon(type) {
  switch (type) {
    case 'Research Lab': return <FaFlask />
    case 'University':   return <FaUniversity />
    case 'Government Agency':   return <FaBuilding />
    case 'AI Startup':      return <FaBriefcase />
    case 'Innovation Hub':  return <FaRocket />
    case 'Tech Company':    return <FaMicrochip />
    default:             return <FaBuilding />
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'Research Lab': return '#8b5cf6'
    case 'University':   return '#3b82f6'
    case 'Government Agency':   return '#10b981'
    case 'AI Startup':      return '#f59e0b'
    case 'Innovation Hub':  return '#06b6d4'
    case 'Tech Company':    return '#6366f1'
    case 'NGO':          return '#ec4899'
    default:             return '#64748b'
  }
}

// Single stakeholder card — horizontal layout
function StakeholderCard({ s }) {
  return (
    <div className="modern-stakeholder-card">
      <div className="card-top">
        <div className="stakeholder-type-badge" style={{ background: `${getTypeColor(s.type)}10`, color: getTypeColor(s.type) }}>
          {getIcon(s.type)}
          <span>{s.type}</span>
        </div>
        {s.website && (
          <a href={s.website} target="_blank" rel="noopener noreferrer" className="external-link">
            <FaExternalLinkAlt />
          </a>
        )}
      </div>
      
      <div className="card-body">
        <h3>{s.name}</h3>
        <p>{s.description}</p>
      </div>
      
      <div className="card-footer">
        <div className="footer-meta">
          <FaGlobeAmericas />
          <span>{s.country}</span>
        </div>
        {s.category && (
          <span className="category-tag">{s.category}</span>
        )}
      </div>
    </div>
  )
}

// Country card with stakeholders inside
function CountrySection({ country, stakeholders }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="modern-country-section">
      <button className={`section-trigger ${open ? 'is-open' : ''}`} onClick={() => setOpen(!open)}>
        <div className="trigger-left">
          <div className="country-flag-mini">
            <img src={country.flag} alt={country.name} />
          </div>
          <div className="country-text">
            <span className="country-name">{country.name}</span>
            <span className="country-meta">{stakeholders.length} Stakeholder{stakeholders.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="trigger-right">
          <span className="chevron-icon">{open ? <FaChevronUp /> : <FaChevronDown />}</span>
        </div>
      </button>

      {open && (
        <div className="section-content">
          <div className="stakeholders-grid">
            {stakeholders.map(s => (
              <StakeholderCard key={s.id} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StakeholderDirectory() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [stakeholders, setStakeholders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/stakeholders/`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then(data => {
        setStakeholders(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Fetch error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filtered = stakeholders.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'All' || s.type === selectedCategory
    return matchSearch && matchCategory
  })

  // Group by country, preserving ARAB_COUNTRIES order
  const grouped = ARAB_COUNTRIES
    .map(c => ({
      country: c,
      items: filtered.filter(s =>
        (s.country || '').toLowerCase() === c.name.toLowerCase()
      )
    }))
    .filter(g => g.items.length > 0)

  const totalCount = filtered.length

  return (
    <div className="modern-directory">
      {/* Dynamic Hero */}
      <section className="directory-hero">
        <div className="animated-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        
        <div className="container hero-container">
          <div className="hero-content animate-up">
            <div className="hero-badge">
              <FaUsers />
              <span>{t('stakeholders.heroBadge')}</span>
            </div>
            <h1>{t('stakeholders.heroTitle')} <span className="text-gradient">{t('stakeholders.heroTitleAccent')}</span></h1>
            <p>{t('stakeholders.heroSubtitle')}</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="directory-body">
        <div className="container">
          {/* Advanced Search & Filter Bar */}
          <div className="search-filter-card animate-up delay-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={t('stakeholders.searchPlaceholder')}
              className="directory-search"
            />
            
            <div className="filter-wrapper">
              <div className="filter-group">
                <FaBuilding className="group-icon" />
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="stats-indicator">
              <strong>{totalCount}</strong> {t('stakeholders.results')}
            </div>
          </div>

          {/* Results Area */}
          <div className="results-area animate-up delay-2">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>{t('stakeholders.loading')}</p>
              </div>
            ) : grouped.length > 0 ? (
              <div className="countries-list">
                {grouped.map(({ country, items }) => (
                  <CountrySection key={country.name} country={country} stakeholders={items} />
                ))}
              </div>
            ) : (
              <div className="no-results-card">
                <div className="no-results-icon">🔍</div>
                <h3>{t('stakeholders.noResults')}</h3>
                <p>{t('stakeholders.noResultsHint')}</p>
                <button className="reset-btn" onClick={() => { setSearch(''); setSelectedCategory('All'); }}>{t('stakeholders.clearFilters')}</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .modern-directory {
          --d-primary: #2563eb;
          --d-secondary: #0f172a;
          --d-text: #1e293b;
          --d-text-light: #64728b;
          --d-glass: rgba(255, 255, 255, 0.8);
          
          font-family: 'Outfit', sans-serif;
          color: var(--d-text);
          background: #fff;
          min-height: 100vh;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Hero */
        .directory-hero {
          position: relative;
          padding: 120px 0 80px;
          background: #fff;
          overflow: hidden;
          text-align: center;
        }

        .animated-blobs {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0; left: 0;
          filter: blur(70px);
          opacity: 0.3;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          background: var(--d-primary);
          animation: float 15s infinite alternate;
        }

        .blob-1 { width: 300px; height: 300px; top: -50px; right: 5%; background: #60a5fa; }
        .blob-2 { width: 250px; height: 250px; bottom: -50px; left: 5%; background: #93c5fd; animation-delay: -5s; }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, 20px) scale(1.1); }
        }

        .hero-container { position: relative; z-index: 2; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(37, 99, 235, 0.08);
          border-radius: 100px;
          color: var(--d-primary);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 24px;
        }

        .directory-hero h1 {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }

        .text-gradient {
          background: linear-gradient(135deg, #2563eb, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .directory-hero p {
          font-size: 1.2rem;
          color: var(--d-text-light);
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Body & Filters */
        .directory-body { padding-bottom: 100px; }

        .search-filter-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          margin-bottom: 40px;
          margin-top: -30px;
          position: relative;
          z-index: 10;
        }

        .directory-search {
          flex: 1;
        }

        .filter-wrapper {
          display: flex;
          gap: 8px;
          padding-right: 8px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          padding: 10px 16px;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
        }

        .group-icon { color: var(--d-text-light); font-size: 0.9rem; }
        .filter-group select {
          border: none;
          background: transparent;
          font-weight: 600;
          color: var(--d-secondary);
          outline: none;
          cursor: pointer;
          font-family: inherit;
        }

        .stats-indicator {
          padding: 0 24px;
          border-left: 1px solid #f1f5f9;
          font-size: 0.9rem;
          color: var(--d-text-light);
        }

        /* Countries List */
        .countries-list { display: flex; flex-direction: column; gap: 24px; }

        .modern-country-section {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          overflow: hidden;
          transition: 0.3s;
        }
        .modern-country-section:hover { border-color: #e2e8f0; }

        .section-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .section-trigger:hover { background: #f8fafc; }
        .section-trigger.is-open { border-bottom: 1px solid #f1f5f9; }

        .trigger-left { display: flex; align-items: center; gap: 20px; }
        .country-flag-mini {
          width: 50px;
          height: 35px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          flex-shrink: 0;
        }
        .country-flag-mini img { width: 100%; height: 100%; object-fit: cover; }

        .country-text { display: flex; flex-direction: column; align-items: flex-start; }
        .country-name { font-size: 1.25rem; font-weight: 700; color: var(--d-secondary); }
        .country-meta { font-size: 0.85rem; color: var(--d-text-light); font-weight: 500; }

        .chevron-icon { color: var(--d-text-light); font-size: 1rem; }

        .section-content { padding: 32px; background: #fafbfc; }

        /* Stakeholder Grid */
        .stakeholders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .modern-stakeholder-card {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .modern-stakeholder-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.04);
          border-color: #e2e8f0;
        }

        .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .stakeholder-type-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .external-link {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--d-text-light);
          border-radius: 50%;
          transition: 0.2s;
        }
        .external-link:hover { background: #f1f5f9; color: var(--d-primary); }

        .card-body h3 { font-size: 1.15rem; font-weight: 700; color: var(--d-secondary); margin-bottom: 8px; }
        .card-body p { font-size: 0.9rem; color: var(--d-text-light); line-height: 1.6; }

        .card-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-meta { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--d-text-light); font-weight: 600; }
        .category-tag { font-size: 0.75rem; background: #f1f5f9; color: var(--d-text-light); padding: 4px 10px; border-radius: 8px; font-weight: 600; }

        /* Helpers */
        .loading-container { text-align: center; padding: 60px 0; }
        .spinner {
          width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: var(--d-primary);
          border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .no-results-card {
          text-align: center; background: #fff; padding: 60px; border-radius: 32px; border: 1px solid #f1f5f9;
        }
        .no-results-icon { font-size: 3rem; margin-bottom: 16px; }
        .reset-btn {
          margin-top: 24px; background: var(--d-primary); color: #fff; border: none;
          padding: 12px 24px; border-radius: 14px; font-weight: 700; cursor: pointer;
        }

        .animate-up { opacity: 0; transform: translateY(20px); animation: fadeInUp 0.6s forwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1024px) {
          .search-filter-card { flex-direction: column; padding: 16px; }
          .search-wrapper { width: 100%; border-bottom: 1px solid #f1f5f9; margin-bottom: 8px; }
          .stats-indicator { border-left: none; padding: 8px 0; border-top: 1px solid #f1f5f9; width: 100%; text-align: center; }
        }

        @media (max-width: 768px) {
          .directory-hero h1 { font-size: 2rem; }
          .section-trigger { padding: 16px 20px; }
          .section-content { padding: 16px; }
          .filter-wrapper { flex-direction: column; width: 100%; }
        }

        /* ── Dark mode ── */
        [data-theme="dark"] .modern-directory {
          --d-text: #e2e8f0;
          --d-text-light: #94a3b8;
          --d-secondary: #f1f5f9;
          background: #0f172a;
          color: #e2e8f0;
        }
        [data-theme="dark"] .directory-hero { background: #0f172a; }
        [data-theme="dark"] .search-filter-card {
          background: #1e293b;
          border-color: rgba(255,255,255,0.06);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        [data-theme="dark"] .filter-group {
          background: #0f172a;
          border-color: rgba(255,255,255,0.08);
        }
        [data-theme="dark"] .filter-group select {
          color: #e2e8f0;
          background: #0f172a;
        }
        [data-theme="dark"] .filter-group select option {
          background: #1e293b;
          color: #e2e8f0;
        }
        [data-theme="dark"] .stats-indicator { border-left-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .modern-country-section {
          background: #1e293b;
          border-color: rgba(255,255,255,0.06);
        }
        [data-theme="dark"] .modern-country-section:hover { border-color: rgba(255,255,255,0.12); }
        [data-theme="dark"] .section-trigger:hover { background: rgba(255,255,255,0.04); }
        [data-theme="dark"] .section-trigger.is-open { border-bottom-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .section-content { background: rgba(15,23,42,0.6); }
        [data-theme="dark"] .modern-stakeholder-card {
          background: #1e293b;
          border-color: rgba(255,255,255,0.06);
        }
        [data-theme="dark"] .modern-stakeholder-card:hover { border-color: rgba(255,255,255,0.14); }
        [data-theme="dark"] .external-link:hover { background: rgba(255,255,255,0.07); }
        [data-theme="dark"] .card-footer { border-top-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .category-tag { background: rgba(255,255,255,0.07); color: #94a3b8; }
        [data-theme="dark"] .no-results-card {
          background: #1e293b;
          border-color: rgba(255,255,255,0.06);
        }
        [data-theme="dark"] .spinner { border-color: rgba(255,255,255,0.07); border-top-color: #2563eb; }
        [data-theme="dark"] .search-wrapper { border-bottom-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .stats-indicator { border-top-color: rgba(255,255,255,0.06); }
      `}</style>
    </div>
  )
}

export default StakeholderDirectory
