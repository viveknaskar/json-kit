/* ============================================
   JsonToTypeScript.js — Generate TypeScript interfaces from JSON
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('j2ts-input')
  const output = document.getElementById('j2ts-output')
  const status = document.getElementById('j2ts-status')
  const stats  = document.getElementById('j2ts-input-stats')
  const nameEl = document.getElementById('j2ts-root-name')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('j2ts-btn').addEventListener('click', run)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run()
  })

  document.getElementById('j2ts-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('j2ts-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('j2ts-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'types.ts', 'text/plain')
  })

  function run() {
    const raw = input.value.trim()
    if (!raw) { setStatus('Paste JSON to generate TypeScript interfaces.', 'info'); return }
    try {
      const data   = JSON.parse(raw)
      const name   = (nameEl.value.trim() || 'Root').replace(/[^a-zA-Z0-9_]/g, '') || 'Root'
      const result = jsonToTypeScript(data, name)
      output.textContent = result
      output.className = 'output-area'
      output.dataset.raw = result
      const count = (result.match(/^export interface/gm) || []).length
      setStatus(`✓ Generated ${count} interface${count !== 1 ? 's' : ''}`, 'success')
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
 * Generate TypeScript interface definitions from a JSON value.
 *
 * @param {*} data
 * @param {string} [rootName='Root']
 * @returns {string}
 */
export function jsonToTypeScript(data, rootName = 'Root') {
  const interfaces = []
  const seen = new Set()

  function inferType(value, name) {
    if (value === null) return 'null'
    if (Array.isArray(value)) {
      if (value.length === 0) return 'unknown[]'
      const itemTypes = [...new Set(value.map(v => inferType(v, singular(name))))]
      const inner = itemTypes.length === 1 ? itemTypes[0] : `(${itemTypes.join(' | ')})`
      return `${inner}[]`
    }
    if (typeof value === 'object') {
      const ifaceName = toPascalCase(name) || 'Type'
      if (!seen.has(ifaceName)) {
        seen.add(ifaceName)
        const fields = Object.entries(value).map(([k, v]) => {
          const fieldType = inferType(v, k)
          const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k)
          return `  ${key}: ${fieldType};`
        })
        interfaces.push(`export interface ${ifaceName} {\n${fields.join('\n')}\n}`)
      }
      return ifaceName
    }
    if (typeof value === 'string')  return 'string'
    if (typeof value === 'number')  return 'number'
    if (typeof value === 'boolean') return 'boolean'
    return 'unknown'
  }

  inferType(data, rootName)
  return interfaces.reverse().join('\n\n')
}

function toPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, c => c.toUpperCase())
}

function singular(name) {
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y'
  if (name.endsWith('s') && !name.endsWith('ss')) return name.slice(0, -1)
  return name + 'Item'
}
