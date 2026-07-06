import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/* Mapping nom de pays (DB) → code ISO alpha-2 */
const NAME_TO_ISO = {
  'Algeria':'dz','Saudi Arabia':'sa','Bahrain':'bh','Comoros':'km','Djibouti':'dj',
  'Egypt':'eg','United Arab Emirates':'ae','Iraq':'iq','Jordan':'jo','Kuwait':'kw',
  'Lebanon':'lb','Libya':'ly','Morocco':'ma','Mauritania':'mr','Oman':'om',
  'Palestine':'ps','Qatar':'qa','Somalia':'so','Sudan':'sd','Syria':'sy',
  'Tunisia':'tn','Yemen':'ye',
}

const STATUS_META = {
  idea:       { label: 'Idée',        color: '#94a3b8' },
  prototype:  { label: 'Prototype',   color: '#60a5fa' },
  production: { label: 'Production',  color: '#10b981' },
  ongoing:    { label: 'En cours',    color: '#0891b2' },
  completed:  { label: 'Complété',    color: '#6366f1' },
  approved:   { label: 'Approuvé',    color: '#f59e0b' },
}

const W = 800
const H = 460
const GEO = { minLng: -20, maxLng: 64, minLat: -5, maxLat: 42 }
const INIT_VB = { x: -W * 0.25, y: -H * 0.25, w: W * 1.5, h: H * 1.5 }

const ARAB_MEMBERS = [
  { name: 'Algérie',             iso: 'dz' },
  { name: 'Arabie Saoudite',     iso: 'sa' },
  { name: 'Bahreïn',             iso: 'bh' },
  { name: 'Comores',             iso: 'km' },
  { name: 'Djibouti',            iso: 'dj' },
  { name: 'Égypte',              iso: 'eg' },
  { name: 'Émirats Arabes Unis', iso: 'ae' },
  { name: 'Irak',                iso: 'iq' },
  { name: 'Jordanie',            iso: 'jo' },
  { name: 'Koweït',              iso: 'kw' },
  { name: 'Liban',               iso: 'lb' },
  { name: 'Libye',               iso: 'ly' },
  { name: 'Maroc',               iso: 'ma' },
  { name: 'Mauritanie',          iso: 'mr' },
  { name: 'Oman',                iso: 'om' },
  { name: 'Palestine',           iso: 'ps' },
  { name: 'Qatar',               iso: 'qa' },
  { name: 'Somalie',             iso: 'so' },
  { name: 'Soudan',              iso: 'sd' },
  { name: 'Syrie',               iso: 'sy' },
  { name: 'Tunisie',             iso: 'tn' },
  { name: 'Yémen',               iso: 'ye' },
]

/* Statistiques clés par pays (sources : Banque mondiale / PNUD 2023) */
const COUNTRY_STATS = {
  'Algeria':              { fr: 'Algérie',             iso: 'dz', capital: 'Alger',       pop: '45,6 M', area: '2 381 741', gdp: '239 Md$',   hdi: '0.745', currency: 'Dinar algérien' },
  'Saudi Arabia':         { fr: 'Arabie Saoudite',     iso: 'sa', capital: 'Riyad',       pop: '35,9 M', area: '2 149 690', gdp: '1 061 Md$', hdi: '0.875', currency: 'Riyal saoudien' },
  'Bahrain':              { fr: 'Bahreïn',             iso: 'bh', capital: 'Manama',      pop: '1,5 M',  area: '778',       gdp: '44 Md$',    hdi: '0.875', currency: 'Dinar bahreïni' },
  'Comoros':              { fr: 'Comores',             iso: 'km', capital: 'Moroni',      pop: '0,87 M', area: '2 235',     gdp: '1,3 Md$',   hdi: '0.558', currency: 'Franc comorien' },
  'Djibouti':             { fr: 'Djibouti',            iso: 'dj', capital: 'Djibouti',   pop: '1,1 M',  area: '23 200',    gdp: '3,9 Md$',   hdi: '0.509', currency: 'Franc djiboutien' },
  'Egypt':                { fr: 'Égypte',              iso: 'eg', capital: 'Le Caire',    pop: '105 M',  area: '1 002 450', gdp: '475 Md$',   hdi: '0.728', currency: 'Livre égyptienne' },
  'United Arab Emirates': { fr: 'Émirats Arabes Unis', iso: 'ae', capital: 'Abou Dhabi',  pop: '9,9 M',  area: '83 600',    gdp: '509 Md$',   hdi: '0.911', currency: 'Dirham des EAU' },
  'Iraq':                 { fr: 'Irak',                iso: 'iq', capital: 'Bagdad',      pop: '42,2 M', area: '438 317',   gdp: '264 Md$',   hdi: '0.686', currency: 'Dinar irakien' },
  'Jordan':               { fr: 'Jordanie',            iso: 'jo', capital: 'Amman',       pop: '10,3 M', area: '89 342',    gdp: '50 Md$',    hdi: '0.736', currency: 'Dinar jordanien' },
  'Kuwait':               { fr: 'Koweït',              iso: 'kw', capital: 'Koweït',     pop: '4,2 M',  area: '17 818',    gdp: '162 Md$',   hdi: '0.831', currency: 'Dinar koweïtien' },
  'Lebanon':              { fr: 'Liban',               iso: 'lb', capital: 'Beyrouth',   pop: '5,5 M',  area: '10 452',    gdp: '23 Md$',    hdi: '0.706', currency: 'Livre libanaise' },
  'Libya':                { fr: 'Libye',               iso: 'ly', capital: 'Tripoli',    pop: '7,1 M',  area: '1 759 541', gdp: '52 Md$',    hdi: '0.718', currency: 'Dinar libyen' },
  'Morocco':              { fr: 'Maroc',               iso: 'ma', capital: 'Rabat',       pop: '37,5 M', area: '710 850',   gdp: '138 Md$',   hdi: '0.683', currency: 'Dirham marocain' },
  'Mauritania':           { fr: 'Mauritanie',          iso: 'mr', capital: 'Nouakchott',  pop: '4,5 M',  area: '1 030 700', gdp: '10,5 Md$',  hdi: '0.540', currency: 'Ouguiya' },
  'Oman':                 { fr: 'Oman',                iso: 'om', capital: 'Mascate',    pop: '4,5 M',  area: '309 500',   gdp: '104 Md$',   hdi: '0.816', currency: 'Rial omanais' },
  'Palestine':            { fr: 'Palestine',           iso: 'ps', capital: 'Ramallah',   pop: '5,3 M',  area: '6 220',     gdp: '19 Md$',    hdi: '0.715', currency: 'Shekel / Dinar' },
  'Qatar':                { fr: 'Qatar',               iso: 'qa', capital: 'Doha',        pop: '2,9 M',  area: '11 586',    gdp: '220 Md$',   hdi: '0.855', currency: 'Riyal qatari' },
  'Somalia':              { fr: 'Somalie',             iso: 'so', capital: 'Mogadiscio',  pop: '17,6 M', area: '637 657',   gdp: '11 Md$',    hdi: '0.380', currency: 'Shilling somalien' },
  'Sudan':                { fr: 'Soudan',              iso: 'sd', capital: 'Khartoum',   pop: '45,7 M', area: '1 861 484', gdp: '52 Md$',    hdi: '0.510', currency: 'Livre soudanaise' },
  'Syria':                { fr: 'Syrie',               iso: 'sy', capital: 'Damas',       pop: '21,3 M', area: '185 180',   gdp: '60 Md$',    hdi: '0.577', currency: 'Livre syrienne' },
  'Tunisia':              { fr: 'Tunisie',             iso: 'tn', capital: 'Tunis',       pop: '12,0 M', area: '163 610',   gdp: '46 Md$',    hdi: '0.731', currency: 'Dinar tunisien' },
  'Yemen':                { fr: 'Yémen',               iso: 'ye', capital: 'Sanaa',       pop: '33,7 M', area: '527 968',   gdp: '21 Md$',    hdi: '0.455', currency: 'Rial yéménite' },
}

/* Statistiques IA par pays */
const AI_STATS = {
  dz: { projects: 47,  invest: 'Moyen',     investN: 2, maturity: 'Émergent',  maturityN: 2, sectors: ['Agriculture','Santé','Éducation','Sécurité'],                    initiative: 'Stratégie Nationale IA 2023–2027',      highlight: '3 universités avec programmes IA' },
  sa: { projects: 340, invest: 'Très élevé', investN: 5, maturity: 'Leader',    maturityN: 5, sectors: ['NEOM','Finance','Énergie','Santé','Ville intelligente'],          initiative: 'SDAIA — Saudi Data & AI Authority',     highlight: 'Budget IA > 20 Md$ — Leader régional' },
  bh: { projects: 38,  invest: 'Élevé',      investN: 4, maturity: 'Avancé',    maturityN: 4, sectors: ['Fintech','Gouvernance','Logistique'],                             initiative: 'Smart Bahrain Initiative',              highlight: 'Hub fintech IA du Golfe' },
  km: { projects: 4,   invest: 'Faible',     investN: 1, maturity: 'Débutant',  maturityN: 1, sectors: ['Agriculture','Pêche'],                                           initiative: 'Plan Numérique Comores 2025',           highlight: 'Premiers projets pilotes en cours' },
  dj: { projects: 12,  invest: 'Faible',     investN: 1, maturity: 'Débutant',  maturityN: 1, sectors: ['Logistique','Port','Éducation'],                                 initiative: 'Djibouti Tech Park',                   highlight: 'Hub stratégique câbles sous-marins' },
  eg: { projects: 210, invest: 'Élevé',      investN: 4, maturity: 'Avancé',    maturityN: 4, sectors: ['Santé','Agriculture','Ville intelligente','Finance','Éducation'], initiative: 'Egypt National AI Strategy 2025',       highlight: 'Ministère IA & TIC depuis 2018' },
  ae: { projects: 410, invest: 'Très élevé', investN: 5, maturity: 'Leader',    maturityN: 5, sectors: ['Gouvernance','Ville intelligente','Finance','Défense'],           initiative: 'UAE AI Strategy 2031',                  highlight: '1er Ministère de l\'IA au monde (2017)' },
  iq: { projects: 22,  invest: 'Faible',     investN: 1, maturity: 'Débutant',  maturityN: 1, sectors: ['Pétrole & Gaz','Sécurité','Agriculture'],                        initiative: 'Iraqi Digital Transformation Plan',     highlight: 'Reconstruction numérique post-conflit' },
  jo: { projects: 85,  invest: 'Moyen',      investN: 3, maturity: 'Émergent',  maturityN: 3, sectors: ['Tech & Startups','Santé','Éducation','Humanitaire'],             initiative: 'Jordan AI Roadmap 2023–2027',           highlight: 'King Hussein Tech Hub' },
  kw: { projects: 44,  invest: 'Élevé',      investN: 3, maturity: 'Émergent',  maturityN: 3, sectors: ['Pétrole','Finance','Logistique','Santé'],                        initiative: 'Kuwait Vision 2035 — New Kuwait',       highlight: 'KIA — Fonds souverain investisseur IA' },
  lb: { projects: 62,  invest: 'Faible',     investN: 2, maturity: 'Émergent',  maturityN: 3, sectors: ['Fintech','Santé','Éducation','Diaspora Tech'],                   initiative: 'AUB & LAU — Centres de recherche IA',  highlight: 'Fort vivier de talents malgré la crise' },
  ly: { projects: 9,   invest: 'Faible',     investN: 1, maturity: 'Débutant',  maturityN: 1, sectors: ['Pétrole','Sécurité'],                                            initiative: 'Initiatives IA naissantes post-conflit', highlight: 'Potentiel à développer' },
  ma: { projects: 130, invest: 'Élevé',      investN: 4, maturity: 'Avancé',    maturityN: 4, sectors: ['Agriculture','Finance','Tourisme','Éducation','Industrie'],      initiative: 'Maroc Digital 2030 — Centre IA MVI',   highlight: 'Hub régional IA Europe–Afrique' },
  mr: { projects: 7,   invest: 'Faible',     investN: 1, maturity: 'Débutant',  maturityN: 1, sectors: ['Pêche','Agriculture','Mines'],                                   initiative: 'MAURITECH 2025',                        highlight: 'Premiers pilotes IA dans la pêche' },
  om: { projects: 48,  invest: 'Élevé',      investN: 3, maturity: 'Émergent',  maturityN: 3, sectors: ['Pétrole & Gaz','Tourisme','Logistique'],                         initiative: 'Oman Vision 2040 — Digital Oman',      highlight: 'Partenariats IBM et Microsoft' },
  ps: { projects: 28,  invest: 'Faible',     investN: 2, maturity: 'Émergent',  maturityN: 2, sectors: ['Tech & Startups','Éducation','Humanitaire'],                     initiative: 'Gaza Sky Geeks — Techstars',            highlight: 'Communauté tech résiliente' },
  qa: { projects: 95,  invest: 'Très élevé', investN: 5, maturity: 'Avancé',    maturityN: 5, sectors: ['Énergie','Sport & Événements','Finance','Ville intelligente'],   initiative: 'Qatar Computing Research Institute',    highlight: 'QCRI — Centre recherche IA mondial' },
  so: { projects: 5,   invest: 'Faible',     investN: 1, maturity: 'Débutant',  maturityN: 1, sectors: ['Humanitaire','Agriculture'],                                     initiative: 'Somalia Digital Inclusion Plan',        highlight: 'Développement freiné par l\'instabilité' },
  sd: { projects: 14,  invest: 'Faible',     investN: 1, maturity: 'Débutant',  maturityN: 2, sectors: ['Agriculture','Santé','Finance mobile'],                          initiative: 'Sudan Digital Strategy 2025',           highlight: 'Fort taux pénétration mobile' },
  sy: { projects: 18,  invest: 'Faible',     investN: 1, maturity: 'Débutant',  maturityN: 2, sectors: ['Humanitaire','Éducation','Reconstruction'],                      initiative: 'Diaspora syrienne tech — Syria Tech',  highlight: 'Talents de la diaspora actifs' },
  tn: { projects: 108, invest: 'Moyen',      investN: 3, maturity: 'Avancé',    maturityN: 4, sectors: ['Fintech','Agriculture','Santé','Éducation','Défense'],           initiative: 'Stratégie Nationale IA Tunisie 2023',  highlight: '2e écosystème startup d\'Afrique du Nord' },
  ye: { projects: 4,   invest: 'Faible',     investN: 1, maturity: 'Débutant',  maturityN: 1, sectors: ['Humanitaire','Agriculture'],                                     initiative: 'Projets pilotes en zones stables',     highlight: 'Conflit freine le développement' },
}

const INVEST_COLOR  = n => ['','#94a3b8','#60a5fa','#f59e0b','#10b981','#8b5cf6'][n]
const INVEST_DOTS   = n => Array.from({ length: 5 }, (_, i) => i < n)
const MATURITY_COLOR = n => ['','#94a3b8','#60a5fa','#f59e0b','#10b981','#8b5cf6'][n]

function project(lat, lng) {
  const x = (lng - GEO.minLng) / (GEO.maxLng - GEO.minLng) * W
  const y = (GEO.maxLat - lat) / (GEO.maxLat - GEO.minLat) * H
  return [x, y]
}

function geomToPath(geometry) {
  const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
  return polys.flatMap(poly =>
    poly.map(ring =>
      'M' + ring.map(([lng, lat]) => {
        const [x, y] = project(lat, lng)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      }).join('L') + 'Z'
    )
  ).join(' ')
}

const ARAB_COUNTRIES_LIST = [
  'algeria','bahrain','comoros','comoro islands','djibouti','egypt','iraq','jordan',
  'kuwait','lebanon','libya','mauritania','morocco','oman','palestine',
  'west bank','gaza strip','palestinian territory','qatar','saudi arabia',
  'somalia','somaliland','sudan','syria','tunisia',
  'united arab emirates','yemen','uae','western sahara','w. sahara','syrian arab republic'
]

const countryNameMapping = {
  'Israel':'Palestine','Palestine':'Palestine',
  'West Bank':'Palestine','Gaza Strip':'Palestine','Palestinian Territory':'Palestine',
  'United Arab Emirates':'United Arab Emirates','UAE':'United Arab Emirates',
  'Western Sahara':'Morocco','W. Sahara':'Morocco',
  'Somaliland':'Somalia','Syrian Arab Republic':'Syria','Syria':'Syria',
  'Sudan':'Sudan','Comoro Islands':'Comoros',
}

const ARAB_CITIES = [
  { lat: 34.02, lng: -6.84 }, { lat: 36.74, lng:  3.06 }, { lat: 36.82, lng: 10.18 },
  { lat: 32.90, lng: 13.18 }, { lat: 30.06, lng: 31.25 }, { lat: 15.55, lng: 32.53 },
  { lat: 18.08, lng:-15.97 }, { lat:  2.05, lng: 45.34 }, { lat: 11.59, lng: 43.15 },
  { lat: 24.69, lng: 46.72 }, { lat: 15.35, lng: 44.21 }, { lat: 23.61, lng: 58.59 },
  { lat: 24.47, lng: 54.37 }, { lat: 25.29, lng: 51.53 }, { lat: 29.37, lng: 47.97 },
  { lat: 33.34, lng: 44.40 }, { lat: 31.96, lng: 35.91 }, { lat: 33.51, lng: 36.29 },
  { lat: 33.89, lng: 35.50 }, { lat: 31.90, lng: 35.20 },
]

function buildConnections() {
  const pairs = new Set()
  ARAB_CITIES.forEach((c, i) => {
    ARAB_CITIES
      .map((d, j) => ({ j, dist: Math.hypot(d.lat - c.lat, d.lng - c.lng) }))
      .filter(x => x.j !== i).sort((a, b) => a.dist - b.dist).slice(0, 5)
      .forEach(({ j }) => pairs.add(`${Math.min(i,j)}-${Math.max(i,j)}`))
  })
  return [...pairs].map(k => k.split('-').map(Number))
}
const CONNECTIONS = buildConnections()
const NODE_PTS = ARAB_CITIES.map(c => { const [x, y] = project(c.lat, c.lng); return { x, y } })

const HDI_COLOR = hdi => {
  const v = parseFloat(hdi)
  if (v >= 0.8)  return '#10b981'
  if (v >= 0.7)  return '#f59e0b'
  if (v >= 0.55) return '#f97316'
  return '#ef4444'
}

function KnowledgeMap() {
  const containerRef = useRef(null)
  const panelRef     = useRef(null)
  const membersRef   = useRef(null)
  const statsRef     = useRef(null)
  const wasDragged   = useRef(false)

  const [vb, setVb]               = useState(INIT_VB)
  const dragging                  = useRef(false)
  const lastPos                   = useRef(null)

  const [geoData, setGeoData]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [tooltip, setTooltip]           = useState(null)
  const [ready, setReady]               = useState(false)
  const [linesReady, setLinesReady]     = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMembers, setShowMembers]   = useState(false)
  const [search, setSearch]             = useState('')
  const [showHint, setShowHint]               = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedMember, setSelectedMember]   = useState(null)  /* vue IA dans le panel */
  const [projectStats, setProjectStats]       = useState({})    /* stats dynamiques par iso */
  const [statsLoading, setStatsLoading]       = useState(true)

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(r => r.json()).then(geo => setGeoData(geo))
      .catch(err => console.error('GeoJSON failed:', err))
      .finally(() => {
        setLoading(false)
        setTimeout(() => { setReady(true); setShowHint(true) }, 60)
        setTimeout(() => setLinesReady(true), 400)
        setTimeout(() => setShowHint(false), 4500)
      })
  }, [])

  /* Fetch projets et calcul stats dynamiques par pays */
  useEffect(() => {
    fetch(`${API_BASE}/api/projects/?limit=10000`)
      .then(r => r.json())
      .then(data => {
        const projects = Array.isArray(data) ? data : (data.items || [])
        const stats = {}
        projects.forEach(p => {
          const iso = p.country ? NAME_TO_ISO[p.country.name] : null
          if (!iso) return
          if (!stats[iso]) stats[iso] = { count: 0, sectors: {}, technologies: {}, statuses: {} }
          stats[iso].count++
          if (p.sector)        stats[iso].sectors[p.sector]           = (stats[iso].sectors[p.sector]           || 0) + 1
          if (p.ai_technology) stats[iso].technologies[p.ai_technology] = (stats[iso].technologies[p.ai_technology] || 0) + 1
          if (p.status)        stats[iso].statuses[p.status]           = (stats[iso].statuses[p.status]           || 0) + 1
        })
        setProjectStats(stats)
      })
      .catch(err => console.error('Projects fetch failed:', err))
      .finally(() => setStatsLoading(false))
  }, [])

  /* Fermeture panel membres au clic extérieur */
  useEffect(() => {
    if (!showMembers) return
    const handler = e => {
      if (
        panelRef.current   && !panelRef.current.contains(e.target) &&
        membersRef.current && !membersRef.current.contains(e.target)
      ) setShowMembers(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMembers])

  /* Fermeture panel stats au clic extérieur */
  useEffect(() => {
    if (!selectedCountry) return
    const handler = e => {
      if (statsRef.current && !statsRef.current.contains(e.target))
        setSelectedCountry(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selectedCountry])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  const isArab = useCallback(name => {
    if (!name) return false
    const n = name.toLowerCase()
    return ARAB_COUNTRIES_LIST.includes(n)
      || Object.keys(countryNameMapping).some(k => k.toLowerCase() === n)
  }, [])

  const handleWheel = useCallback(e => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    setVb(v => {
      const factor = e.deltaY < 0 ? 0.82 : 1.22
      const newW = Math.max(W * 0.04, Math.min(W * 2, v.w * factor))
      const newH = H * newW / W
      const ratio = newW / v.w
      return {
        x: v.x + (mx / rect.width)  * v.w * (1 - ratio),
        y: v.y + (my / rect.height) * v.h * (1 - ratio),
        w: newW, h: newH
      }
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handlePointerDown = useCallback(e => {
    if (e.button !== 0) return
    dragging.current  = true
    wasDragged.current = false
    lastPos.current   = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback(e => {
    if (!dragging.current || !lastPos.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    if (Math.hypot(dx, dy) > 4) wasDragged.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setVb(v => ({ ...v, x: v.x - (dx / rect.width) * v.w, y: v.y - (dy / rect.height) * v.h }))
  }, [])

  const handlePointerUp = useCallback(() => { dragging.current = false }, [])

  const handleCountryClick = useCallback((engName) => {
    if (wasDragged.current) return
    const stats = COUNTRY_STATS[engName]
    if (stats) setSelectedCountry({ ...stats, engName })
  }, [])

  const zoomIn  = () => setVb(v => { const nw = Math.max(W * 0.04, v.w * 0.75); const nh = H * nw / W; return { x: v.x + (v.w - nw) / 2, y: v.y + (v.h - nh) / 2, w: nw, h: nh } })
  const zoomOut = () => setVb(v => { const nw = Math.min(W * 2, v.w / 0.75);   const nh = H * nw / W; return { x: v.x + (v.w - nw) / 2, y: v.y + (v.h - nh) / 2, w: nw, h: nh } })
  const resetView = () => setVb(INIT_VB)

  const arabFeatures = geoData?.features?.filter(f => {
    const name = f.properties.ADMIN || f.properties.NAME || f.properties.name
    return isArab(name)
  }) || []

  const filteredMembers = ARAB_MEMBERS.filter(({ name }) =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  const zoomScale = W / vb.w

  if (loading) return (
    <div className="km-loading">
      <div className="km-spinner"/>
      <style>{`.km-loading{height:100vh;display:flex;align-items:center;justify-content:center;
        background:linear-gradient(180deg,#f0f7ff 0%,#fff 60%)}
        .km-spinner{width:44px;height:44px;border:4px solid #e2e8f0;border-top:4px solid #0d3d4e;
        border-radius:50%;animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`}
      </style>
    </div>
  )

  return (
    <div className="km-page">
      <div
        ref={containerRef}
        className="km-wrap"
        style={{
          cursor: dragging.current ? 'grabbing' : 'grab',
          opacity: ready ? 1 : 0,
          transform: ready ? 'scale(1)' : 'scale(0.97)',
          transition: 'opacity .6s ease, transform .6s ease',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          width="100%" height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block' }}
        >
          <defs>
            <filter id="km-glow" x="-500%" y="-500%" width="1100%" height="1100%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={4 / zoomScale} result="b1"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation={2 / zoomScale} result="b2"/>
              <feMerge>
                <feMergeNode in="b1"/><feMergeNode in="b1"/>
                <feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="km-halo" x="-600%" y="-600%" width="1300%" height="1300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={8 / zoomScale}/>
            </filter>
            <filter id="km-sel-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={3 / zoomScale} result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Pays */}
          {arabFeatures.map((f, i) => {
            const raw     = f.properties.ADMIN || f.properties.NAME || f.properties.name
            const engName = countryNameMapping[raw] || raw
            const isSelected = selectedCountry?.engName === engName
            return (
              <path key={i}
                d={geomToPath(f.geometry)}
                fill={isSelected ? '#1a6a85' : '#0d3d4e'}
                stroke={isSelected ? '#38bdf8' : '#0d3d4e'}
                strokeWidth={(isSelected ? 1.2 : 0.8) / zoomScale}
                strokeLinejoin="round"
                filter={isSelected ? 'url(#km-sel-glow)' : undefined}
                style={{ cursor: 'pointer', transition: 'fill .2s, stroke .2s' }}
                onMouseEnter={e => setTooltip({ name: COUNTRY_STATS[engName]?.fr || engName, x: e.clientX, y: e.clientY })}
                onMouseMove={e  => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
                onClick={e => { e.stopPropagation(); handleCountryClick(engName) }}
              />
            )
          })}

          {/* Lignes avec animation de dessin au chargement */}
          {CONNECTIONS.map(([i, j], k) => {
            const p1 = NODE_PTS[i], p2 = NODE_PTS[j]
            const motionPath = `M${p1.x},${p1.y} L${p2.x},${p2.y}`
            const dur   = (2.5 + (k % 6) * 0.55).toFixed(2)
            const delay = ((k * 0.38) % 3).toFixed(2)
            return (
              <g key={k}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke="rgba(190,228,248,0.7)"
                  strokeWidth={0.55 / zoomScale}
                  pathLength="1"
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: linesReady ? 0 : 1,
                    transition: linesReady
                      ? `stroke-dashoffset ${0.6 + k * 0.04}s ease ${k * 0.025}s`
                      : 'none',
                  }}
                />
                <circle r={1.1 / zoomScale} fill="rgba(255,255,255,0.85)" filter="url(#km-glow)">
                  <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${delay}s`} path={motionPath}/>
                </circle>
              </g>
            )
          })}

          {/* Nœuds */}
          {NODE_PTS.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r={5 / zoomScale}
                fill="rgba(125,211,252,0.25)" filter="url(#km-halo)"
                className={`km-pulse km-pulse-${i % 3}`}/>
              <circle cx={pt.x} cy={pt.y} r={3 / zoomScale}
                fill="rgba(125,211,252,0.55)" filter="url(#km-glow)"/>
              <circle cx={pt.x} cy={pt.y} r={1.6 / zoomScale}
                fill="#ffffff" filter="url(#km-glow)"/>
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div className="km-tooltip" style={{ left: tooltip.x + 14, top: tooltip.y - 36 }}>
            {tooltip.name}
          </div>
        )}

        {/* Titre centré */}
        <div className="km-desc">
          <div className="km-badge">Arab AI Ecosystem</div>
          <h1 className="km-title">Knowledge <span className="km-accent">Map</span></h1>
        </div>

        {/* Compteur cliquable */}
        <button ref={membersRef} className="km-members"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setShowMembers(v => !v); setSearch('') }}>
          <span className="km-members-count">22</span>
          <span className="km-members-label">pays membres</span>
          <span className="km-members-arrow">{showMembers ? '▲' : '▼'}</span>
        </button>

        {/* Panel liste membres */}
        {showMembers && (
          <div ref={panelRef} className="km-members-panel"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}>

            {/* Vue liste (grid) */}
            {!selectedMember && (<>
              <div className="km-members-panel-header">
                <span>Ligue Arabe — {filteredMembers.length} pays</span>
                <button className="km-panel-close" onClick={() => setShowMembers(false)}>✕</button>
              </div>
              <div className="km-search-wrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="km-search-input"
                  placeholder="Rechercher un pays…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button className="km-search-clear" onClick={() => setSearch('')}>✕</button>
                )}
              </div>
              <div className="km-members-grid">
                {filteredMembers.length > 0 ? filteredMembers.map(({ name, iso }) => (
                  <div key={iso} className="km-country-card"
                    onClick={() => { const ai = AI_STATS[iso]; if (ai) setSelectedMember({ name, iso, ...ai }) }}>
                    <img src={`https://flagcdn.com/48x36/${iso}.png`} alt={name} className="km-country-flag"/>
                    <span className="km-country-name">{name}</span>
                    <svg className="km-card-arrow" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                )) : (
                  <p className="km-no-result">Aucun résultat</p>
                )}
              </div>
            </>)}

            {/* Vue détail IA — données dynamiques */}
            {selectedMember && (() => {
              const { name, iso } = selectedMember
              const st = projectStats[iso] || { count: 0, sectors: {}, technologies: {}, statuses: {} }
              const topSectors = Object.entries(st.sectors).sort((a,b)=>b[1]-a[1]).slice(0,5)
              const topTechs   = Object.entries(st.technologies).sort((a,b)=>b[1]-a[1]).slice(0,4)
              const statusList = Object.entries(st.statuses).sort((a,b)=>b[1]-a[1])
              const total      = st.count

              return (
                <div className="km-ai-detail" key={iso}>
                  <div className="km-ai-detail-header">
                    <button className="km-ai-back" onClick={() => setSelectedMember(null)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                      Retour
                    </button>
                    <button className="km-panel-close" onClick={() => setShowMembers(false)}>✕</button>
                  </div>

                  {/* En-tête pays */}
                  <div className="km-ai-country-hero">
                    <img src={`https://flagcdn.com/80x60/${iso}.png`} alt={name} className="km-ai-flag"/>
                    <div>
                      <h3 className="km-ai-name">{name}</h3>
                      <span className="km-ai-kpi-label" style={{ fontSize: 10, color: '#64748b' }}>
                        {statsLoading ? 'Chargement…' : `${total} projet${total !== 1 ? 's' : ''} enregistré${total !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>

                  {statsLoading ? (
                    <div className="km-ai-loading">
                      <div className="km-spinner-sm"/>
                      <span>Chargement des données…</span>
                    </div>
                  ) : total === 0 ? (
                    <div className="km-ai-empty">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><circle cx="12" cy="16" r=".5" fill="#cbd5e1"/></svg>
                      <p>Aucun projet enregistré<br/>pour ce pays</p>
                    </div>
                  ) : (<>

                    {/* KPI principal */}
                    <div className="km-ai-kpi-big">
                      <span className="km-ai-kpi-big-val">{total}</span>
                      <span className="km-ai-kpi-big-label">projets enregistrés</span>
                    </div>

                    {/* Répartition par statut */}
                    {statusList.length > 0 && (<>
                      <div className="km-ai-section-label">Répartition par statut</div>
                      <div className="km-ai-statuses">
                        {statusList.map(([status, count]) => {
                          const meta = STATUS_META[status] || { label: status, color: '#94a3b8' }
                          return (
                            <div key={status} className="km-ai-status-row">
                              <span className="km-ai-status-dot" style={{ background: meta.color }}/>
                              <span className="km-ai-status-label">{meta.label}</span>
                              <div className="km-ai-status-bar-bg">
                                <div className="km-ai-status-bar"
                                  style={{ width: `${Math.round(count/total*100)}%`, background: meta.color }}/>
                              </div>
                              <span className="km-ai-status-count">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </>)}

                    {/* Secteurs */}
                    {topSectors.length > 0 && (<>
                      <div className="km-ai-section-label">Secteurs</div>
                      <div className="km-ai-sectors">
                        {topSectors.map(([sector, count]) => (
                          <span key={sector} className="km-ai-sector-tag">
                            {sector}
                            <span className="km-ai-tag-count">{count}</span>
                          </span>
                        ))}
                      </div>
                    </>)}

                    {/* Technologies IA */}
                    {topTechs.length > 0 && (<>
                      <div className="km-ai-section-label">Technologies IA</div>
                      <div className="km-ai-sectors">
                        {topTechs.map(([tech, count]) => (
                          <span key={tech} className="km-ai-sector-tag km-ai-tech-tag">
                            {tech}
                            <span className="km-ai-tag-count">{count}</span>
                          </span>
                        ))}
                      </div>
                    </>)}
                  </>)}

                  <p className="km-stats-source">Source : Projets SARAI Platform</p>
                </div>
              )
            })()}
          </div>
        )}

        {/* Panel statistiques pays */}
        {selectedCountry && (
          <div ref={statsRef} className="km-stats-panel"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}>
            <button className="km-panel-close km-stats-close"
              onClick={() => setSelectedCountry(null)}>✕</button>

            <div className="km-stats-header">
              <img
                src={`https://flagcdn.com/80x60/${selectedCountry.iso}.png`}
                alt={selectedCountry.fr}
                className="km-stats-flag"
              />
              <h2 className="km-stats-name">{selectedCountry.fr}</h2>
              <p className="km-stats-capital">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {selectedCountry.capital}
              </p>
            </div>

            <div className="km-stats-grid">
              <div className="km-stat-item">
                <span className="km-stat-icon">👥</span>
                <span className="km-stat-label">Population</span>
                <span className="km-stat-value">{selectedCountry.pop}</span>
              </div>
              <div className="km-stat-item">
                <span className="km-stat-icon">📐</span>
                <span className="km-stat-label">Superficie</span>
                <span className="km-stat-value">{selectedCountry.area} km²</span>
              </div>
              <div className="km-stat-item">
                <span className="km-stat-icon">💰</span>
                <span className="km-stat-label">PIB (2023)</span>
                <span className="km-stat-value">{selectedCountry.gdp}</span>
              </div>
              <div className="km-stat-item">
                <span className="km-stat-icon">💱</span>
                <span className="km-stat-label">Monnaie</span>
                <span className="km-stat-value">{selectedCountry.currency}</span>
              </div>
            </div>

            {/* IDH avec barre de progression */}
            <div className="km-hdi-wrap">
              <div className="km-hdi-row">
                <span className="km-hdi-label">Indice de développement humain</span>
                <span className="km-hdi-val" style={{ color: HDI_COLOR(selectedCountry.hdi) }}>
                  {selectedCountry.hdi}
                </span>
              </div>
              <div className="km-hdi-bar-bg">
                <div className="km-hdi-bar-fill"
                  style={{
                    width: `${parseFloat(selectedCountry.hdi) * 100}%`,
                    background: HDI_COLOR(selectedCountry.hdi),
                  }}
                />
              </div>
              <div className="km-hdi-scale">
                <span>Faible</span><span>Moyen</span><span>Élevé</span><span>Très élevé</span>
              </div>
            </div>

            <p className="km-stats-source">Source : Banque mondiale / PNUD 2023</p>
          </div>
        )}

        {/* Contrôles */}
        <div className="km-controls"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}>
          <button className="km-ctrl-btn" onClick={resetView} title="Réinitialiser">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>
          <div className="km-ctrl-sep"/>
          <button className="km-ctrl-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Quitter' : 'Plein écran'}>
            {isFullscreen ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </button>
          <div className="km-ctrl-sep"/>
          <button className="km-ctrl-btn km-ctrl-zoom" onClick={zoomIn}>+</button>
          <button className="km-ctrl-btn km-ctrl-zoom" onClick={zoomOut}>−</button>
        </div>

        {/* Hint navigation */}
        <div className="km-hint" style={{ opacity: showHint ? 1 : 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
          Cliquez sur un pays · Scroll pour zoomer · Glisser pour naviguer
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .km-page{
          height:100vh;width:100%;position:relative;overflow:hidden;
          background:linear-gradient(175deg,#eef6fb 0%,#ffffff 55%,#f5fafd 100%);
          font-family:'Inter',sans-serif
        }
        .km-wrap{ width:100%;height:100%;position:relative }

        @keyframes kmPulse{
          0%  { transform:scale(1); opacity:.65 }
          100%{ transform:scale(6); opacity:0   }
        }
        .km-pulse{ animation:kmPulse 3.2s ease-out infinite;transform-box:fill-box;transform-origin:center }
        .km-pulse-1{ animation-delay:1.07s }
        .km-pulse-2{ animation-delay:2.13s }

        .km-tooltip{
          position:fixed;z-index:9999;pointer-events:none;
          background:#0d3d4e;color:#fff;padding:5px 14px;border-radius:100px;
          font-size:12px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.18);
          animation:tipIn .12s ease;white-space:nowrap
        }
        @keyframes tipIn{ from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }

        .km-desc{
          position:absolute;top:24px;left:50%;transform:translateX(-50%);
          text-align:center;pointer-events:none;white-space:nowrap;z-index:10
        }
        .km-badge{
          display:inline-block;padding:3px 12px;margin-bottom:6px;
          background:rgba(13,61,78,.07);border:1px solid rgba(13,61,78,.16);
          color:#0d3d4e;border-radius:100px;
          font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em
        }
        .km-title{ font-size:2rem;font-weight:800;margin:0;letter-spacing:-1px;color:#0d3d4e }
        .km-accent{ color:#0891b2 }

        .km-members{
          position:absolute;top:24px;left:28px;z-index:200;
          display:flex;flex-direction:column;align-items:center;
          background:rgba(255,255,255,.82);
          backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
          border:1px solid rgba(13,61,78,.16);border-radius:16px;
          padding:10px 18px;cursor:pointer;
          box-shadow:0 2px 12px rgba(13,61,78,.08);
          transition:.15s;font-family:inherit;outline:none
        }
        .km-members:hover{ background:rgba(255,255,255,.98);box-shadow:0 4px 20px rgba(13,61,78,.14) }
        .km-members-count{ font-size:1.6rem;font-weight:800;color:#0d3d4e;line-height:1 }
        .km-members-label{ font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-top:2px }
        .km-members-arrow{ font-size:8px;color:#0891b2;margin-top:4px }

        .km-members-panel{
          position:absolute;top:120px;left:28px;z-index:300;width:320px;
          background:rgba(255,255,255,.97);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border:1px solid rgba(13,61,78,.13);border-radius:20px;
          box-shadow:0 16px 48px rgba(13,61,78,.16);overflow:hidden;
          animation:panelIn .2s ease
        }
        @keyframes panelIn{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }

        .km-members-panel-header{
          display:flex;align-items:center;justify-content:space-between;
          padding:13px 16px 10px;
          font-size:10px;font-weight:700;color:#0d3d4e;
          text-transform:uppercase;letter-spacing:.07em
        }
        .km-panel-close{
          background:none;border:none;cursor:pointer;color:#94a3b8;
          font-size:13px;padding:2px 6px;border-radius:6px;transition:.15s
        }
        .km-panel-close:hover{ background:#fee2e2;color:#ef4444 }

        .km-search-wrap{
          display:flex;align-items:center;gap:8px;
          margin:0 12px 8px;padding:7px 12px;
          background:#f8fafc;border:1px solid rgba(13,61,78,.1);border-radius:10px
        }
        .km-search-input{
          flex:1;border:none;background:none;outline:none;
          font-size:12px;font-weight:500;color:#0d3d4e;font-family:inherit
        }
        .km-search-input::placeholder{ color:#94a3b8 }
        .km-search-clear{
          background:none;border:none;cursor:pointer;color:#94a3b8;
          font-size:11px;padding:0 2px;line-height:1;transition:.15s
        }
        .km-search-clear:hover{ color:#ef4444 }

        .km-members-grid{
          display:grid;grid-template-columns:1fr 1fr;gap:0;
          max-height:340px;overflow-y:auto;padding:4px 8px 10px
        }
        .km-members-grid::-webkit-scrollbar{ width:4px }
        .km-members-grid::-webkit-scrollbar-thumb{ background:rgba(13,61,78,.18);border-radius:2px }
        .km-country-card{
          display:flex;align-items:center;gap:8px;
          padding:7px 8px;border-radius:10px;transition:.12s;cursor:pointer;
          position:relative
        }
        .km-country-card:hover{ background:rgba(13,61,78,.06) }
        .km-card-arrow{ margin-left:auto;flex-shrink:0;opacity:0;transition:.15s }
        .km-country-card:hover .km-card-arrow{ opacity:1 }
        .km-country-flag{
          width:30px;height:22px;object-fit:cover;border-radius:3px;
          box-shadow:0 1px 4px rgba(0,0,0,.14);flex-shrink:0
        }
        .km-country-name{ font-size:11px;font-weight:600;color:#0d3d4e }
        .km-no-result{
          grid-column:1/-1;text-align:center;
          color:#94a3b8;font-size:12px;padding:20px 0
        }

        /* Panel statistiques */
        .km-stats-panel{
          position:absolute;top:50%;right:28px;transform:translateY(-50%);
          z-index:300;width:272px;
          background:rgba(255,255,255,.97);
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border:1px solid rgba(13,61,78,.13);border-radius:22px;
          box-shadow:0 20px 60px rgba(13,61,78,.18);
          overflow:hidden;
          animation:statsIn .25s cubic-bezier(.34,1.56,.64,1)
        }
        @keyframes statsIn{ from{opacity:0;transform:translateY(-50%) translateX(20px)} to{opacity:1;transform:translateY(-50%) translateX(0)} }

        .km-stats-close{
          position:absolute;top:10px;right:12px;z-index:1
        }

        .km-stats-header{
          background:linear-gradient(135deg,#0d3d4e 0%,#0f5068 100%);
          padding:22px 20px 16px;text-align:center
        }
        .km-stats-flag{
          width:64px;height:48px;object-fit:cover;border-radius:6px;
          box-shadow:0 4px 16px rgba(0,0,0,.3);margin-bottom:10px
        }
        .km-stats-name{
          margin:0 0 4px;font-size:1.1rem;font-weight:800;color:#fff;letter-spacing:-.5px
        }
        .km-stats-capital{
          margin:0;font-size:11px;font-weight:500;color:rgba(186,230,253,.8);
          display:flex;align-items:center;justify-content:center;gap:4px
        }

        .km-stats-grid{
          display:grid;grid-template-columns:1fr 1fr;gap:1px;
          background:rgba(13,61,78,.06);margin:12px 14px 0
        }
        .km-stat-item{
          background:#fff;padding:10px 10px 8px;border-radius:10px;
          display:flex;flex-direction:column;align-items:flex-start;gap:2px
        }
        .km-stat-icon{ font-size:14px;line-height:1 }
        .km-stat-label{ font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em }
        .km-stat-value{ font-size:12px;font-weight:700;color:#0d3d4e;line-height:1.2 }

        .km-hdi-wrap{
          margin:10px 14px 0;padding:10px 12px;
          background:#f8fafc;border-radius:12px;border:1px solid rgba(13,61,78,.07)
        }
        .km-hdi-row{
          display:flex;justify-content:space-between;align-items:center;margin-bottom:6px
        }
        .km-hdi-label{ font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em }
        .km-hdi-val{ font-size:13px;font-weight:800 }
        .km-hdi-bar-bg{
          height:5px;background:#e2e8f0;border-radius:100px;overflow:hidden
        }
        .km-hdi-bar-fill{
          height:100%;border-radius:100px;
          transition:width 1s cubic-bezier(.34,1.2,.64,1)
        }
        .km-hdi-scale{
          display:flex;justify-content:space-between;margin-top:4px;
          font-size:7.5px;color:#cbd5e1;font-weight:500
        }

        .km-stats-source{
          text-align:center;font-size:9px;color:#cbd5e1;margin:8px 0 12px;
          font-style:italic
        }

        /* Vue détail IA */
        .km-ai-detail{ animation:panelIn .18s ease }
        .km-ai-detail-header{
          display:flex;align-items:center;justify-content:space-between;
          padding:12px 14px 8px
        }
        .km-ai-back{
          display:flex;align-items:center;gap:5px;
          background:none;border:none;cursor:pointer;
          font-size:11px;font-weight:600;color:#0891b2;
          padding:4px 8px;border-radius:8px;transition:.15s;font-family:inherit
        }
        .km-ai-back:hover{ background:rgba(8,145,178,.08) }

        .km-ai-country-hero{
          display:flex;align-items:center;gap:12px;
          padding:0 14px 12px
        }
        .km-ai-flag{
          width:52px;height:39px;object-fit:cover;border-radius:6px;
          box-shadow:0 2px 10px rgba(0,0,0,.15);flex-shrink:0
        }
        .km-ai-name{ margin:0 0 5px;font-size:.95rem;font-weight:800;color:#0d3d4e }
        .km-ai-maturity-badge{
          display:inline-block;padding:2px 10px;border-radius:100px;border:1px solid;
          font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em
        }

        .km-ai-kpi-row{
          display:flex;align-items:center;
          margin:0 12px 12px;padding:10px 14px;
          background:#f8fafc;border-radius:12px;border:1px solid rgba(13,61,78,.07)
        }
        .km-ai-kpi{ flex:1;display:flex;flex-direction:column;align-items:center;gap:3px }
        .km-ai-kpi-sep{ width:1px;height:36px;background:rgba(13,61,78,.1);margin:0 8px }
        .km-ai-kpi-val{ font-size:1.5rem;font-weight:800;color:#0d3d4e;line-height:1 }
        .km-ai-kpi-label{ font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em }
        .km-ai-kpi-sub{ font-size:10px;font-weight:600;color:#64748b }
        .km-ai-invest-dots{ display:flex;gap:4px;margin-bottom:2px }
        .km-dot{ width:9px;height:9px;border-radius:50% }

        .km-ai-section-label{
          font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;
          letter-spacing:.08em;padding:0 14px;margin-bottom:5px
        }
        .km-ai-sectors{
          display:flex;flex-wrap:wrap;gap:5px;padding:0 14px;margin-bottom:12px
        }
        .km-ai-sector-tag{
          padding:3px 10px;background:rgba(8,145,178,.08);
          color:#0369a1;border-radius:100px;
          font-size:10px;font-weight:600;border:1px solid rgba(8,145,178,.2)
        }
        /* Spinner small */
        .km-ai-loading{
          display:flex;flex-direction:column;align-items:center;gap:8px;
          padding:24px 0;color:#94a3b8;font-size:11px;font-weight:500
        }
        .km-spinner-sm{
          width:22px;height:22px;border:2.5px solid #e2e8f0;
          border-top-color:#0891b2;border-radius:50%;
          animation:sp 1s linear infinite
        }
        @keyframes sp{ to{ transform:rotate(360deg) } }

        /* État vide */
        .km-ai-empty{
          display:flex;flex-direction:column;align-items:center;gap:8px;
          padding:20px 0;color:#94a3b8;font-size:11px;text-align:center;line-height:1.5
        }

        /* KPI grand */
        .km-ai-kpi-big{
          display:flex;flex-direction:column;align-items:center;
          margin:0 14px 10px;padding:12px;
          background:linear-gradient(135deg,rgba(13,61,78,.06),rgba(8,145,178,.07));
          border-radius:14px;border:1px solid rgba(13,61,78,.08)
        }
        .km-ai-kpi-big-val{ font-size:2rem;font-weight:800;color:#0d3d4e;line-height:1 }
        .km-ai-kpi-big-label{ font-size:10px;font-weight:600;color:#64748b;margin-top:3px }

        /* Statuts */
        .km-ai-statuses{ padding:0 14px;margin-bottom:10px;display:flex;flex-direction:column;gap:5px }
        .km-ai-status-row{
          display:flex;align-items:center;gap:7px
        }
        .km-ai-status-dot{ width:7px;height:7px;border-radius:50%;flex-shrink:0 }
        .km-ai-status-label{ font-size:10px;font-weight:600;color:#0d3d4e;width:68px;flex-shrink:0 }
        .km-ai-status-bar-bg{ flex:1;height:4px;background:#f1f5f9;border-radius:100px;overflow:hidden }
        .km-ai-status-bar{ height:100%;border-radius:100px;transition:width .8s cubic-bezier(.34,1.2,.64,1) }
        .km-ai-status-count{ font-size:10px;font-weight:700;color:#64748b;width:18px;text-align:right }

        /* Tags */
        .km-ai-tag-count{
          display:inline-flex;align-items:center;justify-content:center;
          background:rgba(255,255,255,.5);border-radius:100px;
          padding:0 5px;font-size:9px;font-weight:700;margin-left:4px
        }
        .km-ai-tech-tag{
          background:rgba(99,102,241,.08) !important;
          color:#4338ca !important;
          border-color:rgba(99,102,241,.2) !important
        }

        .km-ai-initiative{
          display:flex;align-items:flex-start;gap:7px;
          margin:0 14px 8px;padding:9px 11px;
          background:rgba(13,61,78,.04);border-radius:10px;
          font-size:11px;font-weight:600;color:#0d3d4e;line-height:1.4
        }
        .km-ai-highlight{
          display:flex;align-items:flex-start;gap:7px;
          margin:0 14px 10px;padding:8px 11px;
          background:rgba(245,158,11,.07);border-radius:10px;
          font-size:10px;font-weight:500;color:#92400e;line-height:1.4;
          border:1px solid rgba(245,158,11,.15)
        }

        /* Contrôles */
        .km-controls{
          position:absolute;top:24px;right:28px;z-index:100;
          display:flex;align-items:center;gap:2px;
          background:rgba(255,255,255,.82);
          backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
          border:1px solid rgba(13,61,78,.13);border-radius:14px;
          padding:6px 8px;box-shadow:0 2px 12px rgba(13,61,78,.07)
        }
        .km-ctrl-btn{
          width:34px;height:34px;background:none;border:none;
          color:#0d3d4e;cursor:pointer;border-radius:9px;
          display:flex;align-items:center;justify-content:center;transition:.15s
        }
        .km-ctrl-btn:hover{ background:rgba(13,61,78,.08) }
        .km-ctrl-btn:active{ transform:scale(.9) }
        .km-ctrl-zoom{ font-size:20px;font-weight:400 }
        .km-ctrl-sep{ width:1px;height:20px;background:rgba(13,61,78,.12);margin:0 3px }

        .km-hint{
          position:absolute;bottom:28px;left:50%;transform:translateX(-50%);
          display:flex;align-items:center;gap:7px;
          background:rgba(13,61,78,.75);color:rgba(255,255,255,.9);
          padding:7px 18px;border-radius:100px;font-size:11px;font-weight:500;
          pointer-events:none;white-space:nowrap;
          transition:opacity 1s ease 3s;
          box-shadow:0 4px 16px rgba(13,61,78,.2)
        }

        @media(max-width:768px){
          .km-members{ top:12px;left:12px }
          .km-controls{ top:12px;right:12px }
          .km-title{ font-size:1.5rem }
          .km-members-panel{ width:calc(100vw - 24px);left:12px }
          .km-stats-panel{ width:calc(100vw - 24px);right:12px;top:auto;bottom:12px;transform:none }
          .km-hint{ display:none }
        }
      `}</style>
    </div>
  )
}

export default KnowledgeMap
