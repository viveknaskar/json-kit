/* ============================================
   RemoveNulls.js — Clean JSON by removing null / empty values
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('rn-input')
  const output = document.getElementById('rn-output')
  const status = document.getElementById('rn-status')
  const stats  = document.getElementById('rn-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('rn-btn').addEventListener('click', run)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run()
  })

  document.getElementById('rn-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('rn-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('rn-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'cleaned.json', 'application/json')
  })

  function run() {
    const raw = input.value.trim()
    if (!raw) { setStatus('Paste JSON to clean.', 'info'); return }
    try {
      const data = JSON.parse(raw)
      const opts = {
        emptyStrings: document.getElementById('rn-opt-strings').checked,
        emptyArrays:  document.getElementById('rn-opt-arrays').checked,
        emptyObjects: document.getElementById('rn-opt-objects').checked,
      }
      const cleaned = removeNulls(data, opts)
      const json = JSON.stringify(cleaned, null, 2)
      output.textContent = json
      output.className = 'output-area'
      output.dataset.raw = json
      setStatus('✓ Cleaned successfully', 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ ${e.message.split(' at')[0]}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Recursively remove null values (and optionally empty strings/arrays/objects)
 * from a JSON value.
 *
 * @param {*} value
 * @param {{ emptyStrings?: boolean, emptyArrays?: boolean, emptyObjects?: boolean }} [options]
 * @returns {*}
 */
export function removeNulls(value, options = {}) {
  const { emptyStrings = false, emptyArrays = false, emptyObjects = false } = options

  function clean(v) {
    if (v === null) return undefined
    if (emptyStrings && v === '') return undefined
    if (Array.isArray(v)) {
      const cleaned = v.map(clean).filter(x => x !== undefined)
      if (emptyArrays && cleaned.length === 0) return undefined
      return cleaned
    }
    if (typeof v === 'object') {
      const result = {}
      for (const [k, val] of Object.entries(v)) {
        const cleaned = clean(val)
        if (cleaned !== undefined) result[k] = cleaned
      }
      if (emptyObjects && Object.keys(result).length === 0) return undefined
      return result
    }
    return v
  }

  const result = clean(value)
  if (result === undefined) {
    return Array.isArray(value) ? [] : (typeof value === 'object' && value !== null ? {} : null)
  }
  return result
}
