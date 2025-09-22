// server/src/routes/compute.routes.js
import express from 'express'
import mongoose from 'mongoose'
import { Enrollment } from '../models/Enrollment.js'
import { computeGpa } from '../utils/grades.js'

const router = express.Router()

// Per-semester GPA (unchanged): counts all courses that semester
router.get('/gpa', async (req, res) => {
  const userId = req.user.sub
  const { semesterId } = req.query
  if (!semesterId) return res.status(400).json({ message: 'semesterId is required' })
  const rows = await Enrollment.find({ userId, semesterId }).lean()
  return res.json({ gpa: computeGpa(rows) })
})

// Overall CGPA with **latest attempt wins** per course code
router.get('/cgpa', async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.sub)

  // Take the most recent enrollment per course code (by createdAt)
  const latest = await Enrollment.aggregate([
    { $match: { userId } },
    { $sort: { code: 1, createdAt: -1 } },   // latest per code on top
    {
      $group: {
        _id: '$code',
        letter: { $first: '$letter' },
        credits: { $first: '$credits' },
      }
    }
  ])

  const cgpa = computeGpa(latest)
  return res.json({ cgpa })
})

export default router
