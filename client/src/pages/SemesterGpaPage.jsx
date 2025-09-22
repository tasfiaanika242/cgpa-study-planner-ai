import { useState, useMemo } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Box, Container, Paper, Typography, Stack, TextField,
  Select, MenuItem, Button, Divider, Stepper, Step, StepLabel,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Tooltip
} from '@mui/material'
import TopNav from '../components/TopNav'
import { api } from '../lib/api'

const GRADE_POINTS = { A:4.0,'A-':3.7,'B+':3.3,B:3.0,'B-':2.7,'C+':2.3,C:2.0,'C-':1.7,D:1.0,F:0.0 }
const LETTERS = Object.keys(GRADE_POINTS)
const pt = (l) => GRADE_POINTS[l] ?? 0
const round2 = (n) => Math.round(n * 100) / 100

export default function SemesterGpaPage() {
  const { id: semesterId } = useParams()

  const [active, setActive] = useState(0)
  const [prevCgpa, setPrevCgpa] = useState('')
  const [prevCourses, setPrevCourses] = useState('')
  const [numCourses, setNumCourses] = useState(4)
  const [rows, setRows] = useState(
    Array.from({ length: 4 }, () => ({ code: '', credits: 3, letter: 'A' }))
  )

  const step1Valid =
    prevCgpa !== '' && !isNaN(prevCgpa) && Number(prevCgpa) >= 0 && Number(prevCgpa) <= 4 &&
    prevCourses !== '' && Number(prevCourses) >= 0 &&
    Number.isInteger(Number(prevCourses)) &&
    numCourses > 0

  function ensureRows(n) {
    setRows((old) => {
      const copy = old.slice(0, n)
      while (copy.length < n) copy.push({ code: '', credits: 3, letter: 'A' })
      return copy
    })
  }

  const semesterCredits = useMemo(
    () => rows.reduce((a, r) => a + (Number(r.credits) || 0), 0),
    [rows]
  )
  const semesterQp = useMemo(
    () => rows.reduce((a, r) => a + (Number(r.credits) || 0) * pt(r.letter), 0),
    [rows]
  )
  const semesterGpa = useMemo(
    () => (semesterCredits > 0 ? semesterQp / semesterCredits : 0),
    [semesterCredits, semesterQp]
  )

  const prevCredits = useMemo(() => Number(prevCourses || 0) * 3, [prevCourses])
  const prevQp = useMemo(() => Number(prevCgpa || 0) * prevCredits, [prevCgpa, prevCredits])
  const newCgpa = useMemo(
    () =>
      prevCredits + semesterCredits > 0
        ? (prevQp + semesterQp) / (prevCredits + semesterCredits)
        : 0,
    [prevCredits, semesterCredits, prevQp, semesterQp]
  )

  async function prefillFromPlanner() {
    if (!semesterId) return
    try {
      const list = await api.listEnrollments(semesterId)
      if (!list?.length) return
      const mapped = list.map((e) => ({
        code: e.code || '',
        credits: Number(e.credits) || 3,
        letter: e.letter && LETTERS.includes(e.letter) ? e.letter : 'A',
      }))
      setNumCourses(mapped.length)
      setRows(mapped)
      if (active === 0) setActive(1)
    } catch (e) {
      alert(e.message)
    }
  }

  const handleRowChange = (i, key, val) => {
    setRows((old) => {
      const copy = [...old]
      copy[i] = { ...copy[i], [key]: key === 'credits' ? Number(val) : val }
      return copy
    })
  }

  const goNext = () => { ensureRows(numCourses); setActive(1) }
  const goBack = () => setActive(0)

  return (
    <>
      <TopNav buttons={['home']} />
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(79,70,229,0.14), transparent 60%)'
              : 'linear-gradient(180deg, rgba(79,70,229,0.08), transparent 60%)',
        }}
      >
        <Container maxWidth="md">
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h4" fontWeight={900} sx={{ color: 'primary.main' }}>
                BRACU CGPA Calculator
              </Typography>
              {semesterId && (
                <Tooltip title="Fill this semester's courses from your planner">
                  <span>
                    <Button onClick={prefillFromPlanner} variant="outlined">
                      Prefill from Planner
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Stack>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              Calculate your CGPA in just seconds!
            </Typography>

            <Divider sx={{ my: 2.5 }} />

            <Stepper activeStep={active} alternativeLabel sx={{ mb: 3 }}>
              <Step><StepLabel>Previous summary</StepLabel></Step>
              <Step><StepLabel>This semester grades</StepLabel></Step>
            </Stepper>

            {/* STEP 1 */}
            {active === 0 && (
              <Box>
                <Stack spacing={2.2}>
                  <div>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Current CGPA (before this semester)
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Current CGPA"
                      type="number"
                      value={prevCgpa}
                      onChange={(e) => setPrevCgpa(e.target.value)}
                      inputProps={{ step: '0.01', min: 0, max: 4 }}
                    />
                  </div>

                  <div>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Courses completed (before this semester)
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Courses completed"
                      type="number"
                      value={prevCourses}
                      onChange={(e) => setPrevCourses(e.target.value)}
                      inputProps={{ step: 1, min: 0 }}
                      helperText="Hint: Courses = Total credits / 3 (if you remember your total credits)"
                    />
                  </div>

                  <div>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Number of courses this semester
                    </Typography>
                    <Select
                      fullWidth
                      value={numCourses}
                      onChange={(e) => setNumCourses(Number(e.target.value))}
                    >
                      {[1,2,3,4,5,6,7,8].map((n) => (
                        <MenuItem key={n} value={n}>{n}</MenuItem>
                      ))}
                    </Select>
                  </div>

                  <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1 }}>
                    <Button component={RouterLink} to="/calculator" color="inherit">Cancel</Button>
                    <Button disabled={!step1Valid} variant="contained" onClick={goNext}>
                      Next
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}

            {/* STEP 2 */}
            {active === 1 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                  Enter this semester’s courses
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell align="right">Credits</TableCell>
                      <TableCell align="right">Letter</TableCell>
                      <TableCell align="right">Points</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <TextField
                            fullWidth
                            placeholder={`Code (optional)`}
                            value={r.code}
                            onChange={(e) => handleRowChange(i, 'code', e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 140 }}>
                          <TextField
                            type="number"
                            value={r.credits}
                            onChange={(e) => handleRowChange(i, 'credits', e.target.value)}
                            inputProps={{ min: 0, step: 1 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 160 }}>
                          <Select
                            value={r.letter}
                            onChange={(e) => handleRowChange(i, 'letter', e.target.value)}
                            fullWidth
                          >
                            {LETTERS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                          </Select>
                        </TableCell>
                        <TableCell align="right">{(pt(r.letter)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  justifyContent="space-between"
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={`Semester Credits: ${semesterCredits}`} variant="outlined" />
                    <Chip label={`Semester GPA: ${round2(semesterGpa).toFixed(2)}`} color="primary" variant="outlined" />
                    <Chip label={`New CGPA: ${round2(newCgpa).toFixed(2)}`} color="primary" />
                  </Stack>

                  <Stack direction="row" spacing={1.5}>
                    <Button onClick={goBack}>Back</Button>
                    <Button variant="contained" onClick={() => { /* live-calculated */ }}>
                      Calculate
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </>
  )
}
