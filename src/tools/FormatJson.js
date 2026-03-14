/* ============================================
   FormatJson.js — Prettify and validate JSON
   ============================================ */

import { copyToClipboard, downloadText, countStats, extractErrorPosition, escapeHtml } from '../core/Utils.js'

export function init() {
  const input    = document.getElementById('format-input')
  const output   = document.getElementById('format-output')
  const status   = document.getElementById('format-status')
  const stats    = document.getElementById('format-input-stats')
  const indentOpts = document.getElementById('format-indent-opts')

  if (!input) return

  let currentIndent = 2

  // Indent selector
  indentOpts.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-indent]')
    if (!btn) return
    indentOpts.querySelectorAll('.btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentIndent = btn.dataset.indent === 'tab' ? '\t' : parseInt(btn.dataset.indent)
    // Re-run if there's already output
    if (output.dataset.hasContent) runFormat()
  })

  // Stats update
  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  // Format button
  document.getElementById('format-btn').addEventListener('click', runFormat)

  // Keyboard shortcut: Ctrl+Enter
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runFormat()
  })

  // Clear
  document.getElementById('format-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.hasContent = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  // Copy
  document.getElementById('format-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  // Download
  document.getElementById('format-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'formatted.json', 'application/json')
  })

  function runFormat() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste some JSON to format.', 'info')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const pretty = JSON.stringify(parsed, null, currentIndent)

      output.textContent = pretty
      output.className = 'output-area'
      output.dataset.raw = pretty
      output.dataset.hasContent = '1'

      // Success status
      const before = new TextEncoder().encode(raw).length
      const after  = new TextEncoder().encode(pretty).length
      setStatus(`✓ Valid JSON · ${countJsonNodes(parsed)} nodes · ${formatDelta(before, after)}`, 'success')
    } catch (e) {
      output.dataset.raw = ''
      output.dataset.hasContent = ''

      // Build helpful error output
      const pos = extractErrorPosition(e.message)
      let errorHtml = `<span style="color:var(--error);font-weight:600;">✕ Invalid JSON</span>\n\n`
      errorHtml += `<span style="color:var(--warning);">Error: ${escapeHtml(e.message)}</span>`

      if (pos.line) {
        errorHtml += `\n<span style="color:var(--text-muted);">→ Line ${pos.line}${pos.col ? `, column ${pos.col}` : ''}</span>`
        // Show the offending line
        const lines = raw.split('\n')
        const lineIdx = pos.line - 1
        if (lines[lineIdx] !== undefined) {
          errorHtml += `\n\n<span style="color:var(--text-muted);">Line ${pos.line}:</span> <span style="color:var(--error);">${escapeHtml(lines[lineIdx].trim())}</span>`
        }
      } else if (pos.pos !== null) {
        // Derive line from character position
        const before = raw.slice(0, pos.pos)
        const lineNum = before.split('\n').length
        const lineStart = before.lastIndexOf('\n') + 1
        const colNum  = pos.pos - lineStart + 1
        errorHtml += `\n<span style="color:var(--text-muted);">→ Line ${lineNum}, column ${colNum}</span>`
        const lines = raw.split('\n')
        if (lines[lineNum - 1] !== undefined) {
          errorHtml += `\n\n<span style="color:var(--text-muted);">Line ${lineNum}:</span> <span style="color:var(--error);">${escapeHtml(lines[lineNum - 1].trim())}</span>`
        }
      }

      output.innerHTML = errorHtml
      output.className = 'output-area'
      setStatus(`✕ Parse error — ${e.message.split(' at')[0]}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

function countJsonNodes(val) {
  if (val === null || typeof val !== 'object') return 1
  if (Array.isArray(val)) return val.reduce((n, v) => n + countJsonNodes(v), 1)
  return Object.values(val).reduce((n, v) => n + countJsonNodes(v), 1)
}

function formatDelta(before, after) {
  const diff = after - before
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${(diff / 1024).toFixed(1)} KB`
}
