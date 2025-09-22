// client/src/pages/Motivation.jsx
import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
} from '@mui/material'
import {
  EmojiObjects,
  Favorite,
  TrendingUp,
  CheckCircle,
  CloseRounded,
  AccessTime,
  Security,
  School,
  Calculate,
  ChatBubbleOutline,
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import TopNav from '../components/TopNav'

const glass = (t, opacity = 0.24, blur = 8) => ({
  backgroundColor: alpha(t.palette.background.paper, opacity),
  backdropFilter: `saturate(160%) blur(${blur}px)`,
  WebkitBackdropFilter: `saturate(160%) blur(${blur}px)`,
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  borderRadius: 16,
})

export default function Motivation() {
  return (
    <>
      <TopNav buttons={['home','login','signup']} />

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
          <Card elevation={0} sx={(t) => ({ ...glass(t, 0.28, 10), px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 }, mx: 'auto', maxWidth: 1100 })}>
            <Stack spacing={1.5} alignItems="center" textAlign="center">
              <Typography variant="overline" sx={{ opacity: 0.85 }}>
                Why this exists
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.3px' }}>
                Motivation: why our planner is different
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 860 }}>
                There are plenty of GPA calculators and generic study planners. But BRACU students need both — in one place — with
                retake-aware CGPA math, semester planning, and an AI coach that respects your schedule.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip icon={<School />} label="Built for BRACU" size="small" />
                <Chip icon={<TrendingUp />} label="Real CGPA insights" size="small" />
                <Chip icon={<ChatBubbleOutline />} label="AI study coach" size="small" />
              </Stack>
            </Stack>
          </Card>
        </Container>
      </Box>

      {/* Why different */}
      <Container sx={{ py: { xs: 5, md: 8 }, maxWidth: 1100 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          What makes it different
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card sx={(t) => glass(t)}>
              <CardContent>
                <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
                  <Calculate />
                  <Typography variant="subtitle1" fontWeight={800}>BRACU-aware CGPA</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Retakes are marked <b>(RT)</b> and older attempts show <b>(NT)</b>. Your overall CGPA automatically uses the
                  <b> latest attempt only</b> — no manual spreadsheet hacks.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                  <Chip size="small" label="Retake logic" />
                  <Chip size="small" label="Earned vs Attempted" />
                  <Chip size="small" label="Trend chart" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={(t) => glass(t)}>
              <CardContent>
                <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
                  <AccessTime />
                  <Typography variant="subtitle1" fontWeight={800}>Planner that knows your time</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Feed your weekly routine and priorities. The AI finds <b>free windows</b> and proposes study blocks that actually fit —
                  mornings or evenings, around class and commuting.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                  <Chip size="small" label="Time-aware" />
                  <Chip size="small" label="Weekly focus" />
                  <Chip size="small" label="Pomodoro-ready" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={(t) => glass(t)}>
              <CardContent>
                <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
                  <Security />
                  <Typography variant="subtitle1" fontWeight={800}>Per-user history & privacy</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Your chats are stored per account. Create, rename, or delete threads. Switch accounts and your conversations stay separate.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                  <Chip size="small" label="Multi-chat" />
                  <Chip size="small" label="Isolated per user" />
                  <Chip size="small" label="You control history" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Comparison */}
      <Container sx={{ pb: { xs: 5, md: 8 }, maxWidth: 1100 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          Not just another calculator or planner
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={(t) => glass(t, 0.20)}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <CloseRounded sx={{ color: 'error.main' }} />
                  <Typography variant="subtitle1" fontWeight={800}>Typical CGPA calculators</Typography>
                </Stack>
                <Stack spacing={1} color="text.secondary">
                  <Typography variant="body2">• Treat retakes incorrectly or require manual edits</Typography>
                  <Typography variant="body2">• No planning, just math</Typography>
                  <Typography variant="body2">• No per-student history</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={(t) => glass(t, 0.26)}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <CheckCircle sx={{ color: 'success.main' }} />
                  <Typography variant="subtitle1" fontWeight={800}>This app</Typography>
                </Stack>
                <Stack spacing={1} color="text.secondary">
                  <Typography variant="body2">• BRACU-specific retake logic: <b>(RT)</b> and <b>(NT)</b> handled automatically</Typography>
                  <Typography variant="body2">• Integrated AI study coach + weekly planning</Typography>
                  <Typography variant="body2">• Per-user multi-chat history</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Why I built this */}
      <Container sx={{ pb: { xs: 5, md: 8 }, maxWidth: 1100 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          Why I built this
        </Typography>
        <Card sx={(t) => ({ ...glass(t, 0.26, 10) })}>
          <CardContent>
            <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
              <Favorite />
              <Typography variant="subtitle1" fontWeight={800}>A tool that respects your time</Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 950 }}>
              BRACU students juggle tough course loads, labs, and commutes. I wanted one space that gets the
              CGPA math right and also helps you <b>act</b> — with simple planning that adapts to your routine,
              real encouragement, and a clean, private experience.
            </Typography>
          </CardContent>
        </Card>
      </Container>

      {/* Benefits / CTA */}
      <Container sx={{ pb: { xs: 8, md: 12 }, maxWidth: 1100 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          How BRACU students benefit
        </Typography>

        <Grid container spacing={2}>
          {[
            { icon: <TrendingUp />, title: 'True CGPA picture', text: 'Know where you stand with retakes handled correctly.' },
            { icon: <EmojiObjects />, title: 'Weekly clarity', text: 'Time-aware blocks: mornings, evenings, between classes.' },
            { icon: <ChatBubbleOutline />, title: 'Motivation built-in', text: 'Encouragement + concrete actions, not guilt.' },
          ].map((b) => (
            <Grid item xs={12} md={4} key={b.title}>
              <Card sx={(t) => glass(t)}>
                <CardContent>
                  <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
                    {b.icon}
                    <Typography variant="subtitle1" fontWeight={800}>{b.title}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{b.text}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3, opacity: 0.2 }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={(t) => ({ ...glass(t, 0.22), px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 3.5 } })}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={900}>Ready to focus on the right next step?</Typography>
            <Typography variant="body2" color="text.secondary">
              Create an account, add your semester, and try the Study Planner today.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button component={RouterLink} to="/signup" variant="contained">Sign Up</Button>
            <Button component={RouterLink} to="/login" variant="outlined">Login</Button>
            
          </Stack>
        </Stack>
      </Container>
    </>
  )
}
