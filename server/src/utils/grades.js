// server/src/utils/grades.js
export const GRADE_POINTS = {
  'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D': 1.0, 'F': 0.0
}
export const LETTERS = Object.keys(GRADE_POINTS)
export function letterToPoint(letter) {
  return GRADE_POINTS[letter] ?? null
}
export function computeGpa(rows) {
  let num = 0, den = 0
  for (const r of rows) {
    const p = letterToPoint(r.letter)
    const cr = Number(r.credits) || 0
    if (p !== null && cr > 0) { num += p * cr; den += cr }
  }
  return den ? num / den : 0
}
