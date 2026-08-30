/**
 * Dataset loading, validation and description. Unit U1.
 *
 * The organizers' published fixture shape IS this application's data model. There
 * is no schema of our own and no mapping layer, because judges test with cases in
 * that shape which are not in the published pack — a translation layer is one more
 * thing that can be wrong about data we have never seen.
 *
 * A case looks like:
 *   { case_id, subjects: [{code, name, practical}], compulsory: [code],
 *     students: [{id, name, class, optional, marks: {code: Mark}}] }
 *   Mark = number | {theory, practical} | "AB"
 *
 * NOTE ON THE EDGE DETECTION BELOW. It deliberately does NOT compute grade points —
 * that is U2's engine in src/lib/grading.js and it must exist in exactly one place.
 * What it uses instead are the raw thresholds the problem statement itself states:
 * theory passes at 25, practical passes at 8, a subject fails below 33, and an
 * optional subject stops helping below 50 (the grade point for 40-49 is 2.0, and
 * the rule adds only the amount above 2.0). Those are facts about the data, not the
 * grading algorithm.
 */
// The import attribute keeps this module loadable by plain `node` as well as by
// Vite, so the pure functions below can be exercised without a browser.
import seed from '../data/seed-p08.json' with { type: 'json' }

export const THEORY_PASS_MARK = 25
export const PRACTICAL_PASS_MARK = 8
export const SUBJECT_FAIL_MARK = 33
/** Below this, the optional subject's grade point is 2.0 or less, so it adds nothing. */
export const OPTIONAL_HELPS_FROM_MARK = 50

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/** The total for one subject: a plain mark, or theory + practical. null when absent. */
export function subjectTotal(mark) {
  if (mark === 'AB') return null
  if (isObject(mark)) return (mark.theory ?? 0) + (mark.practical ?? 0)
  return typeof mark === 'number' ? mark : null
}

/** Raw-threshold failure test. Not a grade point — see the note at the top. */
function marksFail(mark) {
  if (mark === 'AB') return true
  if (isObject(mark)) {
    if (mark.theory < THEORY_PASS_MARK) return true
    if (mark.practical < PRACTICAL_PASS_MARK) return true
  }
  const total = subjectTotal(mark)
  return total === null || total < SUBJECT_FAIL_MARK
}

function isValidMark(mark) {
  if (mark === 'AB') return true
  if (typeof mark === 'number') return Number.isFinite(mark)
  return isObject(mark) && Number.isFinite(mark.theory) && Number.isFinite(mark.practical)
}

/**
 * Validate and normalise. Accepts either a bare case object or a whole fixture file
 * — a judge will paste the file they downloaded, not the object inside it — and in
 * the file case takes the first entry of `cases`.
 *
 * Throws an Error whose message names the field that is wrong. A message like
 * "students[3] is missing its `optional` subject" is worth more at 21:00 than a
 * stack trace.
 */
export function parseDataset(input) {
  let data = input
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      throw new Error('That is not valid JSON. Paste the contents of a case, or the whole fixture file.')
    }
  }
  if (!isObject(data)) throw new Error('Expected a JSON object.')

  // A whole fixture file: { schema_version, problem_id, format_note, cases: [...] }
  if (Array.isArray(data.cases)) {
    if (data.cases.length === 0) throw new Error('That fixture file has an empty `cases` list.')
    data = data.cases[0]
    if (!isObject(data)) throw new Error('The first entry of `cases` is not an object.')
  }

  if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
    throw new Error('Missing `subjects` — expected a list of {code, name, practical}.')
  }
  for (const [i, s] of data.subjects.entries()) {
    if (!isObject(s) || typeof s.code !== 'string' || typeof s.name !== 'string') {
      throw new Error(`subjects[${i}] needs a string \`code\` and \`name\`.`)
    }
  }

  if (!Array.isArray(data.compulsory) || data.compulsory.length === 0) {
    throw new Error('Missing `compulsory` — expected a list of subject codes.')
  }
  const codes = new Set(data.subjects.map((s) => s.code))
  for (const c of data.compulsory) {
    if (!codes.has(c)) throw new Error(`\`compulsory\` names "${c}", which is not in \`subjects\`.`)
  }

  if (!Array.isArray(data.students) || data.students.length === 0) {
    throw new Error('Missing `students` — expected a non-empty list.')
  }
  for (const [i, st] of data.students.entries()) {
    const where = `students[${i}]${st?.id ? ` (${st.id})` : ''}`
    if (!isObject(st)) throw new Error(`${where} is not an object.`)
    for (const f of ['id', 'name', 'class', 'optional']) {
      if (typeof st[f] !== 'string') throw new Error(`${where} is missing its \`${f}\`.`)
    }
    if (!codes.has(st.optional)) {
      throw new Error(`${where} names optional subject "${st.optional}", which is not in \`subjects\`.`)
    }
    if (!isObject(st.marks)) throw new Error(`${where} is missing its \`marks\`.`)
    for (const c of [...data.compulsory, st.optional]) {
      if (!(c in st.marks)) throw new Error(`${where} has no mark for "${c}".`)
      if (!isValidMark(st.marks[c])) {
        throw new Error(`${where} has an unreadable mark for "${c}" — expected a number, {theory, practical}, or "AB".`)
      }
    }
  }

  return {
    case_id: typeof data.case_id === 'string' ? data.case_id : 'untitled',
    subjects: data.subjects,
    compulsory: data.compulsory,
    students: data.students,
  }
}

export const SEED = parseDataset(seed)

/** Header counts. */
export function summarise(dataset) {
  if (!dataset) return { caseId: '—', students: 0, classes: [], subjects: 0, compulsory: 0 }
  const byClass = new Map()
  for (const s of dataset.students) byClass.set(s.class, (byClass.get(s.class) ?? 0) + 1)
  return {
    caseId: dataset.case_id,
    students: dataset.students.length,
    classes: [...byClass].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)),
    subjects: dataset.subjects.length,
    compulsory: dataset.compulsory.length,
  }
}

/**
 * The four hard edges required item 1 names, found in whatever data is loaded.
 * Never hard-coded: judges load cases we have not seen, and a named student who is
 * not in the roster is worse than no claim at all.
 *
 * Returns one representative per edge plus the full id list, and `covered`, the
 * number of distinct students sitting on at least one edge — the item asks for
 * eight.
 */
export function describeEdges(dataset) {
  const empty = { edges: [], covered: 0 }
  if (!dataset?.students?.length) return empty

  const nameOf = new Map(dataset.subjects.map((s) => [s.code, s.name]))
  const found = { strongAverage: [], practicalFail: [], optionalWeak: [], absent: [] }

  for (const st of dataset.students) {
    const m = st.marks

    if (Object.values(m).some((v) => v === 'AB')) {
      const code = Object.keys(m).find((c) => m[c] === 'AB')
      found.absent.push({ student: st, detail: `absent in ${nameOf.get(code) ?? code}` })
    }

    const pf = Object.keys(m).find(
      (c) => isObject(m[c]) && m[c].practical < PRACTICAL_PASS_MARK && m[c].theory >= THEORY_PASS_MARK,
    )
    if (pf) {
      found.practicalFail.push({
        student: st,
        detail: `${nameOf.get(pf) ?? pf}: theory ${m[pf].theory} passes, practical ${m[pf].practical} does not`,
      })
    }

    const om = m[st.optional]
    const optionalTotal = subjectTotal(om)
    if (om === 'AB' || marksFail(om) || (optionalTotal !== null && optionalTotal < OPTIONAL_HELPS_FROM_MARK)) {
      found.optionalWeak.push({
        student: st,
        detail:
          om === 'AB'
            ? `optional ${nameOf.get(st.optional) ?? st.optional} absent, so it adds nothing`
            : `optional ${nameOf.get(st.optional) ?? st.optional} at ${optionalTotal}, below the mark where it starts helping`,
      })
    }

    const failed = dataset.compulsory.filter((c) => marksFail(m[c]))
    const totals = dataset.compulsory.map((c) => subjectTotal(m[c])).filter((t) => t !== null)
    const average = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0
    if (failed.length && average >= 60) {
      found.strongAverage.push({
        student: st,
        detail: `averages ${average.toFixed(1)} but fails ${failed.map((c) => nameOf.get(c) ?? c).join(', ')}`,
      })
    }
  }

  const edges = [
    { key: 'strongAverage', label: 'Failed subject, strong average', hits: found.strongAverage },
    { key: 'practicalFail', label: 'Practical fail, theory passed', hits: found.practicalFail },
    { key: 'optionalWeak', label: 'Optional below where it helps', hits: found.optionalWeak },
    { key: 'absent', label: 'Absent in a subject', hits: found.absent },
  ].map((e) => ({ ...e, count: e.hits.length, first: e.hits[0] ?? null }))

  const covered = new Set(edges.flatMap((e) => e.hits.map((h) => h.student.id))).size
  return { edges, covered }
}
