/* ============================================
   JsonToCsv.js — Convert JSON array to CSV
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('j2c-input')
  const output = document.getElementById('j2c-output')
  const status = document.getElementById('j2c-status')
  const stats  = document.getElementById('j2c-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('j2c-btn').addEventListener('click', runConvert)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runConvert()
  })

  document.getElementById('j2c-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('j2c-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('j2c-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'data.csv', 'text/csv')
  })

  function runConvert() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste a JSON array of objects to convert.', 'info')
      return
    }

    try {
      const parsed = JSON.parse(raw)

      if (!Array.isArray(parsed)) {
        setStatus('✕ Input must be a JSON array (e.g. [{...},{...}])', 'error')
        return
      }

      if (parsed.length === 0) {
        setStatus('✕ Array is empty — nothing to convert.', 'error')
        return
      }

      const csv = jsonToCsv(parsed)
      output.textContent = csv
      output.className = 'output-area'
      output.dataset.raw = csv

      const rows = csv.split('\n').length - 1
      setStatus(`✓ Converted ${parsed.length} records · ${rows} data rows`, 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ Invalid JSON: ${e.message}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Convert a JSON array of objects to CSV string.
 * Nested objects are flattened one level deep.
 */
export function jsonToCsv(arr) {
  // Collect all unique keys from all rows (flattening one level)
  const headersSet = new Set()
  const flatRows = arr.map(row => flattenOne(row))
  flatRows.forEach(row => Object.keys(row).forEach(k => headersSet.add(k)))
  const headers = Array.from(headersSet)

  const lines = [headers.map(csvCell).join(',')]
  for (const row of flatRows) {
    lines.push(headers.map(h => csvCell(row[h] === undefined ? '' : row[h])).join(','))
  }

  return lines.join('\r\n')
}

/**
 * Flatten a single object one level deep.
 * e.g. {a: {b: 1}, c: 2} → {"a.b": 1, c: 2}
 */
function flattenOne(obj, prefix = '', result = {}) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    result[prefix] = obj
    return result
  }
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      // One level: expand sub-object but not deeper
      for (const [k2, v2] of Object.entries(val)) {
        result[`${fullKey}.${k2}`] = typeof v2 === 'object' ? JSON.stringify(v2) : v2
      }
    } else if (Array.isArray(val)) {
      result[fullKey] = JSON.stringify(val)
    } else {
      result[fullKey] = val
    }
  }
  return result
}

/**
 * Wrap a CSV cell value with proper quoting/escaping.
 */
function csvCell(val) {
  const str = val === null || val === undefined ? '' : String(val)
  // Quote if contains comma, newline, double-quote, or leading/trailing whitespace
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"') || str !== str.trim()) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}
