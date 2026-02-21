import { useState, useEffect } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || '/api'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function App() {
  const [url, setUrl] = useState('')
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  const fetchLinks = async () => {
    const res = await fetch(`${API}/links`)
    const data = await res.json()
    setLinks(data)
  }

  useEffect(() => { fetchLinks() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCreated(null)
    try {
      const res = await fetch(`${API}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setCreated(data)
      setUrl('')
      fetchLinks()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="hero">
        <div className="hero-icon">🔗</div>
        <h1>Link Tracker</h1>
        <p>Shorten links and track every click</p>
      </div>

      <div className="create-card">
        <form onSubmit={handleCreate}>
          <div className="input-row">
            <input
              className="url-input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste your long URL here..."
              required
            />
            <button className="shorten-btn" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Shortening</> : 'Shorten →'}
            </button>
          </div>
          {error && (
            <div className="error-alert">
              <span>⚠</span> {error}
            </div>
          )}
        </form>
      </div>

      {created && (
        <div className="result-card">
          <div>
            <div className="result-label">Your short link is ready</div>
            <div className="result-url">{created.short_url}</div>
          </div>
          <CopyButton text={created.short_url} />
        </div>
      )}

      <div className="links-header">
        <span className="links-title">Your links</span>
        {links.length > 0 && <span className="links-count">{links.length} link{links.length !== 1 ? 's' : ''}</span>}
      </div>

      {links.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No links yet — paste a URL above to get started</p>
        </div>
      ) : (
        links.map(link => (
          <div className="link-card" key={link.id}>
            <div className="link-main">
              <div className="link-short">
                <a href={link.short_url} target="_blank" rel="noopener noreferrer">
                  {link.short_url?.replace(/^https?:\/\//, '')}
                </a>
                <span className="click-badge">↗ {link.click_count || 0} clicks</span>
              </div>
              <div className="link-original" title={link.original_url}>
                {link.original_url}
              </div>
              <div className="link-meta">{timeAgo(link.created_at)}</div>
            </div>
            <div className="link-actions">
              <CopyButton text={link.short_url} />
            </div>
          </div>
        ))
      )}
    </div>
  )
}
