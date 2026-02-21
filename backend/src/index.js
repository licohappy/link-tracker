import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { linksRouter } from './routes/links.js'
import { redirectRouter } from './routes/redirect.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/links', linksRouter)
app.use('/', redirectRouter)

app.get('/health', (req, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))
