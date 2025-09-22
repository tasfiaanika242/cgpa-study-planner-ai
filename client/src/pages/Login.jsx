// src/pages/Login.jsx
import { useState } from 'react'
import {
  Container, Paper, Typography, Stack, TextField, Button,
  InputAdornment, IconButton, Alert, Box
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'

// BRACU-only + simple password rule
const schema = z.object({
  email: z.string()
    .email('Enter a valid email')
    .transform(v => v.trim().toLowerCase())
    .refine(v => /@g\.bracu\.ac\.bd$/i.test(v), 'Use your BRACU GSuite email (…@g.bracu.ac.bd)'),
  password: z.string().min(8, 'At least 8 characters'),
})

export default function Login() {
  const [showPw, setShowPw] = useState(false)
  const [serverMsg, setServerMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched'
  })

  async function onSubmit(values) {
    setServerMsg(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Login failed (${res.status})`)
      }
      const data = await res.json()
      // store tokens/user as you prefer (example: session storage)
      if (data.accessToken) sessionStorage.setItem('accessToken', data.accessToken)
      if (data.user) sessionStorage.setItem('user', JSON.stringify(data.user))
      navigate('/calculator', { replace: true })
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

      {/* Center the login box both vertically & horizontally */}
      <Container maxWidth="sm" sx={{ py: 0 }}>
        <Box
          sx={{
            minHeight: { xs: 'calc(100vh - 64px)', sm: 'calc(100vh - 64px)' }, // minus AppBar
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, width: '100%' }}>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Login
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Use your BRACU GSuite email (<b>@g.bracu.ac.bd</b>) and password.
            </Typography>

            {serverMsg && <Alert severity={serverMsg.type} sx={{ mb: 2 }}>{serverMsg.text}</Alert>}

            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                label="Email"
                placeholder="name@g.bracu.ac.bd"
                fullWidth
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <TextField
                label="Password"
                type={showPw ? 'text' : 'password'}
                fullWidth
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
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

              <Button type="submit" size="large" variant="contained" disabled={loading}>
                {loading ? 'Signing in…' : 'Login'}
              </Button>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                New here?{' '}
                <Button size="small" component={Link} to="/signup">
                  Create your account
                </Button>
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </>
  )
}
