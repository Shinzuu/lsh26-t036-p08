/**
 * Dataset loading. OWNED BY U1 — replaced on branch u1-dataset.
 * Placeholder so the shell builds before the seed lands.
 */
export const SEED = { case_id: 'none', subjects: [], compulsory: [], students: [] }

export function parseDataset(json) {
  if (!json || typeof json !== 'object') throw new Error('Not a JSON object.')
  return json
}
