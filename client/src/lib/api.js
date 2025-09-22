// client/src/lib/api.js
export function getToken() {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
}

export async function authFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    // Try to parse a structured error; fall back to text
    let errMessage = `Request failed (${res.status})`
    try {
      const err = await res.json()
      errMessage = err?.message || errMessage
    } catch {
      try {
        const text = await res.text()
        if (text) errMessage = text
      } catch {}
    }
    throw new Error(errMessage)
  }

  // Some endpoints might return empty bodies; guard JSON parsing
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  // Non-JSON success: return raw text
  return res.text()
}

// ---------------- Semesters & Enrollments ----------------
export const api = {
  listSemesters: () => authFetch('/api/semesters'),

  createSemester: (name) =>
    authFetch('/api/semesters', { method: 'POST', body: JSON.stringify({ name }) }),

  deleteSemester: (id) =>
    authFetch(`/api/semesters/${id}`, { method: 'DELETE' }),

  listEnrollments: (semesterId) =>
    authFetch(`/api/enrollments?semesterId=${encodeURIComponent(semesterId)}`),

  addEnrollment: (payload) =>
    authFetch('/api/enrollments', { method: 'POST', body: JSON.stringify(payload) }),

  deleteEnrollment: (id) =>
    authFetch(`/api/enrollments/${id}`, { method: 'DELETE' }),

  cgpa: () => authFetch('/api/compute/cgpa'),

  gpa: (semesterId) =>
    authFetch(`/api/compute/gpa?semesterId=${encodeURIComponent(semesterId)}`),

  // --------------- AI Planner Chat ----------------
  /**
   * Send a chat to the AI study planner.
   * Expects server to accept: POST /api/ai/planner  { messages: [{role, content}, ...] }
   * Tries to normalize different response formats and returns:
   *   { message: string }
   */
  aiPlannerChat: async ({ messages }) => {
    const res = await fetch('/api/ai/planner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ messages }),
    })

    if (!res.ok) {
      let errMessage = `Request failed (${res.status})`
      try {
        const err = await res.json()
        errMessage = err?.message || errMessage
      } catch {
        try {
          const text = await res.text()
          if (text) errMessage = text
        } catch {}
      }
      throw new Error(errMessage)
    }

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json()
      // Normalize several possible shapes
      const message =
        data?.message ??
        data?.reply ??
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.delta?.content ??
        ''

      return { message: String(message || '').trim() }
    }

    // Plain text fallback
    const text = (await res.text()) || ''
    return { message: text.trim() }
  },
}
