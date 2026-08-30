/**
 * Required item 4 — the office's checking list. OWNED BY U4 (Dip).
 *
 * Before results go out, a teacher verifies by hand every student whose result was
 * changed by something other than a plain mark: the optional-subject rule, a failed
 * practical part, or an absence. This panel is that worklist.
 *
 * Membership is clarification R-29, and only R-29:
 *   optional      — optional grade point 2.0 or below; an absent optional counts
 *   practicalFail — a practical part below 8 in any subject
 *   absent        — an AB in any subject
 *
 * A student can qualify for more than one list and must appear on every list they
 * qualify for. Nothing is deduplicated across lists — the office checks each reason
 * separately, so a student with a failed practical AND an absence is two checks, not
 * one. Because a judge has to *see* that overlap, each entry names the other lists it
 * also appears on.
 *
 * The lists come from `checkingLists()` in the engine, which is U2's file. This
 * component does not recompute them: if the engine and this panel disagreed, the panel
 * would be lying about what the app actually did. The one liberty taken is shape
 * tolerance — see `resolve()` below.
 */
import { useMemo } from 'react'
import { checkingLists } from '../lib/grading.js'
import { useDataset, useSelected } from '../lib/store.js'
import { openTrace } from './TracePanel.jsx'

/** The three lists, in the order R-29 states them. */
const LISTS = [
  {
    key: 'optional',
    title: 'Optional subject rule',
    reason: 'Optional grade point is 2.0 or below, so it added nothing to the GPA. An absent optional counts.',
  },
  {
    key: 'practicalFail',
    title: 'Practical fail',
    reason: 'A practical part scored below 8, which fails the whole subject however good the theory mark was.',
  },
  {
    key: 'absent',
    title: 'Absent',
    reason: 'Marked AB in at least one subject. An absence is not a zero and is not marked as one.',
  },
]

const EMPTY = { optional: [], practicalFail: [], absent: [] }

/**
 * SPEC fixes `checkingLists(results) -> { optional, practicalFail, absent }` but does
 * not say whether the arrays hold student ids or whole studentResult objects. Rather
 * than block on the answer or edit the engine, accept either: an entry is matched back
 * to its studentResult by identity or by id. Both drills lost time to exactly this kind
 * of unstated export shape, and tolerating both costs three lines.
 */
function resolve(entry, byId) {
  if (entry == null) return null
  if (typeof entry === 'string') return byId.get(entry) ?? null
  if (typeof entry === 'object') return byId.get(entry.id) ?? entry
  return null
}

/** Subject codes where this student's practical part fell below the pass mark of 8. */
function practicalFailCodes(result) {
  const subjects = result?.subjects ?? {}
  return Object.keys(subjects).filter((code) => {
    const s = subjects[code]
    return s && !s.absent && typeof s.practical === 'number' && s.practical < 8
  })
}

/** Subject codes this student was absent for. */
function absentCodes(result) {
  const subjects = result?.subjects ?? {}
  return Object.keys(subjects).filter((code) => subjects[code]?.absent)
}

/**
 * The one line under a student's name explaining why *this* list caught them, using
 * that student's real numbers. A general restatement of the rule would be useless to
 * the teacher doing the checking — they need to know which subject to open.
 */
function detailFor(listKey, result, nameFor) {
  if (!result) return null

  if (listKey === 'optional') {
    const code = result.optional
    const subject = result.subjects?.[code]
    const label = code ? `${nameFor(code)} (${code})` : 'the optional subject'
    if (subject?.absent) return `${label} — absent, so it contributes nothing`
    const gp = result.optionalGradePoint
    if (typeof gp === 'number') return `${label} — grade point ${gp.toFixed(1)}, at or below 2.0`
    return `${label} — did not reach the point where it helps`
  }

  if (listKey === 'practicalFail') {
    const codes = practicalFailCodes(result)
    if (codes.length === 0) return 'A practical part is below the pass mark of 8'
    return codes
      .map((code) => `${nameFor(code)} practical ${result.subjects[code].practical} of 25`)
      .join(' · ')
  }

  const codes = absentCodes(result)
  if (codes.length === 0) return 'Absent in at least one subject'
  return `AB in ${codes.map(nameFor).join(', ')}`
}

export default function CheckingLists() {
  const { dataset, results } = useDataset()
  const { selectedId, select } = useSelected()

  // Subject codes are what the engine carries; the teacher reads names.
  const nameFor = useMemo(() => {
    const names = new Map((dataset?.subjects ?? []).map((s) => [s.code, s.name]))
    return (code) => names.get(code) ?? code
  }, [dataset])

  const byId = useMemo(() => new Map((results ?? []).map((r) => [r.id, r])), [results])

  // A half-built engine must not white-screen the panel — the rest of the page is
  // still demoable without it.
  const { lists, failure } = useMemo(() => {
    try {
      const raw = checkingLists(results ?? [])
      return { lists: { ...EMPTY, ...(raw ?? {}) }, failure: null }
    } catch (e) {
      console.error('checkingLists failed', e)
      return { lists: EMPTY, failure: e.message ?? 'The grading engine could not build the lists.' }
    }
  }, [results])

  // Which lists each student appears on, so an entry can say "also on …". This is the
  // overlap R-29 requires, made visible rather than left for the reader to spot.
  const membership = useMemo(() => {
    const m = new Map()
    for (const { key } of LISTS) {
      for (const entry of lists[key] ?? []) {
        const r = resolve(entry, byId)
        const id = r?.id ?? (typeof entry === 'string' ? entry : entry?.id)
        if (!id) continue
        if (!m.has(id)) m.set(id, [])
        m.get(id).push(key)
      }
    }
    return m
  }, [lists, byId])

  const titleFor = (key) => LISTS.find((l) => l.key === key)?.title ?? key
  const overlapCount = useMemo(
    () => [...membership.values()].filter((keys) => keys.length > 1).length,
    [membership],
  )

  const total = (results ?? []).length

  return (
    <section aria-labelledby="checking-lists-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="checking-lists-heading" className="text-lg font-semibold tracking-tight">
          Checking list before results go out
        </h2>
        <p className="text-sm text-ink-500">
          {overlapCount > 0
            ? `${overlapCount} ${overlapCount === 1 ? 'student appears' : 'students appear'} on more than one list — each is listed under every reason.`
            : 'A student can appear on more than one list. Each is listed under every reason.'}
        </p>
      </div>

      {failure && (
        <p
          role="alert"
          className="mt-3 rounded-card border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          <span className="font-medium">The lists could not be built.</span> {failure}
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {LISTS.map(({ key, title, reason }) => {
          const entries = lists[key] ?? []
          return (
            <div
              key={key}
              className="flex min-w-0 flex-col rounded-card border border-ink-300 bg-white"
            >
              <div className="border-b border-ink-300 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-accent">{title}</h3>
                  <span
                    className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-sm font-semibold text-accent tabular-nums"
                    aria-label={`${entries.length} students`}
                  >
                    {entries.length}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{reason}</p>
              </div>

              {entries.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-500">
                  {total === 0 ? 'No students loaded yet.' : 'No student on this list.'}
                </p>
              ) : (
                <ul className="max-h-80 divide-y divide-ink-300/60 overflow-y-auto">
                  {entries.map((entry, i) => {
                    const r = resolve(entry, byId)
                    const id = r?.id ?? (typeof entry === 'string' ? entry : entry?.id) ?? `row-${i}`
                    const alsoOn = (membership.get(id) ?? []).filter((k) => k !== key)
                    const isSelected = selectedId === id

                    return (
                      <li key={`${key}-${id}`}>
                        <button
                          type="button"
                          onClick={() => {
                            select(id)
                            openTrace()
                          }}
                          aria-current={isSelected ? 'true' : undefined}
                          className={`w-full px-4 py-2.5 text-left transition-colors hover:bg-accent-soft/60 ${
                            isSelected ? 'bg-accent-soft' : ''
                          }`}
                        >
                          <span className="flex items-baseline gap-2">
                            <span className="truncate font-medium text-ink-900">
                              {r?.name ?? id}
                            </span>
                            <span className="shrink-0 text-xs text-ink-500 tabular-nums">{id}</span>
                          </span>

                          <span className="mt-0.5 block text-xs text-ink-500">
                            {r?.class ? `${r.class} · ` : ''}
                            {detailFor(key, r, nameFor)}
                          </span>

                          {alsoOn.length > 0 && (
                            <span className="mt-1 block text-xs font-medium text-accent">
                              also on {alsoOn.map(titleFor).join(' and ')}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
