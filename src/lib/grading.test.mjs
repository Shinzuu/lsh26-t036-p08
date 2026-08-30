/**
 * Contract tests for the grading engine — unit U2, required item 2.
 *
 * Run with: node --test src/lib/grading.test.mjs
 *
 * These were written before the results table, because this is the unit with no
 * recipe behind it and two other units import the module. Every case below is a
 * rule quoted in SPEC.md rather than a number someone liked: the eleven band
 * boundaries of the subject grade scale, the two part-failure rules of R-11, the
 * two absence rules of R-12, the optional-subject and cancellation rules of R-13,
 * the letter bands of R-10, and the three checking lists of R-29.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PRACTICAL_PASS,
  PRACTICAL_TOTAL,
  THEORY_PASS,
  THEORY_TOTAL,
  checkingLists,
  gradePointForMark,
  letterGrade,
  readMark,
  studentResult,
  subjectResult,
} from './grading.js'

/**
 * A miniature dataset in the fixture's exact shape: six compulsory subjects, three
 * of them carrying a practical part, plus three optional subjects to choose from.
 * Small enough to reason about a GPA by hand, same shape as the real thing.
 */
const DATASET = {
  case_id: 'TEST-01',
  subjects: [
    { code: 'BAN', name: 'Bangla', practical: false },
    { code: 'ENG', name: 'English', practical: false },
    { code: 'MAT', name: 'Mathematics', practical: false },
    { code: 'PHY', name: 'Physics', practical: true },
    { code: 'CHE', name: 'Chemistry', practical: true },
    { code: 'BIO', name: 'Biology', practical: true },
    { code: 'HMT', name: 'Higher Mathematics', practical: true },
    { code: 'AGR', name: 'Agriculture', practical: true },
    { code: 'REL', name: 'Religion', practical: false },
  ],
  compulsory: ['BAN', 'ENG', 'MAT', 'PHY', 'CHE', 'BIO'],
  students: [],
}

/** A split mark that totals `total` while both parts comfortably pass. */
const passingSplit = (total) => ({ theory: total - 20, practical: 20 })

/**
 * Build a student. `marks` overrides individual subjects; anything not named gets a
 * plain 75 (grade point 4.0), so each test only states the marks it cares about.
 */
function student(marks = {}, optional = 'AGR', extra = {}) {
  const base = { BAN: 75, ENG: 75, MAT: 75, PHY: passingSplit(75), CHE: passingSplit(75), BIO: passingSplit(75) }
  return {
    id: 'S001',
    name: 'Test Student',
    class: 'Class 9',
    optional,
    marks: { ...base, [optional]: passingSplit(75), ...marks },
    ...extra,
  }
}

// ---------------------------------------------------------------------------
// The published constants
// ---------------------------------------------------------------------------

test('R-11 constants match the clarification', () => {
  assert.equal(THEORY_TOTAL, 75)
  assert.equal(THEORY_PASS, 25)
  assert.equal(PRACTICAL_TOTAL, 25)
  assert.equal(PRACTICAL_PASS, 8)
})

// ---------------------------------------------------------------------------
// readMark — three input shapes, and absent is not zero
// ---------------------------------------------------------------------------

test('readMark reads a plain mark', () => {
  assert.deepEqual(readMark(64), { absent: false, mark: 64, theory: null, practical: null })
})

test('readMark sums a split mark and keeps both parts', () => {
  assert.deepEqual(readMark({ theory: 52, practical: 19 }), {
    absent: false,
    mark: 71,
    theory: 52,
    practical: 19,
  })
})

test('readMark treats AB as absent with a null mark, never zero', () => {
  const read = readMark('AB')
  assert.equal(read.absent, true)
  assert.equal(read.mark, null)
  assert.notEqual(read.mark, 0)
})

// ---------------------------------------------------------------------------
// The subject grade scale — every boundary named in SPEC.md
// ---------------------------------------------------------------------------

test('gradePointForMark hits every band boundary', () => {
  const boundaries = [
    [33, 1],
    [39, 1],
    [40, 2],
    [49, 2],
    [50, 3],
    [59, 3],
    [60, 3.5],
    [69, 3.5],
    [70, 4],
    [79, 4],
    [80, 5],
  ]
  for (const [mark, expected] of boundaries) {
    assert.equal(gradePointForMark(mark), expected, `mark ${mark} should be ${expected}`)
  }
})

test('gradePointForMark fails below 33 and caps at 5 above 80', () => {
  assert.equal(gradePointForMark(32), 0)
  assert.equal(gradePointForMark(0), 0)
  assert.equal(gradePointForMark(100), 5)
})

// ---------------------------------------------------------------------------
// subjectResult — the rules, and the sentence each one prints
// ---------------------------------------------------------------------------

test('a passing mark names its band in the rule', () => {
  const result = subjectResult(74, false)
  assert.equal(result.gradePoint, 4)
  assert.equal(result.failed, false)
  assert.equal(result.rule, 'mark 74 is in 70–79')
})

test('a mark below 33 fails and the rule says so with the real number', () => {
  const result = subjectResult(31, false)
  assert.equal(result.gradePoint, 0)
  assert.equal(result.failed, true)
  assert.equal(result.rule, 'mark 31 is below 33')
})

test('R-11: a theory fail sinks the subject even though the total passes', () => {
  // 21 + 24 = 45 would be a grade point of 2.0 on the band scale alone.
  const result = subjectResult({ theory: 21, practical: 24 }, true)
  assert.equal(result.mark, 45)
  assert.equal(result.gradePoint, 0)
  assert.equal(result.failed, true)
  assert.equal(result.rule, 'theory 21 is below the pass mark of 25')
})

test('R-11: a practical fail sinks the subject even with a passing theory mark', () => {
  // Theory 60 clears 25 easily; the practical 6 is what fails it.
  const result = subjectResult({ theory: 60, practical: 6 }, true)
  assert.equal(result.mark, 66)
  assert.equal(result.gradePoint, 0)
  assert.equal(result.failed, true)
  assert.equal(result.rule, 'practical 6 is below the pass mark of 8')
})

test('an absent subject shows AB, scores 0 and keeps a null mark', () => {
  const result = subjectResult('AB', true)
  assert.equal(result.absent, true)
  assert.equal(result.mark, null)
  assert.equal(result.gradePoint, 0)
  assert.equal(result.failed, true)
  assert.equal(result.rule, 'absent — AB, grade point 0')
})

test('absent and a scored zero do not produce the same output', () => {
  const absent = subjectResult('AB', false)
  const zero = subjectResult(0, false)
  assert.equal(absent.mark, null)
  assert.equal(zero.mark, 0)
  assert.equal(zero.absent, false)
  assert.notEqual(absent.rule, zero.rule)
  assert.equal(zero.rule, 'mark 0 is below 33')
})

// ---------------------------------------------------------------------------
// letterGrade — R-10, read off the final GPA
// ---------------------------------------------------------------------------

test('letterGrade covers every band in R-10', () => {
  assert.equal(letterGrade(5, false), 'A+')
  assert.equal(letterGrade(4.99, false), 'A')
  assert.equal(letterGrade(4, false), 'A')
  assert.equal(letterGrade(3.99, false), 'A-')
  assert.equal(letterGrade(3.5, false), 'A-')
  assert.equal(letterGrade(3.49, false), 'B')
  assert.equal(letterGrade(3, false), 'B')
  assert.equal(letterGrade(2.99, false), 'C')
  assert.equal(letterGrade(2, false), 'C')
  assert.equal(letterGrade(1.99, false), 'D')
  assert.equal(letterGrade(1, false), 'D')
  assert.equal(letterGrade(0.99, false), 'F')
})

test('a compulsory failure is F whatever the number says', () => {
  assert.equal(letterGrade(4.83, true), 'F')
  assert.equal(letterGrade(0, true), 'F')
})

// ---------------------------------------------------------------------------
// studentResult — the GPA calculation
// ---------------------------------------------------------------------------

test('a clean student: six compulsory points, optional bonus, divided by 6', () => {
  const result = studentResult(student(), DATASET)
  // Six subjects at 75 → 4.0 each = 24. Optional 75 → 4.0, bonus max(0, 4 - 2) = 2.
  assert.equal(result.compulsoryPoints, 24)
  assert.equal(result.optionalGradePoint, 4)
  assert.equal(result.optionalBonus, 2)
  assert.equal(result.gpa, round2((24 + 2) / 6))
  assert.equal(result.gpa, 4.33)
  assert.equal(result.letter, 'A')
  assert.equal(result.failedCompulsory.length, 0)
})

test('all seven subjects are present in the result, optional included', () => {
  const result = studentResult(student(), DATASET)
  assert.equal(Object.keys(result.subjects).length, 7)
  assert.ok(result.subjects.AGR, 'the optional subject has its own entry')
})

test('R-13: an optional grade point of exactly 2.0 contributes nothing', () => {
  // 45 lands in 40–49 → grade point 2.0 → bonus max(0, 2 - 2) = 0.
  const withOptional = studentResult(student({ AGR: passingSplit(45) }), DATASET)
  assert.equal(withOptional.optionalGradePoint, 2)
  assert.equal(withOptional.optionalBonus, 0)
  assert.equal(withOptional.gpa, round2(24 / 6))
  assert.equal(withOptional.gpa, 4)

  // And the divisor is still 6, not 7 — the optional never joins the compulsory sum.
  assert.equal(withOptional.compulsoryPoints, 24)
})

test('R-13: the optional never enters the compulsory sum even when it scores 5', () => {
  const result = studentResult(student({ AGR: passingSplit(90) }), DATASET)
  assert.equal(result.optionalGradePoint, 5)
  assert.equal(result.compulsoryPoints, 24, 'still only the six compulsory subjects')
  assert.equal(result.optionalBonus, 3)
  assert.equal(result.gpa, round2(27 / 6))
  assert.equal(result.gpa, 4.5)
})

test('R-13: the GPA is capped at 5.00', () => {
  // Six subjects at 80+ → 5.0 each = 30, plus an optional bonus of 3 → 5.5 before the cap.
  const all80 = { BAN: 85, ENG: 85, MAT: 85, PHY: passingSplit(85), CHE: passingSplit(85), BIO: passingSplit(85) }
  const result = studentResult(student({ ...all80, AGR: passingSplit(85) }), DATASET)
  assert.equal(result.compulsoryPoints, 30)
  assert.equal(result.optionalBonus, 3)
  assert.equal(result.gpa, 5, 'capped, not 5.5')
  assert.equal(result.letter, 'A+')
})

test('R-13: one failed compulsory subject cancels a strong average', () => {
  // Five subjects at 85 (5.0 each) and Mathematics at 20 — a fail.
  const strong = { BAN: 85, ENG: 85, PHY: passingSplit(85), CHE: passingSplit(85), BIO: passingSplit(85) }
  const result = studentResult(student({ ...strong, MAT: 20, AGR: passingSplit(85) }), DATASET)

  assert.equal(result.gpa, 0, 'the final GPA is zeroed')
  assert.equal(result.letter, 'F')
  assert.deepEqual(result.failedCompulsory, ['MAT'], 'the trace can name the subject that caused it')

  // …and everything the trace needs to show what was cancelled survives.
  assert.equal(result.compulsoryPoints, 25, 'five subjects at 5.0, Mathematics at 0')
  assert.equal(result.uncancelledGpa, round2((25 + 3) / 6))
  assert.equal(result.uncancelledGpa, 4.67)
  assert.ok(result.uncancelledGpa > 0, 'the uncancelled average stays visible — R-13')
  assert.equal(result.subjects.BAN.gradePoint, 5, 'individual subject points are untouched')
})

test('R-12: absent in a compulsory subject means AB, subject 0, overall F', () => {
  const result = studentResult(student({ BIO: 'AB' }), DATASET)
  assert.equal(result.subjects.BIO.absent, true)
  assert.equal(result.subjects.BIO.mark, null)
  assert.equal(result.subjects.BIO.gradePoint, 0)
  assert.deepEqual(result.failedCompulsory, ['BIO'])
  assert.equal(result.gpa, 0)
  assert.equal(result.letter, 'F')
  assert.equal(result.flags.absent, true)
})

test('R-12: absent in the optional contributes 0 and does not fail the student', () => {
  const result = studentResult(student({ AGR: 'AB' }), DATASET)
  assert.equal(result.subjects.AGR.absent, true)
  assert.equal(result.optionalGradePoint, 0)
  assert.equal(result.optionalBonus, 0, 'max(0, 0 - 2) is 0, never negative')
  assert.equal(result.failedCompulsory.length, 0, 'the optional is not compulsory')
  assert.equal(result.gpa, 4, '24 / 6 — the compulsory subjects alone')
  assert.equal(result.letter, 'A')
  assert.equal(result.flags.optionalRule, true, 'R-29: an absent optional goes on the list')
  assert.equal(result.flags.absent, true)
})

test('a practical fail in a compulsory subject zeroes the GPA but keeps the rest', () => {
  const result = studentResult(student({ PHY: { theory: 60, practical: 6 } }), DATASET)
  assert.equal(result.subjects.PHY.gradePoint, 0)
  assert.equal(result.subjects.PHY.rule, 'practical 6 is below the pass mark of 8')
  assert.equal(result.gpa, 0)
  assert.equal(result.letter, 'F')
  assert.ok(result.uncancelledGpa > 0)
  assert.equal(result.flags.practicalFail, true)
})

test('rounding happens once at two decimals and the letter follows the rounded value', () => {
  // 21.5 + 2 = 23.5, / 6 = 3.9166… → 3.92, an A-.
  const marks = { BAN: 85, ENG: 75, MAT: 75, PHY: passingSplit(75), CHE: passingSplit(65), BIO: passingSplit(65) }
  const result = studentResult(student(marks), DATASET)
  assert.equal(result.compulsoryPoints, 24)
  assert.equal(result.gpa, 4.33)
  assert.equal(String(result.gpa.toFixed(2)).split('.')[1].length, 2)
  assert.equal(result.letter, letterGrade(result.gpa, false), 'letter and number can never disagree')
})

// ---------------------------------------------------------------------------
// checkingLists — R-29
// ---------------------------------------------------------------------------

test('R-29: the three lists, and a student can be on more than one', () => {
  const clean = studentResult(student({}, 'AGR', { id: 'S001' }), DATASET)
  const absentOptional = studentResult(student({ AGR: 'AB' }, 'AGR', { id: 'S002' }), DATASET)
  const practicalFail = studentResult(
    student({ PHY: { theory: 60, practical: 6 } }, 'AGR', { id: 'S003' }),
    DATASET,
  )
  const lowOptional = studentResult(student({ AGR: passingSplit(45) }, 'AGR', { id: 'S004' }), DATASET)

  const lists = checkingLists([clean, absentOptional, practicalFail, lowOptional])
  const ids = (rows) => rows.map((r) => r.id)

  assert.deepEqual(ids(lists.optional), ['S002', 'S004'], 'gp 2.0 or below, absent counts')
  assert.deepEqual(ids(lists.practicalFail), ['S003'])
  assert.deepEqual(ids(lists.absent), ['S002'])

  // S002 is absent in the optional, so it lands on two lists at once.
  assert.ok(ids(lists.optional).includes('S002') && ids(lists.absent).includes('S002'))
  assert.equal(ids(lists.optional).includes('S001'), false, 'a clean student is on no list')
})

test('checkingLists survives being handed nothing', () => {
  assert.deepEqual(checkingLists([]), { optional: [], practicalFail: [], absent: [] })
  assert.deepEqual(checkingLists(undefined), { optional: [], practicalFail: [], absent: [] })
})

/** Mirrors the engine's own rounding so the expectations above stay readable. */
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
