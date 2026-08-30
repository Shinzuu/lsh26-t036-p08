/**
 * The grading engine — required item 2. Unit U2.
 *
 * Every rule here comes from SPEC.md, which quotes the problem statement and the
 * published clarifications verbatim. Nothing in this file is invented: if a number
 * appears below it is either R-10, R-11, R-12, R-13 or the subject grade scale.
 *
 * The whole module is pure. No React, no store, no dataset import — it takes marks
 * and returns results, which is what lets `grading.test.mjs` run it under plain
 * `node --test` with no bundler in the way. U3's trace and U4's checking lists both
 * import from here, so every exported name and return shape is fixed in SPEC.md.
 */

export const THEORY_TOTAL = 75
export const THEORY_PASS = 25
export const PRACTICAL_TOTAL = 25
export const PRACTICAL_PASS = 8

/** Below this a subject is a fail outright, whatever the parts said. */
const SUBJECT_FAIL_MARK = 33

/** R-13: the optional subject contributes `max(0, gp - 2)`, and the divisor is 6. */
const OPTIONAL_DISCOUNT = 2
const DIVISOR = 6
const GPA_CAP = 5

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * Round half up at two decimals, once.
 *
 * SPEC decision 1: cap first, round once, then read the letter off the rounded
 * value — so a student at 3.995 shows 4.00 and is an A, and the letter can never
 * disagree with the number printed beside it. The epsilon nudge is there because
 * binary floats put values like 3.995 a hair below the true half, which would
 * round the wrong way and hand that student an A-.
 */
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Normalise one raw mark into the shape the rest of the engine reads.
 *
 * Three input forms, fixed by the fixture: a plain number, `{theory, practical}`,
 * or the string "AB". Absent is not zero (an explicit constraint of the problem),
 * so it comes back with `mark: null` and never as a 0 — the difference survives
 * all the way to the screen.
 *
 * Anything unrecognised is treated as absent rather than thrown. `parseDataset`
 * has already rejected malformed cases upstream; if something slips through, one
 * student reading AB is a far better failure than a blank roster at judging.
 */
export function readMark(raw) {
  if (raw === 'AB') return { absent: true, mark: null, theory: null, practical: null }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { absent: false, mark: raw, theory: null, practical: null }
  }

  if (isObject(raw) && Number.isFinite(raw.theory) && Number.isFinite(raw.practical)) {
    return {
      absent: false,
      mark: raw.theory + raw.practical,
      theory: raw.theory,
      practical: raw.practical,
    }
  }

  return { absent: true, mark: null, theory: null, practical: null }
}

/**
 * The subject grade scale, straight from the problem statement:
 * 80+ → 5.0 · 70–79 → 4.0 · 60–69 → 3.5 · 50–59 → 3.0 · 40–49 → 2.0 ·
 * 33–39 → 1.0 · below 33 → 0 and counts as a fail.
 *
 * This is the band lookup only. It knows nothing about theory/practical pass marks
 * or absence — `subjectResult` applies those, because a mark can clear 33 overall
 * and still fail on a part.
 */
export function gradePointForMark(mark) {
  if (!Number.isFinite(mark)) return 0
  if (mark >= 80) return 5
  if (mark >= 70) return 4
  if (mark >= 60) return 3.5
  if (mark >= 50) return 3
  if (mark >= 40) return 2
  if (mark >= SUBJECT_FAIL_MARK) return 1
  return 0
}

/** The band sentence for a passing mark, e.g. "mark 74 is in 70–79". */
function bandRule(mark) {
  if (mark >= 80) return `mark ${mark} is 80 or above`
  if (mark >= 70) return `mark ${mark} is in 70–79`
  if (mark >= 60) return `mark ${mark} is in 60–69`
  if (mark >= 50) return `mark ${mark} is in 50–59`
  if (mark >= 40) return `mark ${mark} is in 40–49`
  return `mark ${mark} is in 33–39`
}

/**
 * One subject's result: the mark used, the grade point it produced, and the rule
 * sentence that decided it — built from this student's real numbers, because the
 * problem states the trace must show the numbers used, not a general explanation.
 *
 * R-11: theory is out of 75 passing at 25, practical out of 25 passing at 8, and
 * failing either part fails the subject with grade point 0 even when the total
 * looks healthy. R-12: absent scores grade point 0 and shows AB.
 *
 * Precedence when more than one rule could fire is absent → practical → theory →
 * below 33, following the order SPEC.md lists its example sentences in. It only
 * matters for a student who failed both parts at once; the sentence names one
 * cause, so it names the first in that order.
 */
export function subjectResult(raw, hasPractical) {
  const read = readMark(raw)
  const { absent, mark, theory, practical } = read

  if (absent) {
    return { ...read, gradePoint: 0, failed: true, rule: 'absent — AB, grade point 0' }
  }

  // Part checks only apply when the marks actually arrived split. A practical
  // subject recorded as a single total has no parts to test, so it falls through
  // to the band rules below rather than inventing a theory mark to judge.
  const split = hasPractical && theory !== null && practical !== null

  if (split && practical < PRACTICAL_PASS) {
    return {
      ...read,
      gradePoint: 0,
      failed: true,
      rule: `practical ${practical} is below the pass mark of ${PRACTICAL_PASS}`,
    }
  }

  if (split && theory < THEORY_PASS) {
    return {
      ...read,
      gradePoint: 0,
      failed: true,
      rule: `theory ${theory} is below the pass mark of ${THEORY_PASS}`,
    }
  }

  if (mark < SUBJECT_FAIL_MARK) {
    return {
      ...read,
      gradePoint: 0,
      failed: true,
      rule: `mark ${mark} is below ${SUBJECT_FAIL_MARK}`,
    }
  }

  const gradePoint = gradePointForMark(mark)
  return { ...read, gradePoint, failed: false, rule: bandRule(mark) }
}

/**
 * R-10, read off the final GPA: A+ = 5.00, A = 4.00–4.99, A- = 3.50–3.99,
 * B = 3.00–3.49, C = 2.00–2.99, D = 1.00–1.99, anything else F.
 *
 * `hasCompulsoryFail` short-circuits to F because R-13 makes a compulsory failure
 * an F regardless of the average — and the caller has already zeroed the GPA, so
 * this only restates the same verdict from the flag rather than inferring it.
 */
export function letterGrade(gpa, hasCompulsoryFail) {
  if (hasCompulsoryFail) return 'F'
  if (gpa >= 5) return 'A+'
  if (gpa >= 4) return 'A'
  if (gpa >= 3.5) return 'A-'
  if (gpa >= 3) return 'B'
  if (gpa >= 2) return 'C'
  if (gpa >= 1) return 'D'
  return 'F'
}

/**
 * A whole student: all seven subjects, the GPA calculation, and the flags the
 * checking lists are built from.
 *
 * The two rules that are easiest to get backwards, both from R-13:
 *
 * 1. A compulsory failure zeroes `gpa` and nothing else. `compulsoryPoints`, every
 *    `subjects[code].gradePoint` and `uncancelledGpa` stay populated, because the
 *    clarification requires the uncancelled average to remain visible in the trace
 *    — the teacher has to see what was cancelled and by which subject.
 * 2. The optional subject never joins `compulsoryPoints` and never moves the
 *    divisor. It contributes `max(0, gp - 2)` on top, and the divisor is always 6.
 */
export function studentResult(student, dataset) {
  const practicalByCode = new Map(
    (dataset?.subjects ?? []).map((s) => [s.code, Boolean(s.practical)]),
  )
  const compulsory = dataset?.compulsory ?? []

  const subjects = {}
  for (const [code, raw] of Object.entries(student.marks ?? {})) {
    subjects[code] = subjectResult(raw, practicalByCode.get(code) ?? false)
  }

  const compulsoryPoints = compulsory.reduce(
    (sum, code) => sum + (subjects[code]?.gradePoint ?? 0),
    0,
  )

  const optionalEntry = subjects[student.optional] ?? null
  const optionalGradePoint = optionalEntry?.gradePoint ?? 0
  const optionalBonus = Math.max(0, optionalGradePoint - OPTIONAL_DISCOUNT)

  const uncancelledGpa = round2(
    Math.min(GPA_CAP, (compulsoryPoints + optionalBonus) / DIVISOR),
  )

  const failedCompulsory = compulsory.filter((code) => (subjects[code]?.gradePoint ?? 0) === 0)
  const hasCompulsoryFail = failedCompulsory.length > 0

  const gpa = hasCompulsoryFail ? 0 : uncancelledGpa

  const entries = Object.values(subjects)

  return {
    id: student.id,
    name: student.name,
    class: student.class,
    optional: student.optional,
    subjects,
    compulsoryPoints,
    optionalGradePoint,
    optionalBonus,
    uncancelledGpa,
    failedCompulsory,
    gpa,
    letter: letterGrade(gpa, hasCompulsoryFail),
    flags: {
      // R-29, all three read across every subject the student sits, optional included.
      optionalRule: optionalGradePoint <= 2,
      practicalFail: entries.some((s) => s.practical !== null && s.practical < PRACTICAL_PASS),
      absent: entries.some((s) => s.absent),
    },
  }
}

/**
 * The office's three checking lists (R-29). A student can land on more than one and
 * appears on each; the arrays hold whole `studentResult` objects so U4 can show the
 * name and select the student without a second lookup.
 */
export function checkingLists(results) {
  const rows = Array.isArray(results) ? results : []
  return {
    optional: rows.filter((r) => r.flags?.optionalRule),
    practicalFail: rows.filter((r) => r.flags?.practicalFail),
    absent: rows.filter((r) => r.flags?.absent),
  }
}
