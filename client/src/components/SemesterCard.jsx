import { useMemo, useState } from 'react'
import {
  Paper, Stack, Typography, Chip, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Grid, TextField, Button, Divider, Select, MenuItem, Box
} from '@mui/material'
import { normalizeCode, pt } from '../utils'

const LETTERS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'] // Grade letters

const SemesterCard = ({
  sem, courses, latestIdByCode, onRequestAddCourse, onRemoveCourse, onDeleteSemester, maxCourses
}) => {
  const [newCourse, setNewCourse] = useState({ code: '', credits: 3, letter: 'A' })

  const gpa = sem.gpa || 0
  const count = courses.length
  const maxReached = count >= maxCourses
  const attempted = useMemo(() => courses.reduce((a, c) => a + (Number(c.credits) || 0), 0), [courses])
  const earned = useMemo(
    () => courses.reduce((a, c) => a + ((pt(c.letter) ?? 0) > 0 ? (Number(c.credits) || 0) : 0), 0),
    [courses]
  )

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>{sem.name}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`GPA: ${gpa.toFixed(2)}`} color="primary" variant="outlined" />
          <Chip label={`${count}/${maxCourses} courses`} variant="outlined" />
          <Button size="small" color="error" onClick={() => onDeleteSemester()}>Delete</Button>
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

      <Box
        sx={{
          mt: 1.5, px: 1.5, py: 1,
          bgcolor: 'action.hover',
          borderRadius: 1
        }}
      >
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <b>SEMESTER</b> &nbsp; Credits Attempted: <b>{attempted.toFixed(2)}</b> &nbsp; Credits Earned:{' '}
              <b>{earned.toFixed(2)}</b> &nbsp; GPA: <b>{gpa.toFixed(2)}</b>
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
            value={newCourse.code}
            onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
            inputProps={{ maxLength: 20 }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth type="number" label="Credits"
            value={newCourse.credits}
            onChange={e => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
            inputProps={{ min: 0, step: 1 }}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <Select
            fullWidth value={newCourse.letter}
            onChange={e => setNewCourse({ ...newCourse, letter: e.target.value })}
          >
            {LETTERS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </Select>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            disabled={maxReached || !newCourse.code || !newCourse.credits}
            onClick={() => {
              onRequestAddCourse(sem._id, newCourse)
              setNewCourse({ code: '', credits: 3, letter: 'A' })
            }}
          >
            {maxReached ? 'Limit Reached' : 'Add Course'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default SemesterCard
