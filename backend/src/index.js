import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { migrate } from './db/index.js'
import { linksRouter } from './routes/links.js'
import { redirectRouter } from './routes/redirect.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

// Health must come before redirect router (/:code catches everything 6-char)
app.get('/health', (req, res) => res.json({ ok: true }))

// API routes
app.use('/api/links', linksRouter)

// Catch-all short code redirect — must be last
app.use('/', redirectRouter)

migrate()
  .then(() => app.listen(PORT, () => console.log(`Backend running on port ${PORT}`)))
  .catch(err => { console.error('Migration failed:', err); process.exit(1) })
