import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaEnvelope, FaPhone, FaGlobe, FaMapMarkerAlt, FaRocket, FaStar
} from 'react-icons/fa'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [avatarHover, setAvatarHover] = useState(false)
  const [toast, setToast] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    if (!token || !storedUser) {
      navigate('/')
      return
    }
    try {
      const parsed = JSON.parse(storedUser)
      setUser(parsed)
      setForm({
        organization_name: parsed.organization_name || '',
        organization_type: parsed.organization_type || '',
        phone: parsed.phone || '',
        website: parsed.website || '',
        country: parsed.country || '',
        city: parsed.city || '',
        address: parsed.address || '',
        sector: parsed.sector || '',
        description: parsed.description || ''
      })
    } catch {
      navigate('/')
    }
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    if (!user) return
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
        const res = await fetch(`${API_BASE}/api/projects/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setProjects(await res.json())
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setProjectsLoading(false)
      }
    }
    fetchProjects()
  }, [user])

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organization_name: form.organization_name,
          organization_type: form.organization_type,
          phone: form.phone,
          website: form.website,
          country: form.country,
          city: form.city,
          address: form.address,
          sector: form.sector,
          description: form.description
        })
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setUser(prev => ({ ...prev, ...updated }))
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage
      storage.setItem('user', JSON.stringify({ ...user, ...updated }))
      setEditing(false)
      setToast({ type: 'success', message: 'Profile updated successfully' })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      organization_name: user?.organization_name || '',
      organization_type: user?.organization_type || '',
      phone: user?.phone || '',
      website: user?.website || '',
      country: user?.country || '',
      city: user?.city || '',
      address: user?.address || '',
      sector: user?.sector || '',
      description: user?.description || ''
    })
    setEditing(false)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
        const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ logo: base64 })
        })
        if (!res.ok) throw new Error('Failed')
        const updated = await res.json()
        setUser(prev => ({ ...prev, ...updated }))
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage
        storage.setItem('user', JSON.stringify({ ...user, ...updated }))
        setToast({ type: 'success', message: 'Logo updated' })
      } catch {
        setToast({ type: 'error', message: 'Failed to upload logo' })
      }
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const sectorTags = user.sector ? user.sector.split(/[,;]+/).map(s => s.trim()).filter(Boolean) : []
  const formSectorTags = form.sector ? form.sector.split(/[,;]+/).map(s => s.trim()).filter(Boolean) : []

  return (
    <div className="profile-page">
      {toast && (
        <div className={`profile-toast profile-toast-${toast.type}`}>
          {toast.type === 'success' ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          {toast.message}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-banner-gradient"></div>
          <div className="profile-header-content">
            <div
              className="profile-avatar-container"
              onMouseEnter={() => editing && setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
            >
              {user.logo ? (
                <img src={user.logo} alt={user.organization_name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <svg viewBox="0 0 80 90" fill="none">
                    <ellipse cx="40" cy="28" rx="18" ry="18" fill="#94a3b8"/>
                    <ellipse cx="40" cy="80" rx="34" ry="24" fill="#94a3b8"/>
                  </svg>
                </div>
              )}
              {editing && (
                <>
                  <div className={`profile-avatar-overlay ${avatarHover ? 'visible' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="20" height="20">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <input type="file" accept="image/*" className="profile-avatar-input" onChange={handleLogoUpload} />
                </>
              )}
            </div>

            <div className="profile-header-info">
              {editing ? (
                <input
                  type="text"
                  className="profile-edit-title"
                  value={form.organization_name}
                  onChange={e => handleChange('organization_name', e.target.value)}
                  placeholder="Organization name"
                />
              ) : (
                <h1>{user.organization_name || 'Organization'}</h1>
              )}
              {editing ? (
                <select
                  className="profile-edit-select"
                  value={form.organization_type}
                  onChange={e => handleChange('organization_type', e.target.value)}
                >
                  <option value="" disabled>Select type</option>
                  <option value="NGO">NGO</option>
                  <option value="Startup">Startup</option>
                  <option value="Company">Company</option>
                  <option value="Government">Government</option>
                  <option value="University">University</option>
                  <option value="Research Lab">Research Lab</option>
                </select>
              ) : (
                <p className="profile-org-type">{user.organization_type}</p>
              )}
              {editing ? (
                <div className="profile-edit-location-row">
                  <input
                    type="text"
                    className="profile-edit-input-sm"
                    value={form.city}
                    onChange={e => handleChange('city', e.target.value)}
                    placeholder="City"
                  />
                  <span className="profile-edit-sep">,</span>
                  <input
                    type="text"
                    className="profile-edit-input-sm"
                    value={form.country}
                    onChange={e => handleChange('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              ) : (
                <p className="profile-location">
                  <FaMapMarkerAlt size={12} />
                  {user.city && user.country ? `${user.city}, ${user.country}` : user.country || user.city || 'Not specified'}
                </p>
              )}
            </div>

            <div className="profile-header-actions">
              {editing ? (
                <div className="profile-edit-actions">
                  <button className="profile-btn-edit profile-btn-cancel" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                  <button className="profile-btn-edit profile-btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <span className="profile-save-spinner"></span>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        Save
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button className="profile-edit-toggle" onClick={() => setEditing(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="profile-body">
          <div className="profile-section">
            <h2 className="profile-section-title">
              <FaEnvelope size={14} /> Contact Information
            </h2>
            <div className="profile-details-grid">
              <div className="profile-detail-item">
                <div className="profile-detail-icon-wrap">
                  <FaEnvelope size={14} />
                </div>
                <div className="profile-detail-content">
                  <span className="profile-detail-label">Email</span>
                  {editing ? (
                    <input type="email" className="profile-edit-field" value={user.email} disabled title="Email cannot be changed" />
                  ) : (
                    <span className="profile-detail-value">{user.email || 'Not provided'}</span>
                  )}
                </div>
              </div>
              <div className="profile-detail-item">
                <div className="profile-detail-icon-wrap">
                  <FaPhone size={14} />
                </div>
                <div className="profile-detail-content">
                  <span className="profile-detail-label">Phone</span>
                  {editing ? (
                    <input type="tel" className="profile-edit-field" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+216 XX XXX XXX" />
                  ) : (
                    <span className="profile-detail-value">{user.phone || 'Not provided'}</span>
                  )}
                </div>
              </div>
              <div className="profile-detail-item">
                <div className="profile-detail-icon-wrap">
                  <FaGlobe size={14} />
                </div>
                <div className="profile-detail-content">
                  <span className="profile-detail-label">Website</span>
                  {editing ? (
                    <input type="url" className="profile-edit-field" value={form.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://example.com" />
                  ) : user.website ? (
                    <span className="profile-detail-value"><a href={user.website} target="_blank" rel="noopener noreferrer">{user.website}</a></span>
                  ) : (
                    <span className="profile-detail-value">Not provided</span>
                  )}
                </div>
              </div>
              <div className="profile-detail-item">
                <div className="profile-detail-icon-wrap">
                  <FaMapMarkerAlt size={14} />
                </div>
                <div className="profile-detail-content">
                  <span className="profile-detail-label">Address</span>
                  {editing ? (
                    <input type="text" className="profile-edit-field" value={form.address} onChange={e => handleChange('address', e.target.value)} placeholder="Street address" />
                  ) : (
                    <span className="profile-detail-value">{user.address || 'Not provided'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2 className="profile-section-title">
              <FaStar size={14} /> Description & Expertise
            </h2>
            {editing ? (
              <div className="profile-edit-section">
                <textarea
                  className="profile-edit-textarea"
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Brief description of your organization..."
                  rows={3}
                />
                <input
                  type="text"
                  className="profile-edit-field"
                  value={form.sector}
                  onChange={e => handleChange('sector', e.target.value)}
                  placeholder="Sectors (comma separated): AI, Healthcare, Finance..."
                />
              </div>
            ) : (
              <>
                {user.description && (
                  <p className="profile-description">{user.description}</p>
                )}
                {sectorTags.length > 0 && (
                  <div className="profile-skills-pills">
                    {sectorTags.map((tag, i) => (
                      <span key={i} className="profile-skill-pill">{tag}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="profile-section">
            <h2 className="profile-section-title">
              <FaRocket size={14} /> My Projects
            </h2>
            {projectsLoading ? (
              <div className="profile-projects-loading">Loading your projects...</div>
            ) : projects.length === 0 ? (
              <p className="profile-projects-empty">You haven't submitted any projects yet.</p>
            ) : (
              <div className="profile-projects-list">
                {projects.map(project => (
                  <div key={project.id} className={`profile-project-card ${project.status}`}>
                    <div className="profile-project-top">
                      <h4>{project.title}</h4>
                      <span className={`profile-project-status ${project.status}`}>
                        {project.status === 'approved' ? 'Approved' : project.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                    {project.sector && <p className="profile-project-sector">{project.sector}</p>}
                    {project.rejection_reason && (
                      <div className="profile-project-rejection">
                        <strong>Reason:</strong> {project.rejection_reason}
                      </div>
                    )}
                    <div className="profile-project-bottom">
                      <span className="profile-project-date">
                        Submitted on {new Date(project.submitted_at).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        className="profile-project-edit-btn"
                        onClick={() => navigate(`/projects/${project.id}/edit`)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .profile-page {
          background: var(--gray-50);
          min-height: calc(100vh - 80px);
          padding: 32px 24px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .profile-loading {
          text-align: center;
          color: var(--gray-500);
          margin-top: 120px;
        }
        .profile-loading .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--gray-200);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: pSpin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes pSpin { to { transform: rotate(360deg); } }

        .profile-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          animation: toastIn 0.35s ease both;
        }
        .profile-toast-success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .profile-toast-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .profile-card {
          background: var(--white);
          border-radius: 24px;
          box-shadow: var(--shadow-md);
          width: 100%;
          max-width: 720px;
          overflow: hidden;
          animation: cardFadeUp 0.5s ease both;
        }
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .profile-header {
          position: relative;
          overflow: hidden;
        }
        .profile-banner-gradient {
          height: 120px;
          background: linear-gradient(135deg, #2563eb 0%, #059669 25%, #06b6d4 45%, #8b5cf6 65%, #ec4899 85%, #f59e0b 100%);
          position: relative;
        }
        .profile-banner-gradient::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: linear-gradient(to top, rgba(255,255,255,0.3), transparent);
        }
        .profile-header-content {
          padding: 0 28px 24px;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          position: relative;
        }
        .profile-avatar-container {
          position: relative;
          width: 104px;
          height: 104px;
          flex-shrink: 0;
          margin-top: -52px;
          cursor: default;
        }
        .profile-avatar-img {
          width: 104px;
          height: 104px;
          border-radius: 50%;
          border: 4px solid #fff;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          object-fit: cover;
        }
        .profile-avatar-placeholder {
          width: 104px;
          height: 104px;
          border-radius: 50%;
          border: 4px solid #fff;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          background: linear-gradient(135deg, #cbd5e1, #94a3b8);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .profile-avatar-placeholder svg {
          width: 72px;
        }
        .profile-avatar-overlay {
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .profile-avatar-overlay.visible {
          opacity: 1;
        }
        .profile-avatar-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          border-radius: 50%;
        }
        .profile-header-info {
          flex: 1;
          min-width: 0;
          padding-top: 8px;
        }
        .profile-header-info h1 {
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--gray-900);
          line-height: 1.15;
          letter-spacing: -0.02em;
        }
        .profile-org-type {
          font-size: 0.875rem;
          color: var(--primary-color);
          font-weight: 600;
          margin-top: 4px;
        }
        .profile-location {
          font-size: 0.85rem;
          color: var(--gray-500);
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .profile-header-actions {
          flex-shrink: 0;
          padding-top: 8px;
        }
        .profile-edit-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 999px;
          border: 1.5px solid var(--gray-200);
          background: var(--white);
          color: var(--gray-700);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          white-space: nowrap;
        }
        .profile-edit-toggle:hover {
          background: var(--gray-50);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .profile-edit-actions {
          display: flex;
          gap: 8px;
        }
        .profile-btn-edit {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          font-family: inherit;
          white-space: nowrap;
        }
        .profile-btn-cancel {
          background: var(--gray-100);
          color: var(--gray-700);
        }
        .profile-btn-cancel:hover {
          background: var(--gray-200);
        }
        .profile-btn-save {
          background: var(--primary-color);
          color: #fff;
        }
        .profile-btn-save:hover {
          background: var(--primary-dark);
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }
        .profile-btn-save:disabled,
        .profile-btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .profile-save-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pSpin 0.6s linear infinite;
          display: inline-block;
        }
        .profile-edit-title {
          width: 100%;
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--gray-900);
          border: none;
          border-bottom: 2px solid var(--gray-200);
          padding: 4px 0;
          outline: none;
          font-family: inherit;
          letter-spacing: -0.02em;
          transition: border-color 0.2s;
        }
        .profile-edit-title:focus {
          border-bottom-color: var(--primary-color);
        }
        .profile-edit-select {
          margin-top: 4px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1.5px solid var(--gray-200);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--primary-color);
          background: var(--gray-50);
          font-family: inherit;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .profile-edit-select:focus {
          border-color: var(--primary-color);
        }
        .profile-edit-location-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
        }
        .profile-edit-input-sm {
          padding: 6px 10px;
          border-radius: 8px;
          border: 1.5px solid var(--gray-200);
          font-size: 0.82rem;
          color: var(--gray-700);
          background: var(--gray-50);
          font-family: inherit;
          outline: none;
          width: 100px;
          transition: border-color 0.2s;
        }
        .profile-edit-input-sm:focus {
          border-color: var(--primary-color);
        }
        .profile-edit-sep {
          color: var(--gray-400);
          font-weight: 500;
        }

        .profile-body {
          padding: 0 28px 28px;
        }
        .profile-section {
          margin-top: 24px;
        }
        .profile-section-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .profile-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .profile-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .profile-detail-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--gray-50);
          border: 1.5px solid var(--gray-100);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-400);
          flex-shrink: 0;
        }
        .profile-detail-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .profile-detail-label {
          font-size: 0.7rem;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .profile-detail-value {
          font-size: 0.9rem;
          color: var(--gray-800);
          font-weight: 500;
          margin-top: 2px;
          word-break: break-all;
        }
        .profile-detail-value a {
          color: var(--primary-color);
          text-decoration: none;
        }
        .profile-detail-value a:hover {
          text-decoration: underline;
        }
        .profile-edit-field {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1.5px solid var(--gray-200);
          font-size: 0.875rem;
          color: var(--gray-800);
          background: var(--gray-50);
          font-family: inherit;
          outline: none;
          margin-top: 4px;
          transition: border-color 0.2s;
        }
        .profile-edit-field:focus {
          border-color: var(--primary-color);
          background: var(--white);
        }
        .profile-edit-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--gray-100);
        }
        .profile-edit-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .profile-edit-textarea {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--gray-200);
          font-size: 0.875rem;
          color: var(--gray-800);
          background: var(--gray-50);
          font-family: inherit;
          outline: none;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.2s;
        }
        .profile-edit-textarea:focus {
          border-color: var(--primary-color);
          background: var(--white);
        }
        .profile-description {
          font-size: 0.9rem;
          color: var(--gray-600);
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .profile-skills-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .profile-skill-pill {
          background: rgba(37, 99, 235, 0.08);
          border: 1.5px solid rgba(37, 99, 235, 0.15);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--primary-color);
          transition: all 0.2s;
        }
        .profile-skill-pill:hover {
          background: rgba(37, 99, 235, 0.12);
          transform: translateY(-1px);
        }

        .profile-projects-loading,
        .profile-projects-empty {
          color: var(--gray-500);
          font-size: 0.9rem;
          padding: 8px 0;
        }
        .profile-projects-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .profile-project-card {
          background: var(--gray-50);
          border: 1.5px solid var(--gray-100);
          border-radius: 16px;
          padding: 18px 20px;
          transition: all 0.2s;
        }
        .profile-project-card:hover {
          border-color: var(--gray-200);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .profile-project-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .profile-project-top h4 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0;
        }
        .profile-project-status {
          flex-shrink: 0;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 12px;
          border-radius: 100px;
        }
        .profile-project-status.pending {
          background: #fff7ed;
          color: #f59e0b;
        }
        .profile-project-status.approved {
          background: #f0fdf4;
          color: #10b981;
        }
        .profile-project-status.rejected {
          background: #fef2f2;
          color: #ef4444;
        }
        .profile-project-sector {
          font-size: 0.85rem;
          color: var(--gray-500);
          margin: 8px 0 0 0;
        }
        .profile-project-rejection {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 10px;
          font-size: 0.85rem;
          color: #991b1b;
          line-height: 1.5;
        }
        .profile-project-rejection strong {
          font-weight: 700;
        }
        .profile-project-date {
          display: block;
          font-size: 0.78rem;
          color: var(--gray-400);
        }
        .profile-project-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 10px;
        }
        .profile-project-edit-btn {
          flex-shrink: 0;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1.5px solid var(--primary-color);
          background: transparent;
          color: var(--primary-color);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }
        .profile-project-edit-btn:hover {
          background: var(--primary-color);
          color: #fff;
        }

        @media (max-width: 768px) {
          .profile-page { padding: 16px 12px 48px; }
          .profile-header-content { padding: 0 16px 20px; flex-wrap: wrap; }
          .profile-body { padding: 0 16px 20px; }
          .profile-details-grid { grid-template-columns: 1fr; }
          .profile-header-info h1 { font-size: 1.3rem; }
          .profile-avatar-container { width: 88px; height: 88px; margin-top: -44px; }
          .profile-avatar-img { width: 88px; height: 88px; }
          .profile-avatar-placeholder { width: 88px; height: 88px; }
          .profile-avatar-placeholder svg { width: 60px; }
          .profile-header-actions { width: 100%; }
          .profile-edit-toggle,
          .profile-edit-actions { width: 100%; justify-content: flex-end; }
        }
        @media (max-width: 480px) {
          .profile-header-content { flex-direction: column; align-items: center; text-align: center; }
          .profile-header-info { padding-top: 16px; }
          .profile-header-actions { margin-top: 12px; }
          .profile-location { justify-content: center; }
          .profile-edit-location-row { justify-content: center; }
        }

        /* ── Dark mode ── */
        [data-theme="dark"] .profile-toast-success { background: rgba(16,185,129,0.1); color: #34d399; border-color: rgba(16,185,129,0.2); }
        [data-theme="dark"] .profile-toast-error { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.2); }
        [data-theme="dark"] .profile-project-status.pending { background: rgba(245,158,11,0.1); }
        [data-theme="dark"] .profile-project-status.approved { background: rgba(16,185,129,0.1); }
        [data-theme="dark"] .profile-project-status.rejected { background: rgba(239,68,68,0.1); }
        [data-theme="dark"] .profile-project-rejection { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.15); color: #f87171; }
      `}</style>
    </div>
  )
}

export default Profile
