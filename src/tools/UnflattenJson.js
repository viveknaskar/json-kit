/* ============================================
   UnflattenJson.js — Restore flat keys to nested JSON
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('unflatten-input')
  const output = document.getElementById('unflatten-output')
  const status = document.getElementById('unflatten-status')
  const stats  = document.getElementById('unflatten-input-stats')
  const sepEl  = document.getElementById('unflatten-sep')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('unflatten-btn').addEventListener('click', runUnflatten)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runUnflatten()
  })

  document.getElementById('unflatten-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('unflatten-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('unflatten-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'nested.json', 'application/json')
  })

  function runUnflatten() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste flat JSON to unflatten.', 'info')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setStatus('✕ Input must be a flat JSON object.', 'error')
        return
      }
      const sep = sepEl.value || '.'
      const nested = unflattenJson(parsed, sep)
      const result = JSON.stringify(nested, null, 2)

      output.textContent = result
      output.className = 'output-area'
      output.dataset.raw = result
      setStatus(`✓ Unflattened successfully`, 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ ${e.message}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Unflatten a flat key-value object into nested JSON.
 * Supports: "a.b.c" → {a:{b:{c:...}}} and "a[0]" → {a:[...]}
 * @param {object} flat
 * @param {string} sep
 * @returns {object|array}
 */
export function unflattenJson(flat, sep = '.') {
  const root = {}

  for (const [flatKey, val] of Object.entries(flat)) {
    const segments = parseKey(flatKey, sep)
    setNested(root, segments, val)
  }

  return arrayifyObject(root)
}

/**
 * Parse a flat key like "a.b[0].c" into segments ["a","b","0","c"].
 */
function parseKey(key, sep) {
  // Split on separator first, then handle bracket notation within each part
  const rawParts = key.split(sep)
  const segments = []
  for (const part of rawParts) {
    // Handle bracket notation: "arr[0][1]" → ["arr","0","1"]
    const bracketParts = part.split(/\[(\d+)\]/).filter(Boolean)
    for (const bp of bracketParts) {
      segments.push(bp)
    }
  }
  return segments
}

/**
 * Set a value in a nested object by array of key segments.
 */
function setNested(obj, segments, val) {
  let current = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    const nextSeg = segments[i + 1]
    const nextIsIndex = /^\d+$/.test(nextSeg)

    if (current[seg] === undefined || current[seg] === null || typeof current[seg] !== 'object') {
      current[seg] = nextIsIndex ? [] : {}
    }
    current = current[seg]
  }
  current[segments[segments.length - 1]] = val
}

/**
 * Walk the object and convert any object whose keys are all numeric into an array.
 */
function arrayifyObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(arrayifyObject)
  }

  const keys = Object.keys(obj)
  const allNumeric = keys.length > 0 && keys.every(k => /^\d+$/.test(k))

  const result = allNumeric ? [] : {}

  for (const key of keys) {
    const child = arrayifyObject(obj[key])
    if (allNumeric) {
      result[parseInt(key, 10)] = child
    } else {
      result[key] = child
    }
  }

  return result
}
