import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock pg pool
vi.mock('../db/index.js', () => ({
  pool: {
    query: vi.fn(),
  },
  migrate: vi.fn(),
}))

// Mock redis
vi.mock('../db/redis.js', () => ({
  redis: {
    connect: vi.fn(),
    sendCommand: vi.fn(),
    on: vi.fn(),
  },
}))

// Mock rate-limit-redis
vi.mock('rate-limit-redis', () => ({
  RedisStore: vi.fn().mockImplementation(() => ({})),
}))

const { pool } = await import('../db/index.js')

// Dynamically import app after mocks are set up
const { default: app } = await import('../index.js')
const supertest = (await import('supertest')).default
const request = supertest(app)

describe('POST /api/links', () => {
  it('returns 400 for missing url', async () => {
    const res = await request.post('/api/links').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('url is required')
  })

  it('returns 400 for invalid url', async () => {
    const res = await request.post('/api/links').send({ url: 'not-a-url' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid URL')
  })

  it('creates a short link for valid url', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, short_code: 'abc123', original_url: 'https://example.com', created_at: new Date() }]
    })
    const res = await request.post('/api/links').send({ url: 'https://example.com' })
    expect(res.status).toBe(200)
    expect(res.body.short_code).toBe('abc123')
    expect(res.body.short_url).toContain('abc123')
  })
})

describe('GET /api/links', () => {
  it('returns list of links', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, short_code: 'abc123', original_url: 'https://example.com', click_count: '5' }]
    })
    const res = await request.get('/api/links')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].short_code).toBe('abc123')
  })
})

describe('GET /:code', () => {
  it('redirects to original url', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, short_code: 'abc123', original_url: 'https://example.com' }] })
      .mockResolvedValueOnce({ rows: [] }) // click insert
    const res = await request.get('/abc123')
    expect(res.status).toBe(301)
    expect(res.headers.location).toBe('https://example.com')
  })

  it('returns 404 for unknown code', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })
    const res = await request.get('/xxxxxx')
    expect(res.status).toBe(404)
  })
})
