import { useState, useRef, useEffect, useCallback } from 'react'
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner, FaCopy, FaCheck, FaTrashAlt, FaChevronDown } from 'react-icons/fa'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const MAX_CHARS = 500

const INITIAL_SUGGESTIONS = [
  'Give me an overview of SARAI',
  'Show AI projects in Tunisia',
  'Which country has the most projects?',
  'Find health sector projects',
  'List universities in Morocco',
  'Top sectors by project count',
  'Show machine learning projects',
  'Find NGOs in Egypt',
]

const SECTOR_COLORS = {
  health: '#10b981', healthcare: '#10b981',
  education: '#3b82f6',
  finance: '#f59e0b', banking: '#f59e0b',
  agriculture: '#84cc16', agritech: '#84cc16',
  energy: '#f97316',
  transportation: '#8b5cf6', transport: '#8b5cf6',
  security: '#ef4444', cybersecurity: '#ef4444',
  environment: '#06b6d4', climate: '#06b6d4',
  'smart cities': '#ec4899', govtech: '#ec4899',
  nlp: '#6366f1', 'machine learning': '#6366f1', 'deep learning': '#6366f1',
}

const sectorColor = (s) =>
  SECTOR_COLORS[(s || '').toLowerCase()] || '#64748b'

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function ProjectCard({ item }) {
  const country = item.country_name || item.country || null
  return (
    <div className="result-card project-card">
      <div className="rc-title">{item.title || 'Untitled Project'}</div>
      <div className="rc-tags">
        {item.sector && (
          <span className="rc-tag" style={{ background: sectorColor(item.sector) + '22', color: sectorColor(item.sector) }}>
            {item.sector}
          </span>
        )}
        {item.ai_technology && (
          <span className="rc-tag tech-tag">{item.ai_technology}</span>
        )}
        {country && <span className="rc-tag country-tag">📍 {country}</span>}
      </div>
    </div>
  )
}

function StakeholderCard({ item }) {
  return (
    <div className="result-card stakeholder-card">
      <div className="rc-title">{item.name || 'Unknown'}</div>
      <div className="rc-tags">
        {item.type && <span className="rc-tag type-tag">{item.type}</span>}
        {item.country && <span className="rc-tag country-tag">📍 {item.country}</span>}
      </div>
    </div>
  )
}

function BotMessage({ msg, onCopy, copied }) {
  const isProject = msg.intent_type === 'search_projects'
  const isStakeholder = msg.intent_type === 'search_stakeholders'
  const hasCards = Array.isArray(msg.data) && msg.data.length > 0

  return (
    <div className="chat-msg bot">
      <div className="bot-avatar-sm"><FaRobot size={11} /></div>
      <div className="bot-msg-content">
        <div className="chat-bubble bot-bubble">
          <div className="bubble-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={() => onCopy(msg.text, msg.id)}
            title="Copy response"
          >
            {copied ? <FaCheck size={10} /> : <FaCopy size={10} />}
          </button>
        </div>

        {/* Rich result cards */}
        {hasCards && (
          <div className="result-cards">
            {isProject && msg.data.map((item, i) => <ProjectCard key={i} item={item} />)}
            {isStakeholder && msg.data.map((item, i) => <StakeholderCard key={i} item={item} />)}
          </div>
        )}

        {/* Follow-up suggestion chips */}
        {msg.followups && msg.followups.length > 0 && (
          <div className="followup-chips">
            {msg.followups.map((s, i) => (
              <span key={i} className="followup-chip" data-query={s}>{s}</span>
            ))}
          </div>
        )}

        <span className="msg-time">{formatTime(msg.time)}</span>
      </div>
    </div>
  )
}

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/•\s/g, '<span class="bullet">•</span> ')
    .replace(/\n/g, '<br/>')
}

// ─── Main Component ──────────────────────────────────────────────────────────

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'bot',
      text: "Hi! I'm **SARAI**, your AI assistant for the Arab AI Repository.\n\nAsk me about projects, organizations, sectors, countries or statistics across 22 Arab nations.",
      time: new Date(),
      data: null,
      intent_type: null,
      followups: [],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [copied, setCopied] = useState(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [cleared, setCleared] = useState(false)
  const chatEnd   = useRef(null)
  const bodyRef   = useRef(null)
  const inputRef  = useRef(null)
  const msgIdRef  = useRef(1)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, loading, open])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 280)
    }
  }, [open])

  // Scroll indicator
  const handleScroll = () => {
    const el = bodyRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setShowScrollBtn(!atBottom)
  }

  // Delegate followup chip clicks inside body
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const handler = (e) => {
      const chip = e.target.closest('.followup-chip')
      if (chip) sendMessage(chip.dataset.query)
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  })

  const copyMessage = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const clearConversation = () => {
    setMessages([
      {
        id: 0,
        role: 'bot',
        text: "Conversation cleared. How can I help you?",
        time: new Date(),
        data: null,
        intent_type: null,
        followups: [],
      },
    ])
    setUnread(0)
    setCleared(true)
    setTimeout(() => setCleared(false), 1500)
  }

  const sendMessage = async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return
    setInput('')

    const userMsg = { id: msgIdRef.current++, role: 'user', text: q, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Build history from last 10 messages (for multi-turn context)
    const history = messages.slice(-10).map(m => ({ role: m.role === 'bot' ? 'bot' : 'user', text: m.text }))

    try {
      const res = await fetch(`${API_BASE}/chatbot/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      const botMsg = {
        id: msgIdRef.current++,
        role: 'bot',
        text: data.answer,
        time: new Date(),
        data: data.data || null,
        intent_type: data.intent_type || null,
        followups: data.followups || [],
        source: data.source,
      }
      setMessages(prev => [...prev, botMsg])
      if (!open) setUnread(n => n + 1)
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: msgIdRef.current++,
          role: 'bot',
          text: 'Sorry, I could not connect to the server. Please make sure the backend is running.',
          time: new Date(),
          data: null,
          intent_type: null,
          followups: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const showSuggestions = messages.length === 1

  return (
    <>
      {/* Toggle button */}
      <button
        className={`chatbot-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI assistant"
      >
        {open ? <FaTimes size={20} /> : <FaRobot size={22} />}
        {!open && <span className="chatbot-pulse" />}
        {!open && unread > 0 && <span className="unread-badge">{unread}</span>}
      </button>

      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar"><FaRobot size={16} /></div>
              <div>
                <div className="chatbot-name">SARAI</div>
                <div className="chatbot-status"><span className="status-dot" />Arab AI Repository Assistant</div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="header-action-btn"
                onClick={clearConversation}
                title="Clear conversation"
              >
                {cleared ? <FaCheck size={12} /> : <FaTrashAlt size={12} />}
              </button>
              <button className="header-action-btn" onClick={() => setOpen(false)} title="Close">
                <FaTimes size={13} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-body" ref={bodyRef} onScroll={handleScroll}>
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="chat-msg user">
                  <div className="chat-bubble user-bubble">{msg.text}</div>
                  <span className="msg-time user-time">{formatTime(msg.time)}</span>
                </div>
              ) : (
                <BotMessage
                  key={msg.id}
                  msg={msg}
                  onCopy={copyMessage}
                  copied={copied === msg.id}
                />
              )
            )}

            {loading && (
              <div className="chat-msg bot">
                <div className="bot-avatar-sm"><FaRobot size={11} /></div>
                <div className="chat-bubble bot-bubble loading-bubble">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}

            {/* Initial suggestions */}
            {showSuggestions && (
              <div className="suggestions-section">
                <p className="suggestions-label">Suggested questions</p>
                <div className="suggestions-grid">
                  {INITIAL_SUGGESTIONS.map((s, i) => (
                    <button key={i} className="suggestion-chip-init" onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEnd} />
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollBtn && (
            <button className="scroll-to-bottom" onClick={scrollToBottom} title="Scroll to bottom">
              <FaChevronDown size={12} />
            </button>
          )}

          {/* Footer */}
          <div className="chatbot-footer">
            <div className="input-wrap">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                placeholder="Ask about projects, countries, sectors…"
                disabled={loading}
              />
              {input.length > MAX_CHARS * 0.8 && (
                <span className={`char-count ${input.length >= MAX_CHARS ? 'over' : ''}`}>
                  {input.length}/{MAX_CHARS}
                </span>
              )}
            </div>
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              title="Send"
            >
              {loading ? <FaSpinner className="spin" size={14} /> : <FaPaperPlane size={14} />}
            </button>
          </div>
        </div>
      )}

      <style>{`
        /* ═══════════════════════════════════════════════
           Toggle Button
        ═══════════════════════════════════════════════ */
        .chatbot-toggle {
          position: fixed; bottom: 28px; right: 28px;
          width: 58px; height: 58px; border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8 0%, #059669 100%);
          color: #fff; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 32px rgba(29,78,216,0.45);
          z-index: 9990; transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .chatbot-toggle:hover { transform: scale(1.1); }
        .chatbot-toggle.open {
          background: #ef4444;
          box-shadow: 0 8px 24px rgba(239,68,68,0.35);
        }
        .chatbot-pulse {
          position: absolute; top: 5px; right: 5px;
          width: 11px; height: 11px; border-radius: 50%; background: #10b981;
          animation: pulse 2.2s infinite;
        }
        @keyframes pulse {
          0%,100%{ transform:scale(1);opacity:1; }
          50%{ transform:scale(1.45);opacity:0.55; }
        }
        .unread-badge {
          position: absolute; top: -2px; right: -2px;
          min-width: 18px; height: 18px; border-radius: 9px;
          background: #ef4444; color: #fff; font-size: 0.65rem;
          font-weight: 800; display: flex; align-items: center;
          justify-content: center; padding: 0 4px;
          border: 2px solid #fff;
        }

        /* ═══════════════════════════════════════════════
           Window
        ═══════════════════════════════════════════════ */
        .chatbot-window {
          position: fixed; bottom: 102px; right: 28px;
          width: 420px; height: 600px;
          background: #ffffff; border-radius: 20px;
          box-shadow: 0 24px 80px -8px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04);
          display: flex; flex-direction: column;
          z-index: 9989; overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(20px) scale(0.95); }
          to   { opacity:1; transform:translateY(0)   scale(1); }
        }

        /* ═══════════════════════════════════════════════
           Header
        ═══════════════════════════════════════════════ */
        .chatbot-header {
          background: linear-gradient(135deg, #1e3a8a 0%, #065f46 100%);
          color: #fff; padding: 14px 16px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .chatbot-header-left { display: flex; align-items: center; gap: 11px; }
        .chatbot-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(255,255,255,0.3);
        }
        .chatbot-name { font-weight: 800; font-size: 1rem; letter-spacing: 0.3px; }
        .chatbot-status {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.68rem; opacity: 0.82; margin-top: 1px;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; flex-shrink:0; }
        .chatbot-header-actions { display: flex; gap: 6px; }
        .header-action-btn {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,0.12); border: none; color: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: 0.18s;
        }
        .header-action-btn:hover { background: rgba(255,255,255,0.22); }

        /* ═══════════════════════════════════════════════
           Body
        ═══════════════════════════════════════════════ */
        .chatbot-body {
          flex: 1; overflow-y: auto; padding: 16px 14px;
          display: flex; flex-direction: column; gap: 12px;
          background: #f8fafc;
          scroll-behavior: smooth;
        }
        .chatbot-body::-webkit-scrollbar { width: 5px; }
        .chatbot-body::-webkit-scrollbar-thumb {
          background: #cbd5e1; border-radius: 3px;
        }

        /* Scroll to bottom */
        .scroll-to-bottom {
          position: absolute; bottom: 76px; right: 16px;
          width: 30px; height: 30px; border-radius: 50%;
          background: #fff; border: 1px solid #e2e8f0;
          color: #64748b; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 10; transition: 0.2s;
        }
        .scroll-to-bottom:hover { background: #f1f5f9; }

        /* ═══════════════════════════════════════════════
           Messages
        ═══════════════════════════════════════════════ */
        .chat-msg {
          display: flex; align-items: flex-end; gap: 7px;
          animation: msgIn 0.25s ease-out;
        }
        @keyframes msgIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .chat-msg.user { justify-content: flex-end; }
        .chat-msg.bot  { justify-content: flex-start; align-items: flex-start; }

        .bot-avatar-sm {
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, #1d4ed8, #059669);
          color: #fff; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 4px;
        }

        .chat-bubble {
          max-width: 82%; padding: 10px 14px;
          font-size: 0.875rem; line-height: 1.6;
          border-radius: 16px;
        }
        .user-bubble {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff; border-bottom-right-radius: 4px;
          box-shadow: 0 2px 12px rgba(37,99,235,0.25);
        }
        .bot-bubble {
          background: #fff; color: #1e293b;
          border: 1px solid #e8edf5; border-bottom-left-radius: 4px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
          position: relative;
        }

        .bubble-text strong { font-weight: 700; }
        .bubble-text .bullet { color: #2563eb; font-weight: 700; }

        .msg-time {
          font-size: 0.62rem; color: #94a3b8; margin-top: 3px;
          display: block; padding: 0 2px;
        }
        .user-time { text-align: right; }

        .bot-msg-content { display: flex; flex-direction: column; gap: 5px; max-width: 82%; }

        /* Copy button */
        .copy-btn {
          position: absolute; top: 7px; right: 7px;
          width: 22px; height: 22px; border-radius: 6px;
          background: transparent; border: none; color: #94a3b8;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: 0.15s;
        }
        .bot-bubble:hover .copy-btn { opacity: 1; }
        .copy-btn:hover { background: #f1f5f9; color: #475569; }
        .copy-btn.copied { color: #10b981; opacity: 1; }

        /* Loading dots */
        .loading-bubble {
          display: flex; align-items: center; gap: 5px;
          padding: 14px 18px; min-width: 60px;
        }
        .loading-bubble .dot {
          width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
          animation: bounce 1.3s infinite ease-in-out;
        }
        .loading-bubble .dot:nth-child(2) { animation-delay: 0.18s; }
        .loading-bubble .dot:nth-child(3) { animation-delay: 0.36s; }
        @keyframes bounce {
          0%,80%,100%{ transform:scale(0.7);opacity:0.45; }
          40%{ transform:scale(1.1);opacity:1; }
        }

        /* ═══════════════════════════════════════════════
           Result Cards
        ═══════════════════════════════════════════════ */
        .result-cards {
          display: flex; flex-direction: column; gap: 5px;
          max-height: 220px; overflow-y: auto;
          padding-right: 2px;
        }
        .result-cards::-webkit-scrollbar { width: 3px; }
        .result-cards::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

        .result-card {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 8px 11px;
          transition: 0.18s;
        }
        .result-card:hover { border-color: #93c5fd; background: #eff6ff; }
        .rc-title {
          font-weight: 600; font-size: 0.8rem; color: #1e293b;
          margin-bottom: 5px; line-height: 1.3;
        }
        .rc-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .rc-tag {
          font-size: 0.68rem; padding: 2px 8px; border-radius: 100px;
          font-weight: 600; background: #f1f5f9; color: #64748b;
        }
        .tech-tag { background: #ede9fe; color: #7c3aed; }
        .type-tag { background: #fef3c7; color: #92400e; }
        .country-tag { background: #f0fdf4; color: #166534; }

        /* ═══════════════════════════════════════════════
           Follow-up Chips
        ═══════════════════════════════════════════════ */
        .followup-chips {
          display: flex; flex-wrap: wrap; gap: 5px;
          margin-top: 2px;
        }
        .followup-chip {
          background: #eff6ff; border: 1.5px solid #bfdbfe;
          border-radius: 100px; padding: 4px 11px;
          font-size: 0.72rem; font-weight: 600; color: #2563eb;
          cursor: pointer; transition: 0.18s; user-select: none;
          font-family: inherit;
        }
        .followup-chip:hover { background: #dbeafe; border-color: #93c5fd; }

        /* ═══════════════════════════════════════════════
           Initial Suggestions
        ═══════════════════════════════════════════════ */
        .suggestions-section { margin-top: 4px; }
        .suggestions-label {
          font-size: 0.68rem; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.6px;
          margin-bottom: 8px;
        }
        .suggestions-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .suggestion-chip-init {
          background: #fff; border: 1.5px solid #e2e8f0;
          border-radius: 100px; padding: 6px 13px;
          font-size: 0.75rem; font-weight: 600; color: #475569;
          cursor: pointer; transition: 0.18s; font-family: inherit;
        }
        .suggestion-chip-init:hover {
          background: #eff6ff; border-color: #93c5fd; color: #2563eb;
          transform: translateY(-1px);
        }

        /* ═══════════════════════════════════════════════
           Footer
        ═══════════════════════════════════════════════ */
        .chatbot-footer {
          display: flex; gap: 8px; padding: 10px 12px;
          border-top: 1px solid #f0f4f8; background: #fff; flex-shrink: 0;
        }
        .input-wrap { flex: 1; position: relative; }
        .input-wrap input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          font-size: 0.875rem; font-family: inherit;
          outline: none; transition: 0.2s; box-sizing: border-box;
          background: #f8fafc; color: #1e293b;
        }
        .input-wrap input:focus {
          border-color: #2563eb; background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.09);
        }
        .input-wrap input::placeholder { color: #94a3b8; }
        .char-count {
          position: absolute; bottom: -18px; right: 4px;
          font-size: 0.62rem; color: #94a3b8;
        }
        .char-count.over { color: #ef4444; }
        .send-btn {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: 0.2s; flex-shrink: 0; align-self: flex-start;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }
        .send-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: scale(1.05);
        }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .spin { animation: spinAnim 0.7s linear infinite; }
        @keyframes spinAnim { to { transform: rotate(360deg); } }

        /* ═══════════════════════════════════════════════
           Responsive
        ═══════════════════════════════════════════════ */
        @media (max-width: 480px) {
          .chatbot-window {
            right: 0; left: 0; bottom: 0;
            width: 100%; height: 85vh;
            border-radius: 20px 20px 0 0;
          }
          .chatbot-toggle { right: 16px; bottom: 16px; }
        }

        /* ═══════════════════════════════════════════════
           Dark Mode
        ═══════════════════════════════════════════════ */
        [data-theme="dark"] .chatbot-window {
          background: #1e293b;
          box-shadow: 0 24px 80px -8px rgba(0,0,0,0.55);
        }
        [data-theme="dark"] .chatbot-body { background: #0f172a; }
        [data-theme="dark"] .chatbot-body::-webkit-scrollbar-thumb { background: #334155; }

        [data-theme="dark"] .bot-bubble {
          background: #1e293b; color: #e2e8f0;
          border-color: rgba(255,255,255,0.07);
        }
        [data-theme="dark"] .bubble-text strong { color: #93c5fd; }

        [data-theme="dark"] .chatbot-footer {
          background: #1e293b; border-top-color: rgba(255,255,255,0.06);
        }
        [data-theme="dark"] .input-wrap input {
          background: #0f172a; border-color: rgba(255,255,255,0.1);
          color: #e2e8f0;
        }
        [data-theme="dark"] .input-wrap input:focus {
          border-color: #3b82f6; background: #0f172a;
        }
        [data-theme="dark"] .input-wrap input::placeholder { color: #475569; }

        [data-theme="dark"] .result-card {
          background: #0f172a; border-color: rgba(255,255,255,0.07);
        }
        [data-theme="dark"] .result-card:hover {
          background: rgba(37,99,235,0.1); border-color: rgba(59,130,246,0.3);
        }
        [data-theme="dark"] .rc-title { color: #e2e8f0; }
        [data-theme="dark"] .rc-tag { background: rgba(255,255,255,0.06); color: #94a3b8; }

        [data-theme="dark"] .followup-chip {
          background: rgba(37,99,235,0.12); border-color: rgba(59,130,246,0.25);
          color: #93c5fd;
        }
        [data-theme="dark"] .followup-chip:hover {
          background: rgba(37,99,235,0.22); border-color: rgba(59,130,246,0.45);
        }

        [data-theme="dark"] .suggestion-chip-init {
          background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.09);
          color: #94a3b8;
        }
        [data-theme="dark"] .suggestion-chip-init:hover {
          background: rgba(37,99,235,0.15); border-color: rgba(59,130,246,0.35); color: #93c5fd;
        }

        [data-theme="dark"] .scroll-to-bottom {
          background: #1e293b; border-color: rgba(255,255,255,0.1); color: #94a3b8;
        }
        [data-theme="dark"] .msg-time { color: #475569; }
        [data-theme="dark"] .suggestions-label { color: #475569; }
        [data-theme="dark"] .copy-btn { color: #475569; }
        [data-theme="dark"] .copy-btn:hover { background: rgba(255,255,255,0.06); color: #94a3b8; }
      `}</style>
    </>
  )
}

export default Chatbot
