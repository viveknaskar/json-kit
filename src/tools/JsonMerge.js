/* ============================================
   JsonMerge.js — Deep merge two JSON objects
   ============================================ */

import { copyToClipboard, downloadText } from '../core/Utils.js'

export function init() {
  const inputA = document.getElementById('merge-a')
  const inputB = document.getElementById('merge-b')
  const output = document.getElementById('merge-output')
  const status = document.getElementById('merge-status')

  if (!inputA) return

  document.getElementById('merge-btn').addEventListener('click', runMerge)

  ;[inputA, inputB].forEach(ta => {
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runMerge()
    })
  })

  document.getElementById('merge-clear').addEventListener('click', () => {
    inputA.value = ''
    inputB.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
  })

  document.getElementById('merge-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('merge-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'merged.json', 'application/json')
  })

  function runMerge() {
    const rawA = inputA.value.trim()
    const rawB = inputB.value.trim()

    if (!rawA || !rawB) {
      setStatus('Both JSON inputs are required.', 'error')
      return
    }

    let a, b
    try { a = JSON.parse(rawA) } catch (e) { setStatus(`JSON A parse error: ${e.message.split(' at')[0]}`, 'error'); return }
    try { b = JSON.parse(rawB) } catch (e) { setStatus(`JSON B parse error: ${e.message.split(' at')[0]}`, 'error'); return }

    const strategy = document.getElementById('merge-strategy').value
    const arrayMode = document.getElementById('merge-arrays').value

    let result
    if (strategy === 'deep') {
      result = deepMerge(a, b, arrayMode)
    } else {
      result = Object.assign({}, a, b)
    }

    const pretty = JSON.stringify(result, null, 2)
    output.textContent = pretty
    output.className = 'output-area'
    output.dataset.raw = pretty
    setStatus('✓ Merged successfully', 'success')
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Deep merge two JSON values. For objects, keys from b are recursively merged
 * into a. For arrays, behaviour is controlled by arrayMode ('replace' or 'concat').
 * All other values (primitives, null) are overridden by b.
 * @param {*} a
 * @param {*} b
 * @param {'replace'|'concat'} arrayMode
 * @returns {*}
 */
export function deepMerge(a, b, arrayMode = 'replace') {
  if (isPlainObject(a) && isPlainObject(b)) {
    const result = Object.create(null)
    for (const key of Object.keys(a)) result[key] = a[key]
    for (const key of Object.keys(b)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
      if (key in result) {
        result[key] = deepMerge(result[key], b[key], arrayMode)
      } else {
        result[key] = b[key]
      }
    }
    return Object.assign({}, result)
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return arrayMode === 'concat' ? [...a, ...b] : b
  }

  return b
}

function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}
