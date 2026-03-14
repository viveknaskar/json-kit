/* ============================================
   JsonToYaml.js — Convert JSON to YAML (no external lib)
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('j2y-input')
  const output = document.getElementById('j2y-output')
  const status = document.getElementById('j2y-status')
  const stats  = document.getElementById('j2y-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('j2y-btn').addEventListener('click', runConvert)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runConvert()
  })

  document.getElementById('j2y-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('j2y-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('j2y-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'config.yaml', 'text/yaml')
  })

  function runConvert() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste JSON to convert to YAML.', 'info')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const yaml = jsonToYaml(parsed)
      output.textContent = yaml
      output.className = 'output-area'
      output.dataset.raw = yaml
      const lines = yaml.split('\n').length
      setStatus(`✓ Converted · ${lines} YAML lines`, 'success')
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

// YAML special characters that require quoting
const YAML_SPECIAL = /[:{}\[\],&*#?|<>=!%@`\-]/
const YAML_NEEDS_QUOTE = /^[\s]|[\s]$|^(true|false|null|yes|no|on|off|~)$/i

/**
 * Convert a JSON value to YAML string.
 * @param {any} val
 * @param {number} indent - current indentation level
 * @returns {string}
 */
export function jsonToYaml(val, indent = 0) {
  return serializeValue(val, indent)
}

function serializeValue(val, indent) {
  if (val === null) return 'null'
  if (val === true)  return 'true'
  if (val === false) return 'false'
  if (typeof val === 'number') {
    if (!isFinite(val)) return '.inf'
    return String(val)
  }
  if (typeof val === 'string') return serializeString(val)
  if (Array.isArray(val)) return serializeArray(val, indent)
  if (typeof val === 'object') return serializeObject(val, indent)
  return String(val)
}

function serializeString(str) {
  if (str === '') return "''"
  // Multi-line: use literal block scalar
  if (str.includes('\n')) {
    const escaped = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    return `"${escaped}"`
  }
  // Check if quoting is needed
  if (YAML_NEEDS_QUOTE.test(str) || YAML_SPECIAL.test(str) || /^\d/.test(str) || str.includes('#')) {
    // Single-quote if no single quotes inside, else double-quote
    if (!str.includes("'")) {
      return `'${str}'`
    }
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return str
}

function serializeArray(arr, indent) {
  if (arr.length === 0) return '[]'
  const pad = '  '.repeat(indent + 1)
  const lines = arr.map(item => {
    const v = item
    if (v !== null && typeof v === 'object') {
      // Multi-key object inline in array — indent sub-keys
      const sub = serializeValue(v, indent + 1)
      const firstNl = sub.indexOf('\n')
      if (firstNl === -1) return `- ${sub}`
      // First key on same line as dash, rest indented
      return `- ${sub}`
    }
    return `- ${serializeValue(v, indent + 1)}`
  })
  return '\n' + lines.map(l => pad.slice(2) + l).join('\n')
}

function serializeObject(obj, indent) {
  const keys = Object.keys(obj)
  if (keys.length === 0) return '{}'
  const pad = '  '.repeat(indent + 1)
  const lines = []
  for (const key of keys) {
    const val = obj[key]
    const yamlKey = serializeKey(key)
    if (val === null || typeof val !== 'object') {
      lines.push(`${pad}${yamlKey}: ${serializeValue(val, indent + 1)}`)
    } else if (Array.isArray(val)) {
      const serialized = serializeArray(val, indent + 1)
      if (serialized.startsWith('\n')) {
        lines.push(`${pad}${yamlKey}:${serialized.replace(/\n/g, '\n' + pad)}`)
      } else {
        lines.push(`${pad}${yamlKey}: ${serialized}`)
      }
    } else {
      // Nested object
      const nested = serializeObject(val, indent + 1)
      lines.push(`${pad}${yamlKey}:\n${nested}`)
    }
  }
  return lines.join('\n')
}

function serializeKey(key) {
  if (/[:{}\[\],&*#?|<>=!%@`\s"']/.test(key) || YAML_NEEDS_QUOTE.test(key)) {
    return `'${key.replace(/'/g, "''")}'`
  }
  return key
}
