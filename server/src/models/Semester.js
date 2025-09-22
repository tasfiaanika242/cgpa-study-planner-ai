// server/src/models/Semester.js
import mongoose from 'mongoose'
const semesterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  name:   { type: String, required: true, trim: true }, // e.g., "Fall 2025"
}, { timestamps: true })
semesterSchema.index({ userId: 1, name: 1 }, { unique: true })
export const Semester = mongoose.model('Semester', semesterSchema)
