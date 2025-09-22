import express from 'express'
import { z } from 'zod'
import { Enrollment } from '../models/Enrollment.js'
import { Semester } from '../models/Semester.js'
import { LETTERS } from '../utils/grades.js'
import { validate } from '../middleware/validate.js'

const router = express.Router()
const CreateDto = z.object({
  semesterId: z.string().min(1),
  code: z.string().min(2).max(20),
  title: z.string().optional().default(''),
  credits: z.number({ coerce: true }).min(0.5).max(10),
  letter: z.enum(/** @type {const} */(LETTERS)),
  isRetake: z.boolean().optional().default(false)     // <- allow flag from client
})

router.get('/', async (req, res) => {
  const userId = req.user.sub
  const filter = { userId }
  if (req.query.semesterId) filter.semesterId = req.query.semesterId
  const rows = await Enrollment.find(filter).sort({ createdAt: 1 }).lean()
  res.json(rows)
})

router.post('/', validate(CreateDto), async (req, res) => {
  const userId = req.user.sub
  const { semesterId } = req.body

  // ensure semester belongs to user
  const sem = await Semester.findOne({ _id: semesterId, userId })
  if (!sem) return res.status(404).json({ message: 'Semester not found' })

  // normalize code to uppercase (schema also uppercases)
  const code = req.body.code.trim().toUpperCase()
  const { title = '', credits, letter, isRetake = false } = req.body

  // RULE 1: Max 5 per semester
  const count = await Enrollment.countDocuments({ userId, semesterId })
  if (count >= 5) return res.status(400).json({ message: 'You can add at most 5 courses in a semester.' })

  // RULE 2: No duplicate in same semester
  const dup = await Enrollment.findOne({ userId, semesterId, code })
  if (dup) return res.status(409).json({ message: `Course ${code} already exists in this semester.` })

  // RULE 3: If exists elsewhere, require explicit retake
  const prev = await Enrollment.findOne({ userId, code, semesterId: { $ne: semesterId } })
  if (prev && !isRetake) return res.status(409).json({ message: 'Retake confirmation required.' })

  const created = await Enrollment.create({ userId, semesterId, code, title, credits, letter, isRetake })
  res.status(201).json(created)
})

router.delete('/:id', async (req, res) => {
  const userId = req.user.sub
  const { id } = req.params
  const ok = await Enrollment.findOneAndDelete({ _id: id, userId })
  if (!ok) return res.status(404).json({ message: 'Not found' })
  res.json({ message: 'Deleted' })
})

export default router
