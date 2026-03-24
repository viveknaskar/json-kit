/* ============================================
   JsonDiff.js — Compare two JSON objects
   ============================================ */

import { copyToClipboard, escapeHtml as escHtml } from '../core/Utils.js'

export function init() {
  const inputA  = document.getElementById('diff-a')
  const inputB  = document.getElementById('diff-b')
  const output  = document.getElementById('diff-output')
  const summary = document.getElementById('diff-summary')

  if (!inputA) return

  document.getElementById('diff-btn').addEventListener('click', runDiff)

  // Allow Ctrl+Enter from either textarea
  ;[inputA, inputB].forEach(ta => {
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runDiff()
    })
  })

  document.getElementById('diff-clear').addEventListener('click', () => {
    inputA.value = ''
    inputB.value = ''
    output.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">{Δ}</div>
        <p>Enter JSON in both panels and click Compare to see the differences.</p>
      </div>`
    summary.style.display = 'none'
    output.dataset.raw = ''
  })

  document.getElementById('diff-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  function runDiff() {
    const rawA = inputA.value.trim()
    const rawB = inputB.value.trim()

    if (!rawA || !rawB) {
      showDiffError('Both JSON inputs are required.')
      return
    }

    let a, b
    try { a = JSON.parse(rawA) } catch (e) { showDiffError(`JSON A parse error: ${e.message}`); return }
    try { b = JSON.parse(rawB) } catch (e) { showDiffError(`JSON B parse error: ${e.message}`); return }

    const diffs = []
    computeDiff(a, b, '', diffs)

    renderDiff(diffs, a, b)
  }

  function showDiffError(msg) {
    output.innerHTML = `<div style="color:var(--error);padding:1rem;font-size:0.85rem;">✕ ${escHtml(msg)}</div>`
    summary.style.display = 'none'
    output.dataset.raw = ''
  }

  function renderDiff(diffs, a, b) {
    if (diffs.length === 0) {
      output.innerHTML = `
        <div style="color:var(--success);padding:1rem;display:flex;align-items:center;gap:.5rem;font-size:.875rem;">
          <span>✓</span><span>JSON objects are identical — no differences found.</span>
        </div>`
      summary.style.display = 'none'
      output.dataset.raw = 'Objects are identical'
      return
    }

    const added   = diffs.filter(d => d.type === 'added').length
    const removed = diffs.filter(d => d.type === 'removed').length
    const changed = diffs.filter(d => d.type === 'changed').length

    let html = ''
    let rawText = ''

    for (const diff of diffs) {
      const path = diff.path || '(root)'
      const pathHtml = `<div class="diff-path">@ ${escHtml(path)}</div>`

      if (diff.type === 'added') {
        html += pathHtml
        html += `<div class="diff-line diff-added">+ ${escHtml(JSON.stringify(diff.b, null, 2))}</div>`
        rawText += `+ ${path}: ${JSON.stringify(diff.b)}\n`
      } else if (diff.type === 'removed') {
        html += pathHtml
        html += `<div class="diff-line diff-removed">- ${escHtml(JSON.stringify(diff.a, null, 2))}</div>`
        rawText += `- ${path}: ${JSON.stringify(diff.a)}\n`
      } else if (diff.type === 'changed') {
        html += pathHtml
        html += `<div class="diff-line diff-removed">- ${escHtml(JSON.stringify(diff.a, null, 2))}</div>`
        html += `<div class="diff-line diff-added">+ ${escHtml(JSON.stringify(diff.b, null, 2))}</div>`
        rawText += `~ ${path}: ${JSON.stringify(diff.a)} → ${JSON.stringify(diff.b)}\n`
      }
    }

    output.innerHTML = html
    output.dataset.raw = rawText

    // Summary
    summary.style.display = 'flex'
    document.getElementById('diff-added-count').textContent   = `${added} added`
    document.getElementById('diff-removed-count').textContent = `${removed} removed`
    document.getElementById('diff-changed-count').textContent = `${changed} changed`
  }
}

/**
 * Recursively compute differences between two JSON values.
 * Populates `diffs` array with {type, path, a?, b?} entries.
 */
export function computeDiff(a, b, path, diffs) {
  if (deepEqual(a, b)) return

  const typeA = jsonType(a)
  const typeB = jsonType(b)

  // Different types or one is primitive: record change
  if (typeA !== typeB || typeA === 'primitive') {
    diffs.push({ type: 'changed', path, a, b })
    return
  }

  if (typeA === 'array') {
    const maxLen = Math.max(a.length, b.length)
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}[${i}]`
      if (i >= a.length) {
        diffs.push({ type: 'added', path: childPath, b: b[i] })
      } else if (i >= b.length) {
        diffs.push({ type: 'removed', path: childPath, a: a[i] })
      } else {
        computeDiff(a[i], b[i], childPath, diffs)
      }
    }
    return
  }

  if (typeA === 'object') {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of allKeys) {
      const childPath = path ? `${path}.${key}` : key
      if (!(key in a)) {
        diffs.push({ type: 'added', path: childPath, b: b[key] })
      } else if (!(key in b)) {
        diffs.push({ type: 'removed', path: childPath, a: a[key] })
      } else {
        computeDiff(a[key], b[key], childPath, diffs)
      }
    }
  }
}

function deepEqual(a, b) {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  const keysA = Object.keys(a), keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every(k => k in b && deepEqual(a[k], b[k]))
}

function jsonType(val) {
  if (val === null) return 'primitive'
  if (Array.isArray(val)) return 'array'
  if (typeof val === 'object') return 'object'
  return 'primitive'
}

