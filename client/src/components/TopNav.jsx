import { AppBar, Toolbar, Typography, Button, Stack, Divider, Tooltip } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

/**
 * Usage examples:
 *  <TopNav buttons={['home']} />
 *  <TopNav buttons={['home','calc-sem-cgpa','study-planner']} semesterId={currentSemesterId} />
 *
 * Known button keys:
 *  - 'home' | 'login' | 'signup' | 'calc-sem-cgpa' | 'study-planner'
 *
 * Extra props:
 *  - active?: 'login' | 'signup'
 *  - semesterId?: string
 *  - calcLabel?: string
 *  - plannerHref?: string   (default '/study-planner')
 *  - plannerLabel?: string  (default 'Study Planner')
 */
export default function TopNav({
  active,
  buttons = ['home', 'login', 'signup'],
  semesterId,
  calcLabel = 'Calculate Current Semester CGPA',
  plannerHref = '/study-planner',
  plannerLabel = 'Study Planner',
}) {
  const has = (k) => buttons.includes(k)
  const isActive = (k) => active === k

  const calcTarget = semesterId ? `/semester/${semesterId}/cgpa` : undefined
  const calcDisabled = has('calc-sem-cgpa') && !semesterId

  return (
    <>
      <AppBar color="transparent" elevation={0} position="sticky">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, cursor: 'pointer' }}
            component={RouterLink}
            to="/"
          >
            BRACU CGPA Calculator + Planner
          </Typography>

          {/* right-aligned controls */}
          <Stack direction="row" spacing={1.5} sx={{ ml: 'auto' }}>
            {has('home') && (
              <Button color="inherit" component={RouterLink} to="/">Home</Button>
            )}

            {/* Calculate Current Semester CGPA */}
            {has('calc-sem-cgpa') && (
              <Tooltip title={calcDisabled ? 'Add/select a semester to calculate' : ''}>
                <span>
                  <Button
                    color="secondary"
                    variant="outlined"
                    component={calcDisabled ? 'button' : RouterLink}
                    to={calcDisabled ? undefined : calcTarget}
                    disabled={calcDisabled}
                  >
                    {calcLabel}
                  </Button>
                </span>
              </Tooltip>
            )}

            {/* Study Planner */}
            {has('study-planner') && (
              <Button
                color="secondary"
                variant="contained"
                component={RouterLink}
                to={plannerHref}
              >
                {plannerLabel}
              </Button>
            )}

            {has('login') && (
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
                variant={isActive('login') ? 'contained' : 'text'}
              >
                Login
              </Button>
            )}
            {has('signup') && (
              <Button
                color="inherit"
                component={RouterLink}
                to="/signup"
                variant={isActive('signup') ? 'contained' : 'text'}
              >
                Sign Up
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
      <Divider />
    </>
  )
}
