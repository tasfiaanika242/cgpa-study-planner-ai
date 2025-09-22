import { useState } from 'react'
import {
  Container, Paper, Typography, Stack, TextField, Button,
  InputAdornment, IconButton, Alert, Box
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import TopNav from '../components/TopNav'

// adjustable Student ID rule (digits only)
const STUDENT_ID_MIN = 6
const STUDENT_ID_MAX = 12

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string()
    .email('Enter a valid email')
    .transform(v => v.trim().toLowerCase())
    .refine(v => /@g\.bracu\.ac\.bd$/i.test(v), 'Use your BRACU GSuite email (…@g.bracu.ac.bd)'),
  studentId: z.string()
    .regex(new RegExp(`^\\d{${STUDENT_ID_MIN},${STUDENT_ID_MAX}}$`),
      `Student ID must be ${STUDENT_ID_MIN}-${STUDENT_ID_MAX} digits`),
  password: z.string().min(8, 'At least 8 characters')
    .refine(v => /[A-Za-z]/.test(v) && /\d/.test(v), 'Use letters and numbers'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function SignUp() {
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [serverMsg, setServerMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', studentId: '', password: '', confirmPassword: '' },
    mode: 'onTouched'
  })

  async function onSubmit(values) {
    setServerMsg(null)
    setLoading(true)
    try {
      const payload = {
        name: values.fullName.trim(),
        email: values.email.toLowerCase(),
        studentId: values.studentId.trim(),
        password: values.password,
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Sign up failed (${res.status})`)
      }

      // Optional: show a brief success then redirect, or redirect immediately.
      // Immediate redirect:
      reset()
      navigate('/login', { replace: true })
      return

      // If you prefer a short delay to show the success message, use:
      // setServerMsg({ type: 'success', text: 'Account created! Redirecting to login…' })
      // reset()
      // setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (e) {
      setServerMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Top bar: only HOME on the right */}
      <TopNav buttons={['home']} />

      {/* Center the signup box */}
      <Container maxWidth="sm" sx={{ py: 0 }}>
        <Box
          sx={{
            minHeight: { xs: 'calc(100vh - 64px)', sm: 'calc(100vh - 64px)' },
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, width: '100%' }}>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Create your BRACU account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Only BRACU GSuite emails are allowed (<b>@g.bracu.ac.bd</b>). Student ID is required (digits only).
            </Typography>

            {serverMsg && <Alert severity={serverMsg.type} sx={{ mb: 2 }}>{serverMsg.text}</Alert>}

            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                label="Full Name" fullWidth
                {...register('fullName')}
                error={!!errors.fullName} helperText={errors.fullName?.message}
              />
              <TextField
                label="BRACU GSuite Email" fullWidth placeholder="name@g.bracu.ac.bd"
                {...register('email')}
                error={!!errors.email} helperText={errors.email?.message}
                inputProps={{ inputMode: 'email' }}
              />
              <TextField
                label={`Student ID (${STUDENT_ID_MIN}-${STUDENT_ID_MAX} digits)`} fullWidth
                placeholder="e.g., 24341139"
                {...register('studentId')}
                error={!!errors.studentId} helperText={errors.studentId?.message}
                inputProps={{ inputMode: 'numeric', pattern: '\\d*', maxLength: STUDENT_ID_MAX }}
              />
              <TextField
                label="Password" fullWidth type={showPw ? 'text' : 'password'}
                {...register('password')}
                error={!!errors.password} helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw(s => !s)} edge="end" aria-label="toggle password">
                        {showPw ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                label="Confirm Password" fullWidth type={showPw2 ? 'text' : 'password'}
                {...register('confirmPassword')}
                error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw2(s => !s)} edge="end" aria-label="toggle confirm password">
                        {showPw2 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button type="submit" size="large" variant="contained" disabled={loading}>
                {loading ? 'Creating…' : 'Sign Up'}
              </Button>
              <Button variant="text" component={Link} to="/login">
                Already have an account? Login
              </Button>
            </Stack>
          </Paper>

          <Box mt={3} textAlign="center">
            <Typography variant="caption" color="text.secondary">
              By signing up you agree to our Terms & Privacy.
            </Typography>
          </Box>
        </Box>
      </Container>
    </>
  )
}
