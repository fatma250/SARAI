import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaSearch, FaArrowRight, FaExternalLinkAlt, FaInfoCircle, FaExclamationTriangle, FaSortAmountDown } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FALLBACK_SDG_META = [
  { number: 1,  name: "No Poverty",              color: "#E5243B", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-01-1024x1024.png" },
  { number: 2,  name: "Zero Hunger",             color: "#DDA63A", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-02-1024x1024.png" },
  { number: 3,  name: "Good Health",             color: "#4C9F38", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-03-1024x1024.png" },
  { number: 4,  name: "Quality Education",       color: "#C5192D", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-04-1024x1024.png" },
  { number: 5,  name: "Gender Equality",         color: "#FF3A21", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-05-1024x1024.png" },
  { number: 6,  name: "Clean Water",             color: "#26BDE2", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-06-1024x1024.png" },
  { number: 7,  name: "Clean Energy",            color: "#FCC30B", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-07-1024x1024.png" },
  { number: 8,  name: "Decent Work",             color: "#A21942", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-08-1024x1024.png" },
  { number: 9,  name: "Industry & Innovation",   color: "#FD6925", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-09-1024x1024.png" },
  { number: 10, name: "Reduced Inequality",      color: "#DD1367", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-10-1024x1024.png" },
  { number: 11, name: "Sustainable Cities",      color: "#FD9D24", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-11-1024x1024.png" },
  { number: 12, name: "Responsible Consumption", color: "#BF8B2E", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-12-1024x1024.png" },
  { number: 13, name: "Climate Action",          color: "#3F7E44", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-13-1024x1024.png" },
  { number: 14, name: "Life Below Water",        color: "#0A97D9", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-14-1024x1024.png" },
  { number: 15, name: "Life on Land",            color: "#56C02B", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-15-1024x1024.png" },
  { number: 16, name: "Peace & Justice",         color: "#00689D", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-16-1024x1024.png" },
  { number: 17, name: "Partnerships",            color: "#19486A", icon: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-17-1024x1024.png" },
]

const SORT_OPTIONS = [
  { value: 'number',    label: 'Goal number' },
  { value: 'projects',  label: 'Most projects' },
  { value: 'countries', label: 'Most countries' },
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontSize: 13 }}>
      <strong style={{ color: d.color }}>SDG {d.number}</strong>
      <div style={{ color: '#555', marginTop: 2 }}>{d.project_count} project{d.project_count !== 1 ? 's' : ''}</div>
    </div>
  )
}

function SDGDirectory() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [sdgs, setSdgs] = useState([])
  const [globalStats, setGlobalStats] = useState({ covered_sdgs: 0, total_projects: 0, total_stakeholders: 0, total_countries: 0 })
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('number')
  const [showSort, setShowSort] = useState(false)

  useEffect(() => { fetchDashboard() }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/api/sdgs/dashboard`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()

      const merged = data.sdgs.map(sdg => {
        const meta = FALLBACK_SDG_META.find(m => m.number === sdg.goal_number) || {}
        return {
          ...sdg,
          number: sdg.goal_number,
          color: sdg.color_code || meta.color,
          icon: sdg.icon_url || meta.icon,
        }
      })

      setSdgs(merged)
      setGlobalStats(data.global)
      setSelectedGoal(merged[0] || null)
    } catch (err) {
      console.error('Failed to fetch SDG dashboard:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredSorted = useMemo(() => {
    let list = sdgs.filter(s =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.number) === searchTerm
    )
    if (sortBy === 'projects')  list = [...list].sort((a, b) => b.project_count - a.project_count)
    if (sortBy === 'countries') list = [...list].sort((a, b) => b.countries_count - a.countries_count)
    return list
  }, [sdgs, searchTerm, sortBy])

  const chartData = useMemo(() =>
    [...sdgs]
      .filter(s => s.project_count > 0)
      .sort((a, b) => b.project_count - a.project_count),
    [sdgs]
  )

  const coveragePct = globalStats.covered_sdgs ? Math.round((globalStats.covered_sdgs / 17) * 100) : 0

  return (
    <div className="sdg-dashboard">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="title-section">
            <div className="breadcrumb">{t('sdgs.breadcrumb')}</div>
            <h1>{t('sdgs.title')} <span className="text-accent">{t('sdgs.titleAccent')}</span></h1>
          </div>
          <div className="header-actions">
            <div className="search-pill">
              <FaSearch size={13} />
              <input
                type="text"
                placeholder={t('sdgs.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sort-wrap">
              <button className="btn-icon" title="Sort" onClick={() => setShowSort(v => !v)}>
                <FaSortAmountDown size={14} />
              </button>
              {showSort && (
                <div className="sort-dropdown">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`sort-opt ${sortBy === opt.value ? 'active' : ''}`}
                      onClick={() => { setSortBy(opt.value); setShowSort(false) }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Coverage banner ── */}
      {!loading && !error && (
        <div className="coverage-banner">
          <div className="container">
            <div className="coverage-stats">
              <div className="cov-stat">
                <span className="cov-val">{globalStats.covered_sdgs}<span className="cov-denom">/17</span></span>
                <span className="cov-label">{t('sdgs.sdgsCovered')}</span>
              </div>
              <div className="cov-divider" />
              <div className="cov-stat">
                <span className="cov-val">{globalStats.total_projects}</span>
                <span className="cov-label">{t('sdgs.activeProjects')}</span>
              </div>
              <div className="cov-divider" />
              <div className="cov-stat">
                <span className="cov-val">{globalStats.total_stakeholders}</span>
                <span className="cov-label">{t('sdgs.stakeholders')}</span>
              </div>
              <div className="cov-divider" />
              <div className="cov-stat">
                <span className="cov-val">{globalStats.total_countries}</span>
                <span className="cov-label">{t('sdgs.countries')}</span>
              </div>
              <div className="cov-divider" />
              <div className="cov-bar-wrap">
                <span className="cov-bar-label">{t('sdgs.coverage')}</span>
                <div className="cov-progress">
                  <div className="cov-fill" style={{ width: `${coveragePct}%` }} />
                </div>
                <span className="cov-pct">{coveragePct}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-content">
        <div className="container">

          {/* ── Error state ── */}
          {error && (
            <div className="error-banner">
              <FaExclamationTriangle size={18} />
              <div>
                <strong>Failed to load SDG data</strong>
                <p>{error}</p>
              </div>
              <button className="btn-retry" onClick={fetchDashboard}>Retry</button>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="loading-container">
              <div className="sdg-spinner" />
              <p>Loading SDGs…</p>
            </div>
          )}

          {!loading && !error && (
            <div className="layout-grid">

              {/* ── Left: mosaic + chart ── */}
              <div className="left-col">
                <div className="mosaic-grid">
                  {filteredSorted.map(sdg => (
                    <button
                      key={sdg.id}
                      className={`mosaic-item ${selectedGoal?.id === sdg.id ? 'active' : ''}`}
                      onClick={() => setSelectedGoal(sdg)}
                      style={{ '--sdg-color': sdg.color }}
                    >
                      <img src={sdg.icon} alt={sdg.name} />
                      <div className="mosaic-overlay">
                        <span className="goal-num">{sdg.number}</span>
                      </div>
                      {sdg.project_count > 0 && (
                        <span className="project-badge">{sdg.project_count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Projects per SDG bar chart ── */}
                {chartData.length > 0 && (
                  <div className="chart-card">
                    <h3 className="chart-title">Projects per SDG</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <XAxis dataKey="number" tick={{ fontSize: 11, fill: '#86868b' }} tickLine={false} axisLine={false} tickFormatter={n => `SDG ${n}`} />
                        <YAxis tick={{ fontSize: 11, fill: '#86868b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="project_count" radius={[6, 6, 0, 0]}>
                          {chartData.map(entry => (
                            <Cell key={entry.number} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* ── Right: detail panel ── */}
              <div className="info-section">
                {selectedGoal ? (
                  <div className="goal-detail-card" style={{ '--sdg-color': selectedGoal.color }}>
                    <div className="card-accent" style={{ background: selectedGoal.color }}>
                      <img src={selectedGoal.icon} alt={selectedGoal.name} className="card-accent-icon" />
                      <div className="card-accent-text">
                        <span className="card-goal-num">Goal {selectedGoal.number}</span>
                        <h2 className="card-goal-name">{selectedGoal.name}</h2>
                      </div>
                    </div>

                    <div className="card-body">
                      <p className="goal-description">{selectedGoal.description}</p>

                      <div className="goal-stats">
                        <div className="stat-box" style={{ background: `${selectedGoal.color}12`, borderColor: `${selectedGoal.color}30` }}>
                          <span className="stat-val" style={{ color: selectedGoal.color }}>{selectedGoal.project_count}</span>
                          <span className="stat-label">{t('sdgs.projects')}</span>
                        </div>
                        <div className="stat-box" style={{ background: `${selectedGoal.color}12`, borderColor: `${selectedGoal.color}30` }}>
                          <span className="stat-val" style={{ color: selectedGoal.color }}>{selectedGoal.stakeholder_count}</span>
                          <span className="stat-label">{t('sdgs.partnerships')}</span>
                        </div>
                        <div className="stat-box" style={{ background: `${selectedGoal.color}12`, borderColor: `${selectedGoal.color}30` }}>
                          <span className="stat-val" style={{ color: selectedGoal.color }}>{selectedGoal.countries_count}</span>
                          <span className="stat-label">{t('sdgs.countries')}</span>
                        </div>
                      </div>

                      {/* Country list */}
                      {selectedGoal.country_names?.length > 0 && (
                        <div className="country-list">
                          {selectedGoal.country_names.map(c => (
                            <span key={c} className="country-chip" style={{ background: `${selectedGoal.color}14`, color: selectedGoal.color }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {selectedGoal.top_sector && (
                        <div className="sector-row">
                          <span className="sector-row-label">{t('sdgs.topSector')}</span>
                          <span className="sector-chip" style={{ background: `${selectedGoal.color}18`, color: selectedGoal.color }}>
                            {selectedGoal.top_sector}
                          </span>
                        </div>
                      )}

                      {selectedGoal.project_count === 0 && (
                        <div className="no-data-hint">{t('sdgs.noProjects')}</div>
                      )}

                      <div className="goal-actions">
                        <Link
                          to={`/projects?sdg_num=${selectedGoal.number}`}
                          className="btn-primary-sdg"
                          style={{ background: selectedGoal.color }}
                        >
                          {t('sdgs.exploreProjects')} <FaArrowRight size={12} />
                        </Link>
                        <a
                          href={`https://sdgs.un.org/goals/goal${selectedGoal.number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary-sdg"
                        >
                          <FaExternalLinkAlt size={12} /> {t('sdgs.unReport')}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <FaInfoCircle size={32} />
                    <h3>{t('sdgs.noResults')}</h3>
                    <p>{t('sdgs.noResultsHint')}</p>
                    <button className="btn-link" onClick={() => setSearchTerm('')}>{t('sdgs.resetSearch')}</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .sdg-dashboard {
          background: #fbfbfb;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, system-ui, sans-serif;
          color: #1d1d1f;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

        /* ── Header ── */
        .dashboard-header {
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
          padding: 20px 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-container {
          max-width: 1200px; margin: 0 auto; padding: 0 24px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .breadcrumb { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #86868b; font-weight: 600; margin-bottom: 4px; }
        .title-section h1 { font-size: 1.5rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
        .text-accent { color: #2563eb; }
        .header-actions { display: flex; gap: 12px; align-items: center; }

        .search-pill {
          display: flex; align-items: center; background: #f5f5f7;
          border-radius: 12px; padding: 8px 16px; width: 260px;
          border: 1px solid transparent; transition: all 0.2s;
        }
        .search-pill:focus-within { background: #fff; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.08); }
        .search-pill input { border: none; background: transparent; outline: none; margin-left: 10px; font-size: 14px; width: 100%; font-weight: 500; }

        .sort-wrap { position: relative; }
        .btn-icon {
          width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e5e5e5;
          background: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #424245; transition: all 0.2s;
        }
        .btn-icon:hover { background: #f5f5f7; border-color: #d2d2d7; }
        .sort-dropdown {
          position: absolute; right: 0; top: calc(100% + 8px);
          background: #fff; border: 1px solid #e5e5e5; border-radius: 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10); overflow: hidden; z-index: 200; min-width: 160px;
        }
        .sort-opt {
          display: block; width: 100%; padding: 10px 16px; text-align: left;
          background: none; border: none; cursor: pointer; font-size: 0.85rem;
          color: #333; transition: background 0.15s;
        }
        .sort-opt:hover { background: #f5f5f7; }
        .sort-opt.active { color: #2563eb; font-weight: 700; background: #eff6ff; }

        /* ── Coverage banner ── */
        .coverage-banner { background: #fff; border-bottom: 1px solid #e5e5e5; padding: 16px 0; }
        .coverage-stats { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
        .cov-stat { display: flex; flex-direction: column; gap: 2px; }
        .cov-val { font-size: 1.5rem; font-weight: 800; color: #1d1d1f; line-height: 1; }
        .cov-denom { font-size: 1rem; font-weight: 600; color: #86868b; }
        .cov-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #86868b; }
        .cov-divider { width: 1px; height: 36px; background: #e5e5e5; }
        .cov-bar-wrap { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 180px; }
        .cov-bar-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: #86868b; white-space: nowrap; }
        .cov-progress { flex: 1; height: 8px; background: #f0f0f0; border-radius: 999px; overflow: hidden; }
        .cov-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #60a5fa); border-radius: 999px; transition: width 1s ease; }
        .cov-pct { font-size: 0.85rem; font-weight: 800; color: #2563eb; white-space: nowrap; }

        /* ── Error ── */
        .error-banner {
          display: flex; align-items: flex-start; gap: 16px;
          background: #fff5f5; border: 1px solid #fecaca; border-radius: 16px;
          padding: 20px 24px; margin-bottom: 32px; color: #991b1b;
        }
        .error-banner strong { display: block; margin-bottom: 4px; font-size: 0.95rem; }
        .error-banner p { margin: 0; font-size: 0.82rem; color: #b91c1c; }
        .btn-retry {
          margin-left: auto; flex-shrink: 0; padding: 8px 18px; border-radius: 10px;
          background: #dc2626; color: #fff; border: none; cursor: pointer;
          font-weight: 600; font-size: 0.85rem; transition: background 0.2s;
        }
        .btn-retry:hover { background: #b91c1c; }

        /* ── Loading ── */
        .loading-container { text-align: center; padding: 80px 0; color: #86868b; }
        .sdg-spinner { width: 36px; height: 36px; border: 3px solid #e5e5e5; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Main layout ── */
        .dashboard-content { padding: 48px 0; }
        .layout-grid { display: grid; grid-template-columns: 1fr 400px; gap: 48px; align-items: start; }
        .left-col { display: flex; flex-direction: column; gap: 32px; }

        /* ── Mosaic ── */
        .mosaic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 14px; }
        .mosaic-item {
          aspect-ratio: 1; padding: 0; border: none; border-radius: 16px;
          overflow: hidden; cursor: pointer; position: relative;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .mosaic-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .mosaic-item:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 36px rgba(0,0,0,0.11); z-index: 10; }
        .mosaic-item:hover img { transform: scale(1.08); }
        .mosaic-item.active { transform: translateY(-6px) scale(1.04); outline: 4px solid var(--sdg-color); outline-offset: 3px; box-shadow: 0 16px 36px rgba(0,0,0,0.14); z-index: 11; }
        .mosaic-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .goal-num { font-size: 28px; font-weight: 900; color: white; opacity: 0; transform: scale(0.5); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
        .mosaic-item:hover .mosaic-overlay { background: rgba(0,0,0,0.28); }
        .mosaic-item:hover .goal-num { opacity: 1; transform: scale(1); }
        .project-badge { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.62); color: #fff; font-size: 0.63rem; font-weight: 800; padding: 2px 6px; border-radius: 999px; line-height: 1.4; backdrop-filter: blur(4px); pointer-events: none; }

        /* ── Chart ── */
        .chart-card { background: #fff; border-radius: 20px; border: 1px solid #e5e5e5; padding: 20px 20px 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .chart-title { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #86868b; margin: 0 0 16px; }

        /* ── Info panel ── */
        .info-section { position: sticky; top: 120px; }
        @keyframes cardAppear { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .goal-detail-card { background: #fff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e5e5; box-shadow: 0 4px 32px rgba(0,0,0,0.07); animation: cardAppear 0.3s ease; }
        .card-accent { display: flex; align-items: center; gap: 20px; padding: 28px 28px 24px; }
        .card-accent-icon { width: 68px; height: 68px; border-radius: 14px; background: rgba(255,255,255,0.22); padding: 6px; object-fit: contain; flex-shrink: 0; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
        .card-goal-num { display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; color: rgba(255,255,255,0.75); margin-bottom: 4px; }
        .card-goal-name { margin: 0; font-size: 1.45rem; font-weight: 800; color: #fff; line-height: 1.15; letter-spacing: -0.02em; }
        .card-body { padding: 24px 28px 28px; }
        .goal-description { font-size: 0.92rem; line-height: 1.7; color: #555; margin: 0 0 22px; }

        /* Stats boxes */
        .goal-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
        .stat-box { border-radius: 16px; border: 1.5px solid transparent; padding: 14px 10px 12px; text-align: center; }
        .stat-val { display: block; font-size: 1.65rem; font-weight: 800; line-height: 1; margin-bottom: 5px; }
        .stat-label { font-size: 0.63rem; font-weight: 700; color: #86868b; text-transform: uppercase; letter-spacing: 0.6px; }

        /* Country chips */
        .country-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
        .country-chip { font-size: 0.75rem; font-weight: 600; padding: 3px 12px; border-radius: 999px; }

        /* Sector */
        .sector-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .sector-row-label { font-size: 0.70rem; font-weight: 700; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
        .sector-chip { font-size: 0.78rem; font-weight: 700; padding: 4px 14px; border-radius: 999px; }

        .no-data-hint { font-size: 0.83rem; color: #86868b; background: #f5f5f7; border-radius: 10px; padding: 10px 16px; margin-bottom: 20px; text-align: center; }

        /* Action buttons */
        .goal-actions { display: flex; flex-direction: column; gap: 10px; }
        .btn-primary-sdg { width: 100%; padding: 14px; border-radius: 14px; color: #fff; border: none; font-weight: 700; font-size: 0.93rem; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; text-decoration: none; transition: filter 0.2s, transform 0.2s, box-shadow 0.2s; }
        .btn-primary-sdg:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.18); }
        .btn-secondary-sdg { width: 100%; padding: 12px; border-radius: 14px; background: #f5f5f7; color: #444; border: 1.5px solid #e5e5e5; font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; text-decoration: none; transition: all 0.2s; }
        .btn-secondary-sdg:hover { background: #fff; border-color: #d2d2d7; }

        .empty-state { text-align: center; padding: 60px 32px; background: #fff; border-radius: 24px; border: 2px dashed #e5e5e5; color: #86868b; }
        .empty-state h3 { color: #1d1d1f; margin: 20px 0 10px; font-weight: 700; }
        .btn-link { background: none; border: none; color: #2563eb; font-weight: 600; text-decoration: underline; cursor: pointer; margin-top: 16px; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .layout-grid { grid-template-columns: 1fr; }
          .info-section { position: static; order: -1; margin-bottom: 32px; }
        }
        @media (max-width: 640px) {
          .title-section h1 { font-size: 1.2rem; }
          .search-pill { width: 100%; }
          .mosaic-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; }
        }

        /* ── Dark mode ── */
        [data-theme="dark"] .sdg-dashboard { background: #0f172a; color: #f1f5f9; }
        [data-theme="dark"] .dashboard-header { background: #1e293b; border-bottom-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .breadcrumb { color: #64748b; }
        [data-theme="dark"] .search-pill { background: rgba(255,255,255,0.07); }
        [data-theme="dark"] .search-pill:focus-within { background: #1e293b; border-color: #3b82f6; }
        [data-theme="dark"] .search-pill input { color: #f1f5f9; }
        [data-theme="dark"] .btn-icon { background: #1e293b; border-color: rgba(255,255,255,0.1); color: #94a3b8; }
        [data-theme="dark"] .btn-icon:hover { background: rgba(255,255,255,0.07); }
        [data-theme="dark"] .sort-dropdown { background: #1e293b; border-color: rgba(255,255,255,0.08); }
        [data-theme="dark"] .sort-opt { color: #cbd5e1; }
        [data-theme="dark"] .sort-opt:hover { background: rgba(255,255,255,0.06); }
        [data-theme="dark"] .sort-opt.active { background: rgba(59,130,246,0.15); color: #60a5fa; }
        [data-theme="dark"] .coverage-banner { background: #1e293b; border-bottom-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .cov-val { color: #f1f5f9; }
        [data-theme="dark"] .cov-divider { background: rgba(255,255,255,0.08); }
        [data-theme="dark"] .cov-progress { background: rgba(255,255,255,0.1); }
        [data-theme="dark"] .chart-card { background: #1e293b; border-color: rgba(255,255,255,0.07); }
        [data-theme="dark"] .chart-title { color: #64748b; }
        [data-theme="dark"] .goal-detail-card { background: #1e293b; border-color: rgba(255,255,255,0.07); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        [data-theme="dark"] .goal-description { color: #94a3b8; }
        [data-theme="dark"] .stat-box { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; }
        [data-theme="dark"] .stat-label { color: #64748b; }
        [data-theme="dark"] .sector-row-label { color: #64748b; }
        [data-theme="dark"] .no-data-hint { background: rgba(255,255,255,0.04); color: #64748b; }
        [data-theme="dark"] .btn-secondary-sdg { background: rgba(255,255,255,0.07); color: #cbd5e1; border-color: rgba(255,255,255,0.1); }
        [data-theme="dark"] .btn-secondary-sdg:hover { background: rgba(255,255,255,0.12); }
        [data-theme="dark"] .empty-state { background: #1e293b; border-color: rgba(255,255,255,0.08); color: #64748b; }
        [data-theme="dark"] .empty-state h3 { color: #f1f5f9; }
        [data-theme="dark"] .error-banner { background: rgba(220,38,38,0.1); border-color: rgba(220,38,38,0.3); color: #fca5a5; }
        [data-theme="dark"] .error-banner p { color: #f87171; }
      `}</style>
    </div>
  )
}

export default SDGDirectory
