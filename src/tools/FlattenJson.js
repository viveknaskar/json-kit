/* ============================================
   FlattenJson.js — Flatten nested JSON to dot-notation
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('flatten-input')
  const output = document.getElementById('flatten-output')
  const status = document.getElementById('flatten-status')
  const stats  = document.getElementById('flatten-input-stats')
  const sepEl  = document.getElementById('flatten-sep')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('flatten-btn').addEventListener('click', runFlatten)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runFlatten()
  })

  document.getElementById('flatten-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('flatten-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('flatten-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'flat.json', 'application/json')
  })

  function runFlatten() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste JSON to flatten.', 'info')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const sep = sepEl.value || '.'
      const flat = flattenJson(parsed, sep)
      const result = JSON.stringify(flat, null, 2)

      output.textContent = result
      output.className = 'output-area'
      output.dataset.raw = result

      const keyCount = Object.keys(flat).length
      setStatus(`✓ Flattened to ${keyCount} keys`, 'success')
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
 * Flatten a nested JSON object into dot-notation keys.
 * Arrays use bracket notation: a[0], a[1].
 * @param {any}    obj
 * @param {string} sep       - key separator (default '.')
 * @param {string} prefix    - internal use
 * @param {object} result    - internal use
 * @returns {object}
 */
export function flattenJson(obj, sep = '.', prefix = '', result = {}) {
  if (obj === null || typeof obj !== 'object') {
    if (prefix) result[prefix] = obj
    return result
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      if (prefix) result[prefix] = []
      return result
    }
    obj.forEach((item, i) => {
      const key = prefix ? `${prefix}[${i}]` : `[${i}]`
      if (item !== null && typeof item === 'object') {
        flattenJson(item, sep, key, result)
      } else {
        result[key] = item
      }
    })
    return result
  }

  const keys = Object.keys(obj)
  if (keys.length === 0) {
    if (prefix) result[prefix] = {}
    return result
  }

  for (const key of keys) {
    const fullKey = prefix ? `${prefix}${sep}${key}` : key
    const val = obj[key]
    if (val !== null && typeof val === 'object') {
      flattenJson(val, sep, fullKey, result)
    } else {
      result[fullKey] = val
    }
  }

  return result
}
