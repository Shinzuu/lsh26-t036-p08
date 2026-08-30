/**
 * The grading engine. OWNED BY U2 (Rimjhim) — replace this file wholesale.
 *
 * This is a signature-only placeholder written by the integrator so that the app
 * builds and so U3 and U4 can render against the real shapes before the engine
 * lands. Every name and return shape below is fixed in SPEC.md; keep them, throw
 * the bodies away.
 */
export const THEORY_TOTAL = 75
export const THEORY_PASS = 25
export const PRACTICAL_TOTAL = 25
export const PRACTICAL_PASS = 8

export function readMark() {
  return { absent: false, mark: null, theory: null, practical: null }
}

export function gradePointForMark() {
  return 0
}

export function subjectResult() {
  return {
    absent: false, mark: null, theory: null, practical: null,
    gradePoint: 0, failed: false, rule: 'not implemented yet — U2',
  }
}

export function letterGrade() {
  return '—'
}

export function studentResult(student) {
  return {
    id: student.id, name: student.name, class: student.class, optional: student.optional,
    subjects: {}, compulsoryPoints: 0, optionalGradePoint: 0, optionalBonus: 0,
    uncancelledGpa: 0, failedCompulsory: [], gpa: 0, letter: '—',
    flags: { optionalRule: false, practicalFail: false, absent: false },
    pending: true,
  }
}

export function checkingLists() {
  return { optional: [], practicalFail: [], absent: [] }
}
