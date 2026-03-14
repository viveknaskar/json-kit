/* ============================================
   MinifyJson.js — Compact JSON
   ============================================ */

import { copyToClipboard, downloadText, countStats, showError } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('minify-input')
  const output = document.getElementById('minify-output')
  const status = document.getElementById('minify-status')
  const stats  = document.getElementById('minify-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('minify-btn').addEventListener('click', runMinify)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runMinify()
  })

  document.getElementById('minify-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('minify-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('minify-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'minified.json', 'application/json')
  })

  function runMinify() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste some JSON to minify.', 'info')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const minified = JSON.stringify(parsed)

      output.textContent = minified
      output.className = 'output-area'
      output.dataset.raw = minified

      const beforeBytes = new TextEncoder().encode(raw).length
      const afterBytes  = new TextEncoder().encode(minified).length
      const saved = beforeBytes - afterBytes
      const pct   = ((saved / beforeBytes) * 100).toFixed(1)

      setStatus(
        `✓ Minified · ${formatBytes(beforeBytes)} → ${formatBytes(afterBytes)} (saved ${formatBytes(saved)}, ${pct}%)`,
        'success'
      )
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

function formatBytes(b) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / (1024 * 1024)).toFixed(2) + ' MB'
}
