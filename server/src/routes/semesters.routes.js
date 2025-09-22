// server/src/routes/semesters.routes.js
import express from 'express'
import { z } from 'zod'
import { Semester } from '../models/Semester.js'
import { Enrollment } from '../models/Enrollment.js'
import { validate } from '../middleware/validate.js'
import { computeGpa } from '../utils/grades.js'

const router = express.Router()

const CreateDto = z.object({ name: z.string().min(2).max(100) })

// GET /api/semesters  -> list with GPA + totalCredits
router.get('/', async (req, res) => {
  const userId = req.user.sub
  const semesters = await Semester.find({ userId }).sort({ createdAt: 1 }).lean()

  // attach summary (gpa, totalCredits)
  const ids = semesters.map(s => s._id)
  const enrolls = await Enrollment.find({ userId, semesterId: { $in: ids } }).lean()

  const bySem = new Map()
  for (const e of enrolls) {
    const arr = bySem.get(String(e.semesterId)) || []
    arr.push(e); bySem.set(String(e.semesterId), arr)
  }

  const data = semesters.map(s => {
    const rows = bySem.get(String(s._id)) || []
    const totalCredits = rows.reduce((a, r) => a + (Number(r.credits) || 0), 0)
    const gpa = computeGpa(rows)
    return { ...s, totalCredits, gpa }
  })

  res.json(data)
})

// POST /api/semesters
router.post('/', validate(CreateDto), async (req, res) => {
  const userId = req.user.sub
  const exists = await Semester.findOne({ userId, name: req.body.name })
  if (exists) return res.status(409).json({ message: 'Semester already exists' })
  const created = await Semester.create({ userId, name: req.body.name })
  res.status(201).json(created)
})

// DELETE /api/semesters/:id  (also delete its enrollments)
router.delete('/:id', async (req, res) => {
  const userId = req.user.sub
  const { id } = req.params
  const sem = await Semester.findOneAndDelete({ _id: id, userId })
  if (!sem) return res.status(404).json({ message: 'Not found' })
  await Enrollment.deleteMany({ userId, semesterId: id })
  res.json({ message: 'Deleted' })
})

export default router
