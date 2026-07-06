import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts'
import { FaProjectDiagram, FaBuilding, FaGlobeAmericas, FaRocket, FaSyncAlt, FaFilePdf, FaSpinner } from 'react-icons/fa'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const C = {
  blue:   '#3b82f6',
  indigo: '#6366f1',
  purple: '#8b5cf6',
  cyan:   '#06b6d4',
  green:  '#10b981',
  amber:  '#f59e0b',
  pink:   '#ec4899',
  orange: '#f97316',
  chart:  ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ec4899','#f97316','#6366f1']
}

/* ── Animated counter ── */
function useCounter(target) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const n = parseInt(target)
    if (!n || isNaN(n)) return
    let cur = 0
    const step = Math.max(1, Math.ceil(n / 55))
    const id = setInterval(() => {
      cur = Math.min(cur + step, n)
      setVal(cur)
      if (cur >= n) clearInterval(id)
    }, 20)
    return () => clearInterval(id)
  }, [target])
  return val
}

/* ── Dark glass tooltip ── */
function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(5,11,24,0.95)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
      padding: '12px 18px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
    }}>
      <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</p>
      <div style={{ height:1, background:'rgba(255,255,255,0.06)', marginBottom:8 }} />
      {payload.map((e, i) => (
        <p key={i} style={{ margin:'3px 0', fontSize:13, color:e.color, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:e.color, display:'inline-block', boxShadow:`0 0 8px ${e.color}` }} />
          {e.name}: <strong style={{ color:'#f1f5f9', marginLeft:2 }}>{e.value}</strong>
        </p>
      ))}
    </div>
  )
}

/* ── KPI Card ── */
function KPICard({ label, rawValue, icon, color, trend, delay, isString }) {
  const counted = useCounter(isString ? 0 : rawValue)
  const display = isString ? rawValue : (rawValue ? counted.toLocaleString() : '—')

  return (
    <div className="kpi-glass" style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-top-bar" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="kpi-body">
        <div className="kpi-icon" style={{ background:`${color}18`, color, boxShadow:`0 0 24px ${color}22` }}>
          {icon}
        </div>
        <div className="kpi-text">
          <p className="kpi-label">{label}</p>
          <div className="kpi-value-row">
            <span className="kpi-number">{display}</span>
            <span className="kpi-badge" style={{ background:`${color}1a`, color }}>{trend}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════ */
function Analytics() {
  const { t } = useTranslation()
  const { isDark } = useTheme()
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

      // Fetch the HTML report from the backend
      const res = await fetch(`${API_BASE}/api/analytics/report`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const html = await res.text()

      // Render HTML in an off-screen container
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;top:0;left:-9999px;width:960px;background:#fff;z-index:-1;'
      container.innerHTML = html
      // Hide the in-page print button so it doesn't appear in PDF
      const noPrint = container.querySelector('.no-print')
      if (noPrint) noPrint.style.display = 'none'
      document.body.appendChild(container)

      // Let fonts & layout settle
      await new Promise(r => setTimeout(r, 600))

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 960,
        windowWidth: 960,
      })
      document.body.removeChild(container)

      // Build PDF (A4)
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

  const maxTech = aiTech[0]?.count || 1

  return (
    <div className="ap-root">

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
                {downloading ? 'Generating…' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="ap-wrap ap-main">

        {/* KPI row */}
        <div className="kpi-row">
          <KPICard label={t('analytics.totalProjects')}      rawValue={overview?.total_projects}      icon={<FaProjectDiagram />} color={C.blue}   trend={t('analytics.trendActive')} delay={0}   />
          <KPICard label={t('analytics.verifiedStakeholders')}  rawValue={overview?.total_stakeholders}   icon={<FaBuilding />}       color={C.purple} trend="↑ 5%"    delay={80}  />
          <KPICard label={t('analytics.nationsCoverage')}       rawValue={`${overview?.total_countries_active ?? '—'}/22`} isString icon={<FaGlobeAmericas />} color={C.cyan}  trend="98%"  delay={160} />
          <KPICard label={t('analytics.activeRD')} rawValue={overview?.ongoing_projects_count} icon={<FaRocket />}       color={C.green}  trend={t('analytics.trendHigh')}    delay={240} />
        </div>

        {/* Charts grid */}
        <div className="cg">

          {/* Timeline — 2 cols */}
          <div className="gc gc-2 anim-up" style={{ animationDelay:'80ms' }}>
            <div className="gc-hd">
              <div>
                <h3 className="gc-title">{t('analytics.launchTimeline')}</h3>
                <p className="gc-sub">{t('analytics.launchTimelineSub')}</p>
              </div>
              <span className="gc-badge" style={{ background:`${C.blue}1a`, color:C.blue }}>{t('analytics.trendBadge')}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeline} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.blue} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:12, fontWeight:600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:12 }} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="projects" stroke={C.blue} strokeWidth={2.5} fill="url(#ag)" name="Projects" dot={false}
                  activeDot={{ r:6, fill:C.blue, stroke:'#050b18', strokeWidth:2 }}
                  style={{ filter:`drop-shadow(0 0 8px ${C.blue}66)` }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sector donut — 1 col */}
          <div className="gc anim-up" style={{ animationDelay:'120ms' }}>
            <div className="gc-hd">
              <div>
                <h3 className="gc-title">{t('analytics.sectorDistribution')}</h3>
                <p className="gc-sub">{t('analytics.sectorDistributionSub')}</p>
              </div>
            </div>
            <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={projectsBySector} cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={4} dataKey="count" nameKey="sector" stroke="none">
                    {projectsBySector.map((_, i) => (
                      <Cell key={i} fill={C.chart[i % C.chart.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', textAlign:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:26, fontWeight:900, color:'#f1f5f9', lineHeight:1 }}>{overview?.total_projects ?? 0}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:4 }}>{t('analytics.total')}</div>
              </div>
            </div>
            <div className="donut-leg">
              {projectsBySector.slice(0, 5).map((e, i) => (
                <div key={i} className="dleg-row">
                  <span className="dleg-dot" style={{ background:C.chart[i % C.chart.length], boxShadow:`0 0 8px ${C.chart[i % C.chart.length]}55` }} />
                  <span className="dleg-name">{e.sector}</span>
                  <span className="dleg-val">{e.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Country bars — 2 cols */}
          <div className="gc gc-2 anim-up" style={{ animationDelay:'160ms' }}>
            <div className="gc-hd">
              <div>
                <h3 className="gc-title">{t('analytics.projectsByCountry')}</h3>
                <p className="gc-sub">{t('analytics.projectsByCountrySub')}</p>
              </div>
              <span className="gc-badge" style={{ background:`${C.indigo}1a`, color:C.indigo }}>{t('analytics.rankedBadge')}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectsByCountry} margin={{ top:8, right:8, left:-20, bottom:60 }}>
                <defs>
                  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.indigo} stopOpacity={1} />
                    <stop offset="100%" stopColor={C.blue}   stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="country" axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:10, fontWeight:600 }} interval={0} angle={-40} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:12 }} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill:'rgba(255,255,255,0.025)' }} />
                <Bar dataKey="projects" fill="url(#bg)" radius={[6,6,0,0]} maxBarSize={34} name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tech stack — 1 col */}
          <div className="gc anim-up" style={{ animationDelay:'200ms' }}>
            <div className="gc-hd" style={{ marginBottom:20 }}>
              <div>
                <h3 className="gc-title">{t('analytics.techStack')}</h3>
                <p className="gc-sub">{t('analytics.techStackSub')}</p>
              </div>
            </div>
            <div className="tech-list">
              {aiTech.slice(0, 9).map((tech, i) => {
                const pct  = Math.round((tech.count / maxTech) * 100)
                const color = C.chart[i % C.chart.length]
                return (
                  <div key={i} className="tech-item">
                    <div className="tech-meta">
                      <span className="tech-rank">#{i+1}</span>
                      <span className="tech-name">{tech.technology}</span>
                      <span className="tech-count" style={{ color }}>{tech.count}</span>
                    </div>
                    <div className="tech-track">
                      <div className="tech-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}77)`, boxShadow:`0 0 10px ${color}44` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stakeholder types donut */}
          <div className="gc anim-up" style={{ animationDelay:'240ms' }}>
            <div className="gc-hd">
              <div>
                <h3 className="gc-title">Organizations by Type</h3>
                <p className="gc-sub">Breakdown of registered stakeholders</p>
              </div>
            </div>
            <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={stakeholdersByType} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={4} dataKey="count" nameKey="type" stroke="none">
                    {stakeholdersByType.map((_, i) => (
                      <Cell key={i} fill={C.chart[i % C.chart.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', textAlign:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:22, fontWeight:900, color:'#f1f5f9', lineHeight:1 }}>{overview?.total_stakeholders ?? 0}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:4 }}>Total</div>
              </div>
            </div>
            <div className="donut-leg">
              {stakeholdersByType.slice(0, 5).map((e, i) => (
                <div key={i} className="dleg-row">
                  <span className="dleg-dot" style={{ background:C.chart[i % C.chart.length], boxShadow:`0 0 8px ${C.chart[i % C.chart.length]}55` }} />
                  <span className="dleg-name">{e.type}</span>
                  <span className="dleg-val">{e.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stakeholders by country */}
          <div className="gc gc-2 anim-up" style={{ animationDelay:'280ms' }}>
            <div className="gc-hd">
              <div>
                <h3 className="gc-title">Organizations by Country</h3>
                <p className="gc-sub">Top countries by registered stakeholders</p>
              </div>
              <span className="gc-badge" style={{ background:`${C.green}1a`, color:C.green }}>Stakeholders</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stakeholdersByCountry} margin={{ top:8, right:8, left:-20, bottom:60 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.green}  stopOpacity={1} />
                    <stop offset="100%" stopColor={C.cyan}   stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="country" axisLine={false} tickLine={false}
                  tick={{ fill:'#475569', fontSize:10, fontWeight:600 }}
                  interval={0} angle={-38} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:12 }} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill:'rgba(255,255,255,0.025)' }} />
                <Bar dataKey="stakeholders" fill="url(#sg)" radius={[6,6,0,0]} maxBarSize={32} name="Organizations" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>{/* /cg */}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

        /* ── Root ── */
        .ap-root {
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Outfit', sans-serif;
          color: #1e293b;
          padding-bottom: 100px;
          position: relative;
          overflow-x: hidden;
        }
        [data-theme="dark"] .ap-root {
          background: #050b18;
          color: #f1f5f9;
        }

        .ap-wrap { max-width: 1380px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 1; }

        /* ── Ambient orbs ── */
        .orb { position: fixed; border-radius: 50%; filter: blur(110px); pointer-events: none; z-index: 0; }
        .orb-a { width: 700px; height: 700px; background: rgba(59,130,246,0.07);  top: -250px; left: -150px; }
        .orb-b { width: 550px; height: 550px; background: rgba(139,92,246,0.06);  bottom: -100px; right: -100px; }
        .orb-c { width: 450px; height: 450px; background: rgba(6,182,212,0.045); top: 40%; left: 50%; transform: translate(-50%,-50%); }

        /* ── Header ── */
        .ap-header {
          padding: 52px 0 40px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 40px;
          position: relative; z-index: 1;
        }
        [data-theme="dark"] .ap-header { border-bottom-color: rgba(255,255,255,0.05); }

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
          margin: 0 0 10px; line-height: 1.1; color: #0f172a;
        }
        [data-theme="dark"] .ap-title { color: #f1f5f9; }

        .grad-text {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .ap-sub { font-size: 0.9rem; color: #475569; margin: 0; font-weight: 500; }

        .ap-refresh {
          display: flex; align-items: center; gap: 8px;
          background: #fff; border: 1px solid #e2e8f0;
          color: #64748b; padding: 10px 20px; border-radius: 12px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s ease; font-family: 'Outfit', sans-serif; flex-shrink: 0;
        }
        .ap-refresh:hover { background: #f1f5f9; color: #1e293b; transform: translateY(-2px); border-color: #cbd5e1; }
        [data-theme="dark"] .ap-refresh { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: #64748b; }
        [data-theme="dark"] .ap-refresh:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; border-color: rgba(255,255,255,0.12); }

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

        .ap-main { padding-top: 4px; }

        /* ── KPI ── */
        .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 24px; }

        .kpi-glass {
          position: relative; overflow: hidden;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px; padding: 24px;
          backdrop-filter: blur(16px);
          animation: _up 0.5s ease both;
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .kpi-glass:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-5px); box-shadow: 0 24px 48px rgba(0,0,0,0.1); }
        [data-theme="dark"] .kpi-glass { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07); box-shadow: none; }
        [data-theme="dark"] .kpi-glass:hover { background: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.12); box-shadow: 0 24px 48px rgba(0,0,0,0.35); }

        .kpi-top-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; }

        .kpi-body { display: flex; align-items: flex-start; gap: 16px; }

        .kpi-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }

        .kpi-text { flex: 1; min-width: 0; }

        .kpi-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px; }

        .kpi-value-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }

        .kpi-number { font-size: 2rem; font-weight: 900; color: #0f172a; letter-spacing: -0.04em; line-height: 1; }
        [data-theme="dark"] .kpi-label { color: #475569; }
        [data-theme="dark"] .kpi-number { color: #f1f5f9; }

        .kpi-badge { font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 100px; letter-spacing: 0.04em; }

        /* ── Charts grid ── */
        .cg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

        .gc {
          background: #fff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border-radius: 24px; padding: 28px;
          backdrop-filter: blur(16px);
          transition: all 0.25s ease;
        }
        .gc:hover { background: #f8fafc; border-color: #cbd5e1; }
        [data-theme="dark"] .gc { background: rgba(255,255,255,0.025); border-color: rgba(255,255,255,0.055); box-shadow: none; }
        [data-theme="dark"] .gc:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.09); }
        .gc-2 { grid-column: span 2; }

        .gc-hd { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }

        .gc-title { font-size: 1.05rem; font-weight: 800; color: #1e293b; margin: 0 0 4px; letter-spacing: -0.02em; }
        .gc-sub { font-size: 11px; color: #64748b; margin: 0; font-weight: 500; }
        [data-theme="dark"] .gc-title { color: #e2e8f0; }
        [data-theme="dark"] .gc-sub { color: #475569; }

        .gc-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 11px; border-radius: 100px; white-space: nowrap; }

        /* Donut legend */
        .donut-leg { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }
        .dleg-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
        .dleg-dot { width: 8px; height: 8px; border-radius: 3px; flex-shrink: 0; }
        .dleg-name { flex: 1; color: #64748b; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dleg-val { color: #1e293b; font-weight: 800; font-size: 13px; }
        [data-theme="dark"] .dleg-val { color: #e2e8f0; }

        /* Tech */
        .tech-list { display: flex; flex-direction: column; gap: 13px; }
        .tech-item { display: flex; flex-direction: column; gap: 5px; }
        .tech-meta { display: flex; align-items: center; gap: 10px; }
        .tech-rank { width: 26px; height: 20px; background: #f1f5f9; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #64748b; flex-shrink: 0; }
        .tech-name { flex: 1; color: #475569; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tech-count { font-size: 13px; font-weight: 800; }
        .tech-track { height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
        [data-theme="dark"] .tech-rank { background: rgba(255,255,255,0.05); color: #475569; }
        [data-theme="dark"] .tech-name { color: #94a3b8; }
        [data-theme="dark"] .tech-track { background: rgba(255,255,255,0.05); }
        .tech-fill { height: 100%; border-radius: 2px; transition: width 1.2s cubic-bezier(.4,0,.2,1); }

        /* Animations */
        .anim-up { animation: _up 0.5s ease both; }
        @keyframes _up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

        /* Responsive */
        @media (max-width: 1200px) {
          .kpi-row { grid-template-columns: repeat(2,1fr); }
          .cg { grid-template-columns: 1fr; }
          .gc-2 { grid-column: span 1; }
        }
        @media (max-width: 640px) {
          .kpi-row { grid-template-columns: 1fr; }
          .ap-title { font-size: 2rem; }
          .ap-wrap { padding: 0 20px; }
          .ap-header-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}

export default Analytics
