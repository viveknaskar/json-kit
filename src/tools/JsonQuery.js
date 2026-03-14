/* ============================================
   JsonQuery.js — Query JSON with path expressions
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input   = document.getElementById('query-input')
  const pathEl  = document.getElementById('query-path')
  const output  = document.getElementById('query-output')
  const status  = document.getElementById('query-status')
  const stats   = document.getElementById('query-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('query-btn').addEventListener('click', runQuery)

  ;[input, pathEl].forEach(el => {
    el.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runQuery()
    })
  })

  // Also run on Enter in path input
  pathEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runQuery()
  })

  document.getElementById('query-clear').addEventListener('click', () => {
    input.value = ''
    pathEl.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('query-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('query-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'query-result.json', 'application/json')
  })

  function runQuery() {
    const raw  = input.value.trim()
    const path = pathEl.value.trim()

    if (!raw) {
      setStatus('Paste JSON data first.', 'info')
      return
    }

    let data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      setStatus(`✕ Invalid JSON: ${e.message}`, 'error')
      return
    }

    if (!path) {
      // No path: just pretty-print
      const result = JSON.stringify(data, null, 2)
      output.textContent = result
      output.className = 'output-area'
      output.dataset.raw = result
      setStatus('Showing root (no path specified)', 'info')
      return
    }

    try {
      const result = queryJson(data, path)
      const json   = JSON.stringify(result, null, 2)
      output.textContent = json
      output.className = 'output-area'
      output.dataset.raw = json

      const desc = Array.isArray(result) ? `${result.length} results` : '1 result'
      setStatus(`✓ Query returned ${desc}`, 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ Query error: ${e.message}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Query JSON data using a path expression.
 * Supports:
 *   - dot notation:       "a.b.c"
 *   - array index:        "arr[0]"
 *   - wildcard:           "arr[*]"
 *   - chained wildcard:   "arr[*].name"
 *   - mixed:              "users[0].address.city"
 *   - root:               "" or "."  → returns the whole document
 * @param {any}    data
 * @param {string} path
 * @returns {any}
 */
export function queryJson(data, path) {
  if (!path || path === '.' || path === '$') return data

  // Normalize: remove leading $. or $.
  const normalized = path.replace(/^\$\.?/, '').replace(/^\./, '')
  if (!normalized) return data

  const segments = parsePath(normalized)
  return evalSegments(data, segments)
}

/**
 * Parse a path string into an array of segment descriptors.
 * e.g. "users[0].name" → [{key:'users'}, {index:0}, {key:'name'}]
 *      "items[*].id"   → [{key:'items'}, {wildcard:true}, {key:'id'}]
 */
function parsePath(path) {
  const segments = []
  // Tokenize: split on dots and brackets
  // We use a regex to pull out:  .key   [index]  [*]   key (start)
  const re = /([^.[]+)|\[(\d+|\*)\]/g
  let m
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) {
      segments.push({ type: 'key', key: m[1] })
    } else if (m[2] === '*') {
      segments.push({ type: 'wildcard' })
    } else {
      segments.push({ type: 'index', index: parseInt(m[2], 10) })
    }
  }
  return segments
}

/**
 * Evaluate a list of parsed segments against data, supporting wildcards.
 * Wildcards produce arrays; everything else returns a single value.
 */
function evalSegments(data, segments) {
  let current = [data]
  let wildcard = false

  for (const seg of segments) {
    const next = []

    for (const val of current) {
      if (seg.type === 'key') {
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          if (seg.key in val) {
            next.push(val[seg.key])
          } else {
            throw new Error(`Key "${seg.key}" not found`)
          }
        } else if (Array.isArray(val)) {
          // Auto-iterate arrays for key access (like jq)
          for (const item of val) {
            if (item !== null && typeof item === 'object' && !Array.isArray(item) && seg.key in item) {
              next.push(item[seg.key])
            }
          }
          if (next.length === 0) throw new Error(`Key "${seg.key}" not found in array elements`)
          wildcard = true
        } else {
          throw new Error(`Cannot access key "${seg.key}" on ${typeof val}`)
        }
      } else if (seg.type === 'index') {
        if (!Array.isArray(val)) throw new Error(`Cannot index non-array with [${seg.index}]`)
        const idx = seg.index < 0 ? val.length + seg.index : seg.index
        if (idx < 0 || idx >= val.length) throw new Error(`Index [${seg.index}] out of bounds (length ${val.length})`)
        next.push(val[idx])
      } else if (seg.type === 'wildcard') {
        if (!Array.isArray(val)) throw new Error('Wildcard [*] requires an array')
        next.push(...val)
        wildcard = true
      }
    }

    current = next
    if (current.length === 0) throw new Error('Path produced no results')
  }

  // If wildcard was used (or current has multiple items), return array
  if (wildcard || current.length > 1) return current
  return current[0]
}
