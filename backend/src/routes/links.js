import { Router } from 'express'
import { nanoid } from 'nanoid'
import { pool } from '../db/index.js'
import { rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis } from '../db/redis.js'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  store: new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) }),
})

export const linksRouter = Router()

// POST /api/links — create short link
linksRouter.post('/', limiter, async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'url is required' })

  // Validate URL
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
  } catch {
    return res.status(400).json({ error: 'invalid URL' })
  }

  const short_code = nanoid(6)
  const result = await pool.query(
    'INSERT INTO links (short_code, original_url) VALUES ($1, $2) RETURNING *',
    [short_code, url]
  )

  const base = process.env.BASE_URL || 'http://localhost:3001'
  res.json({ ...result.rows[0], short_url: `${base}/${short_code}` })
})

// GET /api/links — list all links with click counts
linksRouter.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT l.*, COUNT(c.id) AS click_count, MAX(c.clicked_at) AS last_clicked
    FROM links l
    LEFT JOIN clicks c ON c.link_id = l.id
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `)
  res.json(result.rows)
})
