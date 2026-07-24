import { useState, useEffect } from 'react'
import { FaClipboardList, FaCheckCircle, FaTimesCircle, FaEye, FaSignOutAlt, FaGlobeAmericas, FaLayerGroup, FaMicrochip, FaCalendarAlt, FaBuilding, FaUsers, FaTrash, FaUserClock, FaEnvelope, FaUserCheck, FaUserSlash, FaHistory } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AdminDashboard() {
  const { t } = useTranslation()
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [pendingProjects, setPendingProjects] = useState([])
  const [users, setUsers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [activeTab, setActiveTab] = useState('projects') // 'projects', 'users', 'approvals', 'activity'
  const [userFilter, setUserFilter] = useState('all') // 'all' or 'connected'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedProjectIds, setSelectedProjectIds] = useState(new Set())

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectProjectId, setRejectProjectId] = useState(null)
  const [isBulkReject, setIsBulkReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (token) {
      if (activeTab === 'projects') {
        fetchPendingProjects()
        setSelectedProjectIds(new Set())
      } else if (activeTab === 'users') {
        fetchUsers()
      } else if (activeTab === 'approvals') {
        fetchPendingUsers()
      } else if (activeTab === 'activity') {
        fetchActivity()
      }
      fetchStats()
    }
  }, [token, activeTab, userFilter])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/users/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPendingUsers(data)
      }
    } catch (err) {
      console.error('Error fetching pending users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success(t('admin.userApproveSuccess'))
        fetchPendingUsers()
        fetchStats()
      }
    } catch (err) {
      toast.error(t('admin.errorPrefix') + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectUser = async (userId) => {
    if (!window.confirm(t('admin.confirmRejectUser'))) return
    setActionLoading(userId)
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Dossier non conforme' })
      })
      if (res.ok) {
        toast.success('Utilisateur rejeté.')
        fetchPendingUsers()
        fetchStats()
      }
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      if (data.user.role !== 'admin') throw new Error('Access denied: Admin only')
      
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.access_token)
    } catch (err) {
      setLoginError(err.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setToken(null)
  }

  const fetchPendingProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/projects/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPendingProjects(data)
      }
    } catch (err) {
      console.error('Error fetching pending projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivity = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setActivity(data)
      }
    } catch (err) {
      console.error('Error fetching activity log:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleProjectSelection = (id) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkApprove = async () => {
    if (selectedProjectIds.size === 0) return
    setActionLoading('bulk')
    try {
      const res = await fetch(`${API_BASE}/api/admin/projects/bulk-approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_ids: Array.from(selectedProjectIds) })
      })
      if (res.ok) {
        toast.success(`${selectedProjectIds.size} project(s) approved and published!`)
        setSelectedProjectIds(new Set())
        fetchPendingProjects()
        fetchStats()
      } else {
        const errData = await res.json()
        toast.error('Failed to approve: ' + (errData.detail || 'Unknown error'))
      }
    } catch (err) {
      toast.error('Network error: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const openBulkRejectModal = () => {
    if (selectedProjectIds.size === 0) return
    setIsBulkReject(true)
    setShowRejectModal(true)
    setRejectReason('')
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const endpoint = userFilter === 'connected' ? '/api/admin/users/connected' : '/api/admin/users'
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleApprove = async (projectId) => {
    setActionLoading(projectId)
    try {
      const res = await fetch(`${API_BASE}/api/admin/projects/${projectId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('Project approved and published successfully!')
        fetchPendingProjects()
        fetchStats()
      } else {
        const errData = await res.json()
        toast.error('Failed to approve: ' + (errData.detail || 'Unknown error'))
      }
    } catch (err) {
      console.error(`Error approving project:`, err)
      toast.error('Network error: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    setActionLoading(userId)
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('User deleted successfully')
        fetchUsers()
        fetchStats()
      } else {
        const errData = await res.json()
        toast.error('Failed to delete user: ' + (errData.detail || 'Unknown error'))
      }
    } catch (err) {
      toast.error('Network error: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectModal = (projectId) => {
    setRejectProjectId(projectId)
    setIsBulkReject(false)
    setShowRejectModal(true)
    setRejectReason('')
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Please provide a reason for rejection.')
      return
    }
    setActionLoading(isBulkReject ? 'bulk' : rejectProjectId)
    try {
      const res = isBulkReject
        ? await fetch(`${API_BASE}/api/admin/projects/bulk-reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_ids: Array.from(selectedProjectIds), reason: rejectReason })
          })
        : await fetch(`${API_BASE}/api/admin/projects/${rejectProjectId}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: rejectReason })
          })
      if (res.ok) {
        toast.info(isBulkReject ? `${selectedProjectIds.size} project(s) rejected.` : 'Project has been rejected.')
        setShowRejectModal(false)
        if (isBulkReject) setSelectedProjectIds(new Set())
        fetchPendingProjects()
        fetchStats()
      } else {
        const errData = await res.json()
        toast.error('Failed to reject: ' + (errData.detail || 'Unknown error'))
      }
    } catch (err) {
      console.error(`Error rejecting project:`, err)
      toast.error('Network error: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (!token) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-container">
          <div className="admin-login-header">
            <h1>Admin Dashboard</h1>
            <p>Moderation portal for AI Initiatives</p>
          </div>
          <form onSubmit={handleLogin} className="admin-login-form">
            {loginError && <div className="login-error">{loginError}</div>}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@aicto.org" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn-login">Access Dashboard</button>
          </form>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="container header-content">
          <div className="header-title">
            <h1>Admin <span className="text-primary">Dashboard</span></h1>
            <p>Welcome back, Administrator</p>
          </div>
          <button className="btn-logout-top" onClick={handleLogout}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className={`stat-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')} style={{cursor: 'pointer'}}>
              <div className="stat-icon pending"><FaClipboardList /></div>
              <div className="stat-data">
                <span className="stat-val">{stats?.pending || 0}</span>
                <span className="stat-lab">Pending Projects</span>
              </div>
            </div>
            <div className={`stat-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')} style={{cursor: 'pointer'}}>
              <div className="stat-icon users"><FaUsers /></div>
              <div className="stat-data">
                <span className="stat-val">{stats?.total_users || 0}</span>
                <span className="stat-lab">Total Users</span>
              </div>
            </div>
            <div className={`stat-item ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')} style={{cursor: 'pointer'}}>
              <div className="stat-icon online"><FaUserCheck /></div>
              <div className="stat-data">
                <span className="stat-val">{stats?.pending_users || 0}</span>
                <span className="stat-lab">Pending Approvals</span>
              </div>
            </div>
            <div className={`stat-item ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')} style={{cursor: 'pointer'}}>
              <div className="stat-icon users"><FaHistory /></div>
              <div className="stat-data">
                <span className="stat-val">{activity.length}</span>
                <span className="stat-lab">Recent Activity</span>
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="section-header">
              <h2>
                {activeTab === 'projects' ? 'Awaiting Moderation' :
                 activeTab === 'users' ? 'User Management' :
                 activeTab === 'activity' ? 'Activity Log' : 'Account Approvals'}
              </h2>
              <span className="count-badge">
                {activeTab === 'projects' ? `${pendingProjects.length} Projects` :
                 activeTab === 'users' ? `${users.length} Users` :
                 activeTab === 'activity' ? `${activity.length} Entries` : `${pendingUsers.length} Pending`}
              </span>
              
              {activeTab === 'users' && (
                <div className="filter-tabs">
                  <button 
                    className={`filter-btn ${userFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setUserFilter('all')}
                  >
                    All Users
                  </button>
                  <button 
                    className={`filter-btn ${userFilter === 'connected' ? 'active' : ''}`}
                    onClick={() => setUserFilter('connected')}
                  >
                    Connected
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="dashboard-loader">
                <div className="spinner"></div>
                <p>Loading data...</p>
              </div>
            ) : activeTab === 'projects' ? (
              /* Projects Content */
              pendingProjects.length === 0 ? (
                <div className="empty-dashboard">
                  <div className="empty-icon">🛡️</div>
                  <h3>Queue is Empty</h3>
                  <p>All submitted projects have been reviewed.</p>
                </div>
              ) : (
                <>
                  {selectedProjectIds.size > 0 && (
                    <div className="bulk-action-bar">
                      <span>{selectedProjectIds.size} selected</span>
                      <div className="bulk-action-buttons">
                        <button className="btn-action-reject" onClick={openBulkRejectModal} disabled={actionLoading === 'bulk'}>
                          Reject Selected
                        </button>
                        <button className="btn-action-approve" onClick={handleBulkApprove} disabled={actionLoading === 'bulk'}>
                          {actionLoading === 'bulk' ? 'Processing...' : 'Approve Selected'}
                        </button>
                      </div>
                    </div>
                  )}
                <div className="pending-grid">
                  {pendingProjects.map((project) => (
                    <div key={project.id} className={`moderation-card animate-up ${selectedProjectIds.has(project.id) ? 'selected' : ''}`}>
                      <div className="card-top">
                        <input
                          type="checkbox"
                          className="card-select-checkbox"
                          checked={selectedProjectIds.has(project.id)}
                          onChange={() => toggleProjectSelection(project.id)}
                        />
                        <div className="card-info">
                          <div className="card-header-main">
                            <h3>{project.title}</h3>
                            <div className="status-label">Pending Review</div>
                          </div>
                          <div className="card-meta">
                            <span className="meta-tag"><FaGlobeAmericas /> {project.country?.name || 'Unknown Country'}</span>
                            <span className="meta-tag"><FaLayerGroup /> {project.sector}</span>
                            <span className="meta-tag"><FaMicrochip /> {project.ai_technology}</span>
                          </div>
                        </div>
                      </div>

                      <div className="project-body">
                        <p className="project-preview">{project.description}</p>
                        
                        <div className="submission-details">
                          <div className="detail-item">
                            <FaBuilding className="detail-icon" />
                            <div className="detail-content">
                              <span className="detail-label">Submitted By</span>
                              <span className="detail-value">{project.owner?.organization_name || project.owner?.email || 'Unknown User'}</span>
                            </div>
                          </div>
                          <div className="detail-item">
                            <FaCalendarAlt className="detail-icon" />
                            <div className="detail-content">
                              <span className="detail-label">Submission Date</span>
                              <span className="detail-value">{new Date(project.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                          </div>
                          {project.website && (
                            <div className="detail-item">
                              <FaEye className="detail-icon" />
                              <div className="detail-content">
                                <span className="detail-label">Website</span>
                                <span className="detail-value">
                                  <a href={project.website} target="_blank" rel="noopener noreferrer" className="project-link">
                                    Visit Project Site
                                  </a>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="card-footer">
                        <div className="card-actions">
                          <button 
                            className="btn-action-reject" 
                            onClick={() => openRejectModal(project.id)}
                            disabled={actionLoading === project.id}
                          >
                            Reject Submission
                          </button>
                          <button 
                            className="btn-action-approve" 
                            onClick={() => handleApprove(project.id)}
                            disabled={actionLoading === project.id}
                          >
                            {actionLoading === project.id ? 'Processing...' : 'Approve & Publish'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )
            ) : activeTab === 'users' ? (
              /* Users Table */
              <div className="users-container animate-up">
                <div className="table-responsive">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User / Organization</th>
                        <th>Contact</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty-table">No users found</td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div className="user-info-cell">
                                <div className="user-avatar">
                                  <div className="avatar-placeholder">{user.organization_name?.charAt(0) || user.email.charAt(0).toUpperCase()}</div>
                                </div>
                                <div className="user-name-info">
                                  <span className="org-name">{user.organization_name || 'Individual'}</span>
                                  <span className="user-email">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="contact-info">
                                <span className="info-item"><FaEnvelope /> {user.email}</span>
                                {user.phone && <span className="info-item">📞 {user.phone}</span>}
                              </div>
                            </td>
                            <td>
                              <span className={`role-badge ${user.role}`}>{user.role}</span>
                            </td>
                            <td>
                              <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="login-info">
                                {user.last_login ? (
                                  <>
                                    <span className="login-date">{new Date(user.last_login).toLocaleDateString()}</span>
                                    <span className="login-time">{new Date(user.last_login).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </>
                                ) : (
                                  <span className="never-logged">Never</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <button 
                                className="btn-delete-user" 
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={actionLoading === user.id}
                                title="Delete User"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'activity' ? (
              /* Activity Log Table */
              <div className="users-container animate-up">
                <div className="table-responsive">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Admin</th>
                        <th>Action</th>
                        <th>Project</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-table">No activity recorded yet</td>
                        </tr>
                      ) : (
                        activity.map((entry) => {
                          const actionLabel = {
                            approved: 'Approved',
                            rejected: 'Rejected',
                            edited: 'Edited',
                            deleted: 'Deleted',
                            pending: 'Pending',
                            revision_requested: 'Revision Requested',
                          }[entry.action] || entry.action
                          const badgeClass = {
                            approved: 'active',
                            edited: 'edited',
                            rejected: 'inactive',
                            deleted: 'inactive',
                          }[entry.action] || 'inactive'
                          return (
                            <tr key={entry.id}>
                              <td>{new Date(entry.created_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                              <td>{entry.actor_name}</td>
                              <td>
                                <span className={`status-badge ${badgeClass}`}>
                                  {actionLabel}
                                </span>
                              </td>
                              <td>{entry.project_title || `#${entry.project_id}`}</td>
                              <td>{entry.reason || '—'}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Pending Approvals Table */
              <div className="users-container animate-up">
                <div className="table-responsive">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User / Organization</th>
                        <th>Status</th>
                        <th>Email Verified</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="empty-table">No pending approvals</td>
                        </tr>
                      ) : (
                        pendingUsers.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div className="user-info-cell">
                                <div className="user-avatar">
                                  <div className="avatar-placeholder">{user.organization_name?.charAt(0) || user.email.charAt(0).toUpperCase()}</div>
                                </div>
                                <div className="user-name-info">
                                  <span className="org-name">{user.organization_name || 'Individual'}</span>
                                  <span className="user-email">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="status-badge inactive">Pending Admin Approval</span>
                            </td>
                            <td>
                              <span className="status-badge active">Verified</span>
                            </td>
                            <td>
                              <div style={{display: 'flex', gap: '10px'}}>
                                <button 
                                  className="btn-approve-user" 
                                  onClick={() => handleApproveUser(user.id)}
                                  disabled={actionLoading === user.id}
                                  title="Approve User"
                                >
                                  <FaUserCheck /> Approve
                                </button>
                                <button 
                                  className="btn-delete-user" 
                                  onClick={() => handleRejectUser(user.id)}
                                  disabled={actionLoading === user.id}
                                  title="Reject User"
                                >
                                  <FaUserSlash /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-up">
            <div className="modal-header">
              <h3>{isBulkReject ? `Reject ${selectedProjectIds.size} Submissions` : 'Reject Submission'}</h3>
              <button className="close-btn" onClick={() => setShowRejectModal(false)}><FaTimesCircle /></button>
            </div>
            <div className="modal-body">
              <p>Please specify why {isBulkReject ? 'these projects are' : 'this project is'} being rejected. This information is internal but helps track moderation quality.</p>
              <textarea 
                value={rejectReason} 
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Insufficient description, duplicate entry, or incorrect sector categorization..."
                rows="5"
              ></textarea>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button 
                className="btn-danger" 
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  )
}

const styles = `
  .admin-dashboard { background: #f1f5f9; min-height: 100vh; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; }
  .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
  
  /* Header */
  .dashboard-header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 20px 0; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .header-content { display: flex; justify-content: space-between; align-items: center; }
  .header-title h1 { font-size: 1.5rem; font-weight: 700; margin: 0; color: #0f172a; }
  .header-title p { color: #64748b; margin: 2px 0 0 0; font-size: 0.875rem; }
  .text-primary { color: #3b82f6; }
  .btn-logout-top { background: #fee2e2; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; color: #ef4444; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; font-size: 0.875rem; }
  .btn-logout-top:hover { background: #fecaca; }

  /* Stats Bar */
  .dashboard-main { padding: 32px 0 64px; }
  .stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
  .stat-item { background: #fff; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: 0.2s; }
  .stat-item.active { border-color: #3b82f6; ring: 2px solid #3b82f6; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
  .stat-icon.pending { background: #fff7ed; color: #f59e0b; }
  .stat-icon.approved { background: #f0fdf4; color: #10b981; }
  .stat-icon.rejected { background: #fef2f2; color: #ef4444; }
  .stat-icon.users { background: #eff6ff; color: #3b82f6; }
  .stat-icon.online { background: #fdf4ff; color: #a855f7; }
  
  .filter-tabs { display: flex; gap: 8px; margin-left: auto; background: #e2e8f0; padding: 4px; border-radius: 8px; }
  .filter-btn { background: none; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; color: #64748b; transition: 0.2s; }
  .filter-btn.active { background: #fff; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

  /* Users Table */
  .users-container { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .table-responsive { overflow-x: auto; }
  .users-table { width: 100%; border-collapse: collapse; text-align: left; }
  .users-table th { background: #f8fafc; padding: 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
  .users-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .users-table tr:last-child td { border-bottom: none; }
  
  .user-info-cell { display: flex; align-items: center; gap: 12px; }
  .user-avatar { width: 40px; height: 40px; border-radius: 10px; overflow: hidden; background: #f1f5f9; flex-shrink: 0; }
  .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #94a3b8; font-size: 1.125rem; }
  .user-name-info { display: flex; flex-direction: column; }
  .org-name { font-weight: 700; color: #0f172a; font-size: 0.9375rem; }
  .user-email { font-size: 0.8125rem; color: #64748b; }
  
  .contact-info { display: flex; flex-direction: column; gap: 4px; }
  .info-item { font-size: 0.8125rem; color: #475569; display: flex; align-items: center; gap: 6px; }
  
  .role-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 4px 8px; border-radius: 9999px; letter-spacing: 0.025em; }
  .role-badge.admin { background: #fef2f2; color: #ef4444; }
  .role-badge.moderator { background: #fff7ed; color: #f59e0b; }
  .role-badge.organization { background: #f0fdf4; color: #10b981; }
  
  .status-badge { font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 9999px; }
  .status-badge.active { background: #f0fdf4; color: #16a34a; }
  .status-badge.inactive { background: #f1f5f9; color: #64748b; }
  .status-badge.edited { background: #fff7ed; color: #f59e0b; }
  
  .login-info { display: flex; flex-direction: column; }
  .login-date { font-weight: 600; color: #1e293b; font-size: 0.875rem; }
  .login-time { font-size: 0.75rem; color: #94a3b8; }
  .never-logged { font-size: 0.875rem; color: #94a3b8; font-style: italic; }
  
  .btn-approve-user { background: #f0fdf4; border: 1px solid #dcfce7; color: #16a34a; padding: 6px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; font-weight: 600; }
  .btn-approve-user:hover { background: #16a34a; color: #fff; }
  
  .btn-delete-user { background: #fff; border: 1px solid #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
  .btn-delete-user:hover { background: #ef4444; color: #fff; }
  .btn-delete-user:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .empty-table { text-align: center; padding: 48px !important; color: #94a3b8; font-style: italic; }
  .stat-val { display: block; font-size: 1.5rem; font-weight: 700; line-height: 1; color: #0f172a; }
  .stat-lab { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.025em; }

  /* Section Header */
  .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .section-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; color: #0f172a; }
  .count-badge { background: #3b82f6; color: #fff; padding: 2px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }

  /* Cards */
  .pending-grid { display: flex; flex-direction: column; gap: 20px; }
  .moderation-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
  .moderation-card:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  .moderation-card.selected { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }

  .card-top { margin-bottom: 16px; display: flex; align-items: flex-start; gap: 14px; }
  .card-select-checkbox { width: 18px; height: 18px; margin-top: 4px; flex-shrink: 0; cursor: pointer; accent-color: #2563eb; }
  .card-top .card-info { flex: 1; min-width: 0; }

  .bulk-action-bar {
    position: sticky; top: 12px; z-index: 20;
    display: flex; align-items: center; justify-content: space-between;
    background: #0f172a; color: #fff; border-radius: 14px;
    padding: 12px 18px; margin-bottom: 16px; font-weight: 600; font-size: 0.9rem;
    box-shadow: 0 8px 20px rgba(15,23,42,0.25);
  }
  .bulk-action-buttons { display: flex; gap: 10px; }
  .bulk-action-buttons .btn-action-approve, .bulk-action-buttons .btn-action-reject { padding: 8px 16px; font-size: 0.85rem; }
  .card-header-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .card-header-main h3 { font-size: 1.25rem; font-weight: 700; margin: 0; color: #0f172a; }
  
  .card-meta { display: flex; gap: 12px; flex-wrap: wrap; }
  .meta-tag { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #475569; font-weight: 600; background: #f8fafc; padding: 4px 10px; border-radius: 6px; border: 1px solid #f1f5f9; }
  .meta-tag svg { color: #3b82f6; }
  
  .status-label { background: #fff7ed; color: #c2410c; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #ffedd5; }
  
  .project-body { margin-bottom: 24px; }
  .project-preview { color: #475569; line-height: 1.6; margin-bottom: 20px; font-size: 0.9375rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  
  .submission-details { background: #f8fafc; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; border: 1px solid #f1f5f9; }
  .detail-item { display: flex; align-items: flex-start; gap: 12px; }
  .detail-icon { color: #64748b; font-size: 1rem; margin-top: 2px; }
  .detail-content { display: flex; flex-direction: column; }
  .detail-label { font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; }
  .detail-value { font-size: 0.875rem; color: #1e293b; font-weight: 600; }
  .project-link { color: #3b82f6; text-decoration: none; border-bottom: 1px solid transparent; transition: 0.2s; }
  .project-link:hover { border-bottom-color: #3b82f6; }
  
  .admin-files-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
  .admin-file-link { font-size: 0.8125rem; color: #3b82f6; text-decoration: none; font-weight: 500; }
  .admin-file-link:hover { text-decoration: underline; }

  .card-footer { display: flex; justify-content: flex-end; padding-top: 20px; border-top: 1px solid #f1f5f9; }
  .card-actions { display: flex; gap: 12px; }
  .btn-action-reject { background: #fff; border: 1px solid #e2e8f0; color: #64748b; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.875rem; }
  .btn-action-reject:hover { background: #f1f5f9; color: #ef4444; border-color: #fca5a5; }
  .btn-action-approve { background: #0f172a; border: none; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.875rem; }
  .btn-action-approve:hover { background: #334155; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

  /* Modal */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal-content { background: #fff; width: 100%; max-width: 500px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
  .modal-header { padding: 24px 24px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
  .modal-header h3 { font-size: 1.25rem; font-weight: 700; margin: 0; color: #0f172a; }
  .close-btn { background: none; border: none; font-size: 1.25rem; color: #cbd5e1; cursor: pointer; transition: 0.2s; }
  .close-btn:hover { color: #64748b; }
  .modal-body { padding: 24px; }
  .modal-body p { color: #64748b; font-size: 0.9375rem; line-height: 1.5; margin-bottom: 16px; }
  .modal-body textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-family: inherit; font-size: 0.9375rem; outline: none; transition: 0.2s; resize: none; }
  .modal-body textarea:focus { border-color: #3b82f6; ring: 2px solid #3b82f6; }
  .modal-footer { padding: 16px 24px 24px; display: flex; gap: 12px; justify-content: flex-end; }
  .btn-secondary { background: #fff; border: 1px solid #e2e8f0; color: #64748b; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
  .btn-danger { background: #ef4444; border: none; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
  .btn-danger:hover { background: #dc2626; }

  /* Login */
  .admin-login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 20px; }
  .admin-login-container { background: #fff; padding: 40px; border-radius: 20px; width: 100%; max-width: 400px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
  .admin-login-header { text-align: center; margin-bottom: 32px; }
  .admin-login-header h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
  .admin-login-header p { color: #64748b; font-size: 0.875rem; }
  .admin-login-form .form-group { margin-bottom: 20px; }
  .admin-login-form label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 6px; color: #475569; }
  .admin-login-form input { width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.9375rem; outline: none; transition: 0.2s; }
  .admin-login-form input:focus { border-color: #3b82f6; }
  .btn-login { width: 100%; background: #0f172a; color: #fff; border: none; padding: 12px; border-radius: 10px; font-size: 0.9375rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .btn-login:hover { background: #334155; }
  .login-error { background: #fef2f2; color: #ef4444; padding: 10px; border-radius: 8px; margin-bottom: 16px; font-size: 0.8125rem; font-weight: 600; text-align: center; border: 1px solid #fee2e2; }

  /* Animations & Helpers */
  .spinner { width: 32px; height: 32px; border: 3px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .dashboard-loader { text-align: center; padding: 48px 0; color: #64748b; font-size: 0.875rem; }
  .empty-dashboard { text-align: center; padding: 64px 0; background: #fff; border-radius: 16px; border: 1px dashed #e2e8f0; }
  .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-up { animation: fadeUp 0.3s ease-out both; }

  @media (max-width: 640px) {
    .stats-bar { grid-template-columns: 1fr; }
    .card-actions { width: 100%; }
    .card-actions button { flex: 1; }
    .submission-details { grid-template-columns: 1fr; }
  }

  /* ── Dark mode ── */
  [data-theme="dark"] .admin-dashboard { background: #0f172a; color: #e2e8f0; }
  [data-theme="dark"] .dashboard-header { background: #1e293b; border-bottom-color: rgba(255,255,255,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
  [data-theme="dark"] .header-title h1 { color: #f1f5f9; }
  [data-theme="dark"] .stat-item { background: #1e293b; border-color: rgba(255,255,255,0.06); box-shadow: none; }
  [data-theme="dark"] .stat-icon.pending { background: rgba(245,158,11,0.1); }
  [data-theme="dark"] .stat-icon.approved { background: rgba(16,185,129,0.1); }
  [data-theme="dark"] .stat-icon.rejected { background: rgba(239,68,68,0.1); }
  [data-theme="dark"] .stat-icon.users { background: rgba(59,130,246,0.1); }
  [data-theme="dark"] .stat-icon.online { background: rgba(168,85,247,0.1); }
  [data-theme="dark"] .filter-tabs { background: rgba(255,255,255,0.07); }
  [data-theme="dark"] .filter-btn.active { background: #1e293b; color: #f1f5f9; }
  [data-theme="dark"] .users-container { background: #1e293b; border-color: rgba(255,255,255,0.06); }
  [data-theme="dark"] .users-table th { background: #0f172a; border-bottom-color: rgba(255,255,255,0.06); }
  [data-theme="dark"] .users-table td { border-bottom-color: rgba(255,255,255,0.04); }
  [data-theme="dark"] .user-avatar { background: rgba(255,255,255,0.07); }
  [data-theme="dark"] .role-badge.admin { background: rgba(239,68,68,0.1); }
  [data-theme="dark"] .role-badge.moderator { background: rgba(245,158,11,0.1); }
  [data-theme="dark"] .role-badge.organization { background: rgba(16,185,129,0.1); }
  [data-theme="dark"] .status-badge.active { background: rgba(22,163,74,0.1); }
  [data-theme="dark"] .status-badge.inactive { background: rgba(100,116,139,0.1); color: #64748b; }
  [data-theme="dark"] .status-badge.edited { background: rgba(245,158,11,0.1); }
  [data-theme="dark"] .btn-approve-user { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.2); }
  [data-theme="dark"] .btn-delete-user { background: transparent; border-color: rgba(239,68,68,0.2); }
  [data-theme="dark"] .section-header h2 { color: #f1f5f9; }
  [data-theme="dark"] .moderation-card { background: #1e293b; border-color: rgba(255,255,255,0.06); box-shadow: none; }
  [data-theme="dark"] .card-header-main h3 { color: #f1f5f9; }
  [data-theme="dark"] .meta-tag { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.06); color: #94a3b8; }
  [data-theme="dark"] .submission-details { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.06); }
  [data-theme="dark"] .detail-value { color: #e2e8f0; }
  [data-theme="dark"] .card-footer { border-top-color: rgba(255,255,255,0.06); }
  [data-theme="dark"] .btn-action-reject { background: transparent; border-color: rgba(255,255,255,0.1); color: #94a3b8; }
  [data-theme="dark"] .btn-action-reject:hover { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.2); }
  [data-theme="dark"] .btn-action-approve { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); }
  [data-theme="dark"] .btn-action-approve:hover { background: #334155; }
  [data-theme="dark"] .modal-content { background: #1e293b; }
  [data-theme="dark"] .modal-header { border-bottom-color: rgba(255,255,255,0.06); }
  [data-theme="dark"] .modal-header h3 { color: #f1f5f9; }
  [data-theme="dark"] .modal-body textarea { background: #0f172a; border-color: rgba(255,255,255,0.1); color: #e2e8f0; }
  [data-theme="dark"] .modal-footer { }
  [data-theme="dark"] .btn-secondary { background: transparent; border-color: rgba(255,255,255,0.1); color: #94a3b8; }
  [data-theme="dark"] .admin-login-page { background: #0f172a; }
  [data-theme="dark"] .admin-login-container { background: #1e293b; border-color: rgba(255,255,255,0.06); }
  [data-theme="dark"] .admin-login-header h1 { color: #f1f5f9; }
  [data-theme="dark"] .admin-login-form input { background: #0f172a; border-color: rgba(255,255,255,0.1); color: #f1f5f9; }
  [data-theme="dark"] .admin-login-form label { color: #94a3b8; }
  [data-theme="dark"] .spinner { border-color: #1e293b; border-top-color: #3b82f6; }
  [data-theme="dark"] .empty-dashboard { background: #1e293b; border-color: rgba(255,255,255,0.08); }
`

export default AdminDashboard
