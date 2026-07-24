import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { FaPlus, FaCheck, FaFilter, FaTimes, FaLightbulb, FaGlobeAmericas, FaHeart, FaCity, FaRocket, FaMicrochip, FaShieldAlt, FaLeaf, FaSearch, FaArrowRight, FaSortAmountDown, FaFileAlt, FaExternalLinkAlt, FaDownload, FaExclamationTriangle } from 'react-icons/fa'
import { toast } from 'react-toastify'
import SearchBar from '../components/SearchBar'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const PAGE_SIZE = 12

// Keep arabCountries only for the "Create Stakeholder" country dropdown in the form
const arabCountries = [
  'Algeria', 'Bahrain', 'Comoros', 'Djibouti', 'Egypt', 'Iraq',
  'Jordan', 'Kuwait', 'Lebanon', 'Libya', 'Mauritania', 'Morocco',
  'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Somalia', 'Sudan',
  'Syria', 'Tunisia', 'United Arab Emirates', 'Yemen'
]

const getCountryName = (id, countriesList) => {
  const country = countriesList.find(c => c.id === id)
  return country ? country.name : null
}

const getCountryRegion = (countryName) => {
  const regions = {
    'Morocco': 'North Africa', 'Algeria': 'North Africa', 'Tunisia': 'North Africa', 'Libya': 'North Africa', 'Mauritania': 'North Africa',
    'Egypt': 'MENA', 'Sudan': 'East Africa', 'Somalia': 'East Africa', 'Djibouti': 'East Africa', 'Comoros': 'East Africa',
    'Saudi Arabia': 'Gulf', 'United Arab Emirates': 'Gulf', 'Qatar': 'Gulf', 'Kuwait': 'Gulf', 'Bahrain': 'Gulf', 'Oman': 'Gulf',
    'Jordan': 'Levant', 'Lebanon': 'Levant', 'Palestine': 'Levant', 'Syria': 'Levant', 'Iraq': 'Levant', 'Yemen': 'Levant'
  }
  return regions[countryName] || 'Arab Region'
}

const getSectorInfo = (sector) => {
  const map = {
    'Health':       { class: 'health', icon: <FaHeart /> },
    'EduTech':      { class: 'edu',    icon: <FaLightbulb /> },
    'Education':    { class: 'edu',    icon: <FaLightbulb /> },
    'AgriTech':     { class: 'agri',   icon: <FaGlobeAmericas /> },
    'Agriculture':  { class: 'agri',   icon: <FaGlobeAmericas /> },
    'Finance':      { class: 'fin',    icon: <FaCity /> },
    'Transportation': { class: 'trans',  icon: <FaRocket /> },
    'Energy':       { class: 'energy', icon: <FaLightbulb /> },
    'Environment':  { class: 'env',    icon: <FaLeaf /> },
    'Security':     { class: 'security', icon: <FaShieldAlt /> },
    'SmartCities':      { class: 'fin',    icon: <FaCity /> },
    'Industry':         { class: 'trans',  icon: <FaRocket /> },
    'Entrepreneuriat':  { class: 'fin',    icon: <FaRocket /> }
  }
  return map[sector] || { class: 'default', icon: <FaMicrochip /> }
}

const getSDGNumber = (sdgStr) => {
  if (!sdgStr) return ''
  const match = sdgStr.match(/SDG\s*(\d+)/)
  return match ? `SDG${match[1]}` : sdgStr.substring(0, 10)
}

// yyyy-MM-ddTHH:mm:ss(.sss)(Z) → yyyy-MM-dd, for <input type="date">
const formatDateForInput = (dateStr) => (dateStr ? dateStr.slice(0, 10) : '')

// yyyy-MM-dd (from <input type="date">) → yyyy-MM-ddT00:00:00, for the API's datetime fields
const formatDateForApi = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : null)

// API project shape (ProjectResponse) → form state shape
const mapProjectToFormData = (project) => ({
  title: project.title || '',
  description: project.description || '',
  start_date: formatDateForInput(project.start_date),
  end_date: formatDateForInput(project.end_date),
  status: project.status || 'pending',
  sector: project.sector || '',
  technology: project.ai_technology || '',
  sdg_alignment: project.sdg_alignment || '',
  country_id: project.country_id ? String(project.country_id) : '',
  coverage: project.coverage || '',
  planned_tasks: project.planned_tasks || '',
  expected_impact: project.expected_impact || '',
  budget: project.budget || '',
  planned_duration: project.planned_duration || '',
  files: [],
})

// form state shape → PUT /api/projects/{id} body (never includes status/user_id)
const mapFormDataToUpdatePayload = (formData) => ({
  title: formData.title,
  description: formData.description || null,
  start_date: formatDateForApi(formData.start_date),
  end_date: formatDateForApi(formData.end_date),
  sector: formData.sector,
  ai_technology: formData.technology,
  sdg_alignment: formData.sdg_alignment || null,
  country_id: formData.country_id ? parseInt(formData.country_id) : null,
  coverage: formData.coverage || null,
  planned_tasks: formData.planned_tasks || null,
  expected_impact: formData.expected_impact || null,
  budget: formData.budget || null,
  planned_duration: formData.planned_duration || null,
})

const EMPTY_FORM_DATA = {
  title: '', description: '', start_date: '', end_date: '', status: 'ongoing',
  sector: '', technology: '', sdg_alignment: '', country_id: '',
  coverage: '', planned_tasks: '', expected_impact: '', budget: '', planned_duration: '',
  files: []
}

function ProjectStocktaking() {
  const [searchParams] = useSearchParams()
  const initialSdgNum = searchParams.get('sdg_num')
  const { id: editProjectId } = useParams()
  const isEdit = !!editProjectId
  const navigate = useNavigate()

  // ── Edit-mode state ───────────────────────────────────────────────────────
  const [editLoading, setEditLoading] = useState(isEdit)
  const [existingStakeholders, setExistingStakeholders] = useState([])
  const [existingDocuments, setExistingDocuments] = useState([])

  // ── Data state ────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [countries, setCountries] = useState([])
  const [sdgList, setSdgList] = useState([])
  const [metaData, setMetaData] = useState({ sectors: [], technologies: [] })
  const [allStakeholders, setAllStakeholders] = useState([])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filterCountry, setFilterCountry] = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [filterSdgNum, setFilterSdgNum] = useState('')
  const [filterTechnology, setFilterTechnology] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // ── Form state ────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM_DATA)
  const [selectedStakeholders, setSelectedStakeholders] = useState([])
  const [showAddStakeholder, setShowAddStakeholder] = useState(false)
  const [newStakeholder, setNewStakeholder] = useState({ name: '', type: '', country: '', website: '', contact_email: '' })
  const [stakeholderSearch, setStakeholderSearch] = useState('')
  const [formStep, setFormStep] = useState(1)
  const [submitLocked, setSubmitLocked] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [classifyDone, setClassifyDone] = useState(false)
  const [duplicateWarnings, setDuplicateWarnings] = useState([])

  // Keep latest filter values accessible inside doFetch without stale closures
  const filtersRef = useRef({})
  filtersRef.current = { filterCountry, filterSector, filterSdgNum, filterTechnology, searchQuery, sortBy }

  const searchTimerRef = useRef(null)

  // ── On mount: load reference data + initial projects ──────────────────────
  useEffect(() => {
    fetchCountries()
    fetchStakeholders()
    fetchSDGList()
    fetchMeta()
    checkAuth()
    doFetch(0, false)
  }, [])

  // Apply SDG filter from URL param
  useEffect(() => {
    if (initialSdgNum) {
      setFilterSdgNum(initialSdgNum)
      setFiltersOpen(true)
    }
  }, [initialSdgNum])

  // ── Edit mode: fetch the project to edit and pre-fill the form ────────────
  useEffect(() => {
    if (!editProjectId) return
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    let currentUserId = null
    let currentUserRole = null
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser)
        currentUserId = u.id
        currentUserRole = u.role
      } catch {}
    }
    if (!token || !currentUserId) {
      toast.error('Please login to edit your project')
      navigate('/login')
      return
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/projects/${editProjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          toast.error(res.status === 404 ? 'Project not found' : 'You can only edit your own projects')
          navigate('/profile')
          return
        }
        const project = await res.json()
        if (currentUserRole !== 'admin' && project.user_id !== currentUserId) {
          toast.error('You can only edit your own projects')
          navigate('/profile')
          return
        }
        setFormData(mapProjectToFormData(project))
        setExistingStakeholders(project.stakeholder_associations || [])
        setExistingDocuments(project.documents || [])
        setSelectedStakeholders([])
        setFormStep(1)
        setShowForm(true)
      } catch (err) {
        console.error('Failed to load project for editing:', err)
        toast.error('Failed to load project')
        navigate('/profile')
      } finally {
        setEditLoading(false)
      }
    })()
  }, [editProjectId])

  // Re-fetch when dropdown filters or sort change (instant)
  useEffect(() => {
    setProjects([])
    doFetch(0, false)
  }, [filterCountry, filterSector, filterSdgNum, filterTechnology, sortBy])

  // Re-fetch when search text changes (debounced 350ms)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setProjects([])
      doFetch(0, false)
    }, 350)
    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery])

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const doFetch = async (skip, append) => {
    const f = filtersRef.current
    try {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      const params = new URLSearchParams({ skip, limit: PAGE_SIZE, sort_by: f.sortBy })
      if (f.filterCountry) params.set('country', f.filterCountry)
      if (f.filterSector) params.set('sector', f.filterSector)
      if (f.filterSdgNum) params.set('sdg_num', f.filterSdgNum)
      if (f.filterTechnology) params.set('technology', f.filterTechnology)
      if (f.searchQuery) params.set('search', f.searchQuery)

      const res = await fetch(`${API_BASE}/api/projects/?${params}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()

      if (append) {
        setProjects(prev => [...prev, ...data.items])
      } else {
        setProjects(data.items)
      }
      setTotalCount(data.total)
      setHasMore(skip + data.items.length < data.total)
      setError(null)
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => doFetch(projects.length, true)

  const fetchSDGList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sdgs/`)
      if (res.ok) setSdgList(await res.json())
    } catch {}
  }

  const fetchMeta = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/meta`)
      if (res.ok) setMetaData(await res.json())
    } catch {}
  }

  const fetchStakeholders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stakeholders/`)
      if (res.ok) setAllStakeholders(await res.json())
    } catch (err) { console.error('Failed to fetch stakeholders:', err) }
  }

  const checkAuth = () => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    if (storedUser && token) {
      try { setUser(JSON.parse(storedUser)) } catch { setUser(null) }
    }
  }

  const fetchCountries = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/countries/`)
      if (res.ok) setCountries(await res.json())
    } catch (err) { console.error('Failed to fetch countries:', err) }
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const autoClassify = async () => {
    if (!formData.title.trim() && !formData.description.trim()) {
      toast.warning('Enter a title or description first'); return
    }
    setClassifying(true)
    setClassifyDone(false)
    try {
      const res = await fetch(`${API_BASE}/chatbot/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title, description: formData.description }),
      })
      if (!res.ok) throw new Error('Classification failed')
      const result = await res.json()
      const updates = {}
      if (result.sector && metaData.sectors.includes(result.sector)) updates.sector = result.sector
      if (result.technology && metaData.technologies.includes(result.technology)) updates.technology = result.technology
      if (result.sdg) updates.sdg_alignment = result.sdg
      setFormData(prev => ({ ...prev, ...updates }))
      setClassifyDone(true)
      const filled = Object.keys(updates).length
      filled > 0
        ? toast.success(`✨ Auto-filled ${filled} field(s) based on your description`)
        : toast.info('No matching classifications found. Try adding more details.')
    } catch {
      toast.error('Auto-classify failed')
    } finally {
      setClassifying(false)
      setTimeout(() => setClassifyDone(false), 3000)
    }
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, files: Array.from(e.target.files) })
  }

  const checkDuplicates = async () => {
    if (!formData.title.trim() || formData.title.trim().length < 4) { setDuplicateWarnings([]); return }
    try {
      const params = new URLSearchParams({ title: formData.title.trim() })
      if (formData.country_id) params.set('country_id', formData.country_id)
      const res = await fetch(`${API_BASE}/api/projects/check-duplicate?${params}`)
      if (res.ok) {
        const matches = await res.json()
        setDuplicateWarnings(matches.filter(m => !isEdit || m.id !== Number(editProjectId)))
      }
    } catch (err) {
      console.error('Duplicate check failed:', err)
    }
  }

  const nextStep = () => {
    if (formStep === 1 && !formData.title.trim()) {
      toast.warning('Please enter a project title'); return
    }
    if (formStep === 2 && (!formData.sector || !formData.technology || !formData.description.trim())) {
      toast.warning('Please fill in all required fields (Sector, Technology, Description)'); return
    }
    const next = formStep + 1
    setFormStep(next)
    if (next === 5) {
      setSubmitLocked(true)
      setTimeout(() => setSubmitLocked(false), 900)
    }
  }

  const handleSessionExpired = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('token_type')
    localStorage.removeItem('user')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
    toast.error('Your session has expired. Please log in again.')
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    if (!token) { toast.error('Please login to submit a project'); return }
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    let userId = null
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser)
        userId = u.id
      } catch {}
    }
    if (!userId) { toast.error('User info not found. Please login again.'); return }

    try {
      let project

      if (isEdit) {
        const response = await fetch(`${API_BASE}/api/projects/${editProjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(mapFormDataToUpdatePayload(formData))
        })
        if (!response.ok) {
          if (response.status === 401) { handleSessionExpired(); return }
          const errorData = await response.json()
          let message = 'Failed to update project'
          if (response.status === 422 && Array.isArray(errorData.detail)) {
            message = errorData.detail.map(e => `${e.loc?.join('.') || 'field'}: ${e.msg}`).join('\n')
          } else if (typeof errorData.detail === 'string') {
            message = errorData.detail
          }
          throw new Error(message)
        }
        project = await response.json()
      } else {
        const projectData = {
          title: formData.title,
          country_id: formData.country_id ? parseInt(formData.country_id) : null,
          sector: formData.sector,
          ai_technology: formData.technology,
          user_id: userId,
          status: 'pending',
          start_date: formatDateForApi(formData.start_date),
          end_date: formatDateForApi(formData.end_date),
        }
        if (formData.description) projectData.description = formData.description
        if (formData.sdg_alignment) projectData.sdg_alignment = formData.sdg_alignment
        if (formData.coverage) projectData.coverage = formData.coverage
        if (formData.planned_tasks) projectData.planned_tasks = formData.planned_tasks
        if (formData.expected_impact) projectData.expected_impact = formData.expected_impact
        if (formData.budget) projectData.budget = formData.budget
        if (formData.planned_duration) projectData.planned_duration = formData.planned_duration

        const response = await fetch(`${API_BASE}/api/projects/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(projectData)
        })

        if (!response.ok) {
          if (response.status === 401) { handleSessionExpired(); return }
          const errorData = await response.json()
          let message = 'Failed to submit project'
          if (response.status === 422 && Array.isArray(errorData.detail)) {
            message = errorData.detail.map(e => `${e.loc?.join('.') || 'field'}: ${e.msg}`).join('\n')
          } else if (typeof errorData.detail === 'string') {
            message = errorData.detail
          }
          throw new Error(message)
        }
        project = await response.json()
      }

      // Upload newly-added files, if any (shared between create and edit)
      if (formData.files && formData.files.length > 0) {
        const fileFormData = new FormData()
        formData.files.forEach(file => {
          fileFormData.append('files', file)
        })

        try {
          await fetch(`${API_BASE}/api/projects/${project.id}/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fileFormData
          })
        } catch (err) {
          console.error('Failed to upload files:', err)
          toast.warning('Project saved but file upload failed.')
        }
      }

      // Link newly-added stakeholders, if any (shared between create and edit)
      for (const s of selectedStakeholders) {
        try {
          await fetch(`${API_BASE}/api/projects/${project.id}/stakeholders/${s.stakeholder_id}?role=${s.role}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        } catch (err) {
          console.error(`Failed to link stakeholder ${s.stakeholder_id}:`, err)
        }
      }

      if (isEdit) {
        toast.success('Your project has been updated.')
        navigate('/profile')
      } else {
        toast.success('Your initiative has been submitted for moderation! It will appear publicly once approved.', {
          icon: '🚀'
        })
        setShowForm(false)
        setFormStep(1)
        setSelectedStakeholders([])
        setFormData(EMPTY_FORM_DATA)
        setDuplicateWarnings([])
        setProjects([])
        doFetch(0, false)
      }
    } catch (err) {
      console.error(isEdit ? 'Error updating project:' : 'Error creating project:', err)
      toast.error('Error: ' + err.message)
    }
  }

  const toggleStakeholder = (stakeholderId) => {
    setSelectedStakeholders(prev =>
      prev.some(s => s.stakeholder_id === stakeholderId)
        ? prev.filter(s => s.stakeholder_id !== stakeholderId)
        : [...prev, { stakeholder_id: stakeholderId, role: 'partner' }]
    )
  }

  const updateStakeholderRole = (stakeholderId, role) => {
    setSelectedStakeholders(prev =>
      prev.map(s => s.stakeholder_id === stakeholderId ? { ...s, role } : s)
    )
  }

  const removeExistingStakeholder = async (stakeholderId) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    try {
      const res = await fetch(`${API_BASE}/api/projects/${editProjectId}/stakeholders/${stakeholderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to remove organization')
      setExistingStakeholders(prev => prev.filter(a => a.stakeholder_id !== stakeholderId))
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  const closeEditForm = () => navigate('/profile')

  const handleNewStakeholderChange = (e) => {
    setNewStakeholder({ ...newStakeholder, [e.target.name]: e.target.value })
  }

  const addNewStakeholder = async () => {
    if (!newStakeholder.name.trim() || !newStakeholder.type) {
      toast.warning('Please fill in required fields (Name and Type)')
      return
    }
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    try {
      const res = await fetch(`${API_BASE}/api/stakeholders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newStakeholder)
      })
      if (!res.ok) throw new Error('Failed to create stakeholder')
      const created = await res.json()
      
      // Refresh list from API then mark as selected
      await fetchStakeholders()
      setSelectedStakeholders(prev => [...prev, { stakeholder_id: created.id, role: 'partner' }])
      setStakeholderSearch('')

      // Reset and close
      setNewStakeholder({ name: '', type: '', country: '', website: '', contact_email: '' })
      setShowAddStakeholder(false)
      toast.success('New organization created and added to your selection!')
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  const clearFilters = () => {
    setFilterCountry('')
    setFilterSector('')
    setFilterSdgNum('')
    setFilterTechnology('')
    setSearchQuery('')
    setSortBy('newest')
  }

  const hasActiveFilters = filterCountry || filterSector || filterSdgNum || filterTechnology || searchQuery

  const handleExportCsv = () => {
    const f = filtersRef.current
    const params = new URLSearchParams()
    if (f.filterCountry) params.set('country', f.filterCountry)
    if (f.filterSector) params.set('sector', f.filterSector)
    if (f.filterSdgNum) params.set('sdg_num', f.filterSdgNum)
    if (f.filterTechnology) params.set('technology', f.filterTechnology)
    if (f.searchQuery) params.set('search', f.searchQuery)
    window.open(`${API_BASE}/api/projects/export?${params}`, '_blank')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Ongoing'
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  if (isEdit && editLoading) {
    return (
      <div className="edit-project-loading">
        <div className="edit-project-spinner" />
        <p>Loading your project…</p>
        <style>{`
          .edit-project-loading { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #64748b; }
          .edit-project-spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top: 4px solid #2563eb; border-radius: 50%; animation: eplSpin 1s linear infinite; }
          @keyframes eplSpin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  return (
    <div className="modern-projects">
      {/* Dynamic Hero */}
      <section className="projects-hero">
        <div className="animated-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        
        <div className="container hero-container">
          <div className="hero-content animate-up">
            <div className="hero-badge">
              <FaRocket />
              <span>Regional Activity</span>
            </div>
            <h1>Project <span className="text-gradient">Stocktaking</span></h1>
            <p>Discover real-world AI initiatives across 22 Arab countries, from desert agriculture to smart cities.</p>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <section className="projects-body">
        <div className="container">
          {/* Action Bar */}
          <div className="projects-action-bar animate-up delay-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search projects or descriptions..."
              className="projects-search"
            />

            <div className="action-buttons">
              {/* Sort dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  className={`filter-btn ${sortBy !== 'newest' ? 'active' : ''}`}
                  onClick={() => setShowSortMenu(v => !v)}
                  title="Sort"
                >
                  <FaSortAmountDown size={13} />
                  {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'A–Z'}
                </button>
                {showSortMenu && (
                  <div className="sort-menu">
                    {[
                      { value: 'newest', label: 'Newest first' },
                      { value: 'oldest', label: 'Oldest first' },
                      { value: 'title',  label: 'A–Z by title' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        className={`sort-menu-opt ${sortBy === opt.value ? 'active' : ''}`}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false) }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className={`filter-btn ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)}>
                <FaFilter /> Filters
                {hasActiveFilters && <span className="badge-dot"></span>}
              </button>

              <button className="filter-btn" onClick={handleExportCsv} title="Export the currently filtered projects as CSV">
                <FaDownload size={13} /> Export CSV
              </button>

              {user && (
                <button className="submit-btn" onClick={() => { setShowForm(!showForm); setFormStep(1); setDuplicateWarnings([]) }}>
                  <FaPlus /> {showForm ? 'Close Form' : 'Submit Project'}
                </button>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {filtersOpen && (
            <div className="modern-filters-panel animate-up">
              <div className="filters-grid filters-grid-4">
                <div className="filter-item">
                  <label>Country</label>
                  <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
                    <option value="">All Countries</option>
                    {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="filter-item">
                  <label>Sector</label>
                  <select value={filterSector} onChange={e => setFilterSector(e.target.value)}>
                    <option value="">All Sectors</option>
                    {metaData.sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="filter-item">
                  <label>Technology</label>
                  <select value={filterTechnology} onChange={e => setFilterTechnology(e.target.value)}>
                    <option value="">All Technologies</option>
                    {metaData.technologies.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="filter-item">
                  <label>SDG Alignment</label>
                  <select value={filterSdgNum} onChange={e => setFilterSdgNum(e.target.value)}>
                    <option value="">All SDGs</option>
                    {sdgList.map(s => (
                      <option key={s.goal_number} value={s.goal_number}>
                        SDG {s.goal_number} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="clear-filters-link" onClick={clearFilters}>Reset all filters</button>
            </div>
          )}

          {/* Submission Form — Multi-step Modal */}
          {showForm && user && (
            <div className="form-overlay" onClick={(e) => { if (e.target === e.currentTarget) { isEdit ? closeEditForm() : setShowForm(false); setFormStep(1) } }}>
              <div className="form-dialog">

                {/* Header */}
                <div className="dialog-header">
                  <div className="dialog-header-left">
                    <div className={`dialog-step-icon step-icon-${formStep}`}>
                      {formStep === 1 && <FaRocket />}
                      {formStep === 2 && <FaMicrochip />}
                      {formStep === 3 && <FaLightbulb />}
                      {formStep === 4 && <FaCity />}
                      {formStep === 5 && <FaSearch />}
                    </div>
                    <div>
                      <p className="dialog-eyebrow">{isEdit ? 'Edit Your Initiative' : 'Submit Your Initiative'}</p>
                      <h2 className="dialog-step-title">
                        {formStep === 1 && 'Project Identity'}
                        {formStep === 2 && 'Technical Profile'}
                        {formStep === 3 && 'Planning & Impact'}
                        {formStep === 4 && 'Stakeholders & Partners'}
                        {formStep === 5 && 'Documents & Review'}
                      </h2>
                    </div>
                  </div>
                  <button type="button" className="dialog-close" onClick={() => { isEdit ? closeEditForm() : setShowForm(false); setFormStep(1) }}>
                    <FaTimes />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="dialog-progress">
                  <div className="dialog-progress-fill" style={{ width: `${(formStep / 5) * 100}%` }}></div>
                </div>

                {/* Step Pills */}
                <div className="dialog-steps">
                  {[
                    { n: 1, label: 'Identity' },
                    { n: 2, label: 'Technical' },
                    { n: 3, label: 'Planning' },
                    { n: 4, label: 'Stakeholders' },
                    { n: 5, label: 'Review' }
                  ].map(s => (
                    <div key={s.n} className={`dialog-step ${formStep === s.n ? 'current' : ''} ${formStep > s.n ? 'completed' : ''}`}>
                      <div className="ds-circle">
                        {formStep > s.n ? <FaCheck /> : s.n}
                      </div>
                      <span className="ds-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="dialog-body">

                    {/* Step 1 — Identity */}
                    {formStep === 1 && (
                      <div className="step-panel">
                        <div className="form-grid">
                          <div className="field full">
                            <label>Project Title <span className="req-star">*</span></label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} onBlur={checkDuplicates} placeholder="e.g. Smart Irrigation AI System in the Delta Region" autoFocus />
                            {duplicateWarnings.length > 0 && (
                              <div className="duplicate-warning">
                                <FaExclamationTriangle size={13} />
                                <div>
                                  <strong>A similar project may already exist</strong> — you can still continue if this isn't a duplicate.
                                  <ul>
                                    {duplicateWarnings.map(m => (
                                      <li key={m.id}>{m.title} {m.country_name ? `(${m.country_name})` : ''} — <em>{m.status}</em></li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="field">
                            <label>Country</label>
                            <select name="country_id" value={formData.country_id} onChange={handleChange}>
                              <option value="">Select Country</option>
                              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="field">
                            <label>Start Date</label>
                            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
                          </div>
                          <div className="field">
                            <label>End Date <span className="opt-tag">optional</span></label>
                            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2 — Technical */}
                    {formStep === 2 && (
                      <div className="step-panel">
                        <button
                          type="button"
                          className={`auto-classify-btn ${classifyDone ? 'done' : ''}`}
                          onClick={autoClassify}
                          disabled={classifying}
                        >
                          {classifying ? (
                            <><span className="classify-spinner" /> Analysing…</>
                          ) : classifyDone ? (
                            <><FaCheck size={12} /> Fields filled!</>
                          ) : (
                            <><FaMicrochip size={12} /> ✨ Auto-suggest Sector & Technology</>
                          )}
                        </button>
                        <div className="form-grid">
                          <div className="field">
                            <label>Primary Sector <span className="req-star">*</span></label>
                            <select name="sector" value={formData.sector} onChange={handleChange}>
                              <option value="">Choose Sector</option>
                              {metaData.sectors.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="field">
                            <label>Core AI Technology <span className="req-star">*</span></label>
                            <select name="technology" value={formData.technology} onChange={handleChange}>
                              <option value="">Choose Technology</option>
                              {metaData.technologies.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="field full">
                            <label>SDG Alignment</label>
                            <select name="sdg_alignment" value={formData.sdg_alignment} onChange={handleChange}>
                              <option value="">Select an SDG goal</option>
                              {sdgList.map(s => (
                                <option key={s.goal_number} value={`SDG ${s.goal_number}: ${s.name}`}>
                                  SDG {s.goal_number} — {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field full">
                            <label>Description <span className="req-star">*</span></label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="5" placeholder="Briefly explain the project goals, impact, and current progress..."></textarea>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3 — Planning */}
                    {formStep === 3 && (
                      <div className="step-panel">
                        <div className="form-grid">
                          <div className="field">
                            <label>Estimated Budget <span className="opt-tag">optional</span></label>
                            <input type="text" name="budget" value={formData.budget} onChange={handleChange} placeholder="e.g. 500,000 USD" />
                          </div>
                          <div className="field">
                            <label>Planned Duration <span className="opt-tag">optional</span></label>
                            <input type="text" name="planned_duration" value={formData.planned_duration} onChange={handleChange} placeholder="e.g. 18 months" />
                          </div>
                          <div className="field full">
                            <label>Geographic Coverage <span className="opt-tag">optional</span></label>
                            <input type="text" name="coverage" value={formData.coverage} onChange={handleChange} placeholder="e.g. National, Regional — Maghreb, Gulf Countries…" />
                          </div>
                          <div className="field full">
                            <label>Planned Tasks <span className="opt-tag">optional</span></label>
                            <textarea name="planned_tasks" value={formData.planned_tasks} onChange={handleChange} rows="4" placeholder="Describe the main tasks and milestones planned for this project…" />
                          </div>
                          <div className="field full">
                            <label>Expected Impact <span className="opt-tag">optional</span></label>
                            <textarea name="expected_impact" value={formData.expected_impact} onChange={handleChange} rows="4" placeholder="Describe the expected social, economic, or technological impact of this project…" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4 — Stakeholders */}
                    {formStep === 4 && (
                      <div className="step-panel">
                        {isEdit && existingStakeholders.length > 0 && (
                          <div className="existing-items-section">
                            <p className="existing-items-label">Already linked</p>
                            <div className="existing-chips">
                              {existingStakeholders.map(a => (
                                <span key={a.stakeholder_id} className="existing-chip">
                                  {a.stakeholder?.name || `#${a.stakeholder_id}`}
                                  <span className="existing-chip-role">· {a.role}</span>
                                  <button
                                    type="button"
                                    className="existing-chip-remove"
                                    onClick={() => removeExistingStakeholder(a.stakeholder_id)}
                                    title="Remove"
                                  >
                                    <FaTimes size={10} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="multi-choice-container">
                          <div className="list-search-wrapper">
                            <FaSearch className="search-icon" />
                            <input
                              type="text"
                              placeholder="Filter organizations..."
                              value={stakeholderSearch}
                              onChange={(e) => setStakeholderSearch(e.target.value)}
                            />
                          </div>
                          <div className="stakeholders-multi-list">
                            {allStakeholders
                              .filter(s => s.name.toLowerCase().includes(stakeholderSearch.toLowerCase()))
                              .map(s => {
                                const isSelected = selectedStakeholders.some(ss => ss.stakeholder_id === s.id)
                                return (
                                  <div key={s.id} className={`list-choice-item ${isSelected ? 'selected' : ''}`}>
                                    <div className="item-main-info" onClick={() => toggleStakeholder(s.id)}>
                                      <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                                        {isSelected && <FaCheck />}
                                      </div>
                                      <div className="org-details">
                                        <span className="org-name">{s.name}</span>
                                        <span className="org-meta">{s.type} · {s.country}</span>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="role-picker">
                                        <label>Role:</label>
                                        <select
                                          value={selectedStakeholders.find(ss => ss.stakeholder_id === s.id)?.role || 'partner'}
                                          onChange={(e) => updateStakeholderRole(s.id, e.target.value)}
                                        >
                                          <option value="partner">Partner</option>
                                          <option value="developer">Developer</option>
                                          <option value="research">Research</option>
                                          <option value="funding">Funding</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            {allStakeholders.filter(s => s.name.toLowerCase().includes(stakeholderSearch.toLowerCase())).length === 0 && (
                              <div className="no-results-msg">No organizations matching your search.</div>
                            )}
                          </div>
                          <div className="list-footer">
                            <button type="button" className="btn-create-new" onClick={() => setShowAddStakeholder(true)}>
                              <FaPlus /> Can't find an organization? Create new
                            </button>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Step 5 — Review & Documents */}
                    {formStep === 5 && (
                      <div className="step-panel">

                        {/* ── Review card — first & prominent ── */}
                        <div className="review-card">
                          <div className="review-card-header">
                            <div className="review-check-circle"><FaCheck /></div>
                            <div>
                              <h4 className="review-card-title">Review your submission</h4>
                              <p className="review-card-sub">Verify the details below before sending</p>
                            </div>
                          </div>

                          <div className="review-fields">
                            <div className="review-field full">
                              <span className="rf-label">Project Title</span>
                              <span className="rf-value rf-title">{formData.title || '—'}</span>
                            </div>
                            <div className="review-field">
                              <span className="rf-label">Country</span>
                              <span className="rf-value">{countries.find(c => String(c.id) === String(formData.country_id))?.name || '—'}</span>
                            </div>
                            <div className="review-field">
                              <span className="rf-label">Period</span>
                              <span className="rf-value">
                                {formData.start_date || '—'}
                                {formData.end_date ? ` → ${formData.end_date}` : ''}
                              </span>
                            </div>
                            <div className="review-field">
                              <span className="rf-label">Sector</span>
                              <span className="rf-badge sector">{formData.sector || '—'}</span>
                            </div>
                            <div className="review-field">
                              <span className="rf-label">Technology</span>
                              <span className="rf-badge tech">{formData.technology || '—'}</span>
                            </div>
                            {formData.sdg_alignment && (
                              <div className="review-field">
                                <span className="rf-label">SDG</span>
                                <span className="rf-badge sdg">{formData.sdg_alignment.split(':')[0]}</span>
                              </div>
                            )}
                            <div className="review-field">
                              <span className="rf-label">Stakeholders</span>
                              <span className="rf-value">{selectedStakeholders.length} organization(s)</span>
                            </div>
                            {formData.budget && (
                              <div className="review-field">
                                <span className="rf-label">Budget</span>
                                <span className="rf-value">{formData.budget}</span>
                              </div>
                            )}
                            {formData.planned_duration && (
                              <div className="review-field">
                                <span className="rf-label">Planned Duration</span>
                                <span className="rf-value">{formData.planned_duration}</span>
                              </div>
                            )}
                            {formData.coverage && (
                              <div className="review-field full">
                                <span className="rf-label">Geographic Coverage</span>
                                <span className="rf-value">{formData.coverage}</span>
                              </div>
                            )}
                            {formData.description && (
                              <div className="review-field full">
                                <span className="rf-label">Description</span>
                                <p className="rf-description">{formData.description}</p>
                              </div>
                            )}
                            {formData.planned_tasks && (
                              <div className="review-field full">
                                <span className="rf-label">Planned Tasks</span>
                                <p className="rf-description">{formData.planned_tasks}</p>
                              </div>
                            )}
                            {formData.expected_impact && (
                              <div className="review-field full">
                                <span className="rf-label">Expected Impact</span>
                                <p className="rf-description">{formData.expected_impact}</p>
                              </div>
                            )}
                          </div>

                          <p className="review-disclaimer">
                            Your submission will be reviewed by our moderation team before being published.
                          </p>
                        </div>

                        {/* ── Already-uploaded documents (edit mode, read-only) ── */}
                        {isEdit && existingDocuments.length > 0 && (
                          <div className="existing-items-section">
                            <p className="existing-items-label">Already uploaded</p>
                            <div className="existing-docs-list">
                              {existingDocuments.map(doc => (
                                <a
                                  key={doc.id}
                                  href={doc.file_url?.startsWith('http') ? doc.file_url : `${API_BASE}${doc.file_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="existing-doc-item"
                                >
                                  <FaFileAlt size={13} />
                                  <span className="existing-doc-name">{doc.original_filename}</span>
                                  {doc.file_size ? <span className="existing-doc-size">({(doc.file_size / 1024).toFixed(1)} KB)</span> : null}
                                  <FaExternalLinkAlt size={10} className="existing-doc-link-icon" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Optional file upload — below review ── */}
                        <div className="upload-optional-section">
                          <p className="upload-optional-label">Attach supporting documents <span className="opt-tag">optional</span></p>
                          <div className="file-upload-wrapper">
                            <input
                              type="file"
                              multiple
                              onChange={handleFileChange}
                              className="file-input-hidden"
                              id="project-files"
                            />
                            <label htmlFor="project-files" className="file-upload-label">
                              <FaPlus className="upload-icon" />
                              <span>{formData.files.length > 0 ? `${formData.files.length} file(s) selected` : 'Click to attach files (PDF, images, reports…)'}</span>
                            </label>
                            {formData.files.length > 0 && (
                              <div className="file-preview-list">
                                {formData.files.map((f, idx) => (
                                  <div key={idx} className="file-preview-item">
                                    <span className="file-name">{f.name}</span>
                                    <span className="file-size">({(f.size / 1024).toFixed(1)} KB)</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Footer Navigation */}
                  <div className="dialog-footer">
                    <button
                      type="button"
                      className="nav-back-btn"
                      onClick={() => { if (formStep === 1) { isEdit ? closeEditForm() : setShowForm(false); setFormStep(1) } else { setFormStep(f => f - 1) } }}
                    >
                      {formStep === 1 ? 'Cancel' : '← Back'}
                    </button>
                    <div className="step-counter">Step {formStep} of 5</div>
                    {formStep < 5 ? (
                      <button type="button" className="nav-next-btn" onClick={nextStep}>
                        Continue →
                      </button>
                    ) : (
                      <button type="submit" className="nav-submit-btn" disabled={submitLocked} style={{ opacity: submitLocked ? 0.5 : 1, cursor: submitLocked ? 'not-allowed' : 'pointer' }}>
                        {submitLocked ? 'Review above…' : <><span>{isEdit ? 'Save Changes' : 'Submit Initiative'}</span> <FaArrowRight /></>}
                      </button>
                    )}
                  </div>
                </form>

              </div>
            </div>
          )}

          {/* New Stakeholder Modal — rendered at root level to escape stacking context */}
          {showAddStakeholder && (
            <div className="new-stakeholder-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddStakeholder(false) }}>
              <div className="new-stakeholder-modal">
                <div className="modal-header">
                  <div className="modal-header-left">
                    <div className="modal-header-icon"><FaCity /></div>
                    <h3>Create New Organization</h3>
                  </div>
                  <button type="button" className="close-btn" onClick={() => setShowAddStakeholder(false)}><FaTimes /></button>
                </div>
                <div className="modal-body">
                  <div className="form-grid-mini">
                    <div className="field">
                      <label>Name <span className="req-star">*</span></label>
                      <input name="name" value={newStakeholder.name} onChange={handleNewStakeholderChange} placeholder="e.g. AI Research Lab" autoFocus />
                    </div>
                    <div className="field">
                      <label>Type <span className="req-star">*</span></label>
                      <select name="type" value={newStakeholder.type} onChange={handleNewStakeholderChange}>
                        <option value="">Select Type</option>
                        <option value="startup">Startup</option>
                        <option value="university">University</option>
                        <option value="government">Government</option>
                        <option value="NGO">NGO</option>
                        <option value="lab">Research Lab</option>
                        <option value="company">Company</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Country</label>
                      <select name="country" value={newStakeholder.country} onChange={handleNewStakeholderChange}>
                        <option value="">Select Country</option>
                        {arabCountries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Website</label>
                      <input name="website" value={newStakeholder.website} onChange={handleNewStakeholderChange} placeholder="https://..." />
                    </div>
                    <div className="field full">
                      <label>Contact Email</label>
                      <input name="contact_email" type="email" value={newStakeholder.contact_email} onChange={handleNewStakeholderChange} placeholder="contact@organization.com" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="modal-cancel-btn" onClick={() => setShowAddStakeholder(false)}>Cancel</button>
                  <button type="button" className="modal-add-btn" onClick={addNewStakeholder}>
                    <FaPlus /> Create & Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results header — count + sort label */}
          {!loading && (
            <div className="results-header">
              <span className="results-count">
                {totalCount === 0
                  ? 'No projects found'
                  : `${totalCount} project${totalCount !== 1 ? 's' : ''} found`}
                {projects.length < totalCount && ` — showing ${projects.length}`}
              </span>
            </div>
          )}

          {/* Results Grid */}
          <div className="results-grid animate-up delay-2">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading projects...</p>
              </div>
            ) : projects.length > 0 ? (
              <>
                <div className="modern-projects-grid">
                  {projects.map((p, i) => {
                    const info = getSectorInfo(p.sector)
                    const countryName = p.country?.name || getCountryName(p.country_id, countries) || 'Regional'
                    const region = getCountryRegion(countryName)
                    return (
                      <div key={p.id} className="modern-project-card" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="card-top">
                          <div className={`sector-icon-box ${info.class}`}>
                            {info.icon}
                          </div>
                          <span className="status-dot-badge">
                            <span className={`dot ${p.status}`}></span>
                            {p.status || 'Active'}
                          </span>
                        </div>

                        <div className="card-mid">
                          <span className="sector-text">{p.sector}</span>
                          <h3>{p.title}</h3>
                          <p className="project-dates">
                            {formatDate(p.start_date)} — {formatDate(p.end_date)}
                          </p>
                          <p className="country-tag">{countryName} · {region}</p>
                        </div>

                        <div className="stakeholders-list">
                          <div className="stakeholder-avatars">
                            {p.stakeholder_associations?.slice(0, 3).map((assoc, idx) => (
                              <div key={idx} className="stakeholder-tag" title={assoc.stakeholder.name}>
                                {assoc.stakeholder.name.substring(0, 2).toUpperCase()}
                              </div>
                            ))}
                            {p.stakeholder_associations?.length > 3 && (
                              <div className="stakeholder-tag more">+{p.stakeholder_associations.length - 3}</div>
                            )}
                          </div>
                          <span className="stakeholder-count">
                            {p.stakeholder_associations?.length || 0} Stakeholder(s)
                          </span>
                        </div>

                        <div className="card-bottom">
                          <div className="meta-info">
                            <div className="meta-col">
                              <span className="meta-label">Technology</span>
                              <span className="meta-value">{p.ai_technology}</span>
                            </div>
                          </div>
                          <div className="sdg-badge">
                            {getSDGNumber(p.sdg_alignment) || 'N/A'}
                          </div>
                        </div>

                        <div className="card-actions">
                          <Link to={`/project/${p.id}`} className="learn-more-btn">
                            Learn More <FaArrowRight />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="load-more-wrap">
                    <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? (
                        <><span className="spinner-sm" /> Loading…</>
                      ) : (
                        `Load more (${totalCount - projects.length} remaining)`
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-results-card">
                <div className="no-results-icon">🚀</div>
                <h3>No projects found</h3>
                <p>Your search returned no matches. Try a different query or submit your own project.</p>
                <button className="reset-btn" onClick={clearFilters}>Reset Filters</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .modern-projects {
          --p-primary: #2563eb;
          --p-secondary: #0f172a;
          --p-text: #1e293b;
          --p-text-light: #64728b;
          
          font-family: 'Outfit', sans-serif;
          color: var(--p-text);
          background: #fff;
          min-height: 100vh;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Hero */
        .projects-hero {
          position: relative;
          padding: 120px 0 80px;
          background: #fff;
          overflow: hidden;
          text-align: center;
        }

        .animated-blobs {
          position: absolute;
          width: 100%; height: 100%;
          top: 0; left: 0;
          filter: blur(70px);
          opacity: 0.3;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          background: var(--p-primary);
          animation: float 15s infinite alternate;
        }

        .blob-1 { width: 300px; height: 300px; top: -50px; left: 5%; background: #60a5fa; }
        .blob-2 { width: 250px; height: 250px; bottom: -50px; right: 5%; background: #93c5fd; animation-delay: -5s; }

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
          color: var(--p-primary);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 24px;
        }

        .projects-hero h1 {
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

        .projects-hero p {
          font-size: 1.2rem;
          color: var(--p-text-light);
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Action Bar */
        .projects-body { padding-bottom: 100px; }

        .projects-action-bar {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          margin-bottom: 40px;
          margin-top: -30px;
          position: relative;
          z-index: 10;
        }

        .search-box {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
        }

        .search-icon { color: var(--p-text-light); }
        .search-box input {
          flex: 1;
          border: none;
          padding: 16px 0;
          font-size: 1rem;
          outline: none;
          font-family: inherit;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          padding-right: 8px;
          flex-shrink: 0;
        }

        .filter-btn, .submit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: 0.3s;
          border: none;
          font-family: inherit;
          white-space: nowrap;
        }

        .filter-btn {
          background: #f8fafc;
          color: var(--p-secondary);
          border: 1px solid #f1f5f9;
          position: relative;
        }
        .filter-btn.active { background: #eff6ff; border-color: #bfdbfe; color: var(--p-primary); }
        .badge-dot { width: 8px; height: 8px; background: var(--p-primary); border-radius: 50%; }

        .submit-btn { background: var(--p-secondary); color: #fff; }
        .submit-btn:hover { background: #1e293b; transform: translateY(-2px); }

        /* Sort menu */
        .sort-menu {
          position: absolute; right: 0; top: calc(100% + 6px);
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.09); z-index: 200; min-width: 160px; overflow: hidden;
        }
        .sort-menu-opt {
          display: block; width: 100%; padding: 10px 16px; text-align: left;
          background: none; border: none; cursor: pointer; font-size: 0.85rem;
          font-family: inherit; color: #334155; font-weight: 500; transition: background 0.15s;
        }
        .sort-menu-opt:hover { background: #f8fafc; }
        .sort-menu-opt.active { color: var(--p-primary); font-weight: 700; background: #eff6ff; }

        /* Results count */
        .results-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; margin-top: -16px;
        }
        .results-count {
          font-size: 0.82rem; font-weight: 600; color: var(--p-text-light);
        }

        /* Load more */
        .load-more-wrap { display: flex; justify-content: center; margin-top: 36px; }
        .load-more-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 32px; background: #fff; border: 1.5px solid #e2e8f0;
          border-radius: 16px; font-weight: 700; font-size: 0.9rem; color: var(--p-primary);
          cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .load-more-btn:hover:not(:disabled) { background: #eff6ff; border-color: #bfdbfe; transform: translateY(-2px); }
        .load-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner-sm {
          width: 14px; height: 14px; border: 2px solid #bfdbfe;
          border-top-color: var(--p-primary); border-radius: 50%;
          animation: spin 0.7s linear infinite; display: inline-block;
        }

        /* Modern Filters */
        .modern-filters-panel {
          background: #f8fafc;
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid #f1f5f9;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .filters-grid-4 {
          grid-template-columns: repeat(4, 1fr);
        }

        .filter-item label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--p-text-light); margin-bottom: 8px; letter-spacing: 0.5px; }
        .filter-item select {
          width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #fff;
          font-weight: 600; outline: none; cursor: pointer; font-family: inherit;
        }

        .clear-filters-link {
          margin-top: 16px; background: none; border: none; color: var(--p-primary); font-weight: 700; font-size: 0.85rem; cursor: pointer; padding: 0;
        }

        /* ── Multi-step Modal Form ── */
        .form-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .form-dialog {
          background: #fff;
          width: 100%;
          max-width: 700px;
          max-height: 92vh;
          border-radius: 28px;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.35);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .dialog-header {
          padding: 22px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }
        .dialog-header-left { display: flex; align-items: center; gap: 16px; }

        .dialog-step-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #60a5fa);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.15rem;
          flex-shrink: 0;
        }
        .dialog-step-icon.step-icon-2 { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
        .dialog-step-icon.step-icon-3 { background: linear-gradient(135deg, #059669, #34d399); }
        .dialog-step-icon.step-icon-4 { background: linear-gradient(135deg, #d97706, #fbbf24); }

        .dialog-eyebrow {
          font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
          color: var(--p-text-light); margin: 0;
        }
        .dialog-step-title {
          font-size: 1.2rem; font-weight: 800; margin: 3px 0 0; color: var(--p-secondary);
        }

        .dialog-close {
          width: 36px; height: 36px; border-radius: 10px;
          background: #f8fafc; border: 1px solid #f1f5f9;
          color: var(--p-text-light);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 0.9rem; transition: 0.2s; flex-shrink: 0;
        }
        .dialog-close:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }

        /* Progress Bar */
        .dialog-progress { height: 3px; background: #f1f5f9; flex-shrink: 0; }
        .dialog-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
          transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Step Pills */
        .dialog-steps {
          display: flex;
          padding: 14px 28px;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
          gap: 4px;
          overflow-x: auto;
        }
        .dialog-step {
          display: flex; align-items: center; gap: 8px;
          flex: 1; position: relative; padding-right: 12px;
        }
        .dialog-step:not(:last-child)::after {
          content: '';
          position: absolute; right: -4px; top: 50%; transform: translateY(-50%);
          width: 16px; height: 1px; background: #e2e8f0;
        }
        .dialog-step.completed::after { background: #10b981; }

        .ds-circle {
          width: 26px; height: 26px; border-radius: 50%;
          background: #f1f5f9; color: var(--p-text-light);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: 800; flex-shrink: 0; transition: 0.3s;
        }
        .dialog-step.current .ds-circle {
          background: var(--p-primary); color: #fff;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.15);
        }
        .dialog-step.completed .ds-circle { background: #10b981; color: #fff; }

        .ds-label {
          font-size: 0.72rem; font-weight: 700; color: var(--p-text-light); white-space: nowrap;
        }
        .dialog-step.current .ds-label { color: var(--p-primary); }
        .dialog-step.completed .ds-label { color: #10b981; }

        /* form must be a flex child so footer stays visible */
        .form-dialog form {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        /* Dialog Body */
        .dialog-body { flex: 1; overflow-y: auto; padding: 28px; min-height: 0; }
        .step-panel { animation: fadeUp 0.22s ease; }

        /* Auto-classify button */
        .auto-classify-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #4f46e5, #0891b2);
          color: #fff; border: none; border-radius: 12px;
          padding: 9px 18px; font-size: 0.82rem; font-weight: 700;
          cursor: pointer; transition: 0.2s; font-family: inherit;
          margin-bottom: 18px; box-shadow: 0 4px 14px rgba(79,70,229,0.3);
        }
        .auto-classify-btn:hover:not(:disabled) {
          opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(79,70,229,0.4);
        }
        .auto-classify-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .auto-classify-btn.done { background: linear-gradient(135deg, #059669, #0d9488); }
        .classify-spinner {
          width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spinAnim 0.6s linear infinite; display: inline-block;
        }
        @keyframes spinAnim { to { transform: rotate(360deg); } }


        /* Form fields */
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .field { display: flex; flex-direction: column; gap: 8px; }
        .field.full { grid-column: span 2; }
        .field label { font-weight: 700; font-size: 0.85rem; color: var(--p-secondary); }
        .req-star { color: #ef4444; margin-left: 2px; }
        .opt-tag { font-size: 0.68rem; font-weight: 500; color: var(--p-text-light); margin-left: 6px; }
        .duplicate-warning {
          display: flex; gap: 10px; align-items: flex-start;
          margin-top: 10px; padding: 10px 14px; border-radius: 12px;
          background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25);
          color: #92400e; font-size: 0.82rem; line-height: 1.5;
        }
        .duplicate-warning svg { margin-top: 2px; flex-shrink: 0; color: #f59e0b; }
        .duplicate-warning ul { margin: 6px 0 0; padding-left: 18px; }
        .duplicate-warning li { margin-bottom: 2px; }
        .field input, .field select, .field textarea {
          padding: 13px 16px; border-radius: 12px; border: 2px solid #f1f5f9; background: #f8fafc;
          font-family: inherit; font-size: 0.95rem; outline: none; transition: 0.2s; color: var(--p-text);
        }
        .field input:focus, .field select:focus, .field textarea:focus {
          border-color: var(--p-primary); background: #fff; box-shadow: 0 0 0 4px rgba(37,99,235,0.06);
        }

        /* ── Review Card (Step 4) ── */
        .review-card {
          background: linear-gradient(135deg, #f0f7ff, #fff);
          border: 2px solid #bfdbfe;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .review-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
          padding-bottom: 18px;
          border-bottom: 1px solid #dbeafe;
        }
        .review-check-circle {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #60a5fa);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; flex-shrink: 0;
        }
        .review-card-title { font-size: 1rem; font-weight: 800; color: var(--p-secondary); margin: 0; }
        .review-card-sub { font-size: 0.78rem; color: var(--p-text-light); margin: 2px 0 0; }

        .review-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 18px;
        }
        .review-field { display: flex; flex-direction: column; gap: 5px; }
        .review-field.full { grid-column: span 2; }
        .rf-label {
          font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.8px; color: #6b8bb5;
        }
        .rf-value { font-size: 0.95rem; font-weight: 700; color: var(--p-secondary); }
        .rf-title { font-size: 1.05rem; font-weight: 800; color: var(--p-secondary); }
        .rf-description {
          font-size: 0.88rem; color: var(--p-text-light); line-height: 1.6;
          background: #fff; border: 1px solid #dbeafe; border-radius: 10px;
          padding: 12px 14px; margin: 0;
        }
        .rf-badge {
          display: inline-flex; align-items: center;
          padding: 4px 12px; border-radius: 100px;
          font-size: 0.8rem; font-weight: 700;
        }
        .rf-badge.sector { background: #eff6ff; color: #2563eb; }
        .rf-badge.tech { background: #f5f3ff; color: #7c3aed; }
        .rf-badge.sdg { background: #ecfdf5; color: #059669; }

        .review-disclaimer {
          font-size: 0.78rem; color: #6b8bb5;
          background: rgba(37,99,235,0.05); border: 1px solid #bfdbfe;
          border-radius: 10px; padding: 10px 14px; margin: 0; line-height: 1.5;
        }

        .existing-items-section { margin-bottom: 18px; }
        .existing-items-label {
          font-size: 0.78rem; font-weight: 700; color: var(--p-text-light);
          text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;
        }
        .existing-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .existing-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1;
          border-radius: 100px; padding: 6px 8px 6px 14px;
          font-size: 0.8rem; font-weight: 600;
        }
        .existing-chip-role { color: #64748b; font-weight: 500; }
        .existing-chip-remove {
          display: flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 50%; border: none;
          background: rgba(3,105,161,0.1); color: #0369a1; cursor: pointer;
        }
        .existing-chip-remove:hover { background: #ef4444; color: #fff; }
        .existing-docs-list { display: flex; flex-direction: column; gap: 6px; }
        .existing-doc-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; text-decoration: none; color: var(--p-text);
          font-size: 0.82rem; transition: 0.2s;
        }
        .existing-doc-item:hover { background: #eff6ff; border-color: #bfdbfe; }
        .existing-doc-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .existing-doc-size { color: #94a3b8; flex-shrink: 0; }
        .existing-doc-link-icon { margin-left: auto; flex-shrink: 0; color: #94a3b8; }

        .upload-optional-section { margin-top: 4px; }
        .upload-optional-label {
          font-size: 0.82rem; font-weight: 700; color: var(--p-text-light);
          margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
        }

        /* Dialog Footer */
        .dialog-footer {
          padding: 14px 28px; border-top: 1px solid #f1f5f9;
          display: flex; align-items: center; gap: 12px; flex-shrink: 0; background: #fff;
        }
        .step-counter { flex: 1; text-align: center; font-size: 0.78rem; font-weight: 600; color: var(--p-text-light); }

        .nav-back-btn {
          padding: 11px 20px; background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 12px; font-weight: 700; font-size: 0.88rem;
          color: var(--p-text-light); cursor: pointer; transition: 0.2s; font-family: inherit;
        }
        .nav-back-btn:hover { background: #f1f5f9; color: var(--p-secondary); }

        .nav-next-btn {
          padding: 11px 24px; background: var(--p-primary); color: #fff; border: none;
          border-radius: 12px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.2s; font-family: inherit;
        }
        .nav-next-btn:hover { background: #1d4ed8; transform: translateY(-1px); }

        .nav-submit-btn {
          padding: 11px 24px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none;
          border-radius: 12px; font-weight: 700; font-size: 0.88rem; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: 0.25s; font-family: inherit;
          box-shadow: 0 4px 14px rgba(37,99,235,0.4);
        }
        .nav-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.5); }


        /* Project Grid & Cards */
        .modern-projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .modern-project-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: 0.3s;
          animation: fadeUp 0.5s ease both;
        }
        .modern-project-card:hover { transform: translateY(-5px); border-color: #e2e8f0; box-shadow: 0 20px 40px rgba(0,0,0,0.03); }

        .card-top { display: flex; justify-content: space-between; align-items: center; }
        .sector-icon-box {
          width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }
        .status-dot-badge {
          display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--p-text-light);
          padding: 4px 12px; background: #f8fafc; border-radius: 100px;
        }
        .status-dot-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; }
        .status-dot-badge .dot.active { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }

        .card-mid .sector-text { font-size: 0.75rem; font-weight: 700; color: var(--p-primary); text-transform: uppercase; letter-spacing: 1px; }
        .card-mid h3 { font-size: 1.25rem; font-weight: 800; margin: 8px 0 4px; line-height: 1.3; }
        .card-mid .org-text { font-size: 0.9rem; color: var(--p-text-light); font-weight: 500; }

        .card-bottom {
          margin-top: auto; padding-top: 20px; border-top: 1px solid #f1f5f9;
          display: flex; justify-content: space-between; align-items: flex-end;
        }
        .meta-info { display: flex; gap: 20px; }
        .meta-col { display: flex; flex-direction: column; gap: 4px; }
        .meta-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--p-text-light); letter-spacing: 0.5px; }
        .meta-value { font-size: 0.85rem; font-weight: 700; color: var(--p-secondary); }
        .sdg-badge { background: #f1f5f9; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; color: var(--p-secondary); }

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
          color: var(--p-primary);
          border-radius: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: 0.3s;
          border: 1.5px solid #e2e8f0;
        }
        .learn-more-btn:hover {
          background: var(--p-primary);
          color: #fff;
          border-color: var(--p-primary);
          transform: translateY(-2px);
        }

        /* Sector Color Classes */
        .edu { background: #eff6ff; color: #3b82f6; }
        .agri { background: #ecfdf5; color: #10b981; }
        .health { background: #fef2f2; color: #ef4444; }
        .fin { background: #f5f3ff; color: #8b5cf6; }
        .trans { background: #fff7ed; color: #f97316; }
        .energy { background: #fffbeb; color: #f59e0b; }
        .env { background: #f0fdf4; color: #22c55e; }
        .security { background: #f8fafc; color: #475569; }

        /* Helpers */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: var(--p-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-state { text-align: center; padding: 60px 0; }
        .no-results-card { text-align: center; background: #fff; padding: 60px; border-radius: 32px; border: 1px solid #f1f5f9; }
        .no-results-icon { font-size: 3rem; margin-bottom: 16px; }
        .reset-btn { margin-top: 24px; background: var(--p-primary); color: #fff; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; }

        .stakeholder-select-wrap {
          background: #f8fafc; border: 2px solid #f1f5f9; border-radius: 20px; padding: 20px;
          display: flex; flex-direction: column; gap: 16px;
        }
        
        /* Multi-Choice List Styles */
        .multi-choice-container {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          margin-bottom: 24px;
        }

        .list-search-wrapper {
          padding: 16px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .list-search-wrapper input {
          flex: 1;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 0.95rem;
        }

        .stakeholders-multi-list {
          max-height: 350px;
          overflow-y: auto;
          background: #fff;
        }

        .list-choice-item {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid #f1f5f9;
          transition: 0.2s;
        }
        .list-choice-item:hover { background: #f8fafc; }
        .list-choice-item.selected { background: #eff6ff; }

        .item-main-info {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
        }

        .custom-checkbox {
          width: 22px;
          height: 22px;
          border: 2px solid #cbd5e1;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          color: #fff;
          font-size: 0.7rem;
          transition: 0.2s;
        }
        .custom-checkbox.checked {
          background: var(--p-primary);
          border-color: var(--p-primary);
        }

        .org-details { display: flex; flex-direction: column; }
        .org-name { font-weight: 700; color: var(--p-secondary); font-size: 0.95rem; }
        .org-meta { font-size: 0.75rem; color: var(--p-text-light); }

        .role-picker {
          padding: 8px 16px 16px 54px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: fadeUp 0.2s ease;
        }
        .role-picker label { font-size: 0.75rem; font-weight: 800; color: var(--p-text-light); text-transform: uppercase; }
        .role-picker select {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #bfdbfe;
          background: #fff;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--p-primary);
          outline: none;
        }

        .no-results-msg { padding: 32px; text-align: center; color: var(--p-text-light); font-size: 0.9rem; }

        .list-footer {
          padding: 12px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .btn-create-new {
          background: none;
          border: none;
          color: var(--p-primary);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 auto;
        }

        /* ── New Stakeholder Modal ── */
        .new-stakeholder-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .new-stakeholder-modal {
          background: #fff;
          width: 100%;
          max-width: 520px;
          border-radius: 24px;
          box-shadow: 0 32px 64px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.04);
          overflow: hidden;
          animation: fadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(135deg, #f8fafc, #fff);
        }
        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .modal-header-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #059669, #34d399);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem;
        }
        .modal-header h3 { font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--p-secondary); }

        .close-btn {
          width: 32px; height: 32px; border-radius: 8px;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          color: var(--p-text-light); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; transition: 0.2s; flex-shrink: 0;
        }
        .close-btn:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }

        .modal-body { padding: 24px; }
        .form-grid-mini { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-grid-mini .field.full { grid-column: span 2; }

        .modal-footer {
          padding: 14px 24px 20px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
        }

        .modal-cancel-btn {
          padding: 10px 20px;
          background: #fff; border: 1.5px solid #e2e8f0;
          border-radius: 10px; font-weight: 700; font-size: 0.88rem;
          color: var(--p-text-light); cursor: pointer; transition: 0.2s; font-family: inherit;
        }
        .modal-cancel-btn:hover { background: #f8fafc; color: var(--p-secondary); }

        .modal-add-btn {
          padding: 10px 22px;
          background: linear-gradient(135deg, #059669, #047857);
          color: #fff; border: none;
          border-radius: 10px; font-weight: 700; font-size: 0.88rem;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: 0.2s; font-family: inherit;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
        }
        .modal-add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(5, 150, 105, 0.45); }

        .field-hint { font-size: 0.85rem; color: var(--p-text-light); margin-bottom: 16px; margin-top: -8px; }

        /* File Upload Styles */
        .file-upload-wrapper {
          background: #f8fafc;
          border: 2px dashed #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          text-align: center;
          transition: 0.3s;
        }
        .file-upload-wrapper:hover { border-color: var(--p-primary); background: #eff6ff; }
        .file-input-hidden { display: none; }
        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--p-text-light);
          font-weight: 600;
        }
        .upload-icon { font-size: 1.5rem; color: var(--p-primary); }
        .file-preview-list {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }
        .file-preview-item {
          background: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .file-name { font-weight: 600; color: var(--p-secondary); }
        .file-size { color: var(--p-text-light); }

        @media (max-width: 1024px) {
          .projects-action-bar { flex-direction: column; padding: 16px; }
          .search-box { width: 100%; border-bottom: 1px solid #f1f5f9; margin-bottom: 8px; }
          .filters-grid { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
          .field.full { grid-column: span 1; }
        }

        /* ── Dark mode ── */
        /* ── Dark mode — modal form ── */
        [data-theme="dark"] .new-stakeholder-modal-overlay { background: rgba(0, 0, 0, 0.8); }
        [data-theme="dark"] .new-stakeholder-modal { background: #1e293b; box-shadow: 0 32px 64px -12px rgba(0,0,0,0.6); }
        [data-theme="dark"] .modal-header { background: #1e293b; border-bottom-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .modal-header h3 { color: #f1f5f9; }
        [data-theme="dark"] .close-btn { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.08); }
        [data-theme="dark"] .modal-body { background: #1e293b; }
        [data-theme="dark"] .modal-footer { background: rgba(255,255,255,0.02); border-top-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .modal-cancel-btn { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); color: #94a3b8; }

        [data-theme="dark"] .form-overlay { background: rgba(0, 0, 0, 0.75); }
        [data-theme="dark"] .form-dialog { background: #1e293b; }
        [data-theme="dark"] .dialog-header { border-bottom-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .dialog-step-title { color: #f1f5f9; }
        [data-theme="dark"] .dialog-close { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .dialog-progress { background: rgba(255,255,255,0.06); }
        [data-theme="dark"] .dialog-steps { border-bottom-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .dialog-step:not(:last-child)::after { background: rgba(255,255,255,0.08); }
        [data-theme="dark"] .ds-circle { background: rgba(255,255,255,0.08); }
        [data-theme="dark"] .dialog-body { background: #1e293b; }
        [data-theme="dark"] .review-summary { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .review-note { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .dialog-footer { background: #1e293b; border-top-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .nav-back-btn { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); color: #94a3b8; }
        [data-theme="dark"] .nav-back-btn:hover { background: rgba(255,255,255,0.1); }
        [data-theme="dark"] .review-card { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.25); }
        [data-theme="dark"] .review-card-header { border-bottom-color: rgba(37,99,235,0.2); }
        [data-theme="dark"] .review-card-title { color: #f1f5f9; }
        [data-theme="dark"] .rf-value, [data-theme="dark"] .rf-title { color: #f1f5f9; }
        [data-theme="dark"] .rf-description { background: rgba(255,255,255,0.03); border-color: rgba(37,99,235,0.2); }
        [data-theme="dark"] .review-disclaimer { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.2); }

        [data-theme="dark"] .modern-projects {
          --p-secondary: #f1f5f9;
          --p-text: #e2e8f0;
          --p-text-light: #94a3b8;
          background: #0f172a;
          color: #e2e8f0;
        }
        [data-theme="dark"] .projects-hero { background: #0f172a; }
        [data-theme="dark"] .projects-action-bar { background: #1e293b; border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .search-box { background: rgba(255,255,255,0.07); border-color: transparent; }
        [data-theme="dark"] .search-box input { color: #e2e8f0; }
        [data-theme="dark"] .filter-btn { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
        [data-theme="dark"] .filter-btn.active { background: rgba(37,99,235,0.15); border-color: rgba(59,130,246,0.3); }
        [data-theme="dark"] .field input,
        [data-theme="dark"] .field select,
        [data-theme="dark"] .field textarea { background: #0f172a; border-color: rgba(255,255,255,0.1); color: #f1f5f9; }
        [data-theme="dark"] .field input:focus,
        [data-theme="dark"] .field select:focus,
        [data-theme="dark"] .field textarea:focus { background: #0f172a; border-color: #3b82f6; }
        [data-theme="dark"] .submit-btn { background: var(--p-primary); color: #fff; }
        [data-theme="dark"] .submit-btn:hover { background: #1d4ed8; }
        [data-theme="dark"] .cancel-btn { background: rgba(255,255,255,0.07); color: #94a3b8; }
        [data-theme="dark"] .modern-project-card { background: #1e293b; border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .modern-project-card:hover { border-color: rgba(255,255,255,0.12); }
        [data-theme="dark"] .status-dot-badge { background: rgba(255,255,255,0.06); }
        [data-theme="dark"] .sdg-badge { background: rgba(255,255,255,0.07); }
        [data-theme="dark"] .edu { background: rgba(59,130,246,0.1); }
        [data-theme="dark"] .agri { background: rgba(16,185,129,0.1); }
        [data-theme="dark"] .health { background: rgba(239,68,68,0.1); }
        [data-theme="dark"] .fin { background: rgba(139,92,246,0.1); }
        [data-theme="dark"] .trans { background: rgba(249,115,22,0.1); }
        [data-theme="dark"] .energy { background: rgba(245,158,11,0.1); }
        [data-theme="dark"] .env { background: rgba(34,197,94,0.1); }
        [data-theme="dark"] .security { background: rgba(71,85,105,0.15); }
        [data-theme="dark"] .no-results-card { background: #1e293b; border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .file-preview-item { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .search-box { border-bottom-color: rgba(255,255,255,0.06); }
        [data-theme="dark"] .sort-menu { background: #1e293b; border-color: rgba(255,255,255,0.08); }
        [data-theme="dark"] .sort-menu-opt { color: #cbd5e1; }
        [data-theme="dark"] .sort-menu-opt:hover { background: rgba(255,255,255,0.06); }
        [data-theme="dark"] .sort-menu-opt.active { background: rgba(37,99,235,0.15); color: #60a5fa; }
        [data-theme="dark"] .results-count { color: #64748b; }
        [data-theme="dark"] .load-more-btn { background: #1e293b; border-color: rgba(255,255,255,0.1); color: #60a5fa; }
        [data-theme="dark"] .load-more-btn:hover:not(:disabled) { background: rgba(37,99,235,0.12); border-color: rgba(59,130,246,0.3); }

        @media (max-width: 1024px) {
          .filters-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .filters-grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

export default ProjectStocktaking
