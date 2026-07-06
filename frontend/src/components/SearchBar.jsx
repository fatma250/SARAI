import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaTimes, FaProjectDiagram, FaBuilding, FaBook } from 'react-icons/fa'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TYPE_ICON = {
  project:     <FaProjectDiagram />,
  stakeholder: <FaBuilding />,
  resource:    <FaBook />,
}
const TYPE_COLOR = {
  project:     '#2563eb',
  stakeholder: '#7c3aed',
  resource:    '#059669',
}

function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
  loading = false,
  // When true, show autocomplete suggestions and navigate on Enter/select
  suggestions: enableSuggestions = false,
  onSubmit,
}) {
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState([])
  const [showDrop, setShowDrop] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [sugLoading, setSugLoading] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch suggestions with 300ms debounce
  const fetchSuggestions = useCallback((q) => {
    clearTimeout(debounceRef.current)
    if (!q || q.trim().length < 2) { setSuggestions([]); setShowDrop(false); return }
    debounceRef.current = setTimeout(async () => {
      setSugLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/search/suggestions?q=${encodeURIComponent(q)}&limit=8`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowDrop((data.suggestions || []).length > 0)
        setActiveIdx(-1)
      } catch { setSuggestions([]) }
      finally { setSugLoading(false) }
    }, 300)
  }, [])

  useEffect(() => {
    if (enableSuggestions) fetchSuggestions(value)
    else { setSuggestions([]); setShowDrop(false) }
  }, [value, enableSuggestions, fetchSuggestions])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClear = () => {
    setSuggestions([]); setShowDrop(false)
    if (onClear) onClear()
    else if (onChange) onChange('')
  }

  const handleKeyDown = (e) => {
    if (!showDrop || suggestions.length === 0) {
      if (e.key === 'Enter' && enableSuggestions) {
        setShowDrop(false)
        if (onSubmit) onSubmit(value)
        else if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0) {
        selectSuggestion(suggestions[activeIdx])
      } else {
        setShowDrop(false)
        if (onSubmit) onSubmit(value)
        else if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`)
      }
    } else if (e.key === 'Escape') {
      setShowDrop(false)
      setActiveIdx(-1)
    }
  }

  const selectSuggestion = (sug) => {
    onChange(sug.text)
    setShowDrop(false)
    setActiveIdx(-1)
    if (onSubmit) onSubmit(sug.text)
    else navigate(`/search?q=${encodeURIComponent(sug.text)}`)
  }

  return (
    <div ref={wrapperRef} className={`sb-wrap ${className} ${loading || sugLoading ? 'is-loading' : ''}`}>
      <div className="sb-inner">
        <FaSearch className="sb-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => enableSuggestions && suggestions.length > 0 && setShowDrop(true)}
          className="sb-input"
          autoComplete="off"
        />
        {(loading || sugLoading) && <div className="sb-loader" />}
        {value && !loading && !sugLoading && (
          <button type="button" className="sb-clear" onClick={handleClear} aria-label="Clear">
            <FaTimes />
          </button>
        )}
      </div>

      {enableSuggestions && showDrop && suggestions.length > 0 && (
        <div className="sb-dropdown">
          {suggestions.map((sug, idx) => (
            <button
              key={`${sug.entity_type}-${sug.id}`}
              className={`sb-suggestion ${idx === activeIdx ? 'active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(sug) }}
              onMouseEnter={() => setActiveIdx(idx)}
            >
              <span className="sug-icon" style={{ color: TYPE_COLOR[sug.entity_type] || '#64748b' }}>
                {TYPE_ICON[sug.entity_type] || <FaSearch />}
              </span>
              <span className="sug-text">{sug.text}</span>
              <span className="sug-type" style={{ color: TYPE_COLOR[sug.entity_type] || '#64748b' }}>
                {sug.entity_type}
              </span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        .sb-wrap {
          width: 100%;
          max-width: 600px;
          position: relative;
        }
        .sb-inner {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          background: var(--white, #fff);
          border: 1.5px solid var(--gray-200, #e5e7eb);
          border-radius: 14px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .sb-inner:focus-within {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1), 0 1px 4px rgba(0,0,0,0.04);
          transform: translateY(-1px);
        }
        .sb-icon {
          position: absolute;
          left: 16px;
          color: var(--gray-400, #9ca3af);
          font-size: 0.95rem;
          pointer-events: none;
          transition: color 0.2s;
        }
        .sb-inner:focus-within .sb-icon { color: var(--primary-color, #2563eb); }
        .sb-input {
          width: 100%;
          padding: 12px 42px 12px 48px;
          border: none;
          background: transparent;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--gray-800, #1f2937);
          outline: none;
          font-family: inherit;
        }
        .sb-input::placeholder { color: var(--gray-400, #9ca3af); }
        .sb-clear {
          position: absolute;
          right: 12px;
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px;
          border-radius: 50%; border: none;
          background: var(--gray-100, #f3f4f6);
          color: var(--gray-500, #6b7280);
          cursor: pointer; transition: all 0.2s; padding: 0;
        }
        .sb-clear:hover { background: var(--gray-200, #e5e7eb); transform: scale(1.1); }
        .sb-loader {
          position: absolute; right: 12px;
          width: 16px; height: 16px;
          border: 2px solid var(--gray-200, #e5e7eb);
          border-top-color: var(--primary-color, #2563eb);
          border-radius: 50%;
          animation: sb-spin 0.6s linear infinite;
        }
        @keyframes sb-spin { to { transform: rotate(360deg); } }

        /* Dropdown */
        .sb-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: var(--white, #fff);
          border: 1px solid var(--gray-200, #e5e7eb);
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          z-index: 1200;
          overflow: hidden;
          animation: sb-drop-in 0.15s ease;
        }
        @keyframes sb-drop-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sb-suggestion {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--gray-800, #1f2937);
          text-align: left;
          transition: background 0.12s;
        }
        .sb-suggestion:hover, .sb-suggestion.active { background: var(--gray-50, #f9fafb); }
        .sug-icon { font-size: 0.85rem; flex-shrink: 0; }
        .sug-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
        .sug-type {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          opacity: 0.8;
        }

        /* Dark mode */
        [data-theme="dark"] .sb-inner { background: #1e293b; border-color: rgba(255,255,255,0.1); }
        [data-theme="dark"] .sb-input { color: #f1f5f9; }
        [data-theme="dark"] .sb-clear { background: rgba(255,255,255,0.07); color: #94a3b8; }
        [data-theme="dark"] .sb-clear:hover { background: rgba(255,255,255,0.12); }
        [data-theme="dark"] .sb-dropdown { background: #1e293b; border-color: rgba(255,255,255,0.1); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        [data-theme="dark"] .sb-suggestion { color: #e2e8f0; }
        [data-theme="dark"] .sb-suggestion:hover, [data-theme="dark"] .sb-suggestion.active { background: rgba(255,255,255,0.06); }
      `}</style>
    </div>
  )
}

export default SearchBar
