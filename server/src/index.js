import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { config } from './config.js'
import authRoutes from './routes/auth.routes.js'
import semestersRoutes from './routes/semesters.routes.js'
import enrollmentsRoutes from './routes/enrollments.routes.js'
import computeRoutes from './routes/compute.routes.js'
import { requireAuth } from './middleware/auth.js'
const app = express()

// IMPORTANT: your Vite is running on 5173 (from your screenshot)
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'cgpa-planner-api', time: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)

// (Optional) global error guard
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Server error' })
})

mongoose.connect(config.mongoUri)
  .then(async () => {
    console.log('✅ MongoDB connected')
    const { User } = await import('./models/User.js')
    await User.init() // ensure unique indexes
    app.listen(config.port, () => {
      console.log(`🚀 API listening on http://localhost:${config.port}`)
    })
  })
  .catch(err => {
    console.error('❌ Mongo connection error:', err.message)
    process.exit(1)
  })
app.use('/api/semesters', requireAuth, semestersRoutes)
app.use('/api/enrollments', requireAuth, enrollmentsRoutes)
app.use('/api/compute', requireAuth, computeRoutes)