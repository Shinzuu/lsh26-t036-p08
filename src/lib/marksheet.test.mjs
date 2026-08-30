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
