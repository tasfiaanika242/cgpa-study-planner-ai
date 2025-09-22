// client/src/pages/About.jsx
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Login as LoginIcon,
  AppRegistration,
  School,
  Calculate,
  Functions,
  ChatBubbleOutline,
  TrendingUp,
  Security,
  ExpandMore,
  CheckCircleOutline,
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function About() {
  const steps = [
    {
      title: 'Sign up with BRACU GSuite & Login',
      icon: <AppRegistration />,
      body:
        `Use your BRACU email to create an account and sign in. Once you're in, your study planner chats and progress are kept per-user.`,
      actions: [
        { to: '/signup', label: 'Create Account', variant: 'contained' },
        { to: '/login', label: 'Login', variant: 'outlined' },
      ],
      tags: ['BRACU email', 'Secure', 'Per-user data'],
    },
    {
      title: 'Create semesters',
      icon: <School />,
      body:
        `Go to Calculator and add semesters (e.g., Spring 2025). Each semester can hold your courses and letter grades.`,
      // actions: [{ to: '/calculator', label: 'Open Calculator', variant: 'contained' }],
      tags: ['Add/Delete', '5-course cap', 'Fast UI'],
    },
    {
      title: 'Add courses & retakes',
      icon: <Functions />,
      body:
        `Enter course code, credits, and letter grade. Retakes are flagged as (RT) and older attempts show (NT) — only the latest attempt counts in CGPA.`,
      // actions: [{ to: '/calculator', label: 'Add Courses', variant: 'outlined' }],
      tags: ['Retake logic', 'Validation', 'Credits'],
    },
    {
      title: 'See GPA, CGPA & trends',
      icon: <TrendingUp />,
      body:
        `The app computes semester GPA and overall CGPA, and visualizes your progress with a trend chart. You’ll also see credits attempted and earned.`,
      // actions: [{ to: '/calculator', label: 'View Insights', variant: 'text' }],
      tags: ['Trend chart', 'Credits', 'Summary'],
    },
    {
      title: 'Calculate this semester’s CGPA',
      icon: <Calculate />,
      body:
        `Use a simple guided form to estimate your current semester’s CGPA quickly — great for goal setting and planning.`,
      // actions: [{ to: '/semester/:id/cgpa', label: 'Open CGPA Form', variant: 'contained' }],
      tags: ['Quick form', 'BRACU scale'],
    },
    {
      title: 'Plan with the AI Chatbot',
      icon: <ChatBubbleOutline />,
      body:
        `The Study Planner chatbot helps build weekly plans, break down topics, and motivate you. It understands free time around your routine and keeps chats per user.`,
      // actions: [{ to: '/study-planner', label: 'Open Study Planner', variant: 'contained' }],
      tags: ['Multi-chat', 'Motivation', 'Free-time aware'],
    },
    {
      title: 'Privacy & Data',
      icon: <Security />,
      body:
        `Your semester data is computed safely via the API; chatbot history is stored per account. You control your chats — create, rename, or delete. `,
      tags: ['Per-user', 'Manage history'],
    },
  ]

  const features = [
    {
      title: 'Retake-Aware CGPA',
      desc: 'Only the latest attempt counts automatically. Older attempts are marked (NT).',
      chips: ['(RT)', '(NT)', 'Accurate'],
      icon: <CheckCircleOutline />,
    },
    {
      title: 'Visual Progress',
      desc: 'Track semester GPA vs cumulative CGPA with a clean trend chart.',
      chips: ['Trends', 'Insights'],
      icon: <TrendingUp />,
    },
    {
      title: 'AI Study Planner',
      desc: 'Chat to build schedules, countdown plans, and Pomodoro blocks — plus motivation coaching.',
      chips: ['Chat', 'Planning'],
      icon: <ChatBubbleOutline />,
    },
  ]

  return (
    <>
      <TopNav buttons={['home', 'login', 'signup']} />

      {/* Hero */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          backgroundImage: `
            radial-gradient(1200px 420px at 20% -10%, rgba(79,70,229,.28), transparent 60%),
            radial-gradient(1000px 420px at 85%   0%, rgba(236,72,153,.18), transparent 60%)
          `,
        }}
      >
        <Container>
          <Card
            elevation={0}
            sx={{
              px: { xs: 2, md: 4 },
              py: { xs: 3, md: 5 },
              maxWidth: 1100,
              mx: 'auto',
              borderRadius: 3,
              backgroundColor: (t) => alpha(t.palette.background.paper, 0.28),
              backdropFilter: 'saturate(160%) blur(10px)',
              WebkitBackdropFilter: 'saturate(160%) blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                Getting started
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.3px' }}>
                About the Website
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 860 }}>
                This page walks you through how BRACU CGPA Calculator + AI Chatbot Planner works —
                from sign up to planning your perfect week.
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip icon={<LoginIcon />} label="BRACU sign-in" size="small" />
                <Chip icon={<Calculate />} label="Real CGPA math" size="small" />
                <Chip icon={<ChatBubbleOutline />} label="AI planning" size="small" />
              </Stack>
            </Stack>
          </Card>
        </Container>
      </Box>

      {/* How it works (vertical stepper) */}
      <Container sx={{ py: { xs: 5, md: 8 }, maxWidth: 1100 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          How it works
        </Typography>

        <Stepper orientation="vertical" sx={{ ml: { xs: 0.5, md: 1 } }}>
          {steps.map((s, i) => (
            <Step key={i} active>
              <StepLabel
                icon={s.icon}
                sx={{
                  '.MuiStepLabel-label': { fontWeight: 700 },
                  '.MuiStepIcon-root': { color: 'primary.main!important' },
                }}
              >
                {s.title}
              </StepLabel>
              <StepContent>
                <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                  {s.body}
                </Typography>
                {s.tags && (
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                    {s.tags.map((t) => (
                      <Chip key={t} size="small" label={t} />
                    ))}
                  </Stack>
                )}
                {s.actions && (
                  <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                    {s.actions.map((a) => (
                      <Button
                        key={a.label}
                        component={RouterLink}
                        to={a.to}
                        variant={a.variant}
                        size="small"
                      >
                        {a.label}
                      </Button>
                    ))}
                  </Stack>
                )}
                <Divider sx={{ my: 2, opacity: 0.2 }} />
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Container>

      {/* Feature grid (glass cards) */}
      <Container sx={{ pb: { xs: 6, md: 9 }, maxWidth: 1100 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          Highlights
        </Typography>

        <Grid container spacing={2}>
          {features.map((f) => (
            <Grid item xs={12} md={4} key={f.title}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  backgroundColor: (t) => alpha(t.palette.background.paper, 0.22),
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
                    {f.icon}
                    <Typography variant="subtitle1" fontWeight={800}>
                      {f.title}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {f.desc}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                    {f.chips.map((c) => (
                      <Chip key={c} size="small" label={c} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FAQ */}
      <Container sx={{ pb: { xs: 6, md: 10 }, maxWidth: 1100 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          FAQ
        </Typography>

        <Stack spacing={1.2}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight={700}>Do I need a BRACU email to sign up?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                Yes — use your BRACU GSuite email so we can keep chat history and planner data
                scoped to your account.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight={700}>How are retakes counted in CGPA?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                Only your latest attempt counts. Earlier attempts are marked as (NT) and excluded
                from overall CGPA automatically.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight={700}>What can the AI Study Planner do?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                It helps build weekly schedules around your routine, breaks topics into tasks,
                suggests Pomodoro blocks, and gives encouragement based on your CGPA goals.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Stack>

        {/* Bottom CTA */}
        <Card
          elevation={0}
          sx={{
            mt: 3,
            px: { xs: 2, md: 3 },
            py: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            backgroundColor: (t) => alpha(t.palette.background.paper, 0.24),
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            spacing={2}
            justifyContent="space-between"
          >
            <Stack spacing={0.5}>
              <Typography variant="h6" fontWeight={900}>
                Ready to try it?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create an account, add your first semester, and start planning with AI today.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <Button component={RouterLink} to="/signup" variant="contained">
                Sign Up
              </Button>
              <Button component={RouterLink} to="/login" variant="outlined">
                Login
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Container>
    </>
  )
}
