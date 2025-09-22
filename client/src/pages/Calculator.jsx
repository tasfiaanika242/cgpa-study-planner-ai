import { useEffect, useMemo, useState } from 'react'
import {
  Container, Box, Paper, Typography, Stack, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, Divider, Select, MenuItem, IconButton,
  CircularProgress, Snackbar, Alert
} from '@mui/material'
import TopNav from '../components/TopNav'
import { api } from '../lib/api'
import TrendChart from '../components/TrendChart'

// Display-only scale (server does real computation)
const GRADE_POINTS = { 'A':4.0,'A-':3.7,'B+':3.3,'B':3.0,'B-':2.7,'C+':2.3,'C':2.0,'C-':1.7,'D':1.0,'F':0.0 }
const LETTERS = Object.keys(GRADE_POINTS)
const pt = (l) => GRADE_POINTS[l] ?? null
const round2 = (n) => Math.round(n * 100) / 100
const normalizeCode = (s) => (s || '').trim().toUpperCase()
const MAX_COURSES_PER_SEM = 5

export default function Calculator() {
  const [loading, setLoading] = useState(true)
  const [semesters, setSemesters] = useState([])       // [{_id,name,totalCredits,gpa}]
  const [coursesBySem, setCoursesBySem] = useState({}) // { semId: [ {_id,code,credits,letter,isRetake,createdAt} ] }
  const [cgpa, setCgpa] = useState(0)

  const [openAddSem, setOpenAddSem] = useState(false)
  const [semName, setSemName] = useState('')
  const [toast, setToast] = useState(null)

  // retake confirm
  const [retakeOpen, setRetakeOpen] = useState(false)
  const [retakeTarget, setRetakeTarget] = useState(null) // { semId, course }

  useEffect(() => { (async () => {
    try {
      const [sems, cg] = await Promise.all([api.listSemesters(), api.cgpa()])
      setSemesters(sems)
      setCgpa(round2(cg.cgpa || 0))

      // load enrollments for all semesters
      const entries = await Promise.all(
        sems.map(async s => [s._id, await api.listEnrollments(s._id)])
      )
      setCoursesBySem(Object.fromEntries(entries))
    } catch (e) { alert(e.message) } finally { setLoading(false) }
  })() }, [])

  // Build a map of latest enrollment id per course code (to show (NT))
  const latestIdByCode = useMemo(() => {
    const flat = Object.values(coursesBySem).flat()
    // sort by createdAt desc; pick first for each code
    flat.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    const map = {}
    for (const row of flat) {
      const code = normalizeCode(row.code)
      if (!map[code]) map[code] = row._id
    }
    return map
  }, [coursesBySem])

  const totalCredits = useMemo(
    () => semesters.reduce((a,s) => a + (s.totalCredits || 0), 0), [semesters]
  )

  const countInSem = (semId) => (coursesBySem[semId]?.length || 0)
  const existsInSem = (semId, codeRaw) =>
    (coursesBySem[semId] || []).some(c => normalizeCode(c.code) === normalizeCode(codeRaw))
  const existsInOtherSems = (semId, codeRaw) => {
    const code = normalizeCode(codeRaw)
    for (const [sid, rows] of Object.entries(coursesBySem)) {
      if (sid === semId) continue
      if ((rows || []).some(r => normalizeCode(r.code) === code)) return true
    }
    return false
  }

  async function refreshSummaries() {
    const [sems, cg] = await Promise.all([api.listSemesters(), api.cgpa()])
    setSemesters(sems); setCgpa(round2(cg.cgpa || 0))
  }

  async function addSemester() {
    if (!semName.trim()) return
    const created = await api.createSemester(semName.trim())
    setSemesters(p => [...p, { ...created, totalCredits: 0, gpa: 0 }])
    setCoursesBySem(p => ({ ...p, [created._id]: [] }))
    setSemName(''); setOpenAddSem(false)
    setToast({ severity: 'success', message: 'Semester added' })
  }

  async function removeSemester(id) {
    await api.deleteSemester(id)
    setSemesters(p => p.filter(s => s._id !== id))
    setCoursesBySem(p => { const c = { ...p }; delete c[id]; return c })
    await refreshSummaries()
    setToast({ severity: 'info', message: 'Semester deleted' })
  }

  function requestAddCourse(semId, course) {
    const code = normalizeCode(course.code)
    if (countInSem(semId) >= MAX_COURSES_PER_SEM) {
      setToast({ severity: 'warning', message: `Max ${MAX_COURSES_PER_SEM} courses per semester.` }); return
    }
    if (existsInSem(semId, code)) {
      setToast({ severity: 'error', message: `Course ${code} already exists in this semester.` }); return
    }
    if (existsInOtherSems(semId, code)) {
      setRetakeTarget({ semId, course: { ...course, code } })
      setRetakeOpen(true)
      return
    }
    doAddCourse(semId, { ...course, code, isRetake: false })
  }

  async function doAddCourse(semId, course) {
    try {
      const created = await api.addEnrollment({
        semesterId: semId,
        code: normalizeCode(course.code),
        title: course.title || '',
        credits: Number(course.credits),
        letter: course.letter,
        isRetake: !!course.isRetake
      })
      setCoursesBySem(p => ({ ...p, [semId]: [...(p[semId]||[]), created] }))
      await refreshSummaries()
      setToast({ severity: 'success', message: `Added ${created.code}${created.isRetake ? ' (RT)' : ''}.` })
    } catch (e) {
      if ((e.message || '').toLowerCase().includes('retake')) {
        setRetakeTarget({ semId, course })
        setRetakeOpen(true)
      } else {
        setToast({ severity: 'error', message: e.message })
      }
    }
  }

  async function removeCourse(semId, enrollmentId) {
    await api.deleteEnrollment(enrollmentId)
    setCoursesBySem(p => ({ ...p, [semId]: (p[semId]||[]).filter(e => e._id !== enrollmentId) }))
    await refreshSummaries()
    setToast({ severity: 'info', message: 'Course removed' })
  }

  // latest / "current" semester id for TopNav CGPA button
  const currentSemesterId = semesters.length ? semesters[semesters.length - 1]._id : undefined

  if (loading) {
    return (
      <>
        <TopNav buttons={['home','calc-sem-cgpa','study-planner']} semesterId={currentSemesterId} />
        <Container sx={{ py: 6, textAlign:'center' }}><CircularProgress /></Container>
      </>
    )
  }

  return (
    <>
      {/* Top bar with Home + Calculate Current Semester CGPA + Study Planner */}
      <TopNav buttons={['home','calc-sem-cgpa','study-planner']} semesterId={currentSemesterId} />

      <Container sx={{ py: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Stat title="Current CGPA (latest attempts)" value={cgpa.toFixed(2)} subtitle="Across all semesters" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Stat title="Total Credits (attempted)" value={totalCredits} subtitle={`${semesters.length} semester(s)`} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="body2" color="text.secondary">Actions</Typography>
              <Stack direction="row" spacing={1.5} mt={1}>
                <Button variant="contained" onClick={() => setOpenAddSem(true)}>Add Semester</Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* 🔥 Trend chart (Semester GPA & Cumulative CGPA) */}
        <Box mt={3}>
          <TrendChart semesters={semesters} coursesBySem={coursesBySem} />
        </Box>

        <Box mt={4}>
          <Typography variant="h6" fontWeight={800} gutterBottom>Semesters</Typography>
          <Stack spacing={2}>
            {semesters.map(s => (
              <SemesterCard
                key={s._id}
                sem={s}
                courses={coursesBySem[s._id] || []}
                latestIdByCode={latestIdByCode}
                onRequestAddCourse={requestAddCourse}
                onRemoveCourse={removeCourse}
                onDeleteSemester={() => removeSemester(s._id)}
                maxCourses={MAX_COURSES_PER_SEM}
              />
            ))}
          </Stack>
        </Box>
      </Container>

      {/* Add Semester */}
      <Dialog open={openAddSem} onClose={() => setOpenAddSem(false)}>
        <DialogTitle>Add Semester</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField autoFocus fullWidth label="Semester name (e.g., Spring 2023)"
            value={semName} onChange={e => setSemName(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddSem(false)}>Cancel</Button>
          <Button variant="contained" onClick={addSemester}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Retake confirm */}
      <Dialog open={retakeOpen} onClose={() => setRetakeOpen(false)}>
        <DialogTitle>Retake this course?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            You already took <b>{retakeTarget?.course?.code}</b> in another semester.
            Add it again as a <b>retake</b>? (Latest attempt will count toward CGPA.)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRetakeOpen(false); setRetakeTarget(null) }}>No</Button>
          <Button variant="contained" onClick={() => {
            const { semId, course } = retakeTarget
            setRetakeOpen(false); setRetakeTarget(null)
            doAddCourse(semId, { ...course, isRetake: true })
          }}>Yes</Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar open={!!toast} autoHideDuration={2600} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast && <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>}
      </Snackbar>
    </>
  )
}

function Stat({ title, value, subtitle }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h5" fontWeight={800}>{value}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Paper>
  )
}

function SemesterCard({
  sem, courses, latestIdByCode, onRequestAddCourse, onRemoveCourse, onDeleteSemester, maxCourses
}) {
  const gpa = sem.gpa || 0
  const [code, setCode] = useState('')
  const [credits, setCredits] = useState(3)
  const [letter, setLetter] = useState('A')

  const valid = code.trim() && Number(credits) > 0 && LETTERS.includes(letter)
  const count = courses.length
  const maxReached = count >= maxCourses

  // semester stats like your picture
  const attempted = useMemo(() => courses.reduce((a,c) => a + (Number(c.credits)||0), 0), [courses])
  const earned = useMemo(
    () => courses.reduce((a,c) => a + ((pt(c.letter) ?? 0) > 0 ? (Number(c.credits)||0) : 0), 0),
    [courses]
  )

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>{sem.name}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`GPA: ${round2(gpa).toFixed(2)}`} color="primary" variant="outlined" />
          <Chip label={`${count}/${maxCourses} courses`} variant="outlined" />
          <Button size="small" color="error" onClick={onDeleteSemester}>Delete</Button>
        </Stack>
      </Stack>

      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Course Code</TableCell>
            <TableCell align="right">Credits</TableCell>
            <TableCell align="right">Letter</TableCell>
            <TableCell align="right">Points</TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {courses.map((c) => {
            const latestId = latestIdByCode[normalizeCode(c.code)]
            const isLatestAttempt = latestId === c._id
            const showNT = !isLatestAttempt // old attempt → (NT)
            return (
              <TableRow key={c._id}>
                <TableCell>{c.code}</TableCell>
                <TableCell align="right">{c.credits}</TableCell>
                <TableCell align="right">
                  {c.letter}{c.isRetake ? ' (RT)' : ''}{showNT ? ' (NT)' : ''}
                </TableCell>
                <TableCell align="right">{(pt(c.letter) ?? 0).toFixed(2)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => onRemoveCourse(sem._id, c._id)}>✕</IconButton>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Summary row */}
      <Box sx={{ mt: 1.5, px: 1.5, py: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <b>SEMESTER</b> &nbsp; Credits Attempted: <b>{attempted.toFixed(2)}</b> &nbsp; Credits Earned:{' '}
              <b>{earned.toFixed(2)}</b> &nbsp; GPA: <b>{round2(gpa).toFixed(2)}</b>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Note: (RT) = retake, (NT) = not counted toward overall CGPA (a newer attempt exists).
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={1}>
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth label="Course Code" placeholder="e.g., CSE111"
            value={code} onChange={e => setCode(e.target.value)} inputProps={{ maxLength: 20 }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth type="number" label="Credits" value={credits}
            onChange={e => setCredits(e.target.value)} inputProps={{ min: 0, step: 1 }}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <Select fullWidth value={letter} onChange={e => setLetter(e.target.value)}>
            {LETTERS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </Select>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            disabled={!valid || maxReached}
            onClick={() => onRequestAddCourse(sem._id, { code, credits: Number(credits), letter })}
          >
            {maxReached ? 'Limit Reached' : 'Add Course'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}
