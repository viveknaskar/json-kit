/* ============================================
   PickOmitKeys.js — Pick or omit specific keys from JSON
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('po-input')
  const output = document.getElementById('po-output')
  const status = document.getElementById('po-status')
  const stats  = document.getElementById('po-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('po-pick-btn').addEventListener('click', () => run('pick'))
  document.getElementById('po-omit-btn').addEventListener('click', () => run('omit'))

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run('pick')
  })

  document.getElementById('po-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('po-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('po-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'output.json', 'application/json')
  })

  function run(mode) {
    const raw  = input.value.trim()
    const keys = document.getElementById('po-keys').value
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)

    if (!raw) { setStatus('Paste JSON to process.', 'info'); return }
    if (keys.length === 0) { setStatus('Enter at least one key path.', 'info'); return }

    try {
      const data   = JSON.parse(raw)
      const result = mode === 'pick' ? pickKeys(data, keys) : omitKeys(data, keys)
      const json   = JSON.stringify(result, null, 2)
      output.textContent = json
      output.className   = 'output-area'
      output.dataset.raw = json
      setStatus(`✓ ${mode === 'pick' ? 'Picked' : 'Omitted'} ${keys.length} key${keys.length !== 1 ? 's' : ''}`, 'success')
    } catch (e) {
      output.textContent = ''
      output.className   = 'output-area empty'
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
 * Return a new object containing only the specified dot-notation key paths.
 *
 * @param {object} obj
 * @param {string[]} paths  e.g. ['name', 'address.city']
 * @returns {object}
 */
export function pickKeys(obj, paths) {
  const result = {}
  for (const path of paths) {
    const value = getPath(obj, path)
    if (value !== undefined) setPath(result, path, value)
  }
  return result
}

/**
 * Return a deep clone of the object with the specified dot-notation key paths removed.
 *
 * @param {object} obj
 * @param {string[]} paths  e.g. ['password', 'meta.internal']
 * @returns {object}
 */
export function omitKeys(obj, paths) {
  const clone = JSON.parse(JSON.stringify(obj))
  for (const path of paths) deletePath(clone, path)
  return clone
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), obj)
}

function setPath(obj, path, value) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {}
    cur = cur[parts[i]]
  }
  cur[parts[parts.length - 1]] = value
}

function deletePath(obj, path) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur == null || typeof cur !== 'object') return
    cur = cur[parts[i]]
  }
  if (cur != null) delete cur[parts[parts.length - 1]]
}
