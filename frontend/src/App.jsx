import { useState, useEffect } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || '/api'

function App() {
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
      if (!res.ok) throw new Error(data.error || 'Failed')
      setCreated(data)
      setUrl('')
      fetchLinks()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copy = (text) => navigator.clipboard.writeText(text)

  return (
    <div className="app">
      <header>
        <h1>🔗 Link Tracker</h1>
        <p>Shorten links and track clicks</p>
      </header>

      <form onSubmit={handleCreate} className="create-form">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste your URL here..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Shorten'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {created && (
        <div className="result">
          <span>{created.short_url}</span>
          <button onClick={() => copy(created.short_url)}>Copy</button>
        </div>
      )}

      <table className="links-table">
        <thead>
          <tr>
            <th>Short URL</th>
            <th>Original</th>
            <th>Clicks</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {links.map(link => (
            <tr key={link.id}>
              <td>
                <a href={link.short_url} target="_blank" rel="noopener noreferrer">
                  {link.short_url}
                </a>
                <button onClick={() => copy(link.short_url)}>Copy</button>
              </td>
              <td className="original-url" title={link.original_url}>
                {link.original_url.length > 50
                  ? link.original_url.slice(0, 50) + '...'
                  : link.original_url}
              </td>
              <td>{link.click_count}</td>
              <td>{new Date(link.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
