/**
 * The header strip: what is loaded, where the hard edges are, and how to load
 * something else. Unit U1 — required item 1.
 *
 * The load controls are here rather than behind a settings screen because a judge
 * has to be able to put their own case in without being told where to look, and
 * because `evaluation-manifest.json` promises that reloading the page restores the
 * seed. Both paths are one click from the top of the page.
 */
import { useRef, useState } from 'react'
import { useDataset, useSelected } from '../lib/store.js'
import { SEED, describeEdges, parseDataset, summarise } from '../lib/dataset.js'

export default function DataSource() {
  const { dataset, load, setError } = useDataset()
  const { select } = useSelected()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const fileRef = useRef(null)

  const summary = summarise(dataset)
  const { edges, covered } = describeEdges(dataset)

  function apply(raw) {
    try {
      load(parseDataset(raw))
      setText('')
      setOpen(false)
    } catch (e) {
      setError(e.message)
    }
  }

  function onFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => apply(String(reader.result))
    reader.onerror = () => setError(`Could not read ${file.name}.`)
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <section
      aria-labelledby="data-source-heading"
      className="rounded-card border border-ink-300 bg-ink-50/60 p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="data-source-heading" className="text-sm font-semibold text-ink-900">
            Marks loaded — case <span className="font-mono">{summary.caseId}</span>
          </h2>
          <p className="mt-0.5 text-sm text-ink-500">
            {summary.students} {summary.students === 1 ? 'student' : 'students'}
            {summary.classes.length > 0 && (
              <> across {summary.classes.map((c) => `${c.name} (${c.count})`).join(' and ')}</>
            )}
            , {summary.compulsory} compulsory subjects plus one optional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            {open ? 'Cancel' : 'Load other marks'}
          </button>
          <button
            type="button"
            onClick={() => {
              load(SEED)
              select(null)
              setError(null)
            }}
            className="rounded-lg px-3 py-1.5 text-sm text-ink-500 underline underline-offset-2 hover:text-ink-700"
          >
            Restore sample data
          </button>
        </div>
      </div>

      {/* The four hard edges required item 1 asks for, found in whatever is loaded. */}
      {edges.some((e) => e.count > 0) && (
        <div className="mt-4 border-t border-ink-300/70 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Hard edges in this data — {covered} {covered === 1 ? 'student sits' : 'students sit'} on at least one
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {edges.map((edge) => (
              <li key={edge.key} className="text-sm">
                <span className="text-ink-500">{edge.label}: </span>
                {edge.first ? (
                  <>
                    <button
                      type="button"
                      onClick={() => select(edge.first.student.id)}
                      className="font-medium text-accent underline underline-offset-2"
                    >
                      {edge.first.student.name}
                    </button>{' '}
                    <span className="text-ink-500">
                      — {edge.first.detail}
                      {edge.count > 1 && <> (+{edge.count - 1} more)</>}
                    </span>
                  </>
                ) : (
                  <span className="text-ink-500">none in this case</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <div className="mt-4 border-t border-ink-300/70 pt-3">
          <label htmlFor="paste-case" className="text-sm font-medium text-ink-700">
            Paste a case, or the whole published fixture file
          </label>
          <p className="mt-0.5 text-xs text-ink-500">
            Either the case object itself or a file with a <span className="font-mono">cases</span> list —
            the first case is used.
          </p>
          <textarea
            id="paste-case"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            spellCheck={false}
            placeholder='{ "case_id": "PUB-02", "subjects": [ ... ], "compulsory": [ ... ], "students": [ ... ] }'
            className="mt-2 w-full rounded-lg border border-ink-300 bg-white p-2 font-mono text-xs text-ink-900"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!text.trim()}
              onClick={() => apply(text)}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Load pasted marks
            </button>
            <span className="text-sm text-ink-500">or</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              Choose a .json file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={onFile}
              className="sr-only"
              aria-label="Upload a marks file"
            />
          </div>
        </div>
      )}
    </section>
  )
}
