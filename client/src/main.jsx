import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.jsx'              // Home / Landing
import SignUp from './pages/SignUp.jsx'
import Login from './pages/Login.jsx'
import Calculator from './pages/Calculator.jsx'
import SemesterGpaPage from './pages/SemesterGpaPage.jsx'
import StudyPlanner from './pages/StudyPlanner.jsx'
import About from './pages/About.jsx'           
import Motivation from './pages/Motivation.jsx'       


import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const theme = createTheme({
  palette: { mode: 'dark', primary: { main: '#4f46e5' } },
  shape: { borderRadius: 12 },
})

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/login', element: <Login /> },
  { path: '/calculator', element: <Calculator /> },
  { path: '/semester/:id/cgpa', element: <SemesterGpaPage /> },
  { path: '/study-planner', element: <StudyPlanner /> },
  { path: '/about', element: <About /> },           
  { path: '/motivation', element: <Motivation /> },     
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
)
