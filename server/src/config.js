import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cgpa_planner',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change',
  emailDomain: (process.env.ALLOWED_EMAIL_DOMAIN || 'g.bracu.ac.bd').toLowerCase(),
  idMin: Number(process.env.STUDENT_ID_MIN || 6),
  idMax: Number(process.env.STUDENT_ID_MAX || 12),
}
