/* ============================================
   JsonToMarkdownTable.js — Convert JSON array to Markdown table
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('j2md-input')
  const output = document.getElementById('j2md-output')
  const status = document.getElementById('j2md-status')
  const stats  = document.getElementById('j2md-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('j2md-btn').addEventListener('click', run)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run()
  })

  document.getElementById('j2md-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('j2md-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('j2md-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'table.md', 'text/markdown')
  })

  function run() {
    const raw = input.value.trim()
    if (!raw) { setStatus('Paste a JSON array to convert to a Markdown table.', 'info'); return }
    try {
      const data   = JSON.parse(raw)
      const result = jsonToMarkdownTable(data)
      output.textContent = result
      output.className = 'output-area'
      output.dataset.raw = result
      const rows = Array.isArray(data) ? data.length : 0
      setStatus(`✓ Converted · ${rows} row${rows !== 1 ? 's' : ''}`, 'success')
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
 * Convert a JSON array to a Markdown table string.
 *
 * - Arrays of objects: columns are the union of all keys.
 * - Arrays of primitives: single "value" column.
 * - Nested objects/arrays in cells are JSON-serialised.
 *
 * @param {*} data
 * @returns {string}
 */
export function jsonToMarkdownTable(data) {
  if (!Array.isArray(data)) throw new Error('Input must be a JSON array')
  if (data.length === 0) return '| (empty) |\n|:--------|\n'

  // Check if items are plain objects
  const hasObjects = data.some(v => v !== null && typeof v === 'object' && !Array.isArray(v))

  if (!hasObjects) {
    // Array of primitives / arrays — single column
    return '| value |\n|:------|\n' + data.map(v => `| ${mdCell(v)} |`).join('\n')
  }

  // Collect headers preserving insertion order
  const headerSet = new Set()
  for (const row of data) {
    if (row !== null && typeof row === 'object' && !Array.isArray(row)) {
      for (const k of Object.keys(row)) headerSet.add(k)
    }
  }
  const headers = [...headerSet]

  const sep  = headers.map(() => ':------').join(' | ')
  const head = `| ${headers.join(' | ')} |`
  const divider = `| ${sep} |`
  const rows = data.map(row => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      return `| ${mdCell(row)} ${headers.slice(1).map(() => '|').join(' ')} |`
    }
    return `| ${headers.map(h => mdCell(row[h])).join(' | ')} |`
  })

  return [head, divider, ...rows].join('\n')
}

function mdCell(value) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'object') return JSON.stringify(value).replace(/\|/g, '\\|')
  return String(value).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ')
}
