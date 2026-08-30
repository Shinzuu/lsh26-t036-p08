/**
 * Marks-sheet round-trip tests.
 *
 * The downloaded template is meant to go into a spreadsheet, get edited, and come
 * back. It did not survive a comma: the writer emitted bare cells, so a name like
 * `Rahman, Md. Kamal` shifted every column after it and the student was dropped on
 * re-import with a reason about a subject.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { SEED } from './dataset.js'
import { toMarksSheet, parseMarksSheet } from './marksheet.js'

const clone = () => JSON.parse(JSON.stringify(SEED))

test('a name containing a comma survives the round trip', () => {
  const ds = clone()
  ds.students[0].name = 'Rahman, Md. Kamal'
  const back = parseMarksSheet(toMarksSheet(ds), ds)
  assert.deepEqual(back.rejected, [])
  assert.equal(back.students[0].name, 'Rahman, Md. Kamal')
  assert.equal(back.students.length, ds.students.length)
})

test('a name containing quotes survives the round trip', () => {
  const ds = clone()
  ds.students[0].name = 'She said "hi"'
  const back = parseMarksSheet(toMarksSheet(ds), ds)
  assert.deepEqual(back.rejected, [])
  assert.equal(back.students[0].name, 'She said "hi"')
})

test('every seeded student round-trips with marks intact', () => {
  const ds = clone()
  const back = parseMarksSheet(toMarksSheet(ds), ds)
  assert.equal(back.rejected.length, 0)
  assert.equal(back.students.length, 80)
  assert.deepEqual(back.students[0].marks, ds.students[0].marks)
})

test('a formula-looking cell is neutralised on the way out', () => {
  const ds = clone()
  ds.students[0].name = '=cmd|calc'
  const sheet = toMarksSheet(ds)
  assert.match(sheet.split('\n')[1], /,'=cmd\|calc,/)
})

test('a row with an impossible mark is rejected, naming the subject', () => {
  // The importer builds students and hands them to the store without going
  // through `parseDataset`, so the range rule has to be applied here too. It was
  // not, and `840` typed for `84` imported cleanly and graded A+ while the same
  // case pasted as JSON was refused.
  const ds = clone()
  const sheet = [
    'id,name,class,optional,BAN,ENG,MAT,PHY,CHE,BIO,AGR',
    'S900,Typo Student,Class 9,AGR,840,60,60,60+20,60+20,60+20,60+20',
    'S901,Bad Parts,Class 9,AGR,80,60,60,900+500,60+20,60+20,60+20',
    'S902,Negative,Class 9,AGR,-50,60,60,60+20,60+20,60+20,60+20',
  ].join('\n')

  const { students, rejected } = parseMarksSheet(sheet, ds)
  assert.equal(students.length, 0)
  assert.equal(rejected.length, 3)
  assert.match(rejected[0].reason, /BAN.*840 is above the maximum of 100/)
  assert.match(rejected[1].reason, /PHY.*theory 900 is above the paper total of 75/)
  assert.match(rejected[2].reason, /BAN.*-50 is negative/)
})

test('legal and boundary marks still import', () => {
  const ds = clone()
  const sheet = [
    'id,name,class,optional,BAN,ENG,MAT,PHY,CHE,BIO,AGR',
    'S903,Good Student,Class 9,AGR,80,60,60,60+20,60+20,60+20,60+20',
    'S904,Boundary,Class 9,AGR,100,60,60,75+25,60+20,60+20,60+20',
    'S905,Absent,Class 9,AGR,AB,60,60,60+20,60+20,60+20,60+20',
  ].join('\n')

  const { students, rejected } = parseMarksSheet(sheet, ds)
  assert.deepEqual(rejected, [])
  assert.equal(students.length, 3)
})
