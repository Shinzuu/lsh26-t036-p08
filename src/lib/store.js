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
import { createContext, createElement, useContext, useMemo, useState } from 'react'
import { SEED } from './dataset.js'
import { studentResult } from './grading.js'

const DatasetContext = createContext(null)

export function StoreProvider({ children }) {
  const [dataset, setDataset] = useState(SEED)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

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

  // Replacing the dataset clears the selection, otherwise the trace panel keeps
  // showing a student who is no longer in the roster.
  function load(next) {
    if (!next) {
      setError('Nothing to load.')
      return
    }
    setDataset(next)
    setSelectedId(null)
    setError(null)
  }

  const value = useMemo(
    () => ({ dataset, results, load, error, setError, selectedId, select: setSelectedId }),
    [dataset, results, error, selectedId],
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

/** { selectedId, select, selected } — `selected` is the studentResult, or null. */
export function useSelected() {
  const { selectedId, select, results } = ctx()
  const selected = useMemo(
    () => results.find((r) => r.id === selectedId) ?? null,
    [results, selectedId],
  )
  return { selectedId, select, selected }
}
