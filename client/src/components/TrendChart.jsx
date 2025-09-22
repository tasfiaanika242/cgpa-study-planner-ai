import { useMemo } from 'react'
import { Paper, Typography, Box } from '@mui/material'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts'

const POINTS = { A:4.0,'A-':3.7,'B+':3.3,B:3.0,'B-':2.7,'C+':2.3,C:2.0,'C-':1.7,D:1.0,F:0.0 }
const pt = (l) => POINTS[l] ?? 0
const norm = (s) => (s || '').trim().toUpperCase()
const r2 = (n) => Math.round(n * 100) / 100

/**
 * Builds two series:
 * - gpa: per-semester GPA (already computed on server and sent in semesters[i].gpa)
 * - cgpa: cumulative CGPA where for each course code only the latest attempt
 *         up to that semester is counted (latest-attempt-wins).
 */
export default function TrendChart({ semesters, coursesBySem }) {
  const data = useMemo(() => {
    const latestByCode = new Map() // code -> {credits, points}
    const out = []

    for (const s of semesters) {
      // incorporate this semester’s enrollments
      const rows = coursesBySem[s._id] || []
      for (const r of rows) {
        latestByCode.set(norm(r.code), {
          credits: Number(r.credits) || 0,
          points: pt(r.letter)
        })
      }
      // compute cumulative CGPA from latestByCode
      let num = 0, den = 0
      latestByCode.forEach(v => { num += v.points * v.credits; den += v.credits })
      out.push({
        name: s.name,
        gpa: r2(s.gpa || 0),
        cgpa: den ? r2(num / den) : 0
      })
    }
    return out
  }, [semesters, coursesBySem])

  if (!semesters?.length) return null

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={800} gutterBottom>Performance Trend</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        GPA per semester and cumulative CGPA (latest attempt of each course counted).
      </Typography>

      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 4]} ticks={[0,1,2,3,4]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : v)} />
            <Legend />
            <ReferenceLine y={4.0} strokeOpacity={0.2} />
            <Line type="monotone" dataKey="gpa" name="Semester GPA" strokeWidth={2} dot />
            <Line type="monotone" dataKey="cgpa" name="Cumulative CGPA" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}
