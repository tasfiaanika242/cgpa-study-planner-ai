import {
  AppBar, Toolbar, Button, Typography, Container, Box, Grid,
  Card, CardContent, Stack, Divider, Chip, CardActionArea
} from '@mui/material'
import { Calculate, EmojiObjects, School, Favorite } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { alpha } from '@mui/material/styles'

export default function App() {
  return (
    <>
      {/* Topbar (glass) */}
      <AppBar
        color="transparent"
        elevation={0}
        position="sticky"
        sx={{
          backgroundColor: (t) => alpha(t.palette.background.paper, 0.25),
          backdropFilter: 'saturate(160%) blur(10px)',
          WebkitBackdropFilter: 'saturate(160%) blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Toolbar sx={{ gap: 1, px: { xs: 1.5, md: 2 } }}>
          <Calculate />
          <Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1 }}>
            BRACU CGPA Calculator + AI Chatbot Planner
          </Typography>

          <Button color="inherit" component={Link} to="/login">Login</Button>
          <Button variant="contained" component={Link} to="/signup">Sign Up</Button>
        </Toolbar>
        <Divider />
      </AppBar>

      {/* Hero (centered, transparent glass panel over gradients) */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 8, md: 12 },
          overflow: 'hidden',
          backgroundImage: `
            radial-gradient(1200px 420px at 20% -10%, rgba(79,70,229,.28), transparent 60%),
            radial-gradient(1000px 420px at 85% 0%, rgba(236,72,153,.18), transparent 60%)
          `,
        }}
      >
        <Container>
          <Stack
            spacing={3}
            maxWidth={980}
            className="heroCenter"
            sx={{
              px: { xs: 2, md: 4 },
              py: { xs: 3, md: 4 },
              borderRadius: 3,
              backgroundColor: (t) => alpha(t.palette.background.paper, 0.28),
              backdropFilter: 'saturate(160%) blur(8px)',
              WebkitBackdropFilter: 'saturate(160%) blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <Typography
              variant="h3"
              fontWeight={900}
              lineHeight={1.15}
              sx={{ letterSpacing: '-0.5px' }}
            >
              Welcome to <br /> BRACU CGPA Calculator +  AI Chatbot Planner
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
              <EmojiObjects fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontStyle: 'italic' }}>
                “Small, consistent effort today builds the CGPA you want tomorrow.”
              </Typography>
            </Stack>

            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 780 }}>
              This is a simple, student-friendly tool to <b>track your GPA/CGPA</b>, plan future
              semesters, and stay on top of key academic dates—made specifically with
              BRACU students in mind.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mt: 1, justifyContent: 'center', width: '100%' }}
            >
              <Button
                size="large"
                variant="contained"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
              <Button size="large" variant="outlined" component={Link} to="/signup">
                Create Account
              </Button>
            
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Sections — glass cards, whole card clickable */}
      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={2} id="about">
          {/* About the Website */}
          <Grid item xs={12} md={4}>
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
              <CardActionArea component={Link} to="/about" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <Calculate />
                    <Typography variant="subtitle1" fontWeight={800}>About the Website</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Add semesters and courses, and the app automatically calculates your
                    <b> semester GPA</b> and <b>cumulative CGPA</b>. Visualize <b>trends</b>, track
                    <b> completed credits</b>, and export a report when you need it.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Motivation */}
          <Grid item xs={12} md={4}>
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
              <CardActionArea component={Link} to="/motivation" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <School />
                    <Typography variant="subtitle1" fontWeight={800}>Motivation</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Plan ahead, reduce stress, and make informed decisions about course loads and
                    target grades—so you steadily reach your <b>goal CGPA</b>.
                  </Typography>
                  <Stack direction="row" spacing={1} mt={2}>
                    <Chip size="small" label="Plan" />
                    <Chip size="small" label="Track" />
                    <Chip size="small" label="Improve" />
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>


        </Grid>

        {/* CTA */}
        <Stack alignItems="center" spacing={2} sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Ready to start planning your best semester yet?
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" component={Link} to="/signup">Sign Up</Button>
            <Button variant="outlined" component={Link} to="/login">Login</Button>
           
          </Stack>
        </Stack>
      </Container>

      {/* Footer (glass) */}
      <Container sx={{ py: 4 }}>
        <Divider sx={{ mb: 2, opacity: 0.6 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} BRACU CGPA Calculator + Planner
          </Typography>
          <Stack direction="row" gap={2}>

          </Stack>
        </Stack>
      </Container>
    </>
  )
}
