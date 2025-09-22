// src/pages/StudyPlanner.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Container, Paper, Stack, Typography, TextField, IconButton, Button,
  Divider, Avatar, Chip, CircularProgress, Tooltip, Drawer, List, ListItemButton,
  ListItemText, ListItemSecondaryAction, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import {
  Send, AutoAwesome, Bolt, Schedule, School,
  Menu as MenuIcon, Edit, Delete, Event as EventIcon, Settings as SettingsIcon
} from '@mui/icons-material'
import TopNav from '../components/TopNav'
import { api, getToken } from '../lib/api'

/* ============================ Utilities ============================ */
const uid = () => (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()))
const nowIso = () => new Date().toISOString()
const YES_RE = /\b(yes|yeah|yup|sure|ok|okay|please|do it|go ahead|sounds good|let'?s go|i want|yes i want|proceed)\b/i

// NEW: Safe Date coercion everywhere we touch a date-like thing
const asDate = (dt) => (dt instanceof Date ? dt : new Date(dt))

const WELCOME = `Hi! I’m your study planning assistant.

Tell me your courses, deadlines, and available time. I can:
• build weekly study schedules
• break topics into bite-size tasks
• make exam countdown plans
• generate Pomodoro blocks

You can also open **Routine & Preferences** (gear icon) to add your class routine and deadlines. I’ll plan around your free time.`

/* =================== Tiny Logistic Intent Model ==================== */
const INTENTS = [
  'greeting', 'how_are_you', 'thanks', 'farewell',
  'plan_request', 'cgpa_dissatisfied', 'cgpa_satisfied'
]
const TRAINING = [
  ['hi', 'greeting'], ['hello', 'greeting'], ['hey', 'greeting'],
  ['good morning', 'greeting'], ['good evening', 'greeting'],
  ['how are you', 'how_are_you'], ['how r u', 'how_are_you'],
  ["how's it going", 'how_are_you'], ['how do you do', 'how_are_you'],
  ['thanks', 'thanks'], ['thank you', 'thanks'], ['appreciate it', 'thanks'],
  ['bye', 'farewell'], ['goodbye', 'farewell'], ['see you', 'farewell'], ['later', 'farewell'],
  ['make a weekly study plan', 'plan_request'],
  ['create a pomodoro session', 'plan_request'],
  ['10 day exam countdown', 'plan_request'],
  ['schedule for cse111', 'plan_request'],
  ['break down chapter 3', 'plan_request'],
  ['i am not satisfied with my cgpa', 'cgpa_dissatisfied'],
  ['i am unhappy with my current cgpa', 'cgpa_dissatisfied'],
  ['not happy with my gpa', 'cgpa_dissatisfied'],
  ['i am satisfied with my cgpa', 'cgpa_satisfied'],
  ['i am happy with my gpa', 'cgpa_satisfied'],
]
function tokenize(s){return s.toLowerCase().replace(/[^a-z0-9\s+]/g,' ').split(/\s+/).filter(Boolean)}
function buildVocab(samples){const set=new Set();samples.forEach(([t])=>tokenize(t).forEach(x=>set.add(x)))
'plan study schedule pomodoro exam countdown chapter course cgpa gpa grade target improve confidence motivation routine deadline'.split(' ').forEach(t=>set.add(t));return[...set]}
function vec(text,vocab){const c=Object.create(null);tokenize(text).forEach(t=>c[t]=(c[t]||0)+1);return vocab.map(v=>c[v]?1:0)}
function dot(a,b){let s=0;for(let i=0;i<a.length;i++) s+=a[i]*b[i];return s}
function trainLogReg(samples,intents,vocab,epochs=180,lr=0.2,l2=1e-4){
  const X=samples.map(([t])=>vec(t,vocab));const Y=intents.map(it=>samples.map(([,y])=>y===it?1:0));const models=[]
  for(let k=0;k<intents.length;k++){let w=new Array(vocab.length).fill(0),b=0
    for(let ep=0;ep<epochs;ep++){for(let i=0;i<X.length;i++){const z=dot(w,X[i])+b;const p=1/(1+Math.exp(-z));const g=p-Y[k][i]
      for(let j=0;j<w.length;j++) w[j]-=lr*(g*X[i][j]+l2*w[j]); b-=lr*g }}
    models.push({w,b})
  } return models
}
function predictIntent(models,intents,vocab,text){
  const s=text.toLowerCase()
  if (/(not\s+(satisfied|happy|content)|unhappy|disappointed).*(cgpa|gpa)|^(i'?m|i am)\s+not\s+(satisfied|happy)/i.test(s))
    return 'cgpa_dissatisfied'
  if (/(satisfied|happy|proud).*(cgpa|gpa)/i.test(s)) return 'cgpa_satisfied'
  const x=vec(text,vocab);let best={intent:'plan_request',score:-1e9}
  for(let k=0;k<intents.length;k++){const z=dot(models[k].w,x)+models[k].b;if(z>best.score)best={intent:intents[k],score:z}}
  if (/(plan|schedule|pomodoro|exam|countdown|study|break down|syllabus|chapter|routine|deadline)/i.test(text)) best.intent='plan_request'
  return best.intent
}

/* ================= Motivation / CGPA helpers ================= */
function extractCgpa(text){
  const c=[]; const m1=text.match(/(cgpa|gpa)\s*(is|=|:)?\s*([0-9](?:\.[0-9]{1,2})?)/i); if(m1) c.push(parseFloat(m1[3]))
  const re2=/(^|\s)([0-4](?:\.[0-9]{1,2})?)($|\s)/g; let m; while((m=re2.exec(text))) c.push(parseFloat(m[2]))
  const v=c.find(n=>!isNaN(n)&&n>=0&&n<=4); return typeof v==='number'?v:null
}

/** Return { text, action } where action is a pending follow-up (handled on “yes”). */
function motivationMessageWithAction(cgpa){
  const n=Number(cgpa); const head=`Thanks for sharing — your current CGPA is **${n.toFixed(2)}**.\n`
  if(n>=3.5){
    return {
      text: head + `You’re doing really well — keep that momentum!

- **Stay consistent**: 1–2 focused hours daily beats cramming.
- **Build skills**: projects, internships, hackathons.
- **Deepen understanding**: teach a topic, spaced recall.

Want a weekly plan to balance **skill-building + coursework**? Reply **yes** to generate it.`,
      action: 'weekly_balance'
    }
  }
  if(n>=3.0){
    return {
      text: head + `Solid foundation — you’re closer than you think!

- Tight loop after class: 30–40m active recall.
- Target weak spots: office hours, 10 MCQs/day per course.
- 2 Pomodoros on weekdays, 3 on weekends.

Want a **4-week improvement plan**? Say **yes**.`,
      action: 'improve_4w'
    }
  }
  if(n>=2.5){
    return {
      text: head + `You’ve got this. Let’s rebuild with a clear plan.

- Daily minimum: 2×25m problem practice.
- Retake strategy: lift CGPA fastest with key retakes.
- Support: tutoring / study buddy / office hours.

Want a **simple weekly plan with checkpoints**? Say **yes**.`,
      action: 'weekly_basic'
    }
  }
  return {
    text: head + `It’s fixable — we’ll go step by step.

- Stability first: 60–90m consistent slot + sleep.
- Micro-goals: 3 key tasks/day; checklist.
- Rescue priorities: pick 1–2 courses to stabilize.

Shall I start a **14-day recovery plan**? Say **yes**.`,
    action: 'recovery_14'
  }
}

/* ===== Plans produced on “yes” ===== */
function genWeeklyBalancePlan(){return `### Weekly Balance Plan (Coursework + Skills)

**Mon–Fri (2h/day)**
- 60m Coursework → active recall + 10 practice Qs
- 40m Skills → pick one area (DSA/SQL/ML/Comms)
- 20m Reflection / notes

**Weekend**
- Project hour + review hour
- Plan next week (3 key tasks)

**Checkpoints**
- Fri quiz (10 MCQs)
- Sun: portfolio/notes update`}

function genFourWeekImprovementPlan(){return `### 4-Week Improvement Plan

**Week 1 – Diagnose**: past papers, error log, 1× office hours  
**Week 2 – Rebuild**: 2×25m drills/day, teach-back, 10 MCQs/day  
**Week 3 – Apply**: mixed sets + one long problem/course  
**Week 4 – Exam Mode**: 3 mocks, one-pagers, rest before exam`}

function genWeeklyBasicPlan(){return `### Simple Weekly Plan with Checkpoints

Daily: 2×25m practice + 10m recap  
Mon/Wed/Fri: 30–40m active recall after class  
Tue/Thu: past Qs or lab (45–60m)  
Weekend: 2h consolidation + plan next week`}

function genRecovery14Plan(){return `### 14-Day Recovery Plan

Days 1–3: set 60–90m slot, triage 2 courses  
Days 4–7: 3×25m blocks/day + office hours  
Days 8–11: past papers + error log  
Days 12–14: two mocks + one-pagers + rest`}

/* ============= Generic plan generator fallback ============= */
function fallbackPlannerReply(prompt){
  const lower=prompt.toLowerCase()
  const hours=(lower.match(/(\d+)\s*(h|hr|hour)/)||[])[1]??2
  const days=(lower.match(/(\d+)\s*(day|days|d)/)||[])[1]??7
  const courses=(lower.match(/[a-z]{3}\d{3}/g)||[]).map(c=>c.toUpperCase()).slice(0,4)
  const topic=(()=>{const t=prompt.replace(/.*for/i,'').trim();return t.length>3?t:'target topics'})()
  let out=`Here’s a focused plan based on **${hours}h/day for ${days} day${days>1?'s':''}**.\n`
  if(courses.length) out+=`Courses: **${courses.join(', ')}**\n`
  out+=`\n**Daily Structure (Pomodoro)**\n- 25m focus × 3 → 10m breaks, then 20m recap\n- Final 10m: quick quiz/flashcards\n`
  out+=`\n**Schedule**\n`; for(let i=1;i<=Math.min(days,10);i++){const c=courses.length?`${courses[(i-1)%courses.length]} — `:''; out+=`- Day ${i}: ${c}${topic} (Deep dive + practice)\n`}
  out+=`\n**Checklist**\n- Break chapters into subsections\n- 5–10 active-recall questions per subsection\n- End with 10 MCQs or 2 coding problems\n`
  out+=`\n**Tip**: Protect your study block (DND on) and jot a 1-line reflection.`
  return out
}

/* =================== Per-user identity helpers =================== */
function decodeJwtPayload(token){try{const p=token.split('.')[1];const b64=p.replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(b64))}catch{return null}}
function shortHash(str){let h=0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))|0;return Math.abs(h).toString(36)}
function deriveUserIdentity(){
  const token=getToken()
  if(!token) return { userKey:'anon', label:'Guest' }
  const p=decodeJwtPayload(token)
  const email=p?.email||p?.preferred_username
  const sub=p?.sub||p?.uid||p?.userId||p?.id
  const base=email||sub||shortHash(token).slice(0,10)
  return { userKey:base, label: email||sub||`user:${base}` }
}

/* =================== Threads store (per user) =================== */
// Store per user:
// { currentId, order:[ids...], threads:{ [id]:{ id,title,createdAt,updatedAt,
//   messages:[], meta:{awaitingCgpa,lastCgpa,pendingAction,prefs?,deadlines?,lastSessions?} } } }
const THREADS_KEY_PREFIX = 'planner_threads_v1_'
const OLD_SINGLE_KEY_PREFIX = 'planner_chat_v1_' // migration

function makeWelcomeThread() {
  const id = uid()
  return {
    id,
    title: 'New chat',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    meta: {
      awaitingCgpa: false, lastCgpa: null, pendingAction: null,
      prefs: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        maxDailyHours: 2,
        studyWindows: [{ day: 'Mon-Fri', start: '18:00', end: '22:00' }],
        routine: [], // {day, start, end, course}
        difficulty: {}, // { CSE111: 'hard' }
      },
      deadlines: [],  // { id, type, course, title, at: 'YYYY-MM-DDTHH:mm' }
      lastSessions: null, // [{title,start,end,desc}]
    },
    messages: [{ id: uid(), role:'assistant', ts: nowIso(), content: WELCOME }],
  }
}
function generateTitleFrom(text){ return (text || 'New chat').slice(0, 38) }

// NEW: hydrate dates in store loaded from localStorage
function hydrateStoreDates(store){
  const threads = { ...store.threads }
  for (const id of Object.keys(threads)) {
    const t = threads[id] || {}
    const meta = { ...(t.meta || {}) }
    if (meta.lastSessions?.sessions?.length) {
      meta.lastSessions = {
        ...meta.lastSessions,
        sessions: meta.lastSessions.sessions.map(s => ({
          ...s,
          start: asDate(s.start),
          end: asDate(s.end),
        })),
      }
    }
    // deadlines can stay as strings; we call new Date(d.at) where needed
    threads[id] = { ...t, meta }
  }
  return { ...store, threads }
}

function loadStore(userKey) {
  const key = THREADS_KEY_PREFIX + userKey
  try {
    const raw = localStorage.getItem(key)
    if (raw) return hydrateStoreDates(JSON.parse(raw))
  } catch {}

  // migrate old single-chat if exists
  try {
    const oldRaw = localStorage.getItem(OLD_SINGLE_KEY_PREFIX + userKey)
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw)
      const messages = Array.isArray(parsed) ? parsed : parsed.messages || []
      const meta = Array.isArray(parsed)
        ? makeWelcomeThread().meta
        : { ...makeWelcomeThread().meta, ...(parsed.meta||{}) }
      const id = uid()
      const store = {
        currentId: id,
        order: [id],
        threads: {
          [id]: {
            id,
            title: 'Imported chat',
            createdAt: nowIso(),
            updatedAt: nowIso(),
            messages,
            meta,
          }
        }
      }
      localStorage.setItem(key, JSON.stringify(store))
      return hydrateStoreDates(store)
    }
  } catch {}

  const t = makeWelcomeThread()
  const store = { currentId: t.id, order: [t.id], threads: { [t.id]: t } }
  localStorage.setItem(key, JSON.stringify(store))
  return store
}

/* ===================== Routine helpers & planning ===================== */
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAY_TO_INDEX = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 } // JS Date: 0=Sun
function toMinutes(t){ const [h,m]=t.split(':').map(Number); return h*60+(m||0) }
function overlap(a,b){ return Math.max(a.start,b.start) < Math.min(a.end,b.end) }
function subtractBusy(free, busy){
  // free: [{start,end}], busy: [{start,end}]
  let slots=[...free]
  for(const b of busy){
    const next=[]
    for(const s of slots){
      if(!overlap(s,b)) { next.push(s); continue }
      if(b.start>s.start) next.push({start:s.start,end:b.start})
      if(b.end<s.end) next.push({start:b.end,end:s.end})
    }
    slots=next
  }
  return slots.filter(s=>s.end-s.start>=30)
}

function getFreeWindowsForDay(prefs, dayIdx){
  // default window 08:00-22:00 unless prefs.studyWindows provide day-specific
  const defaultFree=[{start:toMinutes('08:00'), end:toMinutes('22:00')}]
  const busy = (prefs.routine||[])
    .filter(r=>DAYS.indexOf(r.day)===dayIdx)
    .map(r=>({start:toMinutes(r.start), end:toMinutes(r.end)}))
  return subtractBusy(defaultFree, busy)
}

function difficultyWeight(d){ return d==='hard'?1.5 : d==='easy'?0.75 : 1 }

function pickCourseOrder(prefs, deadlines, refDate){
  // weight by difficulty; boost if deadline is within 3 days
  const courses = new Set((prefs.routine||[]).map(r=>r.course))
  const arr=[]
  for(const c of courses){
    const w = difficultyWeight(prefs.difficulty?.[c]||'medium')
    const soon = (deadlines||[]).find(d=>{
      if(d.course!==c) return false
      const diff = (new Date(d.at) - refDate) / (1000*3600*24)
      return diff>=0 && diff<=3
    })
    arr.push({course:c, score: w + (soon?0.7:0)})
  }
  return arr.sort((a,b)=>b.score-a.score).map(x=>x.course)
}

function buildSessionsFromPrefs(prefs, deadlines, days=7){
  const tz = prefs.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const maxPerDay = Math.max(1, Number(prefs.maxDailyHours || 2))
  const sessions=[]
  const ref = new Date() // now
  for(let offset=0; offset<days; offset++){
    const date = new Date(ref); date.setDate(ref.getDate()+offset)
    const dayIdx = date.getDay() // 0=Sun
    const free = getFreeWindowsForDay(prefs, DAYS[(dayIdx+6)%7]? (dayIdx===0?6:dayIdx-1) : dayIdx) // map JS day to our index
    if(free.length===0) continue
    const order = pickCourseOrder(prefs, deadlines, date)
    if(order.length===0) continue
    let remaining = maxPerDay*60
    let fi=0, ci=0
    while(remaining>0 && fi<free.length){
      const slot=free[fi]
      const chunk = Math.min(remaining, Math.min(90, slot.end-slot.start)) // 60-90m blocks
      if(chunk<30){ fi++; continue }
      const course = order[ci%order.length]
      const startMin = slot.start
      const endMin = startMin+chunk
      // push session
      const start = new Date(date); start.setHours(0,0,0,0); start.setMinutes(startMin)
      const end = new Date(date); end.setHours(0,0,0,0); end.setMinutes(endMin)
      sessions.push({
        title: `Study: ${course}`,
        start, end,
        desc: `Focused block for ${course}. Pomodoro 25×3 + recap.`,
      })
      // update slot
      free[fi] = { start: endMin, end: slot.end }
      if(free[fi].end - free[fi].start < 30) fi++
      remaining -= chunk
      ci++
    }
  }
  return { tz, sessions }
}

/* ========= Calendar helpers: ICS export + GCal quick link ========= */
// Coerce and guard to avoid dt.getFullYear errors
function formatIcsDate(dt){
  const d = asDate(dt)
  if (Number.isNaN(d?.getTime?.())) return ''
  const pad=n=>String(n).padStart(2,'0')
  const y=d.getFullYear(), m=pad(d.getMonth()+1), da=pad(d.getDate())
  const h=pad(d.getHours()), mi=pad(d.getMinutes()), s='00'
  return `${y}${m}${da}T${h}${mi}${s}`
}
function sessionsToICS(tz, sessions){
  const lines=[
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//BRACU CGPA Planner//EN'
  ]
  for(const s of sessions||[]){
    const dtStart = formatIcsDate(s.start)
    const dtEnd   = formatIcsDate(s.end)
    if (!dtStart || !dtEnd) continue
    lines.push('BEGIN:VEVENT')
    lines.push(`SUMMARY:${(s.title||'Study Session').replace(/\n/g,' ')}`)
    if (s.desc) lines.push(`DESCRIPTION:${s.desc.replace(/\n/g,' ')}`)
    lines.push(`DTSTART:${dtStart}`)
    lines.push(`DTEND:${dtEnd}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
function downloadIcs(filename, icsText){
  const blob=new Blob([icsText],{type:'text/calendar;charset=utf-8'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a'); a.href=url; a.download=filename; a.click()
  setTimeout(()=>URL.revokeObjectURL(url), 1500)
}
function gcalUrlForSession(s){
  const pad=n=>String(n).padStart(2,'0')
  function toG(dt){
    const d = asDate(dt)
    if (Number.isNaN(d?.getTime?.())) return ''
    const y=d.getFullYear(), m=pad(d.getMonth()+1), da=pad(d.getDate())
    const h=pad(d.getHours()), mi=pad(d.getMinutes())
    // GCal expects local time without Z
    return `${y}${m}${da}T${h}${mi}00`
  }
  const startStr = toG(s?.start)
  const endStr   = toG(s?.end)
  if (!startStr || !endStr) return null
  const text=encodeURIComponent(s?.title || 'Study Session')
  const details=encodeURIComponent(s?.desc || 'Study session')
  const dates=`${startStr}/${endStr}`
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`
}

/* ============================ Component ============================ */
export default function StudyPlanner() {
  // intent model
  const { vocab, models } = useMemo(() => {
    const vocab = buildVocab(TRAINING)
    const models = trainLogReg(TRAINING, INTENTS, vocab)
    return { vocab, models }
  }, [])

  const { userKey, label: userLabel } = useMemo(() => deriveUserIdentity(), [])
  const STORAGE_KEY = THREADS_KEY_PREFIX + userKey

  const [store, setStore] = useState(() => loadStore(userKey))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const endRef = useRef(null)

  // start a fresh chat on open if current already has a user message (ChatGPT behavior)
  useEffect(() => {
    setStore(prev => {
      if (!prev) return prev
      const cur = prev.threads[prev.currentId]
      const hasUserMsg = cur.messages?.some(m => m.role === 'user')
      if (hasUserMsg) {
        const t = makeWelcomeThread()
        const order = [t.id, ...prev.order]
        const threads = { ...prev.threads, [t.id]: t }
        const next = { ...prev, currentId: t.id, order, threads }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
        return next
      }
      return prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = store.threads[store.currentId]
  const messages = current.messages
  const meta = current.meta

  // persist on any store change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch {}
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [store, STORAGE_KEY])

  /* ----------------------- Thread operations ----------------------- */
  function selectThread(id) {
    if (!store.threads[id]) return
    setStore(s => ({ ...s, currentId: id }))
    setDrawerOpen(false)
  }
  function newThread() {
    const t = makeWelcomeThread()
    setStore(s => ({
      currentId: t.id,
      order: [t.id, ...s.order],
      threads: { ...s.threads, [t.id]: t },
    }))
  }
  function renameThread(id) {
    const cur = store.threads[id]; if (!cur) return
    const title = prompt('Rename chat', cur.title) ?? cur.title
    setStore(s => ({ ...s, threads: { ...s.threads, [id]: { ...cur, title, updatedAt: nowIso() } } }))
  }
  function deleteThread(id) {
    setStore(s => {
      const { [id]:_, ...rest } = s.threads
      const order = s.order.filter(x => x !== id)
      let currentId = s.currentId
      if (currentId === id) currentId = order[0] || makeWelcomeThread().id
      let threads = rest
      let finalOrder = order
      if (order.length === 0) {
        const t = makeWelcomeThread()
        threads = { ...rest, [t.id]: t }
        finalOrder = [t.id]
        currentId = t.id
      }
      return { currentId, order: finalOrder, threads }
    })
  }

  /* --------------------------- Messaging --------------------------- */
  function setCurrent(updater) {
    setStore(s => {
      const cur = s.threads[s.currentId]
      const nextCur = updater(cur)
      return {
        ...s,
        threads: { ...s.threads, [s.currentId]: nextCur },
        order: [s.currentId, ...s.order.filter(x => x !== s.currentId)],
      }
    })
  }

  // produce plan text for a pending action
  function runPendingAction(action) {
    switch (action) {
      case 'weekly_balance': return genWeeklyBalancePlan()
      case 'improve_4w':     return genFourWeekImprovementPlan()
      case 'weekly_basic':   return genWeeklyBasicPlan()
      case 'recovery_14':    return genRecovery14Plan()
      case 'plan_from_prefs':{
        const { tz, sessions } = buildSessionsFromPrefs(meta.prefs, meta.deadlines, 7)
        const text = renderSessionsAsText(sessions)
        setCurrent(cur => ({ ...cur, meta: { ...cur.meta, lastSessions: { tz, sessions } } }))
        return text + `\n\nYou can **Export to Calendar (.ics)** or **View sessions** below.`
      }
      default: return null
    }
  }

  function renderSessionsAsText(sessions){
    if(!sessions || sessions.length===0) return 'No sessions could be scheduled based on your routine. Try widening your preferred hours or increasing max hours/day.'
    const fmt=(d)=>asDate(d).toLocaleString([], { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
    return `### 7-Day Study Plan (fits your free time)\n` +
      sessions.slice(0,40).map(s=>`- ${fmt(s.start)} → ${fmt(s.end)} — **${s.title}**`).join('\n')
  }

  async function handleSend(text) {
    const content = (text ?? input).trim()
    if (!content) return
    setInput('')

    // append user message
    const userMsg = { id: uid(), role: 'user', ts: nowIso(), content }
    setCurrent(cur => ({ ...cur, messages: [...cur.messages, userMsg], updatedAt: nowIso() }))
    setLoading(true)

    // auto-title if first user message
    setStore(s => {
      const cur = s.threads[s.currentId]
      if (cur.title === 'New chat' || cur.title === 'Imported chat') {
        const title = generateTitleFrom(content)
        return { ...s, threads: { ...s.threads, [s.currentId]: { ...cur, title } } }
      }
      return s
    })

    // ---------- A) Pending-action: handle “yes” ----------
    if (meta?.pendingAction && YES_RE.test(content)) {
      const plan = runPendingAction(meta.pendingAction)
      if (plan) {
        setCurrent(cur => ({
          ...cur,
          meta: { ...cur.meta, pendingAction: null },
          messages: [...cur.messages, { id: uid(), role:'assistant', ts: nowIso(), content: plan }],
          updatedAt: nowIso(),
        }))
        setLoading(false)
        return
      }
    }

    // ---------- B) Motivation / CGPA flow (if we were already waiting) ----------
    if (meta.awaitingCgpa) {
      const g = extractCgpa(content)
      if (g !== null) {
        const { text: replyText, action } = motivationMessageWithAction(g)
        setCurrent(cur => ({
          ...cur,
          meta: { ...cur.meta, awaitingCgpa:false, lastCgpa:g, pendingAction: action || null },
          messages: [...cur.messages, { id: uid(), role:'assistant', ts: nowIso(), content: replyText }],
          updatedAt: nowIso(),
        }))
        setLoading(false)
        return
      } else {
        const ask = "Got it — could you share your current CGPA (0.00–4.00)?"
        setCurrent(cur => ({ ...cur, messages: [...cur.messages, { id: uid(), role:'assistant', ts: nowIso(), content: ask }], updatedAt: nowIso() }))
        setLoading(false)
        return
      }
    }

    // Detect generic intent
    const intent = predictIntent(models, INTENTS, vocab, content)

    // ---------- C) CGPA satisfaction / dissatisfaction entry ----------
    if (intent === 'cgpa_dissatisfied' || intent === 'cgpa_satisfied') {
      const g = extractCgpa(content)
      if (g !== null) {
        const { text: replyText, action } = motivationMessageWithAction(g)
        setCurrent(cur => ({
          ...cur,
          meta: { ...cur.meta, awaitingCgpa:false, lastCgpa:g, pendingAction: action || null },
          messages: [...cur.messages, { id: uid(), role:'assistant', ts: nowIso(), content: replyText }],
          updatedAt: nowIso(),
        }))
      } else {
        const ask = "I hear you. What's your current CGPA (0.00–4.00)? I’ll tailor some encouragement and a plan around it."
        setCurrent(cur => ({
          ...cur,
          meta: { ...cur.meta, awaitingCgpa: true },
          messages: [...cur.messages, { id: uid(), role:'assistant', ts: nowIso(), content: ask }],
          updatedAt: nowIso(),
        }))
      }
      setLoading(false)
      return
    }

    // ---------- D) User directly shares CGPA number ----------
    const inlineCgpa = extractCgpa(content)
    if (inlineCgpa !== null && /(cgpa|gpa)/i.test(content)) {
      const { text: replyText, action } = motivationMessageWithAction(inlineCgpa)
      setCurrent(cur => ({
        ...cur,
        meta: { ...cur.meta, awaitingCgpa:false, lastCgpa:inlineCgpa, pendingAction: action || null },
        messages: [...cur.messages, { id: uid(), role:'assistant', ts: nowIso(), content: replyText }],
        updatedAt: nowIso(),
      }))
      setLoading(false)
      return
    }

    // ---------- E) If asking for a plan and prefs exist → build plan from prefs ----------
    if (intent === 'plan_request' && (meta?.prefs?.routine?.length || meta?.deadlines?.length)) {
      const { tz, sessions } = buildSessionsFromPrefs(meta.prefs, meta.deadlines, 7)
      const textReply = renderSessionsAsText(sessions) + `\n\nYou can **Export to Calendar (.ics)** or **View sessions** below.`
      setCurrent(cur => ({
        ...cur,
        meta: { ...cur.meta, lastSessions: { tz, sessions } },
        messages: [...cur.messages, { id: uid(), role:'assistant', ts: nowIso(), content: textReply }],
        updatedAt: nowIso(),
      }))
      setLoading(false)
      return
    }

    // If user mentions routine/deadline keywords but none set → guide to setup
    if (intent === 'plan_request' && !(meta?.prefs?.routine?.length)) {
      const guide = "I can plan around your free time. Click the **gear icon** (top-right of the chat card) to add your **class routine, course difficulty, study windows, and deadlines**. Then say **plan my week**."
      setCurrent(cur => ({ ...cur, meta: { ...cur.meta, pendingAction: 'plan_from_prefs' }, messages: [...cur.messages, { id: uid(), role:'assistant', ts: nowIso(), content: guide }], updatedAt: nowIso() }))
      setLoading(false)
      return
    }

    // ---------- F) Try backend AI ----------
    let replyText = ''
    try {
      if (typeof api?.aiPlannerChat === 'function') {
        const res = await api.aiPlannerChat({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        })
        replyText = (res && res.message) || ''
      }
    } catch { replyText = '' }

    // ---------- G) Local fallback ----------
    if (!replyText) {
      switch (intent) {
        case 'greeting':   replyText = 'Hello! How can I help you with your study planner today?'; break
        case 'how_are_you':replyText = "I’m doing well — thanks! How are you feeling about your studies today?"; break
        case 'thanks':     replyText = 'You’re welcome! Want me to draft a plan around your routine?'; break
        case 'farewell':   replyText = 'Bye for now! Keep going — small steps add up. 📚'; break
        case 'plan_request':
        default:           replyText = fallbackPlannerReply(content)
      }
    }

    setCurrent(cur => ({ ...cur, messages: [...cur.messages, { id: uid(), role:'assistant', ts: nowIso(), content: replyText }], updatedAt: nowIso() }))
    setLoading(false)
  }

  function onKeyDown(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); handleSend() } }

  /* ============================== UI ============================== */
  const quickPrompts = [
    'Plan my week around my routine',
    'I am not satisfied with my CGPA',
    'My CGPA is 3.25',
    'Create a 10-day exam countdown for PHY111',
  ]

  const last = meta?.lastSessions

  return (
    <>
      <TopNav buttons={['home']} />
      <Box
        sx={{
          py: { xs: 2, md: 4 },
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(79,70,229,0.14), transparent 60%)'
              : 'linear-gradient(180deg, rgba(79,70,229,0.08), transparent 60%)',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" spacing={2} alignItems="stretch">
            {/* Sidebar (md+) */}
            <Paper
              variant="outlined"
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                width: 280,
                p: 1.5,
                borderRadius: 2,
                height: '72vh',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={800}>History</Typography>
                <Button size="small" onClick={newThread} variant="outlined">New chat</Button>
              </Stack>

              <Divider sx={{ mb: 1 }} />

              <List dense sx={{ overflowY: 'auto' }}>
                {store.order.map(id => {
                  const t = store.threads[id]
                  const selected = id === store.currentId
                  return (
                    <ListItemButton key={id} selected={selected} onClick={() => selectThread(id)} sx={{ borderRadius: 1 }}>
                      <ListItemText
                        primary={t.title}
                        secondary={new Date(t.updatedAt).toLocaleString()}
                        primaryTypographyProps={{ noWrap: true }}
                        secondaryTypographyProps={{ noWrap: true }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small" onClick={(e)=>{e.stopPropagation(); renameThread(id)}}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e)=>{e.stopPropagation(); deleteThread(id)}}><Delete fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  )
                })}
              </List>
            </Paper>

            {/* Drawer (xs) */}
            <Drawer anchor="left" open={drawerOpen} onClose={()=>setDrawerOpen(false)} sx={{ display: { md:'none' } }}>
              <Box sx={{ width: 280, p: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={800}>History</Typography>
                  <Button size="small" onClick={()=>{setDrawerOpen(false); newThread()}} variant="outlined">New chat</Button>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {store.order.map(id => {
                    const t = store.threads[id]
                    const selected = id === store.currentId
                    return (
                      <ListItemButton key={id} selected={selected} onClick={()=>{selectThread(id); setDrawerOpen(false)}} sx={{ borderRadius: 1 }}>
                        <ListItemText
                          primary={t.title}
                          secondary={new Date(t.updatedAt).toLocaleString()}
                          primaryTypographyProps={{ noWrap: true }}
                          secondaryTypographyProps={{ noWrap: true }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton size="small" onClick={(e)=>{e.stopPropagation(); renameThread(id)}}><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={(e)=>{e.stopPropagation(); deleteThread(id)}}><Delete fontSize="small" /></IconButton>
                        </ListItemSecondaryAction>
                      </ListItemButton>
                    )
                  })}
                </List>
              </Box>
            </Drawer>

            {/* Chat panel */}
            <Paper variant="outlined" sx={{ flex: 1, p: { xs: 2, md: 3 }, borderRadius: 2, height: '72vh', display: 'flex', flexDirection: 'column' }}>
              <Header
                userLabel={userLabel}
                onOpenHistory={()=>setDrawerOpen(true)}
                onOpenPrefs={()=>setPrefsOpen(true)}
                onOpenSessions={()=> setSessionsOpen(true)}
                canOpenSessions={!!last?.sessions?.length}
              />

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2} sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                {messages.map(m => m.role === 'assistant'
                  ? <BotBubble key={m.id} content={m.content} />
                  : <UserBubble key={m.id} content={m.content} />
                )}
                {loading && <TypingBubble />}
                <div ref={endRef} />
              </Stack>

              <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap sx={{ mt: 2 }}>
                {quickPrompts.map((p,i)=>(
                  <Chip key={i} size="small" icon={<Bolt />} label={p} onClick={()=>handleSend(p)} sx={{ borderRadius: 2 }} variant="outlined" />
                ))}
              </Stack>

              <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Button size="small" variant="outlined" startIcon={<SettingsIcon />} onClick={()=>setPrefsOpen(true)}>
                  Routine & Preferences
                </Button>
                <Button size="small" variant="outlined" startIcon={<EventIcon />} disabled={!last?.sessions?.length}
                  onClick={()=>setSessionsOpen(true)}>
                  View Sessions / Add to Calendar
                </Button>
                {last?.sessions?.length ? (
                  <Button size="small" variant="contained" onClick={()=>{
                    const ics = sessionsToICS(last.tz, last.sessions)
                    downloadIcs('study-plan.ics', ics)
                  }}>
                    Export to Calendar (.ics)
                  </Button>
                ) : null}
              </Stack>

              <Paper elevation={0} sx={{ mt: 1.5, p: 1, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <TextField
                  fullWidth multiline minRows={1} maxRows={6}
                  placeholder="Say hi, share your CGPA, or request a plan…"
                  value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKeyDown}
                />
                <Tooltip title="Send (Enter)">
                  <span>
                    <IconButton color="primary" disabled={!input.trim()||loading} onClick={()=>handleSend()}>
                      <Send />
                    </IconButton>
                  </span>
                </Tooltip>
              </Paper>
            </Paper>
          </Stack>
        </Container>
      </Box>

      {/* Routine & Preferences dialog */}
      <PrefsDialog
        open={prefsOpen}
        onClose={()=>setPrefsOpen(false)}
        prefs={meta?.prefs}
        deadlines={meta?.deadlines||[]}
        onSave={(nextPrefs, nextDeadlines)=>{
          setCurrent(cur => ({
            ...cur,
            meta: { ...cur.meta, prefs: nextPrefs, deadlines: nextDeadlines },
            updatedAt: nowIso(),
          }))
          setPrefsOpen(false)
        }}
      />

      {/* Sessions viewer / Google Calendar links */}
      <SessionsDialog
        open={sessionsOpen} onClose={()=>setSessionsOpen(false)}
        sessions={last?.sessions||[]}
      />
    </>
  )
}

/* ============================ UI bits ============================ */
function Header({ userLabel, onOpenHistory, onOpenPrefs, onOpenSessions, canOpenSessions }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <IconButton sx={{ display: { md:'none' } }} onClick={onOpenHistory}><MenuIcon /></IconButton>
      <Avatar sx={{ bgcolor: 'primary.main' }}><School fontSize="small" /></Avatar>
      <Stack>
        <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1 }}>
          Study Planner (AI)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Plans around your **class routine** and **deadlines**. Use the gear to set them up.
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
        <Chip size="small" icon={<AutoAwesome />} label="AI-assisted" variant="outlined" />
        <Chip size="small" icon={<Schedule />} label="Time-aware" variant="outlined" />
        <Chip size="small" label={`Signed in as ${userLabel}`} />
        <Tooltip title="Routine & Preferences">
          <IconButton onClick={onOpenPrefs}><SettingsIcon /></IconButton>
        </Tooltip>
        <Tooltip title="View Sessions / Add to Calendar">
          <span>
            <IconButton onClick={onOpenSessions} disabled={!canOpenSessions}><EventIcon /></IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  )
}
function UserBubble({ content }) {
  return (
    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
      <Paper sx={{ p: 1.25, px: 1.5, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText', maxWidth: '80%', whiteSpace: 'pre-wrap' }}>
        {content}
      </Paper>
      <Avatar>U</Avatar>
    </Stack>
  )
}
function BotBubble({ content }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Avatar sx={{ bgcolor: 'primary.main' }}><AutoAwesome fontSize="small" /></Avatar>
      <Paper variant="outlined" sx={{ p: 1.25, px: 1.5, borderRadius: 2, maxWidth: '80%', whiteSpace: 'pre-wrap' }}>
        {content}
      </Paper>
    </Stack>
  )
}
function TypingBubble() {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Avatar sx={{ bgcolor: 'primary.main' }}><AutoAwesome fontSize="small" /></Avatar>
      <Paper variant="outlined" sx={{ p: 1, px: 1.5, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">Thinking…</Typography>
        </Stack>
      </Paper>
    </Stack>
  )
}

/* ========================== Prefs Dialog ========================== */
function PrefsDialog({ open, onClose, prefs, deadlines, onSave }) {
  const [localPrefs, setLocalPrefs] = useState(prefs)
  const [localDeadlines, setLocalDeadlines] = useState(deadlines)

  useEffect(()=>{ setLocalPrefs(prefs) },[prefs])
  useEffect(()=>{ setLocalDeadlines(deadlines) },[deadlines])

  const [routineRow, setRoutineRow] = useState({ day:'Mon', start:'09:00', end:'10:20', course:'' })
  const [deadlineRow, setDeadlineRow] = useState({ type:'assignment', course:'', title:'', at:'' })
  const [studyRow, setStudyRow] = useState({ day:'Mon-Fri', start:'18:00', end:'22:00' })
  const [maxHours, setMaxHours] = useState(localPrefs?.maxDailyHours || 2)
  const [timezone, setTimezone] = useState(localPrefs?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)

  useEffect(()=>{ setMaxHours(localPrefs?.maxDailyHours||2); setTimezone(localPrefs?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone)},[localPrefs])

  function addRoutine(){
    if(!routineRow.course.trim()) return
    setLocalPrefs(p=>({...p, routine:[...(p.routine||[]), routineRow]}))
    setRoutineRow({ day:'Mon', start:'09:00', end:'10:20', course:'' })
  }
  function removeRoutine(idx){
    setLocalPrefs(p=>({...p, routine:(p.routine||[]).filter((_,i)=>i!==idx)}))
  }
  function setDiff(course, value){
    setLocalPrefs(p=>({...p, difficulty:{ ...(p.difficulty||{}), [course]:value }}))
  }
  function addStudyWindow(){
    setLocalPrefs(p=>({...p, studyWindows:[...(p.studyWindows||[]), studyRow]}))
    setStudyRow({ day:'Mon-Fri', start:'18:00', end:'22:00' })
  }
  function removeStudyWindow(idx){
    setLocalPrefs(p=>({...p, studyWindows:(p.studyWindows||[]).filter((_,i)=>i!==idx)}))
  }
  function addDeadline(){
    if(!deadlineRow.course.trim() || !deadlineRow.at) return
    setLocalDeadlines(p=>[...p, { ...deadlineRow, id: uid() }])
    setDeadlineRow({ type:'assignment', course:'', title:'', at:'' })
  }
  function removeDeadline(id){
    setLocalDeadlines(p=>p.filter(d=>d.id!==id))
  }

  useEffect(()=>{ setLocalPrefs(p=>({...p, maxDailyHours:maxHours, timezone })) },[maxHours, timezone])

  const courses = Array.from(new Set((localPrefs?.routine||[]).map(r=>r.course))).filter(Boolean)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Routine & Preferences</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          {/* Routine */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={800}>Class Routine (current semester)</Typography>
            <Stack spacing={1} mt={1}>
              {(localPrefs?.routine||[]).map((r,idx)=>(
                <Paper key={idx} variant="outlined" sx={{ p:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <Typography variant="body2">{r.day} {r.start}–{r.end} — <b>{r.course}</b></Typography>
                  <IconButton size="small" onClick={()=>removeRoutine(idx)}>✕</IconButton>
                </Paper>
              ))}
              <Stack direction="row" spacing={1}>
                <FormControl sx={{ minWidth: 100 }} size="small">
                  <InputLabel>Day</InputLabel>
                  <Select label="Day" value={routineRow.day} onChange={e=>setRoutineRow({...routineRow, day:e.target.value})}>
                    {DAYS.map(d=><MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" label="Start" type="time" value={routineRow.start} onChange={e=>setRoutineRow({...routineRow, start:e.target.value})} />
                <TextField size="small" label="End" type="time" value={routineRow.end} onChange={e=>setRoutineRow({...routineRow, end:e.target.value})} />
                <TextField size="small" label="Course (e.g., CSE111)" value={routineRow.course} onChange={e=>setRoutineRow({...routineRow, course:e.target.value.toUpperCase()})} />
                <Button variant="contained" onClick={addRoutine}>Add</Button>
              </Stack>
            </Stack>
          </Grid>

          {/* Difficulty & Study windows */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={800}>Difficulty & Preferences</Typography>
            <Stack spacing={1} mt={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" label="Timezone" value={timezone} onChange={e=>setTimezone(e.target.value)} />
                <TextField size="small" type="number" label="Max hours/day" value={maxHours} onChange={e=>setMaxHours(Number(e.target.value||2))} inputProps={{ min:1, max:8 }} />
              </Stack>

              <Typography variant="caption" color="text.secondary">Study Windows</Typography>
              {(localPrefs?.studyWindows||[]).map((w,idx)=>(
                <Paper key={idx} variant="outlined" sx={{ p:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <Typography variant="body2">{w.day} {w.start}–{w.end}</Typography>
                  <IconButton size="small" onClick={()=>removeStudyWindow(idx)}>✕</IconButton>
                </Paper>
              ))}
              <Stack direction="row" spacing={1}>
                <FormControl sx={{ minWidth: 110 }} size="small">
                  <InputLabel>Days</InputLabel>
                  <Select label="Days" value={studyRow.day} onChange={e=>setStudyRow({...studyRow, day:e.target.value})}>
                    <MenuItem value="Mon-Fri">Mon–Fri</MenuItem>
                    <MenuItem value="Sat-Sun">Sat–Sun</MenuItem>
                    {DAYS.map(d=><MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" label="Start" type="time" value={studyRow.start} onChange={e=>setStudyRow({...studyRow, start:e.target.value})} />
                <TextField size="small" label="End" type="time" value={studyRow.end} onChange={e=>setStudyRow({...studyRow, end:e.target.value})} />
                <Button variant="contained" onClick={addStudyWindow}>Add</Button>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Course Difficulty</Typography>
              {courses.length===0 ? (
                <Typography variant="caption" color="text.secondary">Add routine entries to list courses.</Typography>
              ) : (
                <Stack spacing={1}>
                  {courses.map(c=>(
                    <Stack key={c} direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ width: 100 }}>{c}</Typography>
                      <Select size="small" value={localPrefs?.difficulty?.[c]||'medium'} onChange={e=>setDiff(c, e.target.value)}>
                        <MenuItem value="easy">Easy</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="hard">Hard</MenuItem>
                      </Select>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </Grid>

          {/* Deadlines */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1 }}>Deadlines (assignment / quiz / viva / exam)</Typography>
            <Stack spacing={1} mt={1}>
              {localDeadlines.map(d=>(
                <Paper key={d.id} variant="outlined" sx={{ p:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <Typography variant="body2"><b>{d.course}</b> — {d.type} — {d.title||'Untitled'} — {new Date(d.at).toLocaleString()}</Typography>
                  <IconButton size="small" onClick={()=>removeDeadline(d.id)}>✕</IconButton>
                </Paper>
              ))}
              <Stack direction={{ xs:'column', sm:'row' }} spacing={1}>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" value={deadlineRow.type} onChange={e=>setDeadlineRow({...deadlineRow, type:e.target.value})}>
                    <MenuItem value="assignment">Assignment</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="viva">Viva</MenuItem>
                    <MenuItem value="exam">Exam</MenuItem>
                  </Select>
                </FormControl>
                <TextField size="small" label="Course" value={deadlineRow.course} onChange={e=>setDeadlineRow({...deadlineRow, course:e.target.value.toUpperCase()})} />
                <TextField size="small" label="Title" value={deadlineRow.title} onChange={e=>setDeadlineRow({...deadlineRow, title:e.target.value})} />
                <TextField size="small" type="datetime-local" label="When" value={deadlineRow.at} onChange={e=>setDeadlineRow({...deadlineRow, at:e.target.value})} InputLabelProps={{ shrink:true }} />
                <Button variant="contained" onClick={addDeadline}>Add</Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={()=>onSave(localPrefs, localDeadlines)}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

/* ========================= Sessions Dialog ========================= */
function SessionsDialog({ open, onClose, sessions }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Planned Sessions</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          {!sessions?.length && <Typography variant="body2" color="text.secondary">No sessions available yet.</Typography>}
          {sessions?.map((s, idx)=>{
            const start = asDate(s.start)
            const end = asDate(s.end)
            const url = gcalUrlForSession({ ...s, start, end })
            return (
              <Paper key={idx} variant="outlined" sx={{ p: 1, display:'flex', gap: 1, alignItems:'center', justifyContent:'space-between' }}>
                <Typography variant="body2" sx={{ whiteSpace:'pre-wrap' }}>
                  <b>{s.title}</b><br/>
                  {start.toLocaleString()} → {end.toLocaleString()}
                </Typography>
                {url ? (
                  <Button size="small" component="a" target="_blank" href={url}>
                    Add to Google Calendar
                  </Button>
                ) : null}
              </Paper>
            )
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
