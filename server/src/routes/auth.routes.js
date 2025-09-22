import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { config } from '../config.js'
import { User } from '../models/User.js'
import { validate } from '../middleware/validate.js'

const router = express.Router()

const emailRegex = new RegExp(`@${config.emailDomain.replace('.', '\\.')}$`, 'i')
const idRegex = new RegExp(`^\\d{${config.idMin},${config.idMax}}$`)

const RegisterDto = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email')
    .transform(v => v.trim().toLowerCase())
    .refine(v => emailRegex.test(v), `Use your BRACU GSuite email (@${config.emailDomain})`),
  studentId: z.string().regex(idRegex, `Student ID must be ${config.idMin}-${config.idMax} digits`),
  password: z.string().min(8, 'At least 8 characters')
})

const LoginDto = z.object({
  email: z.string().email().transform(v => v.trim().toLowerCase())
    .refine(v => emailRegex.test(v), `Use your BRACU GSuite email (@${config.emailDomain})`),
  password: z.string().min(8)
})

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, studentId: user.studentId },
    config.jwtSecret,
    { expiresIn: '2h' }
  )
}

router.post('/register', validate(RegisterDto), async (req, res) => {
  const { name, email, studentId, password } = req.body
  const exists = await User.findOne({ $or: [{ email }, { studentId }] })
  if (exists) return res.status(409).json({ message: 'Email or Student ID already in use' })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, studentId, passwordHash })
  res.status(201).json({
    message: 'Account created',
    user: { id: user._id, name: user.name, email: user.email, studentId: user.studentId }
  })
})

router.post('/login', validate(LoginDto), async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

  const accessToken = signAccessToken(user)
  res.json({
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, studentId: user.studentId }
  })
})

export default router
