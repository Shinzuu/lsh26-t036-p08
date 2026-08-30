/**
 * The printed marksheet. INTEGRATOR-OWNED.
 *
 * WHY THIS EXISTS. Printing used to emit the trace, which is the wrong document.
 * The trace is a diagnostic: it exists to show a judge, or a teacher handling a
 * query, which rule decided each number — "mark 32 is below 33", "optional adds
 * only what is above 2.0", the divisor, the cap. That reasoning is the right
 * answer to "why is this result what it is" and the wrong answer to "give the
 * student their result". Printing it produced a web page on paper.
 *
 * A school hands out a statement of marks: who the student is, what they scored
 * in each subject, the grade point and letter that follows, the GPA, whether
 * they passed, and room for the two signatures that make it official. No working,
 * no rule text, no interface.
 *
 * So the two are separate documents from separate components. The trace stays on
 * screen unchanged — it is required item 3 and nothing here touches it — and this
 * renders only on paper.
 *
 * It reads the same `studentResult` the rest of the app does. Nothing is
 * recomputed here beyond arranging it: a marksheet that disagreed with the trace
 * beside it would be worse than no marksheet.
 */
import { useEffect, useState } from 'react'
import { letterGrade } from '../lib/grading.js'
import { useDataset, useSelected } from '../lib/store.js'

/**
 * The issuing institution, remembered between visits.
 *
 * The marks file carries a case id and nothing about the school — the organizers'
 * fixtures have no such field and inventing one would put a name on a document
 * that never had it. So the office types it once and it is kept locally. Unset,
 * the sheet simply omits the line and prints under its title, which is what a
 * school printing onto its own letterhead would want anyway.
 */
const SCHOOL_KEY = 'p08.school.v1'

export function useSchoolName() {
  const [name, setName] = useState('')

  useEffect(() => {
    try {
      setName(localStorage.getItem(SCHOOL_KEY) ?? '')
    } catch {
      /* storage unavailable — the sheet just prints without the line */
    }
  }, [])

  const save = (next) => {
    setName(next)
    try {
      localStorage.setItem(SCHOOL_KEY, next)
    } catch {
      /* nothing to do; the name still applies for this session */
    }
  }

  return [name, save]
}

/** A mark cell: a real number, a dash where the parts were never recorded, or AB. */
function Mark({ value, absent }) {
  if (absent) return <span className="ms-ab">AB</span>
  if (!Number.isFinite(value)) return <span className="ms-nil">&ndash;</span>
  return <>{value}</>
}

export default function Marksheet() {
  const { dataset } = useDataset()
  const { selected } = useSelected()
  const [school] = useSchoolName()

  if (!selected || !dataset) return null

  const subjectMeta = new Map((dataset.subjects ?? []).map((s) => [s.code, s]))
  const compulsory = dataset.compulsory ?? []

  // Compulsory subjects in the order the case states them, then the optional —
  // the order a marksheet is read in, and the order the totals below follow.
  const order = [...compulsory, selected.optional].filter(
    (code, i, all) => code && all.indexOf(code) === i,
  )

  const passed = (selected.failedCompulsory?.length ?? 0) === 0
  const issued = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Total marks obtained across every subject sat. Absences contribute nothing
  // rather than a zero, which is the same distinction the engine makes.
  const totalMarks = order.reduce((sum, code) => {
    const s = selected.subjects?.[code]
    return sum + (Number.isFinite(s?.mark) ? s.mark : 0)
  }, 0)

  return (
    <article className="marksheet" aria-hidden="true">
      <header className="ms-head">
        {school && <p className="ms-school">{school}</p>}
        <h1 className="ms-title">Statement of Marks</h1>
        <p className="ms-exam">
          Annual Examination
          {dataset.case_id ? ` · Tabulation record ${dataset.case_id}` : ''}
        </p>
      </header>

      <table className="ms-particulars">
        <tbody>
          <tr>
            <th scope="row">Name of student</th>
            <td className="ms-strong">{selected.name}</td>
            <th scope="row">Student ID</th>
            <td className="ms-mono">{selected.id}</td>
          </tr>
          <tr>
            <th scope="row">Class</th>
            <td>{selected.class}</td>
            <th scope="row">Optional subject</th>
            <td>
              {subjectMeta.get(selected.optional)?.name ?? selected.optional}
              {selected.optional ? ` (${selected.optional})` : ''}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="ms-marks">
        <thead>
          <tr>
            <th scope="col" className="ms-num">
              #
            </th>
            <th scope="col">Subject</th>
            <th scope="col" className="ms-code">
              Code
            </th>
            <th scope="col" className="ms-figure">
              Theory
            </th>
            <th scope="col" className="ms-figure">
              Practical
            </th>
            <th scope="col" className="ms-figure">
              Total
            </th>
            <th scope="col" className="ms-figure">
              Grade point
            </th>
            <th scope="col" className="ms-figure">
              Letter
            </th>
          </tr>
        </thead>
        <tbody>
          {order.map((code, i) => {
            const s = selected.subjects?.[code]
            const meta = subjectMeta.get(code)
            const isOptional = code === selected.optional
            const gp = s?.gradePoint ?? 0
            return (
              <tr key={code} className={s?.failed ? 'ms-failed' : undefined}>
                <td className="ms-num">{i + 1}</td>
                <td>
                  {meta?.name ?? code}
                  {isOptional && <span className="ms-tag">optional</span>}
                </td>
                <td className="ms-code">{code}</td>
                <td className="ms-figure">
                  <Mark value={s?.theory} absent={s?.absent} />
                </td>
                <td className="ms-figure">
                  <Mark value={s?.practical} absent={s?.absent} />
                </td>
                <td className="ms-figure ms-strong">
                  <Mark value={s?.mark} absent={s?.absent} />
                </td>
                <td className="ms-figure">{gp.toFixed(1)}</td>
                <td className="ms-figure ms-strong">{letterGrade(gp, false)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className="ms-foot-label">
              Total marks obtained
            </td>
            <td className="ms-figure ms-strong">{totalMarks}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>

      {/*
        Label above value rather than beside it. Side by side, "Letter grade" is
        a long label next to a one-character value, and in a fixed three-column
        strip the label overran its cell and the grade printed on top of it.
        Stacked, the three read as equal conclusions and no wording can collide.
      */}
      <div className="ms-result">
        <div className="ms-result-cell">
          <p className="ms-result-label">GPA</p>
          <p className="ms-result-value">{selected.gpa.toFixed(2)}</p>
        </div>
        <div className="ms-result-cell">
          <p className="ms-result-label">Letter grade</p>
          <p className="ms-result-value">{selected.letter}</p>
        </div>
        <div className="ms-result-cell">
          <p className="ms-result-label">Result</p>
          <p className="ms-result-value">{passed ? 'PASSED' : 'FAILED'}</p>
        </div>
      </div>

      {/*
        The one remark a marksheet must carry. A GPA of 0.00 next to five good
        subject grades looks like a mistake unless the sheet says why, and the
        student is entitled to know which subject cost them the year.
      */}
      {!passed && (
        <p className="ms-remark">
          <span className="ms-remark-label">Remarks</span> Failed in{' '}
          {selected.failedCompulsory
            .map((code) => `${subjectMeta.get(code)?.name ?? code} (${code})`)
            .join(', ')}
          . A fail in any compulsory subject cancels the average, so the GPA is recorded as
          0.00 and the grade as F. The average before cancellation was{' '}
          {selected.uncancelledGpa.toFixed(2)}.
        </p>
      )}

      <div className="ms-signatures">
        <div>
          <span className="ms-rule" />
          Class Teacher
        </div>
        <div>
          <span className="ms-rule" />
          Head Teacher
        </div>
      </div>

      <footer className="ms-foot">
        <span>Issued {issued}</span>
        <span>
          Computer-generated from the school&rsquo;s tabulation record
          {dataset.case_id ? ` · ${dataset.case_id}` : ''}
        </span>
      </footer>
    </article>
  )
}
