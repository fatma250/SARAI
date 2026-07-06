import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FaBrain, FaUser, FaSignOutAlt, FaUserCircle, FaGlobe, FaTimes, FaSun, FaMoon, FaBell } from 'react-icons/fa'
import { useTheme } from '../contexts/ThemeContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const NOTIF_POLL_MS = 45000

function timeAgo(dateStr, t) {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return t('notifications.justNow')
  if (mins < 60) return t('notifications.minutesAgo', { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('notifications.hoursAgo', { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t('notifications.daysAgo', { count: days })
  return new Date(dateStr).toLocaleDateString()
}

function Navbar() {
  const { isDark, toggle } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoaded, setNotifLoaded] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showLogoModal, setShowLogoModal] = useState(false)
  const [user, setUser] = useState(null)
  const dropdownRef = useRef(null)
  const langRef = useRef(null)
  const notificationRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const getToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }, [location])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false)
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    const token = getToken()
    if (!token || !user?.id) return
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${user.id}/unread/count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unread_count || 0)
      }
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err)
    }
  }, [user])

  const fetchNotifications = useCallback(async () => {
    const token = getToken()
    if (!token || !user?.id) return
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(await res.json())
        setNotifLoaded(true)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [user])

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0)
      setNotifications([])
      setNotifLoaded(false)
      return
    }
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, NOTIF_POLL_MS)
    return () => clearInterval(interval)
  }, [user, fetchUnreadCount])

  const toggleNotifications = () => {
    const opening = !notifOpen
    setNotifOpen(opening)
    if (opening && !notifLoaded) fetchNotifications()
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      const token = getToken()
      try {
        await fetch(`${API_BASE}/api/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        })
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n))
        setUnreadCount(c => Math.max(0, c - 1))
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    }
    setNotifOpen(false)
    if (notif.action_url) navigate(notif.action_url)
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
    setProfileOpen(false)
  }

  const confirmLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('token_type')
    localStorage.removeItem('user')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('token_type')
    sessionStorage.removeItem('user')
    setUser(null)
    setNotifications([])
    setUnreadCount(0)
    setNotifLoaded(false)
    setShowLogoutModal(false)
    navigate('/login')
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  const switchLanguage = (lng) => {
    i18n.changeLanguage(lng)
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lng
    setLangOpen(false)
  }

  const isLoggedIn = !!user
  const displayName = user?.organization_name || user?.email || 'User'
  const displayEmail = user?.email || ''
  const initials = displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

  const currentLang = i18n.language
  const isRTL = currentLang === 'ar'

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/stakeholders', label: t('nav.stakeholders') },
    { path: '/projects', label: t('nav.projects') },
    { path: '/map', label: t('nav.map') },
    { path: '/sdgs', label: t('nav.sdgs') },
    { path: '/resources', label: t('nav.resources') },
    { path: '/statistics', label: t('nav.statistics') }
  ]

  if (user?.role === 'admin') {
    navLinks.push({ path: '/admin', label: t('nav.moderation') })
  }

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <div className="logo-container">
          <Link to="/" className="logo">
            <span className="logo-img-frame">
              <img src="/images/aicto_logo.jpg" alt="AICTO" className="navbar-aicto-logo" />
            </span>
          </Link>
          <button onClick={() => setShowLogoModal(true)} className="navbar-sarai-link">
            <span className="logo-img-frame">
              <img src="/images/sarai_logo.jpeg" alt="SARAI" className="navbar-sarai-logo" />
            </span>
          </button>
          <div className="vertical-divider"></div>
          <Link to="/" className="logo-text">
            <span className="logo-main">SARAI</span>
            <span className="logo-sub">{t('nav.tagline')}</span>
          </Link>
        </div>

        <div className="nav-center">
          <ul className="nav-links">
            {navLinks.map(link => (
              <li key={link.path}>
                <Link to={link.path} className="nav-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <FaSun size={15} /> : <FaMoon size={15} />}
          </button>

          <div className="lang-switcher" ref={langRef}>
            <button className="lang-btn" onClick={() => setLangOpen(!langOpen)} aria-label={t('nav.language')}>
              <FaGlobe size={14} />
              <span>{currentLang === 'en' ? 'EN' : currentLang === 'fr' ? 'FR' : 'AR'}</span>
            </button>
            {langOpen && (
              <div className={`lang-menu ${isRTL ? 'rtl' : ''}`}>
                <button className={`lang-option ${currentLang === 'en' ? 'active' : ''}`} onClick={() => switchLanguage('en')}>English</button>
                <button className={`lang-option ${currentLang === 'fr' ? 'active' : ''}`} onClick={() => switchLanguage('fr')}>Français</button>
                <button className={`lang-option ${currentLang === 'ar' ? 'active' : ''}`} onClick={() => switchLanguage('ar')}>العربية</button>
              </div>
            )}
          </div>

          {isLoggedIn && (
            <div className="notification-dropdown" ref={notificationRef}>
              <button
                className="notif-btn"
                onClick={toggleNotifications}
                aria-label={t('notifications.title')}
                title={t('notifications.title')}
              >
                <FaBell size={16} />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className="dropdown-menu notif-menu">
                  <div className="notif-menu-header">
                    <span>{t('notifications.title')}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <p className="notif-empty">{t('notifications.empty')}</p>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.id}
                          className={`notif-item ${n.is_read ? '' : 'notif-item-unread'}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          {!n.is_read && <span className="notif-dot" />}
                          <div className="notif-item-body">
                            <span className="notif-item-title">{n.title}</span>
                            <span className="notif-item-message">{n.message}</span>
                            <span className="notif-item-time">{timeAgo(n.created_at, t)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isLoggedIn ? (
            <div className="profile-dropdown" ref={dropdownRef}>
              <button className="avatar-btn" onClick={() => setProfileOpen(!profileOpen)} aria-label="User profile">
                {user?.logo ? (
                  <img src={user.logo} alt={displayName} className="avatar-img" />
                ) : (
                  <span className="avatar-placeholder">{initials}</span>
                )}
              </button>
              {profileOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">{user?.logo ? <img src={user.logo} alt={displayName} /> : <FaUserCircle size={40} />}</div>
                    <div className="dropdown-user-info">
                      <span className="dropdown-user-name">{displayName}</span>
                      <span className="dropdown-user-email">{displayEmail}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}><FaUser size={16} /><span>{t('nav.myProfile')}</span></Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item dropdown-logout" onClick={handleLogoutClick}><FaSignOutAlt size={16} /><span>{t('nav.signOut')}</span></button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-cta-btn">
              {t('nav.signIn')}
            </Link>
          )}
        </div>
      </div>

      {showLogoModal && (
        <div className="modal-overlay" onClick={() => setShowLogoModal(false)}>
          <div className="modal-content logo-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowLogoModal(false)}><FaTimes /></button>
            <img src="/images/sarai_logo.jpeg" alt="SARAI" className="modal-logo-img" />
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="modal-overlay" onClick={cancelLogout}>
          <div className="modal-content logout-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon"><FaSignOutAlt size={24} /></div>
              <h3>{t('nav.signOut')}</h3>
            </div>
            <p className="modal-description">{t('nav.confirmLogout')}</p>
            <div className="modal-actions">
              <button className="btn-modal btn-cancel" onClick={cancelLogout}>{t('admin.cancel')}</button>
              <button className="btn-modal btn-confirm" onClick={confirmLogout}>{t('nav.signOut')}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .modal-content { background: white; padding: 32px; border-radius: 24px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
        .logout-modal .modal-header { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 16px; }
        .logout-modal .modal-icon { width: 56px; height: 56px; background: #fee2e2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .logout-modal h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #111827; }
        .modal-description { color: #6b7280; font-size: 1rem; margin-bottom: 24px; }
        .modal-actions { display: flex; gap: 12px; justify-content: center; }
        .btn-modal { padding: 10px 24px; border-radius: 12px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; border: none; flex: 1; }
        .btn-cancel { background: #f3f4f6; color: #4b5563; }
        .btn-cancel:hover { background: #e5e7eb; }
        .btn-confirm { background: #ef4444; color: white; }
        .btn-confirm:hover { background: #dc2626; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        
        .logo-modal { max-width: 600px; padding: 20px; position: relative; }
        .modal-logo-img { width: 100%; height: auto; border-radius: 12px; }
        .close-modal-btn { position: absolute; top: 15px; right: 15px; background: #f3f4f6; border: none; padding: 8px; border-radius: 50%; cursor: pointer; }
        .navbar { position: sticky; top: 0; z-index: 1000; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
        .navbar-content { display: grid; grid-template-columns: auto 1fr auto; align-items: center; padding: 16px 24px; max-width: 1280px; margin: 0 auto; }
        .logo-container { display: flex; align-items: center; gap: 12px; justify-self: start; flex-shrink: 0; }
        .logo { display: flex; align-items: center; }
        .logo-img-frame {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border-radius: 8px;
          padding: 4px 6px;
          border: 1px solid #e5e7eb;
          line-height: 0;
        }
        .navbar-aicto-logo, .navbar-sarai-logo { height: 28px; width: auto; object-fit: contain; display: block; }
        .navbar-sarai-logo { cursor: pointer; }
        .navbar-sarai-link { display: flex; align-items: center; cursor: pointer; border: none; background: none; padding: 0; }
        .logo-text { display: flex; flex-direction: column; text-decoration: none; }
        .vertical-divider { width: 1px; height: 24px; background: #e5e7eb; }
        .logo-main { font-size: 1.4rem; font-weight: 800; color: #111827; letter-spacing: -0.5px; }
        .logo-sub { font-size: 0.7rem; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
        .nav-center { display: flex; align-items: center; justify-content: center; justify-self: center; min-width: 0; }
        .nav-links { display: flex; list-style: none; gap: 0; flex-wrap: wrap; justify-content: center; }
        .nav-link { padding: 8px 10px; border-radius: 10px; font-weight: 500; color: #4b5563; text-decoration: none; font-size: 0.88rem; white-space: nowrap; }
        .nav-link:hover { background: #f3f4f6; color: #2563eb; }
        .nav-actions { display: flex; align-items: center; gap: 12px; justify-self: end; flex-shrink: 0; }
        .nav-cta-btn {
          padding: 8px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          text-decoration: none;
          background: #2563eb;
          color: white;
          transition: all 0.3s ease;
          border: 2px solid #2563eb;
          white-space: nowrap;
        }
        .nav-cta-btn:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
          transform: translateY(-1px);
        }
        .lang-switcher { position: relative; }
        .lang-btn { display: flex; align-items: center; gap: 6px; background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 8px 14px; font-size: 0.85rem; font-weight: 700; color: #374151; cursor: pointer; }
        .lang-menu { position: absolute; top: calc(100% + 8px); right: 0; background: white; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); padding: 8px; z-index: 1003; }
        .lang-option { display: block; width: 100%; padding: 8px; border: none; background: none; cursor: pointer; text-align: left; }
        .lang-option:hover { background: #f9fafb; color: #2563eb; }
        .notification-dropdown { position: relative; }
        .notif-btn { position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 10px; cursor: pointer; color: #374151; transition: all 0.2s; flex-shrink: 0; }
        .notif-btn:hover { background: #e5e7eb; transform: scale(1.05); }
        .notif-badge { position: absolute; top: -5px; right: -5px; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 100px; background: #ef4444; color: white; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid white; }
        .notif-menu { width: 320px; padding: 0; }
        .notif-menu-header { padding: 12px 14px 8px; font-size: 12px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: .05em; }
        .notif-list { max-height: 360px; overflow-y: auto; padding: 4px; }
        .notif-empty { text-align: center; color: #9ca3af; font-size: 13px; padding: 24px 12px; margin: 0; }
        .notif-item { display: flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; padding: 10px 10px; border: none; background: none; border-radius: 10px; cursor: pointer; transition: background .15s; }
        .notif-item:hover { background: #f9fafb; }
        .notif-item-unread { background: rgba(37,99,235,0.05); }
        .notif-item-unread:hover { background: rgba(37,99,235,0.09); }
        .notif-dot { width: 7px; height: 7px; border-radius: 50%; background: #2563eb; margin-top: 6px; flex-shrink: 0; }
        .notif-item-body { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
        .notif-item-title { font-size: 13px; font-weight: 700; color: #111827; }
        .notif-item-message { font-size: 12px; color: #4b5563; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .notif-item-time { font-size: 10px; color: #9ca3af; margin-top: 2px; }
        .profile-dropdown { position: relative; }
        .avatar-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: transform 0.2s ease; }
        .avatar-btn:hover { transform: scale(1.05); }
        .avatar-img { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .avatar-placeholder { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .dropdown-menu { position: absolute; top: calc(100% + 12px); right: 0; width: 240px; background: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); z-index: 1004; padding: 8px; border: 1px solid #f3f4f6; }
        .dropdown-header { display: flex; align-items: center; gap: 12px; padding: 8px; }
        .dropdown-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f3f4f6; color: #6b7280; }
        .dropdown-user-info { display: flex; flex-direction: column; overflow: hidden; }
        .dropdown-user-name { font-weight: 600; color: #111827; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dropdown-user-email { font-size: 0.75rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dropdown-divider { height: 1px; background: #f3f4f6; margin: 8px 0; }
        .dropdown-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; text-decoration: none; color: #374151; border: none; background: none; width: 100%; border-radius: 8px; transition: background 0.2s; }
        .dropdown-item:hover { background: #f9fafb; color: #2563eb; }

        /* Theme toggle button */
        .theme-toggle { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 10px; cursor: pointer; color: #374151; font-size: 0.9rem; transition: all 0.2s; flex-shrink: 0; }
        .theme-toggle:hover { background: #e5e7eb; transform: scale(1.05); }

        /* Dark mode – Navbar */
        [data-theme="dark"] .navbar { background: rgba(12,18,32,0.95); border-bottom-color: rgba(255,255,255,0.07); }
        [data-theme="dark"] .logo-img-frame { background: #fff; border-color: rgba(255,255,255,0.15); box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
        [data-theme="dark"] .logo-main { color: #f1f5f9; }
        [data-theme="dark"] .logo-sub { color: #64748b; }
        [data-theme="dark"] .vertical-divider { background: #334155; }
        [data-theme="dark"] .nav-link { color: #94a3b8; }
        [data-theme="dark"] .nav-link:hover { background: rgba(255,255,255,0.07); color: #60a5fa; }
        [data-theme="dark"] .lang-btn { background: #1e293b; border-color: #334155; color: #e2e8f0; }
        [data-theme="dark"] .lang-menu { background: #1e293b; border: 1px solid #334155; }
        [data-theme="dark"] .lang-option { color: #cbd5e1; }
        [data-theme="dark"] .lang-option:hover { background: rgba(255,255,255,0.07); color: #60a5fa; }
        [data-theme="dark"] .lang-option.active { color: #60a5fa; }
        [data-theme="dark"] .dropdown-menu { background: #1e293b; border-color: rgba(255,255,255,0.08); }
        [data-theme="dark"] .dropdown-user-name { color: #e2e8f0; }
        [data-theme="dark"] .dropdown-user-email { color: #64748b; }
        [data-theme="dark"] .dropdown-item { color: #cbd5e1; }
        [data-theme="dark"] .dropdown-item:hover { background: rgba(255,255,255,0.07); color: #60a5fa; }
        [data-theme="dark"] .dropdown-divider { background: rgba(255,255,255,0.08); }
        [data-theme="dark"] .dropdown-avatar { background: #334155; color: #94a3b8; }
        [data-theme="dark"] .theme-toggle { background: #1e293b; border-color: #334155; color: #fbbf24; }
        [data-theme="dark"] .theme-toggle:hover { background: #334155; }
        [data-theme="dark"] .notif-btn { background: #1e293b; border-color: #334155; color: #e2e8f0; }
        [data-theme="dark"] .notif-btn:hover { background: #334155; }
        [data-theme="dark"] .notif-badge { border-color: #0c1220; }
        [data-theme="dark"] .notif-menu-header { color: #e2e8f0; }
        [data-theme="dark"] .notif-empty { color: #64748b; }
        [data-theme="dark"] .notif-item:hover { background: rgba(255,255,255,0.06); }
        [data-theme="dark"] .notif-item-unread { background: rgba(96,165,250,0.08); }
        [data-theme="dark"] .notif-item-unread:hover { background: rgba(96,165,250,0.14); }
        [data-theme="dark"] .notif-item-title { color: #e2e8f0; }
        [data-theme="dark"] .notif-item-message { color: #94a3b8; }
        [data-theme="dark"] .notif-item-time { color: #64748b; }
        [data-theme="dark"] .modal-content { background: #1e293b; }
        [data-theme="dark"] .logout-modal h3 { color: #f1f5f9; }
        [data-theme="dark"] .modal-description { color: #94a3b8; }
        [data-theme="dark"] .btn-cancel { background: #334155; color: #e2e8f0; }
        [data-theme="dark"] .btn-cancel:hover { background: #475569; }
        [data-theme="dark"] .close-modal-btn { background: #334155; color: #e2e8f0; }
      `}</style>
    </nav>
  )
}

export default Navbar