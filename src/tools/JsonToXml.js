/* ============================================
   JsonToXml.js — Convert JSON to XML
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('j2x-input')
  const output = document.getElementById('j2x-output')
  const status = document.getElementById('j2x-status')
  const stats  = document.getElementById('j2x-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('j2x-btn').addEventListener('click', runConvert)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runConvert()
  })

  document.getElementById('j2x-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('j2x-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('j2x-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'output.xml', 'application/xml')
  })

  function runConvert() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste JSON to convert to XML.', 'info')
      return
    }
    try {
      const parsed = JSON.parse(raw)
      const xml = jsonToXml(parsed)
      output.textContent = xml
      output.className = 'output-area'
      output.dataset.raw = xml
      const lines = xml.split('\n').length
      setStatus(`✓ Converted · ${lines} lines`, 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ Invalid JSON: ${e.message.split(' at')[0]}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Sanitize a JSON key to a valid XML element name.
 * XML names must start with a letter or underscore.
 */
function xmlName(key) {
  let n = String(key).replace(/[^a-zA-Z0-9\-_.]/g, '_')
  if (/^[^a-zA-Z_]/.test(n)) n = '_' + n
  return n || '_'
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function valueToXml(val, key, depth) {
  const pad = '  '.repeat(depth)
  const tag = xmlName(key)

  if (val === null || val === undefined) {
    return `${pad}<${tag}/>`
  }

  if (typeof val !== 'object') {
    return `${pad}<${tag}>${escapeXml(val)}</${tag}>`
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return `${pad}<${tag}/>`
    return val.map(item => valueToXml(item, key, depth)).join('\n')
  }

  const entries = Object.entries(val)
  if (entries.length === 0) return `${pad}<${tag}/>`

  const children = entries.map(([k, v]) => {
    if (Array.isArray(v)) {
      if (v.length === 0) return `${'  '.repeat(depth + 1)}<${xmlName(k)}/>`
      return v.map(item => valueToXml(item, k, depth + 1)).join('\n')
    }
    return valueToXml(v, k, depth + 1)
  }).join('\n')

  return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`
}

/**
 * Convert a parsed JSON value to an XML string.
 * The output is always wrapped in a <root> element.
 * @param {*} data
 * @returns {string}
 */
export function jsonToXml(data) {
  let body
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    body = Object.entries(data).map(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length === 0) return `  <${xmlName(k)}/>`
        return v.map(item => valueToXml(item, k, 1)).join('\n')
      }
      return valueToXml(v, k, 1)
    }).join('\n')
  } else if (Array.isArray(data)) {
    body = data.length === 0
      ? ''
      : data.map(item => valueToXml(item, 'item', 1)).join('\n')
  } else {
    body = data === null ? '' : `  <value>${escapeXml(data)}</value>`
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${body}\n</root>`
}
