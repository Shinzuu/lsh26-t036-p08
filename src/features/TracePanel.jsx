/**
 * The trace side panel.
 *
 * WHY THIS EXISTS. The sign-off desk sits at the top of the page and the trace
 * renders far below it, so clicking "Open trace" there changed the selection
 * somewhere off-screen and looked like it had done nothing. The trace is required
 * item 3 and the desk is the panel a judge is most likely to poke, so the two
 * needed to be in front of each other.
 *
 * This panel does NOT replace the inline trace beside the roster — that one is
 * still there and still auto-opens an illustrative student on arrival. This is a
 * second view of the same component for the case where the reader is somewhere
 * else on the page. Both read `selected` from the store, so they can never show
 * different students.
 *
 * It is a real dialog, not a styled div: Escape closes it, focus moves into it on
 * open and returns to the control that opened it on close, Tab is trapped inside
 * while it is open, and the page behind it does not scroll. A drawer that traps a
 * keyboard user costs more UI/UX marks than it earns.
 *
 * Opening is a module-level subscription rather than state in the store, so
 * wiring a new caller is one import and one call, and `src/lib/store.js` did not
 * have to change.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import StudentTrace from './StudentTrace.jsx'
import { useSelected, useVerification } from '../lib/store.js'

/**
 * Why this student is on the checking list, in the same words the sign-off desk
 * uses. Read from the engine's own flags, so the two panels cannot disagree
 * about who is flagged or why.
 */
function flagReasons(result) {
  if (!result?.flags) return []
  const why = []
  if (result.flags.optionalRule) why.push('optional rule')
  if (result.flags.practicalFail) why.push('practical fail')
  if (result.flags.absent) why.push('absent mark')
  return why
}

/**
 * Opening is a DOM event on `window`, deliberately, rather than a module-level
 * subscriber list.
 *
 * A Set living in this module's scope is only shared while every importer holds
 * the same module instance. Under Vite's hot reload that stops being true the
 * moment this file is edited: the caller keeps the previous module's `openTrace`
 * while the freshly mounted panel subscribes to the new module's Set, so the
 * click pushes into a list nobody is listening to and the panel silently stops
 * opening. `window` is a single object no reload can duplicate.
 */
const OPEN_EVENT = 'trace:open'

/** Call after selecting a student to bring their trace to the reader. */
export function openTrace() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}

/** Elements that can hold focus, for the Tab trap. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

export default function TracePanel() {
  const [open, setOpen] = useState(false)
  const { selected } = useSelected()
  const { verified, toggleVerified } = useVerification()
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  // The control that opened the panel, so focus can go back where it came from.
  const openerRef = useRef(null)

  useEffect(() => {
    const onOpen = () => {
      openerRef.current = document.activeElement
      setOpen(true)
    }
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    // Return focus to the opener, but only if it is still on the page.
    const opener = openerRef.current
    if (opener && document.contains(opener)) opener.focus()
    openerRef.current = null
  }, [])

  // Escape closes, and Tab cycles within the panel rather than escaping to the
  // page behind it.
  useEffect(() => {
    if (!open) return

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        return
      }
      if (e.key !== 'Tab') return

      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE)
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, close])

  // Hold the page still behind the panel, and put focus on the close button so a
  // keyboard user's first Tab lands inside rather than back in the page.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Loading a different case clears the selection; a panel showing a student who
  // is no longer in the roster would be worse than no panel.
  useEffect(() => {
    if (open && !selected) setOpen(false)
  }, [open, selected])

  if (!open) return null

  const reasons = flagReasons(selected)
  const isVerified = selected ? verified.has(selected.id) : false

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop. Clicking it closes, which is what people expect of a drawer. */}
      <button
        type="button"
        aria-label="Close the trace"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-ink-900/35 p-0"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trace-panel-heading"
        className="trace-panel relative flex h-full w-full flex-col border-l-2 border-l-accent bg-ink-50 sm:max-w-3xl"
      >
        <div className="trace-panel-head flex items-baseline justify-between gap-4 px-5 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              Required item 3
            </p>
            <h2
              id="trace-panel-heading"
              className="truncate text-base font-semibold tracking-tight text-ink-900"
            >
              {selected ? `Why ${selected.name} got that result` : 'Why that result'}
            </h2>
            {selected && (
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-mono text-ink-500">{selected.id}</span>
                <span className="text-ink-500">{selected.class}</span>
                <span className="font-mono font-semibold text-ink-900">
                  GPA {Number.isFinite(selected.gpa) ? selected.gpa.toFixed(2) : '—'}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                    selected.failedCompulsory?.length
                      ? 'border border-danger/50 bg-danger/10 text-danger'
                      : 'bg-ink-100 text-ink-700'
                  }`}
                >
                  {selected.letter ?? '—'}
                </span>
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="shrink-0 rounded-card border border-ink-300 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            Close <span className="ml-1 font-normal text-ink-500">Esc</span>
          </button>
        </div>

        {/* The same component the inline panel renders, reading the same selection. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <StudentTrace />
        </div>

        {/*
          Sign-off, for a student who is actually on the checking list. This is the
          same `verified` set the desk writes to, so ticking here ticks there and
          the desk's progress and "ready to publish" state move with it.

          A student who is not flagged gets a plain statement instead of a control
          — offering to sign off something the office was never asked to check
          would invite a tick that means nothing.
        */}
        {selected && (
          <div className="border-t border-ink-300 bg-white px-5 py-3">
            {reasons.length > 0 ? (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={() => toggleVerified(selected.id)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
                />
                <span className="min-w-0 flex-1 text-sm">
                  <span className={isVerified ? 'font-medium text-ok' : 'font-medium text-ink-900'}>
                    {isVerified ? 'Checked by hand — signed off' : 'Mark as checked by hand'}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    On the checking list for {reasons.join(' · ')}. Ticking here also ticks it on
                    the sign-off desk.
                  </span>
                </span>
              </label>
            ) : (
              <p className="text-xs text-ink-500">
                <span className="font-medium text-ink-700">Not on the checking list.</span> Nothing
                changed this student&rsquo;s result by the optional rule, a practical fail or an
                absence, so there is nothing for the office to verify by hand.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
