/* ============================================
   SortKeys.js — Sort all JSON object keys alphabetically
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('sort-input')
  const output = document.getElementById('sort-output')
  const status = document.getElementById('sort-status')
  const stats  = document.getElementById('sort-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('sort-btn').addEventListener('click', runSort)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runSort()
  })

  document.getElementById('sort-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('sort-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('sort-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'sorted.json', 'application/json')
  })

  function runSort() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste some JSON to sort.', 'info')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const sorted = sortKeys(parsed)
      const result = JSON.stringify(sorted, null, 2)

      output.textContent = result
      output.className = 'output-area'
      output.dataset.raw = result

      const keyCount = countObjectKeys(sorted)
      setStatus(`✓ Sorted ${keyCount} keys recursively`, 'success')
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
 * Recursively sort all object keys alphabetically.
 * Arrays have their elements' keys sorted too.
 */
export function sortKeys(val) {
  if (val === null || typeof val !== 'object') return val
  if (Array.isArray(val)) return val.map(sortKeys)

  return Object.keys(val)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = sortKeys(val[key])
      return acc
    }, {})
}

function countObjectKeys(val) {
  if (val === null || typeof val !== 'object') return 0
  if (Array.isArray(val)) return val.reduce((n, v) => n + countObjectKeys(v), 0)
  return Object.keys(val).length + Object.values(val).reduce((n, v) => n + countObjectKeys(v), 0)
}
