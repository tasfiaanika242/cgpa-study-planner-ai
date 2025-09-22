import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', index: true, required: true },
  code:       { type: String, required: true, trim: true, uppercase: true }, // <- auto UPPER
  title:      { type: String, trim: true, default: '' },
  credits:    { type: Number, required: true, min: 0 },
  letter:     { type: String, required: true, trim: true },
  isRetake:   { type: Boolean, default: false }, // <- NEW
}, { timestamps: true })

enrollmentSchema.index({ userId: 1, semesterId: 1, code: 1 }) // prevent dup in same sem

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema)
