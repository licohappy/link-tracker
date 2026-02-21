import { Router } from 'express'
import { createHash } from 'crypto'
import { pool } from '../db/index.js'

export const redirectRouter = Router()

redirectRouter.get('/:code', async (req, res) => {
  const { code } = req.params
  const result = await pool.query('SELECT * FROM links WHERE short_code = $1', [code])
  if (result.rows.length === 0) return res.status(404).send('Not found')

  const link = result.rows[0]
  const ip_hash = createHash('sha256').update(req.ip || '').digest('hex')

  // Record click (non-blocking)
  pool.query(
    'INSERT INTO clicks (link_id, ip_hash, user_agent, referer) VALUES ($1, $2, $3, $4)',
    [link.id, ip_hash, req.headers['user-agent'] || null, req.headers['referer'] || null]
  ).catch(err => console.error('Click record error:', err))

  res.redirect(301, link.original_url)
})
