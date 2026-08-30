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

// The paper totals, for range-checking marks on the way in. Declared here rather
// than imported from `grading.js` on purpose: this module validates data before
// any rule is applied, and importing the engine to validate its own input would
// tie U1's loader to U2's module graph. The two must agree — R-11 fixes both —
// so `dataset.test.mjs` asserts they do.
export const THEORY_TOTAL = 75
export const PRACTICAL_TOTAL = 25

/** R-13: six compulsory subjects, and the GPA divisor is fixed at six. */
export const COMPULSORY_COUNT = 6
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

/**
 * The marks a paper can actually carry. R-11 fixes theory out of 75 and practical
 * out of 25, so a single combined mark cannot exceed 100 and no part can be
 * negative.
 *
 * Range is checked, not just readability, because this app exists to catch a
 * wrong entry before results are published and the unchecked version did the
 * opposite: `{theory: 900, practical: 500}` and a bare `9999` were both accepted
 * and both scored grade point 5.0, turning a typed 840 into an A+ instead of an
 * error. Across all 25 published cases single marks run 0–100, theory 6–75 and
 * practical 1–25, so every case a judge can load passes these bounds untouched.
 *
 * Exported because the marks-sheet importer applies the same rule per row. It
 * bypasses `parseDataset` entirely — it builds students and hands them straight
 * to the store — so without sharing this the spreadsheet path, which is the one a
 * school actually types into, would keep accepting the typo the JSON path had
 * just started refusing.
 *
 * @returns {string|null} what is wrong with the mark, or null if it is legal.
 */
const MAX_SINGLE_MARK = THEORY_TOTAL + PRACTICAL_TOTAL

export function markProblem(mark) {
  if (mark === 'AB') return null

  if (typeof mark === 'number') {
    if (!Number.isFinite(mark)) return 'expected a number, {theory, practical}, or "AB"'
    if (mark < 0) return `${mark} is negative`
    if (mark > MAX_SINGLE_MARK) return `${mark} is above the maximum of ${MAX_SINGLE_MARK}`
    return null
  }

  if (!isObject(mark) || !Number.isFinite(mark.theory) || !Number.isFinite(mark.practical)) {
    return 'expected a number, {theory, practical}, or "AB"'
  }
  if (mark.theory < 0) return `theory ${mark.theory} is negative`
  if (mark.practical < 0) return `practical ${mark.practical} is negative`
  if (mark.theory > THEORY_TOTAL) return `theory ${mark.theory} is above the paper total of ${THEORY_TOTAL}`
  if (mark.practical > PRACTICAL_TOTAL) {
    return `practical ${mark.practical} is above the paper total of ${PRACTICAL_TOTAL}`
  }
  return null
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
  // R-13 fixes the divisor at six, and the engine divides by the constant rather
  // than by however many subjects a case happens to list. So the count is part of
  // the rule, not a property of the data, and a case that disagrees produces a
  // number that is not the average of anything: seven compulsory subjects each at
  // grade point 3.0 summed to 21 and divided by 6 reported GPA 3.67 and grade A-,
  // where the honest average is 3.00 and grade B — a whole band out, with the
  // trace still captioned "Six compulsory grade points" above a list of seven.
  // Every one of the 25 published cases lists exactly six.
  if (data.compulsory.length !== COMPULSORY_COUNT) {
    throw new Error(
      `\`compulsory\` lists ${data.compulsory.length} subjects, but a GPA is always six compulsory subjects plus one optional — the divisor is fixed at ${COMPULSORY_COUNT}, so a case with a different count cannot be graded.`,
    )
  }
  // A repeated subject code makes `subjects` ambiguous: marks are keyed by code,
  // so the second entry silently decides whether the subject carries a practical
  // part, which is what determines the theory/practical pass checks.
  const codes = new Set()
  for (const s of data.subjects) {
    if (codes.has(s.code)) {
      throw new Error(`\`subjects\` lists "${s.code}" more than once. Each subject code appears once.`)
    }
    codes.add(s.code)
  }
  // Uniqueness matters more than it looks. `compulsoryPoints` sums across this
  // list, so a repeat is counted twice and whichever subject it displaced is
  // never graded at all — and the length check above still passes.
  // `['BAN','BAN','ENG','MAT','PHY','CHE']` reported GPA 2.33 and grade C for a
  // student whose six distinct subjects average 1.67 and grade D.
  const seenCompulsory = new Set()
  for (const c of data.compulsory) {
    if (!codes.has(c)) throw new Error(`\`compulsory\` names "${c}", which is not in \`subjects\`.`)
    if (seenCompulsory.has(c)) {
      throw new Error(`\`compulsory\` lists "${c}" twice. The six compulsory subjects must be six different subjects.`)
    }
    seenCompulsory.add(c)
  }

  if (!Array.isArray(data.students) || data.students.length === 0) {
    throw new Error('Missing `students` — expected a non-empty list.')
  }
  // Student ids must be unique, and this is a correctness rule rather than
  // tidiness. Everything downstream identifies a student by id: the store
  // resolves the selection with `results.find(r => r.id === selectedId)`, the
  // sign-off desk keys its verified set by id, and the checking lists dedupe by
  // id. With two students sharing one id the roster shows both rows, but
  // clicking the second opens the first one's trace, highlights both rows, ticks
  // both on sign-off, and prints the first student's marksheet under the second
  // student's click — a school would hand a pupil someone else's result.
  //
  // The marks-sheet importer already refuses a repeated id ("duplicate id — …
  // already appears earlier in the sheet"). This is the same rule on the JSON
  // path, which had been left open. No published case repeats an id, so nothing
  // a judge loads is affected.
  const seenIds = new Map()

  for (const [i, st] of data.students.entries()) {
    const where = `students[${i}]${st?.id ? ` (${st.id})` : ''}`
    if (!isObject(st)) throw new Error(`${where} is not an object.`)
    for (const f of ['id', 'name', 'class', 'optional']) {
      if (typeof st[f] !== 'string') throw new Error(`${where} is missing its \`${f}\`.`)
    }
    if (!codes.has(st.optional)) {
      throw new Error(`${where} names optional subject "${st.optional}", which is not in \`subjects\`.`)
    }
    // The optional is a *fourth* subject, so it cannot also be one of the six
    // compulsory ones. Without this the same grade point is counted twice — once
    // inside compulsoryPoints and again as the optional bonus — and the GPA comes
    // out high with no warning anywhere (T2-01, found by Robiul).
    if (data.compulsory.includes(st.optional)) {
      throw new Error(`${where} names "${st.optional}" as its optional subject, but that is a compulsory subject. The optional must be a fourth subject.`)
    }
    if (seenIds.has(st.id)) {
      throw new Error(
        `${where} repeats the student id "${st.id}", which students[${seenIds.get(st.id)}] already uses. Every student needs their own id — results are published against it.`,
      )
    }
    seenIds.set(st.id, i)

    if (!isObject(st.marks)) throw new Error(`${where} is missing its \`marks\`.`)
    for (const c of [...data.compulsory, st.optional]) {
      if (!(c in st.marks)) throw new Error(`${where} has no mark for "${c}".`)
      const problem = markProblem(st.marks[c])
      if (problem) {
        throw new Error(`${where} has an impossible mark for "${c}" — ${problem}.`)
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
