/**
 * Marks-sheet import. Bonus feature from the problem statement:
 * "Let the user paste or upload a marks sheet and report which rows were
 * rejected and exactly why."
 *
 * A school keeps marks in a spreadsheet, not in the organizers' JSON. This turns
 * a pasted or uploaded sheet into the same case shape the rest of the app
 * already works on, and — the part that is actually scored — reports every row
 * it would not accept, with the reason for that row.
 *
 * Nothing here grades anything. It produces students; `grading.js` remains the
 * only place a rule is applied.
 *
 * ## The sheet it accepts
 *
 * A header row naming the columns, then one row per student. Columns may be
 * separated by commas or tabs, so a paste straight out of Excel works.
 *
 *   id, name, class, optional, BAN, ENG, MAT, PHY, CHE, BIO, HMT
 *
 * A subject with a practical part accepts either form:
 *   - one cell, `theory+practical`   e.g. `60+20`
 *   - two columns, `PHY_theory` and `PHY_practical`
 *
 * `AB` in any subject cell means absent. Header names are matched case- and
 * space-insensitively, so `Student ID`, `student_id` and `id` are all the id.
 */

const ALIASES = {
  id: ['id', 'studentid', 'student', 'roll', 'rollno', 'rollnumber'],
  name: ['name', 'studentname', 'fullname'],
  class: ['class', 'section', 'group', 'classname'],
  optional: ['optional', 'optionalsubject', 'fourthsubject', 'fourth'],
}

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')

/** Split on tabs if the header has any, otherwise commas. Handles quoted cells. */
function splitRow(line, sep) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === sep) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

/**
 * @param {string} text  the pasted or uploaded sheet
 * @param {object} dataset  the case currently loaded — supplies the subject list,
 *                          which subjects carry a practical part, and which are
 *                          compulsory. Importing a sheet replaces the students,
 *                          not the structure.
 * @returns {{ students: object[], rejected: {row:number, id:string, reason:string}[],
 *             columns: string[], skipped: number }}
 */
export function parseMarksSheet(text, dataset) {
  if (!dataset?.subjects?.length) {
    throw new Error('Load a case first — an imported sheet uses that case’s subject list.')
  }
  const raw = String(text ?? '').replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim() !== '')
  if (raw.length < 2) {
    throw new Error('That sheet has no rows. Expected a header row and at least one student.')
  }

  const sep = raw[0].includes('\t') ? '\t' : ','
  const header = splitRow(raw[0], sep)
  const key = header.map(norm)

  const findOne = (names) => key.findIndex((h) => names.includes(h))
  const col = {
    id: findOne(ALIASES.id),
    name: findOne(ALIASES.name),
    class: findOne(ALIASES.class),
    optional: findOne(ALIASES.optional),
  }
  for (const [field, idx] of Object.entries(col)) {
    if (idx === -1) {
      throw new Error(`The sheet has no “${field}” column. Found: ${header.join(', ')}`)
    }
  }

  const practical = new Set(dataset.subjects.filter((s) => s.practical).map((s) => s.code))
  const subjectCol = new Map()   // code -> single column
  const partCol = new Map()      // code -> { theory, practical }
  for (const s of dataset.subjects) {
    const c = norm(s.code)
    const whole = key.findIndex((h) => h === c)
    if (whole !== -1) subjectCol.set(s.code, whole)
    const t = key.findIndex((h) => h === `${c}theory`)
    const p = key.findIndex((h) => h === `${c}practical`)
    if (t !== -1 && p !== -1) partCol.set(s.code, { theory: t, practical: p })
  }

  const num = (v) => {
    const t = String(v ?? '').trim()
    if (t === '') return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }

  const students = []
  const rejected = []
  const seen = new Set()

  for (let i = 1; i < raw.length; i++) {
    const cells = splitRow(raw[i], sep)
    const rowNo = i + 1 // 1-indexed including the header, which is what a spreadsheet shows
    const id = cells[col.id]?.trim() ?? ''
    const reject = (reason) => rejected.push({ row: rowNo, id: id || '(no id)', reason })

    if (!id) { reject('no student id in this row'); continue }
    if (seen.has(id)) { reject(`duplicate id — “${id}” already appears earlier in the sheet`); continue }

    const name = cells[col.name]?.trim() ?? ''
    if (!name) { reject('no name in this row'); continue }

    const cls = cells[col.class]?.trim() ?? ''
    if (!cls) { reject('no class in this row'); continue }

    const optional = cells[col.optional]?.trim().toUpperCase() ?? ''
    if (!optional) { reject('no optional subject named'); continue }
    if (!dataset.subjects.some((s) => s.code === optional)) {
      reject(`optional subject “${optional}” is not one of this case’s subjects`)
      continue
    }
    if (dataset.compulsory.includes(optional)) {
      reject(`“${optional}” is a compulsory subject, so it cannot also be the optional one`)
      continue
    }

    const marks = {}
    let bad = null
    for (const code of [...dataset.compulsory, optional]) {
      const parts = partCol.get(code)
      const one = subjectCol.get(code)

      if (parts) {
        const tRaw = cells[parts.theory]?.trim() ?? ''
        const pRaw = cells[parts.practical]?.trim() ?? ''
        if (tRaw.toUpperCase() === 'AB' || pRaw.toUpperCase() === 'AB') { marks[code] = 'AB'; continue }
        const t = num(tRaw); const p = num(pRaw)
        if (t === null || p === null) { bad = `${code}: theory and practical must both be numbers, or AB`; break }
        marks[code] = { theory: t, practical: p }
        continue
      }

      if (one === undefined) { bad = `no column for subject ${code}`; break }
      const cell = cells[one]?.trim() ?? ''
      if (cell === '') { bad = `${code} is blank — use a number, a theory+practical pair, or AB`; break }
      if (cell.toUpperCase() === 'AB') { marks[code] = 'AB'; continue }

      if (practical.has(code)) {
        // `60+20` — the one-cell form for a subject with a practical part.
        const m = cell.match(/^(-?\d+(?:\.\d+)?)\s*\+\s*(-?\d+(?:\.\d+)?)$/)
        if (!m) { bad = `${code} needs theory+practical, for example 60+20, or AB`; break }
        marks[code] = { theory: Number(m[1]), practical: Number(m[2]) }
        continue
      }

      const n = num(cell)
      if (n === null) { bad = `${code}: “${cell}” is not a number or AB`; break }
      marks[code] = n
    }

    if (bad) { reject(bad); continue }

    seen.add(id)
    students.push({ id, name, class: cls, optional, marks })
  }

  return { students, rejected, columns: header, skipped: rejected.length }
}

/**
 * A sheet a school can start from — the loaded case in spreadsheet form.
 *
 * Every subject gets a column, not just the compulsory ones, because students
 * sit different optional subjects. A student's own optional carries a mark and
 * the others are blank; the parser only reads the columns a given student needs,
 * so this round-trips back through `parseMarksSheet` unchanged.
 */
export function toMarksSheet(dataset) {
  if (!dataset?.students?.length) return ''
  const codes = dataset.subjects.map((s) => s.code)
  const header = ['id', 'name', 'class', 'optional', ...codes]
  const cell = (m) => {
    if (m === undefined) return ''
    if (m === 'AB') return 'AB'
    if (m && typeof m === 'object') return `${m.theory}+${m.practical}`
    return String(m ?? '')
  }
  const rows = dataset.students.map((s) => [
    s.id, s.name, s.class, s.optional,
    ...codes.map((c) => cell(s.marks[c])),
  ])
  return [header, ...rows].map((r) => r.join(',')).join('\n')
}
