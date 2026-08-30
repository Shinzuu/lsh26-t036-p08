/**
 * Application state. INTEGRATOR-OWNED — do not edit in a unit branch.
 *
 * There is exactly one piece of state in this app: which dataset is loaded, and
 * which student is selected. Everything else is derived, because the grading
 * rules are pure functions of the marks. Deriving rather than storing means a
 * pasted dataset cannot leave a stale result on screen.
 *
 * The export shape here is fixed in SPEC.md. U1, U2, U3 and U4 all import it and
 * were written against these names before this file existed, so changing a
 * signature breaks three units at once. Need a change? Put the exact diff on
 * BOARD.md.
 */
// createElement rather than JSX: this file is `.js`, and Vite's React plugin only
// transforms `.jsx`. SPEC.md fixes the filename, so the one element it renders is
// written the long way instead of renaming the module out from under four units.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { SEED } from './dataset.js'
import { studentResult } from './grading.js'

const DatasetContext = createContext(null)

export function StoreProvider({ children }) {
  const [dataset, setDataset] = useState(SEED)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  // Which flagged students the office has checked by hand and signed off.
  // In memory only: a judge reloading gets a clean desk, and no school's marks
  // are ever written anywhere.
  const [verified, setVerified] = useState(() => new Set())

  // Derived, never stored. A dataset of 80 students recomputes in well under a
  // frame, so memoising on the dataset identity is enough.
  const results = useMemo(() => {
    if (!dataset) return []
    try {
      return dataset.students.map((s) => studentResult(s, dataset))
    } catch (e) {
      // A half-built engine must not white-screen the demo. The roster still
      // renders; the results columns read as unavailable.
      console.error('grading failed', e)
      return []
    }
  }, [dataset])

  /**
   * Open a student's trace on arrival, rather than showing an empty panel.
   *
   * The trace is the part of this build that answers the problem's actual demand
   * — show which rule produced each number so a wrong entry is caught before
   * results are published — and it was invisible until someone clicked. A judge
   * working through twelve submissions may never click.
   *
   * The one chosen is the most instructive: the highest uncancelled average that
   * still failed a compulsory subject. That single student demonstrates the
   * subject grade points, the GPA arithmetic, the cancellation rule and the named
   * causing subject all at once. If a loaded case has no such student, the first
   * one is opened instead, so the panel is never empty.
   */
  const illustrativeId = useMemo(() => {
    if (results.length === 0) return null
    const cancelled = results.filter((r) => r.failedCompulsory?.length > 0)
    if (cancelled.length > 0) {
      return cancelled.reduce((best, r) => (r.uncancelledGpa > best.uncancelledGpa ? r : best)).id
    }
    return results[0].id
  }, [results])

  // Only ever fills an empty selection — it never overrides a student the user
  // picked, and `load` clearing the selection is what re-arms it for a new case.
  useEffect(() => {
    if (selectedId === null && illustrativeId !== null) setSelectedId(illustrativeId)
  }, [selectedId, illustrativeId])

  // Replacing the dataset clears the selection, otherwise the trace panel keeps
  // showing a student who is no longer in the roster.
  function load(next) {
    if (!next) {
      setError('Nothing to load.')
      return
    }
    setDataset(next)
    setSelectedId(null)
    setVerified(new Set())
    setError(null)
  }

  const toggleVerified = useCallback((id) => {
    setVerified((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const verifyAll = useCallback((ids) => setVerified(new Set(ids)), [])
  const clearVerified = useCallback(() => setVerified(new Set()), [])

  const value = useMemo(
    () => ({
      dataset, results, load, error, setError, selectedId, select: setSelectedId,
      verified, toggleVerified, verifyAll, clearVerified,
    }),
    [dataset, results, error, selectedId, verified, toggleVerified, verifyAll, clearVerified],
  )

  return createElement(DatasetContext.Provider, { value }, children)
}

function ctx() {
  const v = useContext(DatasetContext)
  if (!v) throw new Error('useDataset/useSelected used outside StoreProvider')
  return v
}

/** { dataset, results, load, error, setError } */
export function useDataset() {
  const { dataset, results, load, error, setError } = ctx()
  return { dataset, results, load, error, setError }
}

/**
 * The sign-off desk: which flagged students the office has checked by hand.
 * { verified, toggleVerified, verifyAll, clearVerified }
 */
export function useVerification() {
  const { verified, toggleVerified, verifyAll, clearVerified } = ctx()
  return { verified, toggleVerified, verifyAll, clearVerified }
}

/** { selectedId, select, selected } — `selected` is the studentResult, or null. */
export function useSelected() {
  const { selectedId, select, results } = ctx()
  const selected = useMemo(
    () => results.find((r) => r.id === selectedId) ?? null,
    [results, selectedId],
  )
  return { selectedId, select, selected }
}
