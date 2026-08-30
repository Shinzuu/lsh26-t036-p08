/**
 * T2 — the grading rules and their boundaries, as runnable cases.
 *
 * The evidence behind `qa/T2-findings.md`, so every claim in that file can be
 * re-run instead of believed. Robiul, testing round, P08.
 *
 * These are QA cases, not U2's unit suite — `src/lib/grading.test.mjs` is U2's
 * file and is untouched here. This one exercises the same engine from the
 * outside, against the hand-built QA-BOUNDARY case and the published data.
 *
 *   node --test qa/T2-cases.mjs
 *
 * The three cases that are not PUB-01 need the organizers' fixture, which lives
 * in the prep repo rather than in this one. Point at it to include them, or
 * leave it unset and those two tests skip:
 *
 *   P08_FIXTURE=/path/to/P08_school_results_public.json node --test qa/T2-cases.mjs
 *
 * Sections map to the T2 pack: A the boundary table, B the letter-band edges,
 * C the published cases, D the probes behind the four findings.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { studentResult, subjectResult, checkingLists } from '../src/lib/grading.js'
import { parseDataset } from '../src/lib/dataset.js'
import seed from '../src/data/seed-p08.json' with { type: 'json' }

/** The hand-built boundary case: 22 students, each sitting exactly on one rule edge. */
const BOUNDARY = {"case_id":"QA-BOUNDARY","subjects":[{"code":"BAN","name":"Bangla","practical":false},{"code":"ENG","name":"English","practical":false},{"code":"MAT","name":"Mathematics","practical":false},{"code":"PHY","name":"Physics","practical":true},{"code":"CHE","name":"Chemistry","practical":true},{"code":"BIO","name":"Biology","practical":true},{"code":"REL","name":"Religion","practical":false}],"compulsory":["BAN","ENG","MAT","PHY","CHE","BIO"],"students":[{"id":"B01","name":"Band 80","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":80}},{"id":"B02","name":"Band 79","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":79}},{"id":"B03","name":"Band 70","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":70}},{"id":"B04","name":"Band 69","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":69}},{"id":"B05","name":"Band 60","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":60}},{"id":"B06","name":"Band 59","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":59}},{"id":"B07","name":"Band 50","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":50}},{"id":"B08","name":"Band 49","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":49}},{"id":"B09","name":"Band 40","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":40}},{"id":"B10","name":"Band 39","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":39}},{"id":"B11","name":"Band 33","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":33}},{"id":"B12","name":"Band 32","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":32}},{"id":"P01","name":"Practical 1","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":25,"practical":8},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":70}},{"id":"P02","name":"Practical 2","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":24,"practical":25},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":70}},{"id":"P03","name":"Practical 3","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":75,"practical":7},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":70}},{"id":"P04","name":"Practical 4","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":75,"practical":25},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":45,"BAN":70}},{"id":"A01","name":"Absent BIO","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":"AB","REL":45,"BAN":70}},{"id":"A02","name":"Absent REL","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":"AB","BAN":70}},{"id":"O01","name":"Optional 49","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":49,"BAN":70}},{"id":"O02","name":"Optional 50","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":50,"BAN":70}},{"id":"O03","name":"Optional 80","class":"Class 9","optional":"REL","marks":{"ENG":70,"MAT":70,"PHY":{"theory":50,"practical":20},"CHE":{"theory":50,"practical":20},"BIO":{"theory":50,"practical":20},"REL":80,"BAN":70}},{"id":"C01","name":"Cap test","class":"Class 9","optional":"REL","marks":{"BAN":100,"ENG":100,"MAT":100,"PHY":{"theory":75,"practical":25},"CHE":{"theory":75,"practical":25},"BIO":{"theory":75,"practical":25},"REL":100}}]}

const PUB01 = parseDataset(structuredClone(seed))
const of = (ds, id) => ds.students.find((s) => s.id === id)
const result = (ds, id) => studentResult(of(ds, id), ds)
const gpa = (r) => r.gpa.toFixed(2)

// ---------------------------------------------------------------------------
// A. The boundary table. Expected values were computed from the clarifications
//    by hand first, then compared with the engine — not read off the screen.
//
//    Every student holds the other six subjects constant, so only the named
//    input moves the answer.
// ---------------------------------------------------------------------------

/** [id, subject under test, its expected grade point, expected GPA, expected letter, why] */
const BOUNDARY_TABLE = [
  ['B01', 'BAN', 5.0, '4.17', 'A', 'mark 80 — the top band opens at exactly 80'],
  ['B02', 'BAN', 4.0, '4.00', 'A', 'mark 79 — one below, so 4.0'],
  ['B03', 'BAN', 4.0, '4.00', 'A', 'mark 70 — the 70-79 band opens at exactly 70'],
  ['B04', 'BAN', 3.5, '3.92', 'A-', 'mark 69'],
  ['B05', 'BAN', 3.5, '3.92', 'A-', 'mark 60 — band opens at exactly 60'],
  ['B06', 'BAN', 3.0, '3.83', 'A-', 'mark 59'],
  ['B07', 'BAN', 3.0, '3.83', 'A-', 'mark 50 — band opens at exactly 50'],
  ['B08', 'BAN', 2.0, '3.67', 'A-', 'mark 49'],
  ['B09', 'BAN', 2.0, '3.67', 'A-', 'mark 40 — band opens at exactly 40'],
  ['B10', 'BAN', 1.0, '3.50', 'A-', 'mark 39'],
  ['B11', 'BAN', 1.0, '3.50', 'A-', 'mark 33 — the pass mark itself'],
  ['B12', 'BAN', 0.0, '0.00', 'F', 'mark 32 — one below 33, fails and cancels the average'],
  ['P01', 'PHY', 1.0, '3.50', 'A-', 'theory 25 and practical 8: both exactly pass'],
  ['P02', 'PHY', 0.0, '0.00', 'F', 'theory 24 is one below the pass mark'],
  ['P03', 'PHY', 0.0, '0.00', 'F', 'practical 7 fails the subject on a total of 82'],
  ['P04', 'PHY', 5.0, '4.17', 'A', 'theory 75 and practical 25, total 100'],
  ['A01', 'BIO', 0.0, '0.00', 'F', 'absent in a compulsory subject'],
  ['A02', 'REL', 0.0, '4.00', 'A', 'absent in the optional — does not fail the student'],
  ['O01', 'REL', 2.0, '4.00', 'A', 'optional grade point exactly 2.0 adds nothing'],
  ['O02', 'REL', 3.0, '4.17', 'A', 'optional 3.0 adds 1.0'],
  ['O03', 'REL', 5.0, '4.50', 'A', 'optional 5.0 adds 3.0'],
  ['C01', null, null, '5.00', 'A+', 'every mark at maximum: (30 + 3) / 6 = 5.5, capped'],
]

for (const [id, code, expectedGp, expectedGpa, expectedLetter, why] of BOUNDARY_TABLE) {
  test(`A · ${id} — ${why}`, () => {
    const r = result(BOUNDARY, id)
    if (code !== null) {
      assert.equal(r.subjects[code].gradePoint, expectedGp, `${id} ${code} grade point`)
    }
    assert.equal(gpa(r), expectedGpa, `${id} GPA`)
    assert.equal(r.letter, expectedLetter, `${id} letter`)
  })
}

test('A · B12 keeps its other five compulsory points and its uncancelled average (R-13)', () => {
  const r = result(BOUNDARY, 'B12')
  assert.equal(gpa(r), '0.00')
  assert.deepEqual(r.failedCompulsory, ['BAN'])
  // The clarification requires the uncancelled average to stay visible in the trace,
  // so a zeroed GPA must not zero the working behind it.
  assert.equal(r.uncancelledGpa.toFixed(2), '3.33')
  assert.equal(r.compulsoryPoints, 20)
  for (const code of ['ENG', 'MAT', 'PHY', 'CHE', 'BIO']) {
    assert.equal(r.subjects[code].gradePoint, 4, `${code} should keep its 4.0`)
  }
})

test('A · P03 fails on the practical despite a total of 82', () => {
  const r = result(BOUNDARY, 'P03')
  assert.equal(r.subjects.PHY.mark, 82, 'the total really is 82')
  assert.equal(r.subjects.PHY.gradePoint, 0, 'but the part rule outranks the band')
  assert.equal(r.subjects.PHY.rule, 'practical 7 is below the pass mark of 8')
  assert.equal(gpa(r), '0.00')
})

test('A · an optional at exactly 2.0 and an absent optional give the same GPA', () => {
  // Both contribute max(0, gp - 2) = 0, so O01 and A02 must land in the same place.
  assert.equal(result(BOUNDARY, 'O01').gpa, result(BOUNDARY, 'A02').gpa)
  assert.equal(gpa(result(BOUNDARY, 'O01')), '4.00')
})

test('A · nothing in the case exceeds the 5.00 cap', () => {
  for (const s of BOUNDARY.students) {
    const r = studentResult(s, BOUNDARY)
    assert.ok(r.gpa <= 5, `${s.id} gpa ${r.gpa}`)
    assert.ok(r.uncancelledGpa <= 5, `${s.id} uncancelled ${r.uncancelledGpa}`)
  }
})

test('A · each rule sentence names the band using this student’s real number', () => {
  assert.equal(result(BOUNDARY, 'B01').subjects.BAN.rule, 'mark 80 is 80 or above')
  assert.equal(result(BOUNDARY, 'B02').subjects.BAN.rule, 'mark 79 is in 70–79')
  assert.equal(result(BOUNDARY, 'B12').subjects.BAN.rule, 'mark 32 is below 33')
  assert.equal(result(BOUNDARY, 'A01').subjects.BIO.rule, 'absent — AB, grade point 0')
  assert.equal(result(BOUNDARY, 'P02').subjects.PHY.rule, 'theory 24 is below the pass mark of 25')
})

// ---------------------------------------------------------------------------
// B. Letter-band edges — where an off-by-one would live.
// ---------------------------------------------------------------------------

test('B · the pairs either side of a band edge read identically', () => {
  assert.equal(gpa(result(BOUNDARY, 'B02')), gpa(result(BOUNDARY, 'B03')), '4.00 pair')
  assert.equal(gpa(result(BOUNDARY, 'B10')), gpa(result(BOUNDARY, 'B11')), '3.50 pair')
  assert.equal(result(BOUNDARY, 'B02').letter, 'A')
  assert.equal(result(BOUNDARY, 'B10').letter, 'A-')
  assert.equal(result(BOUNDARY, 'B04').letter, 'A-', '3.92 is A-, not A')
})

/**
 * R-10 written out again from the clarification text, independently of the engine.
 * Comparing two implementations catches a shared-assumption error that re-reading
 * one of them would not.
 */
function letterFromRules(value, hasCompulsoryFail) {
  if (hasCompulsoryFail) return 'F'
  if (value === 5.0) return 'A+'
  if (value >= 4.0 && value <= 4.99) return 'A'
  if (value >= 3.5 && value <= 3.99) return 'A-'
  if (value >= 3.0 && value <= 3.49) return 'B'
  if (value >= 2.0 && value <= 2.99) return 'C'
  if (value >= 1.0 && value <= 1.99) return 'D'
  return 'F'
}

test('B · GPA and letter never disagree, and every GPA has two decimals', () => {
  for (const ds of [BOUNDARY, PUB01]) {
    for (const s of ds.students) {
      const r = studentResult(s, ds)
      assert.equal(
        r.letter,
        letterFromRules(r.gpa, r.failedCompulsory.length > 0),
        `${ds.case_id}/${r.id} gpa ${r.gpa} letter ${r.letter}`,
      )
      assert.match(r.gpa.toFixed(2), /^\d+\.\d{2}$/)
    }
  }
})

// ---------------------------------------------------------------------------
// C. The published data. PUB-01 is bundled as the seed, so these always run.
// ---------------------------------------------------------------------------

test('C · PUB-01 is 80 students, 59 passing and 21 failing, and they add up', () => {
  const rows = PUB01.students.map((s) => studentResult(s, PUB01))
  const failing = rows.filter((r) => r.failedCompulsory.length > 0).length
  assert.equal(rows.length, 80)
  assert.equal(failing, 21)
  assert.equal(rows.length - failing, 59)
})

/**
 * Hand-computed from the raw fixture marks with the rules in front of me, then
 * compared. The arithmetic is written out in `qa/T2-findings.md`; these are its
 * answers.
 */
const HAND_CHECKED = [
  ['S003', '5.00', 'A+', '5.00', 'straight high marks, (29 + 3) / 6 = 5.3333, capped'],
  ['S011', '0.00', 'F', '3.83', 'PHY 60+5 — practical 5 fails an otherwise 3.83 student'],
  ['S032', '0.00', 'F', '2.83', 'BIO absent'],
  ['S001', '4.58', 'A', '4.58', 'clean pass, (25.5 + 2) / 6'],
  ['S045', '4.67', 'A', '4.67', 'REL absent, but the optional cannot fail a student'],
]

for (const [id, expectedGpa, expectedLetter, expectedUncancelled, why] of HAND_CHECKED) {
  test(`C · PUB-01 ${id} — ${why}`, () => {
    const r = result(PUB01, id)
    assert.equal(gpa(r), expectedGpa)
    assert.equal(r.letter, expectedLetter)
    assert.equal(r.uncancelledGpa.toFixed(2), expectedUncancelled)
  })
}

// The rest of the published pack, when the fixture is reachable.
const FIXTURE = process.env.P08_FIXTURE ?? ''
const havePack = FIXTURE !== '' && existsSync(FIXTURE)
const skipReason = havePack
  ? false
  : 'set P08_FIXTURE to the pack’s P08_school_results_public.json to run this'

test('C · one hand-checked student each from PUB-09, PUB-14 and PUB-22', { skip: skipReason }, () => {
  const pack = JSON.parse(readFileSync(FIXTURE, 'utf8'))
  const pick = (cid) => pack.cases.find((c) => c.case_id === cid)
  const checks = [
    ['PUB-09', 'S007', '0.00', 'F', '4.67'], // CHE theory 24 fails an A-average student
    ['PUB-14', 'S012', '0.00', 'F', '2.00'], // BIO practical 5 fails
    ['PUB-22', 'S030', '5.00', 'A+', '5.00'], // (27.5 + 3) / 6 = 5.0833, capped
  ]
  for (const [cid, sid, expectedGpa, expectedLetter, expectedUncancelled] of checks) {
    const ds = pick(cid)
    const r = result(ds, sid)
    assert.equal(gpa(r), expectedGpa, `${cid}/${sid} gpa`)
    assert.equal(r.letter, expectedLetter, `${cid}/${sid} letter`)
    assert.equal(r.uncancelledGpa.toFixed(2), expectedUncancelled, `${cid}/${sid} uncancelled`)
  }
})

test('C · letter agrees with GPA for every student in all 25 published cases', { skip: skipReason }, () => {
  const pack = JSON.parse(readFileSync(FIXTURE, 'utf8'))
  let seen = 0
  for (const ds of pack.cases) {
    for (const s of ds.students) {
      const r = studentResult(s, ds)
      seen++
      assert.equal(
        r.letter,
        letterFromRules(r.gpa, r.failedCompulsory.length > 0),
        `${ds.case_id}/${r.id}`,
      )
    }
  }
  assert.equal(seen, 1765, 'the pack should hold 1,765 students')
})

// ---------------------------------------------------------------------------
// D. The probes behind the findings. These assert CURRENT behaviour, so if one
//    starts failing, the finding it documents has been fixed — update the file.
// ---------------------------------------------------------------------------

/** A case whose student scores exactly 4.0 in all six compulsory subjects. */
function flatCase(overrides = {}, mutate = (c) => c) {
  return mutate({
    case_id: 'PROBE',
    subjects: [
      { code: 'BAN', name: 'Bangla', practical: false },
      { code: 'ENG', name: 'English', practical: false },
      { code: 'MAT', name: 'Mathematics', practical: false },
      { code: 'PHY', name: 'Physics', practical: true },
      { code: 'CHE', name: 'Chemistry', practical: true },
      { code: 'BIO', name: 'Biology', practical: true },
      { code: 'REL', name: 'Religion', practical: false },
    ],
    compulsory: ['BAN', 'ENG', 'MAT', 'PHY', 'CHE', 'BIO'],
    students: [{
      id: 'X1',
      name: 'Probe',
      class: 'Class 9',
      optional: 'REL',
      marks: {
        BAN: 70,
        ENG: 70,
        MAT: 70,
        PHY: { theory: 50, practical: 20 },
        CHE: { theory: 50, practical: 20 },
        BIO: { theory: 50, practical: 20 },
        REL: 45,
        ...overrides,
      },
    }],
  })
}

test('D · [T2-01, FIXED] an optional that is also compulsory is now refused at the door', () => {
  const ds = flatCase({}, (c) => {
    c.students[0].optional = 'MAT'
    return c
  })
  // Was: parseDataset accepted this and the grade point was counted twice — once in
  // compulsoryPoints and again as the optional bonus — so six subjects at 4.0 read
  // 4.33 instead of 4.00, with no warning anywhere. Fixed in triage at 20:03.
  assert.throws(
    () => parseDataset(structuredClone(ds)),
    /names "MAT" as its optional subject, but that is a compulsory subject/,
    'the case must be refused with a message naming the subject',
  )

  // The engine itself is unchanged and still counts what it is given, which is why
  // the guard belongs in parseDataset: nothing malformed can now reach this path.
  const r = studentResult(ds.students[0], ds)
  assert.equal(gpa(r), '4.33', 'unreachable through the UI now, kept as the record of why')
})

test('D · [T2-01, FIXED] the guard does not reject any legitimate case', () => {
  // The fix would be worse than the bug if it refused real data, so: every published
  // case must still parse, and a normal optional must still be accepted.
  assert.doesNotThrow(() => parseDataset(structuredClone(BOUNDARY)))
  assert.doesNotThrow(() => parseDataset(structuredClone(flatCase())))
  if (havePack) {
    const pack = JSON.parse(readFileSync(FIXTURE, 'utf8'))
    for (const ds of pack.cases) {
      assert.doesNotThrow(() => parseDataset(structuredClone(ds)), `${ds.case_id} must still parse`)
    }
    assert.equal(pack.cases.length, 25)
  }
})

test('D · [T2-02] the practical-fail flag fires where the practical rule was not applied', () => {
  // BAN is declared practical:false, so the part rule correctly does not apply...
  const ds = flatCase({ BAN: { theory: 60, practical: 5 } })
  const r = studentResult(ds.students[0], ds)
  assert.equal(r.subjects.BAN.gradePoint, 3.5, 'graded on the total, 65')
  assert.equal(r.subjects.BAN.rule, 'mark 65 is in 60–69')
  assert.deepEqual(r.failedCompulsory, [], 'nothing failed')
  // ...but the flag reads any practical part below 8, so the checking list disagrees.
  assert.equal(r.flags.practicalFail, true)
  assert.equal(checkingLists([r]).practicalFail.length, 1)
})

test('D · [T2-03] the pass marks pass at exactly 25 and exactly 8', () => {
  // Correct today, but U2's suite only asserts the failing side (24, 7 and below),
  // so this is the boundary a `<` that should be `<=` would slip through.
  assert.equal(subjectResult({ theory: 25, practical: 8 }, true).gradePoint, 1)
  assert.equal(subjectResult({ theory: 25, practical: 8 }, true).failed, false)
  assert.equal(subjectResult({ theory: 24, practical: 25 }, true).gradePoint, 0)
  assert.equal(subjectResult({ theory: 75, practical: 7 }, true).gradePoint, 0)
})

test('D · absent and a scored zero never render the same', () => {
  const absent = subjectResult('AB', false)
  const zero = subjectResult(0, false)
  assert.equal(absent.mark, null, 'absent carries no number at all')
  assert.equal(zero.mark, 0, 'a real zero carries the zero')
  assert.equal(absent.absent, true)
  assert.equal(zero.absent, false)
  assert.notEqual(absent.rule, zero.rule)
})

test('D · marks outside their stated ranges compute rather than crash (known, accepted)', () => {
  const over = flatCase({ BAN: 101 })
  assert.equal(gpa(studentResult(over.students[0], over)), '4.17')
  const under = flatCase({ BAN: -5 })
  assert.equal(gpa(studentResult(under.students[0], under)), '0.00')
  const parts = flatCase({ PHY: { theory: 80, practical: 30 } })
  assert.equal(studentResult(parts.students[0], parts).subjects.PHY.gradePoint, 5)
})

test('D · a practical subject given as one number skips the part checks (deliberate)', () => {
  const ds = flatCase({ PHY: 30 })
  const r = studentResult(ds.students[0], ds)
  assert.equal(r.subjects.PHY.rule, 'mark 30 is below 33', 'graded on the band, no invented parts')
})

test('D · a subject failing both parts names the practical first (documented in NOTES.md)', () => {
  assert.equal(
    subjectResult({ theory: 20, practical: 5 }, true).rule,
    'practical 5 is below the pass mark of 8',
  )
})
