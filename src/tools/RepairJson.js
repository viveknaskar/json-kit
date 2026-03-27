/* ============================================
   RepairJson.js — Auto-fix common JSON issues
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('repair-input')
  const output = document.getElementById('repair-output')
  const status = document.getElementById('repair-status')
  const stats  = document.getElementById('repair-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('repair-btn').addEventListener('click', runRepair)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runRepair()
  })

  document.getElementById('repair-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('repair-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('repair-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'repaired.json', 'application/json')
  })

  function runRepair() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste broken JSON to repair.', 'info')
      return
    }

    // If it already parses, nothing to fix
    try {
      const parsed = JSON.parse(raw)
      const pretty = JSON.stringify(parsed, null, 2)
      output.textContent = pretty
      output.className = 'output-area'
      output.dataset.raw = pretty
      setStatus('✓ JSON is already valid — no repairs needed.', 'success')
      return
    } catch (_) { /* fall through to repair */ }

    const { text, fixes } = repairJson(raw)

    try {
      const parsed = JSON.parse(text)
      const pretty = JSON.stringify(parsed, null, 2)
      output.textContent = pretty
      output.className = 'output-area'
      output.dataset.raw = pretty
      const summary = fixes.length
        ? `✓ Repaired · ${fixes.length} fix${fixes.length !== 1 ? 'es' : ''}: ${fixes.join(', ')}`
        : '✓ Repaired'
      setStatus(summary, 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ Could not repair — ${e.message.split(' at')[0]}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Attempt to repair common JSON issues.
 * Returns { text, fixes } where fixes is an array of human-readable descriptions.
 *
 * Handles:
 *   - Block comments  (/* ... *\/)
 *   - Line comments   (// ...)
 *   - Single-quoted strings ('value')
 *   - Unquoted object keys  ({key: ...})
 *   - Trailing commas       ([1, 2,] or {"a":1,})
 */
export function repairJson(raw) {
  const fixes = []
  let text = raw

  // 1. Remove block comments /* ... */
  const t1 = text.replace(/\/\*[\s\S]*?\*\//g, '')
  if (t1 !== text) { text = t1; fixes.push('removed block comments') }

  // 2. Remove line comments // ...
  const t2 = text.replace(/\/\/[^\n\r]*/g, '')
  if (t2 !== text) { text = t2; fixes.push('removed line comments') }

  // 3. Convert single-quoted strings to double-quoted
  // Matches 'content' where content can contain escaped chars but not unescaped single quotes
  const t3 = text.replace(/'((?:[^'\\]|\\.)*)'/g, (_, content) => {
    const fixed = content
      .replace(/\\'/g, "'")   // unescape \' → '
      .replace(/"/g, '\\"')   // escape any internal " → \"
    return `"${fixed}"`
  })
  if (t3 !== text) { text = t3; fixes.push('converted single quotes to double quotes') }

  // 4. Quote unquoted object keys: { key: ... } → { "key": ... }
  const t4 = text.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, (_, prefix, key) => `${prefix}"${key}":`)
  if (t4 !== text) { text = t4; fixes.push('quoted unquoted keys') }

  // 5. Remove trailing commas before } or ]
  const t5 = text.replace(/,(\s*[}\]])/g, '$1')
  if (t5 !== text) { text = t5; fixes.push('removed trailing commas') }

  return { text: text.trim(), fixes }
}
