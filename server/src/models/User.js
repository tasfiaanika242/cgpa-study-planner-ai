import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    studentId: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
