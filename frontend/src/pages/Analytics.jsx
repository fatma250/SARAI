import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { FaProjectDiagram, FaBuilding, FaGlobeAmericas, FaRocket, FaSyncAlt, FaFilePdf, FaSpinner } from 'react-icons/fa'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import StatKpiTile from '../components/statistics/StatKpiTile'
import KeySignals from '../components/statistics/KeySignals'
import DonutBreakdown from '../components/statistics/DonutBreakdown'
import RankedBarList from '../components/statistics/RankedBarList'
import CountryLeaderboard from '../components/statistics/CountryLeaderboard'
import ProjectsTimeline from '../components/statistics/ProjectsTimeline'
import { cleanSectors, cleanOrgTypes, cleanTechnologies, computeSignals } from '../utils/analyticsTransform'
import { CHART_COLORS_LIGHT, CHART_COLORS_DARK } from '../styles/chartColors'
import '../styles/statistics-tokens.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/* ══════════════════════════════════════════ */
function Analytics() {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const colors = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT

  const [overview,            setOverview]            = useState(null)
  const [projectsByCountry,   setProjectsByCountry]   = useState([])
  const [projectsBySector,    setProjectsBySector]    = useState([])
  const [aiTech,              setAiTech]              = useState([])
  const [timeline,            setTimeline]            = useState([])
  const [stakeholdersByType,  setStakeholdersByType]  = useState([])
  const [stakeholdersByCountry, setStakeholdersByCountry] = useState([])
  const [loading,             setLoading]             = useState(true)
  const [downloading,         setDownloading]         = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [ov, pbc, pbs, ait, tl, sbt, sbc] = await Promise.all([
        fetch(`${API_BASE}/api/analytics/overview`).then(r => r.json()),
        fetch(`${API_BASE}/api/analytics/projects-by-country`).then(r => r.json()),
        fetch(`${API_BASE}/api/analytics/projects-by-sector`).then(r => r.json()),
        fetch(`${API_BASE}/api/analytics/ai-technologies`).then(r => r.json()),
        fetch(`${API_BASE}/api/analytics/projects-timeline`).then(r => r.json()),
        fetch(`${API_BASE}/api/analytics/stakeholders-by-type`).then(r => r.json()),
        fetch(`${API_BASE}/api/analytics/stakeholders-by-country`).then(r => r.json()),
      ])
      setOverview(ov); setProjectsByCountry(pbc); setProjectsBySector(pbs)
      setAiTech(ait); setTimeline(tl); setStakeholdersByType(sbt); setStakeholdersByCountry(sbc)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  const downloadReport = async () => {
    try {
      setDownloading(true)
      toast.info('Generating PDF, please wait…', { autoClose: 8000 })

      const res = await fetch(`${API_BASE}/api/analytics/report`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const html = await res.text()

      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;top:0;left:-9999px;width:960px;background:#fff;z-index:-1;'
      container.innerHTML = html
      const noPrint = container.querySelector('.no-print')
      if (noPrint) noPrint.style.display = 'none'
      document.body.appendChild(container)

      await new Promise(r => setTimeout(r, 600))

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 960,
        windowWidth: 960,
      })
      document.body.removeChild(container)

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW  = pdf.internal.pageSize.getWidth()
      const pageH  = pdf.internal.pageSize.getHeight()
      const imgH   = (canvas.height * pageW) / canvas.width
      const imgData = canvas.toDataURL('image/png')

      let yLeft = imgH
      let yPos  = 0
      pdf.addImage(imgData, 'PNG', 0, yPos, pageW, imgH)
      yLeft -= pageH

      while (yLeft > 0) {
        yPos -= pageH
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, yPos, pageW, imgH)
        yLeft -= pageH
      }

      pdf.save(`SARAI_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success('PDF downloaded!')
    } catch (e) {
      console.error(e)
      toast.error(`Export failed: ${e.message}`)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: isDark ? '#050b18' : '#f8fafc', color: isDark ? '#f1f5f9' : '#1e293b', gap:20, fontFamily:"'Outfit',sans-serif" }}>
      <div style={{ position:'relative', width:56, height:56 }}>
        <div style={{ position:'absolute', inset:0, border:`2px solid ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.2)'}`, borderRadius:'50%' }} />
        <div style={{ position:'absolute', inset:0, border:'2px solid transparent', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'_spin 0.75s linear infinite', boxShadow:'0 0 24px rgba(59,130,246,0.35)' }} />
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#64748b' }}>{t('analytics.loadingTitle')}</p>
        <p style={{ margin:'4px 0 0', fontSize:12, color: isDark ? '#334155' : '#94a3b8' }}>{t('analytics.loadingSubtitle')}</p>
      </div>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ── Clean + shape data for the new statistics components ──
  const sectors = cleanSectors(projectsBySector, 6, t('analytics.otherSectors')).map(d => ({ name: d.sector, value: d.count, isOther: d.isOther }))
  const orgTypesClean = cleanOrgTypes(stakeholdersByType, 6, t('analytics.otherTypes')).map(d => ({ name: d.type, value: d.count, isOther: d.isOther }))
  const technologies = cleanTechnologies(aiTech)
  const techTop = technologies.slice(0, 8).map(d => ({ label: d.technology, value: d.count }))
  const techRest = technologies.slice(8)
  const techFootnote = techRest.length > 0
    ? `+ ${techRest.length}: ${techRest.map(d => d.technology).join(', ')}`
    : null

  const countries = [...projectsByCountry]
    .sort((a, b) => b.projects - a.projects)
    .map(d => ({ name: d.country, value: d.projects }))

  const orgCountries = [...stakeholdersByCountry]
    .sort((a, b) => b.stakeholders - a.stakeholders)
    .map(d => ({ label: d.country, value: d.stakeholders }))

  const ongoingPct = overview.total_projects ? (overview.ongoing_projects_count / overview.total_projects) * 100 : 0
  const completedPct = overview.total_projects ? (overview.completed_projects_count / overview.total_projects) * 100 : 0
  const otherPct = Math.max(0, 100 - ongoingPct - completedPct)

  // ── Headline signals (plain-language takeaways from the raw numbers) ──
  const rawSignals = computeSignals({
    overview, sectors: projectsBySector, technologies: aiTech, orgTypes: stakeholdersByType,
  })
  const signalCopy = rawSignals.map(s => {
    if (s.type === 'org-dominance') {
      return {
        color: colors.series1,
        text: s.ratio
          ? t('analytics.signalOrgDominanceRatio', { topType: s.topType, pct: s.pct, ratio: s.ratio, secondType: s.secondType })
          : t('analytics.signalOrgDominance', { topType: s.topType, pct: s.pct }),
      }
    }
    if (s.type === 'tech-leader') {
      return {
        color: colors.series3,
        text: s.second
          ? t('analytics.signalTechLeaderWithSecond', { name: s.name, count: s.count, pct: s.pct, second: s.second.technology, secondCount: s.second.count })
          : t('analytics.signalTechLeader', { name: s.name, count: s.count, pct: s.pct }),
      }
    }
    if (s.type === 'sector-concentration') {
      return {
        color: colors.series2,
        text: t('analytics.signalSectorConcentration', { pct: s.pct, sectors: s.sectors.join(', '), total: s.total }),
      }
    }
    return null
  }).filter(Boolean)

  return (
    <div className="ap-root stat-page">

      {/* Ambient orbs */}
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />

      {/* ── HEADER ── */}
      <header className="ap-header">
        <div className="ap-wrap">
          <div className="ap-header-row">
            <div>
              <span className="live-chip">
                <span className="live-pulse" />{t('analytics.liveData')}
              </span>
              <h1 className="ap-title">
                {t('analytics.title')} <span className="grad-text">{t('analytics.titleAccent')}</span>
              </h1>
              <p className="ap-sub">
                {t('analytics.subtitle')}
              </p>
            </div>
            <div style={{ display:'flex', gap:10, position:'relative', zIndex:10 }}>
              <button className="ap-refresh" onClick={fetchAll}>
                <FaSyncAlt style={{ fontSize:13 }} /> {t('analytics.refresh')}
              </button>
              <button
                className="ap-download"
                onClick={downloadReport}
                disabled={downloading}
                type="button"
              >
                {downloading
                  ? <FaSpinner className="ap-spin" size={13} />
                  : <FaFilePdf size={13} />}
                {downloading ? t('analytics.generatingPdf') : t('analytics.exportPdf')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="ap-wrap ap-main">

        {/* Headline signals */}
        {signalCopy.length > 0 && <KeySignals signals={signalCopy} />}

        {/* KPI row */}
        <div className="kpi-row-4">
          <StatKpiTile
            icon={<FaProjectDiagram />}
            accent="var(--stat-series-1)"
            label={t('analytics.totalProjects')}
            value={overview.total_projects ?? '—'}
            context={t('analytics.allCategories')}
          />
          <StatKpiTile
            icon={<FaBuilding />}
            accent="var(--stat-series-3)"
            label={t('analytics.verifiedStakeholders')}
            value={overview.total_stakeholders ?? '—'}
            context={t('analytics.verified')}
          />
          <StatKpiTile
            icon={<FaGlobeAmericas />}
            accent="var(--stat-series-2)"
            label={t('analytics.nationsCoverage')}
            value={`${overview.total_countries_active ?? '—'}/22`}
            context={t('analytics.arabLeagueCoverage')}
          />
          <StatKpiTile
            icon={<FaRocket />}
            accent="var(--stat-series-4)"
            label={t('analytics.activeRD')}
            value={overview.ongoing_projects_count ?? '—'}
            context={<>{t('analytics.ongoing')} ({Math.round(ongoingPct)}%)</>}
            meter={[
              { pct: ongoingPct, color: colors.series1, label: t('analytics.ongoing') },
              { pct: completedPct, color: colors.series3, label: t('analytics.completed') },
              { pct: otherPct, color: colors.other },
            ]}
          />
        </div>

        {/* Charts grid */}
        <div className="cg-2col">

          <div className="stat-card stat-span-2">
            <div className="stat-card-head">
              <div>
                <h3 className="stat-card-title">{t('analytics.launchTimeline')}</h3>
                <p className="stat-card-sub">{t('analytics.launchTimelineSub')}</p>
              </div>
              <span className="stat-badge">{t('analytics.trendBadge')}</span>
            </div>
            <ProjectsTimeline
              data={timeline.map(d => ({ year: d.year, count: d.projects }))}
              partialYear={new Date().getFullYear()}
              colors={colors}
            />
          </div>

          <div className="stat-card">
            <div className="stat-card-head">
              <div>
                <h3 className="stat-card-title">{t('analytics.sectorDistribution')}</h3>
                <p className="stat-card-sub">{t('analytics.sectorDistributionSub')}</p>
              </div>
            </div>
            <DonutBreakdown data={sectors} totalLabel={t('analytics.total')} />
          </div>

          <div className="stat-card">
            <div className="stat-card-head">
              <div>
                <h3 className="stat-card-title">{t('analytics.orgTypeDistribution')}</h3>
                <p className="stat-card-sub">{t('analytics.orgTypeDistributionSub')}</p>
              </div>
            </div>
            <DonutBreakdown data={orgTypesClean} totalLabel={t('analytics.total')} />
          </div>

          <div className="stat-card stat-span-2">
            <div className="stat-card-head">
              <div>
                <h3 className="stat-card-title">{t('analytics.projectsByCountry')}</h3>
                <p className="stat-card-sub">{t('analytics.projectsByCountrySub')}</p>
              </div>
              <span className="stat-badge">{t('analytics.rankedBadge')}</span>
            </div>
            <CountryLeaderboard data={countries} accent={colors.series1} />
          </div>

          <div className="stat-card">
            <div className="stat-card-head">
              <div>
                <h3 className="stat-card-title">{t('analytics.techStack')}</h3>
                <p className="stat-card-sub">{t('analytics.techStackSub')}</p>
              </div>
            </div>
            <RankedBarList data={techTop} accent={colors.series1} footnote={techFootnote} />
          </div>

          <div className="stat-card">
            <div className="stat-card-head">
              <div>
                <h3 className="stat-card-title">{t('analytics.orgByCountry')}</h3>
                <p className="stat-card-sub">{t('analytics.orgByCountrySub')}</p>
              </div>
            </div>
            <RankedBarList data={orgCountries} accent={colors.series3} />
          </div>

        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .ap-root {
          background: var(--stat-page-bg);
          min-height: 100vh;
          font-family: 'Outfit', sans-serif;
          color: var(--stat-text-primary);
          padding-bottom: 100px;
          position: relative;
          overflow-x: hidden;
        }

        .ap-wrap { max-width: 1380px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 1; }

        .orb { position: fixed; border-radius: 50%; filter: blur(110px); pointer-events: none; z-index: 0; }
        .orb-a { width: 700px; height: 700px; background: rgba(59,130,246,0.07);  top: -250px; left: -150px; }
        .orb-b { width: 550px; height: 550px; background: rgba(139,92,246,0.06);  bottom: -100px; right: -100px; }
        .orb-c { width: 450px; height: 450px; background: rgba(6,182,212,0.045); top: 40%; left: 50%; transform: translate(-50%,-50%); }

        .ap-header {
          padding: 52px 0 40px;
          border-bottom: 1px solid var(--stat-border);
          margin-bottom: 32px;
          position: relative; z-index: 1;
        }

        .ap-header-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }

        .live-chip {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.22);
          color: #10b981; font-size: 10px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.12em; padding: 5px 12px; border-radius: 100px; margin-bottom: 16px;
        }

        .live-pulse {
          width: 6px; height: 6px; background: #10b981; border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          animation: _pulse 1.6s ease-in-out infinite;
        }

        @keyframes _pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.75)} }

        .ap-title {
          font-size: 3rem; font-weight: 900; letter-spacing: -0.045em;
          margin: 0 0 10px; line-height: 1.1; color: var(--stat-text-primary);
        }

        .grad-text {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .ap-sub { font-size: 0.9rem; color: var(--stat-text-secondary); margin: 0; font-weight: 500; }

        .ap-refresh {
          display: flex; align-items: center; gap: 8px;
          background: var(--stat-surface-1); border: 1px solid var(--stat-border);
          color: var(--stat-text-secondary); padding: 10px 20px; border-radius: 12px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s ease; font-family: 'Outfit', sans-serif; flex-shrink: 0;
        }
        .ap-refresh:hover { background: var(--stat-surface-2); color: var(--stat-text-primary); transform: translateY(-2px); }

        .ap-download {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #1e40af, #059669);
          border: none; color: #fff; padding: 10px 20px; border-radius: 12px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s ease; font-family: 'Outfit', sans-serif; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(30,64,175,0.3);
          position: relative; z-index: 10; pointer-events: auto;
        }
        .ap-download:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(30,64,175,0.4); }
        .ap-download:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .ap-spin { animation: _spin 0.7s linear infinite; }
        @keyframes _spin{to{transform:rotate(360deg)}}

        .ap-main { padding-top: 4px; }

        .kpi-row-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        .cg-2col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

        @media (max-width: 1200px) {
          .kpi-row-4 { grid-template-columns: repeat(2,1fr); }
          .cg-2col { grid-template-columns: 1fr; }
          .cg-2col .stat-span-2 { grid-column: span 1; }
        }
        @media (max-width: 640px) {
          .kpi-row-4 { grid-template-columns: 1fr; }
          .ap-title { font-size: 2rem; }
          .ap-wrap { padding: 0 20px; }
          .ap-header-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}

export default Analytics
