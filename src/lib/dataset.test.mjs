/**
 * Loader tests — the rules that decide whether a case is allowed in at all.
 *
 * `grading.test.mjs` covers what the engine does with valid marks. This covers
 * what happens to invalid ones, which is the half that was open: every case here
 * was accepted before and produced a wrong result somewhere downstream rather
 * than an error.
 *
 * Runs under plain `node --test` with no bundler, same as the grading suite.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SEED,
  parseDataset,
  THEORY_TOTAL,
  PRACTICAL_TOTAL,
  COMPULSORY_COUNT,
} from './dataset.js'
import {
  THEORY_TOTAL as ENGINE_THEORY_TOTAL,
  PRACTICAL_TOTAL as ENGINE_PRACTICAL_TOTAL,
} from './grading.js'

/** A deep copy of the seed, so a test can corrupt one field in isolation. */
const clone = () => JSON.parse(JSON.stringify(SEED))

/** The error message `parseDataset` throws for `data`, or null if it accepts. */
function refusal(data) {
  try {
    parseDataset(data)
    return null
  } catch (e) {
    return e.message
  }
}

test('the published seed still loads', () => {
  const parsed = parseDataset(SEED)
  assert.equal(parsed.students.length, 80)
})

test('the loader and the engine agree on the paper totals', () => {
  // The loader declares these rather than importing the engine, so that it can
  // validate input without pulling in the module that grades it. R-11 fixes both
  // sets, so a drift between them would silently move the range check away from
  // the rule the engine applies.
  assert.equal(THEORY_TOTAL, ENGINE_THEORY_TOTAL)
  assert.equal(PRACTICAL_TOTAL, ENGINE_PRACTICAL_TOTAL)
})

test('a repeated student id is refused, naming both rows', () => {
  // Two students sharing an id used to load fine, and then the roster showed
  // both while clicking either opened the first one's trace, ticked both on
  // sign-off, and printed the first student's marksheet. Results are published
  // against the id, so it has to be unique.
  const data = clone()
  data.students = [data.students[0], { ...data.students[1], id: data.students[0].id }]

  const message = refusal(data)
  assert.ok(message, 'expected a duplicate id to be refused')
  assert.match(message, /repeats the student id/)
  assert.match(message, /students\[1\]/)
  assert.match(message, /students\[0\]/)
})

test('distinct ids are still accepted', () => {
  const data = clone()
  data.students = data.students.slice(0, 3)
  assert.equal(refusal(data), null)
})

test('a theory mark above the paper total is refused', () => {
  const data = clone()
  data.students = [{ ...data.students[0], marks: { ...data.students[0].marks, PHY: { theory: 900, practical: 20 } } }]
  assert.match(refusal(data) ?? '', /theory 900 is above the paper total of 75/)
})

test('a practical mark above the paper total is refused', () => {
  const data = clone()
  data.students = [{ ...data.students[0], marks: { ...data.students[0].marks, PHY: { theory: 60, practical: 500 } } }]
  assert.match(refusal(data) ?? '', /practical 500 is above the paper total of 25/)
})

test('a combined mark above 100 is refused', () => {
  // The case that motivated the check: a typed 840 for 84 scored grade point 5.0
  // and lifted the student to an A, with nothing anywhere reporting a problem.
  const data = clone()
  data.students = [{ ...data.students[0], marks: { ...data.students[0].marks, BAN: 9999 } }]
  assert.match(refusal(data) ?? '', /9999 is above the maximum of 100/)
})

test('a negative mark is refused', () => {
  const data = clone()
  data.students = [{ ...data.students[0], marks: { ...data.students[0].marks, BAN: -50 } }]
  assert.match(refusal(data) ?? '', /-50 is negative/)
})

test('the boundary marks are accepted', () => {
  // 75 + 25 and a bare 100 are legal and must not be caught by the range check.
  const data = clone()
  data.students = [
    {
      ...data.students[0],
      marks: { ...data.students[0].marks, PHY: { theory: THEORY_TOTAL, practical: PRACTICAL_TOTAL }, BAN: 100 },
    },
  ]
  assert.equal(refusal(data), null)
})

test('zero and AB are still accepted', () => {
  const data = clone()
  data.students = [
    { ...data.students[0], marks: { ...data.students[0].marks, BAN: 0, ENG: 'AB', PHY: { theory: 0, practical: 0 } } },
  ]
  assert.equal(refusal(data), null)
})

test('a case with the wrong number of compulsory subjects is refused', () => {
  // The engine divides by the constant six, not by however many subjects a case
  // lists, so the count is part of the rule rather than a property of the data.
  // Seven subjects each at grade point 3.0 summed to 21 and divided by 6 reported
  // GPA 3.67 and grade A- where the honest average is 3.00 and grade B.
  const data = clone()
  data.compulsory = ['BAN', 'ENG', 'MAT', 'PHY', 'CHE', 'BIO', 'HMT']
  assert.match(refusal(data) ?? '', /divisor is fixed at 6/)

  const short = clone()
  short.compulsory = ['BAN', 'ENG', 'MAT', 'PHY', 'CHE']
  assert.match(refusal(short) ?? '', /lists 5 subjects/)
})

test('the seed lists exactly the required number of compulsory subjects', () => {
  assert.equal(SEED.compulsory.length, COMPULSORY_COUNT)
})

test('a repeated compulsory subject is refused', () => {
  // Six entries, so the count check passes, but BAN is summed twice and BIO is
  // never graded: GPA 2.33 and grade C for a student whose six distinct subjects
  // average 1.67 and grade D.
  const data = clone()
  data.compulsory = ['BAN', 'BAN', 'ENG', 'MAT', 'PHY', 'CHE']
  assert.match(refusal(data) ?? '', /lists "BAN" twice/)
})

test('a repeated subject code is refused', () => {
  // Marks are keyed by code, so a second entry silently decides whether the
  // subject carries a practical part — which drives the part-pass checks.
  const data = clone()
  data.subjects = [...data.subjects, { code: 'BAN', name: 'Bangla Again', practical: true }]
  assert.match(refusal(data) ?? '', /lists "BAN" more than once/)
})
