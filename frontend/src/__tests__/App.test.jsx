import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

const mockLinks = [
  { id: 1, short_code: 'abc123', original_url: 'https://example.com', short_url: 'http://localhost:3001/abc123', click_count: '3', created_at: new Date().toISOString() }
]

beforeEach(() => {
  global.fetch = vi.fn()
  global.navigator.clipboard = { writeText: vi.fn() }
})

describe('App', () => {
  it('renders the create form', async () => {
    global.fetch.mockResolvedValueOnce({ json: async () => mockLinks })
    render(<App />)
    expect(screen.getByPlaceholderText(/paste your url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /shorten/i })).toBeInTheDocument()
  })

  it('shows links in the table', async () => {
    global.fetch.mockResolvedValueOnce({ json: async () => mockLinks })
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument()
    })
  })

  it('shows error for invalid url', async () => {
    global.fetch
      .mockResolvedValueOnce({ json: async () => mockLinks }) // initial load
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'invalid URL' }) }) // create

    render(<App />)
    const input = screen.getByPlaceholderText(/paste your url/i)
    fireEvent.change(input, { target: { value: 'https://test.com' } })
    fireEvent.submit(input.closest('form'))

    await waitFor(() => {
      expect(screen.getByText('invalid URL')).toBeInTheDocument()
    })
  })

  it('shows the new short link after creation', async () => {
    global.fetch
      .mockResolvedValueOnce({ json: async () => [] }) // initial
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, short_code: 'xyz789', short_url: 'http://localhost/xyz789', created_at: new Date().toISOString() }) }) // create
      .mockResolvedValueOnce({ json: async () => mockLinks }) // refresh

    render(<App />)
    const input = screen.getByPlaceholderText(/paste your url/i)
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    fireEvent.submit(input.closest('form'))

    await waitFor(() => {
      expect(screen.getByText(/xyz789/)).toBeInTheDocument()
    })
  })
})
