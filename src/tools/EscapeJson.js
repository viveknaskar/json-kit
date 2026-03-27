/* ============================================
   EscapeJson.js — Escape / Unescape JSON strings
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('escape-input')
  const output = document.getElementById('escape-output')
  const status = document.getElementById('escape-status')
  const stats  = document.getElementById('escape-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('escape-btn').addEventListener('click', runEscape)
  document.getElementById('unescape-btn').addEventListener('click', runUnescape)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runEscape()
  })

  document.getElementById('escape-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('escape-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('escape-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'escaped.json', 'application/json')
  })

  function runEscape() {
    const raw = input.value
    if (!raw) {
      setStatus('Paste text to escape.', 'info')
      return
    }
    const result = escapeJson(raw)
    output.textContent = result
    output.className = 'output-area'
    output.dataset.raw = result
    const chars = raw.length
    setStatus(`✓ Escaped · ${chars.toLocaleString()} chars → ${result.length.toLocaleString()} chars`, 'success')
  }

  function runUnescape() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste an escaped JSON string to unescape.', 'info')
      return
    }
    try {
      const result = unescapeJson(raw)
      output.textContent = result
      output.className = 'output-area'
      output.dataset.raw = result
      setStatus(`✓ Unescaped · ${result.length.toLocaleString()} chars`, 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ Invalid escaped string: ${e.message.split(' at')[0]}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Escape a raw string into a JSON string literal (with surrounding quotes).
 * Handles: ", \, newlines, tabs, carriage returns, and control characters.
 * @param {string} raw
 * @returns {string}
 */
export function escapeJson(raw) {
  return JSON.stringify(raw)
}

/**
 * Unescape a JSON string literal back to a plain string.
 * Accepts with or without surrounding double quotes.
 * @param {string} escaped
 * @returns {string}
 */
export function unescapeJson(escaped) {
  const s = escaped.trim()
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    return JSON.parse(s)
  }
  // Wrap bare escaped content in quotes and parse
  return JSON.parse(`"${s}"`)
}
