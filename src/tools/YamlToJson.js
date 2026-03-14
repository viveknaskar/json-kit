/* ============================================
   YamlToJson.js — Parse basic YAML to JSON
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('y2j-input')
  const output = document.getElementById('y2j-output')
  const status = document.getElementById('y2j-status')
  const stats  = document.getElementById('y2j-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('y2j-btn').addEventListener('click', runConvert)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runConvert()
  })

  document.getElementById('y2j-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('y2j-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('y2j-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'output.json', 'application/json')
  })

  function runConvert() {
    const raw = input.value
    if (!raw.trim()) {
      setStatus('Paste YAML to convert.', 'info')
      return
    }

    try {
      const parsed = parseYaml(raw)
      const json = JSON.stringify(parsed, null, 2)
      output.textContent = json
      output.className = 'output-area'
      output.dataset.raw = json
      setStatus(`✓ Converted successfully`, 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ Parse error: ${e.message}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Parse basic YAML string into a JavaScript value.
 * Supports: scalars, sequences (- item), mappings (key: value), indentation nesting,
 * quoted strings (single and double), multi-line blocks (|  >), anchors ignored.
 */
export function parseYaml(text) {
  // Remove YAML document markers
  text = text.replace(/^---\s*\n?/, '').replace(/\n\.\.\.\s*$/, '')

  const lines = text.split('\n')
  const tokens = tokenize(lines)
  const { value } = parseValue(tokens, 0, -1)
  return value
}

function tokenize(lines) {
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip comments and fully blank lines after stripping
    const stripped = line.replace(/#(?!['"\\]).*$/, '').trimEnd() // remove inline comments
    if (stripped.trim() === '') {
      result.push({ type: 'blank', indent: 0, raw: stripped, lineNum: i + 1 })
      continue
    }
    const indent = stripped.length - stripped.trimStart().length
    const content = stripped.trimStart()
    result.push({ type: 'content', indent, content, raw: stripped, lineNum: i + 1 })
  }
  return result
}

function parseValue(tokens, start, parentIndent) {
  // Skip blanks at start
  while (start < tokens.length && tokens[start].type === 'blank') start++
  if (start >= tokens.length) return { value: null, next: start }

  const first = tokens[start]
  if (first.type !== 'content') return { value: null, next: start + 1 }
  if (parentIndent >= first.indent) return { value: null, next: start }

  // Detect if this block is a sequence
  if (first.content.startsWith('- ') || first.content === '-') {
    return parseSequence(tokens, start, parentIndent)
  }

  // Detect if this block is a mapping
  if (isMapping(first.content)) {
    return parseMapping(tokens, start, parentIndent)
  }

  // Scalar
  return { value: parseScalar(first.content), next: start + 1 }
}

function isMapping(content) {
  // key: value  or  key:
  // But not "- item" and not plain scalars containing ":"
  // We look for key followed by ': '  or ': ' at end
  return /^[^'"{\[\|>].*?:\s/.test(content) ||
         /^[^'"{\[\|>].*?:$/.test(content) ||
         /^'[^']*':\s/.test(content) ||
         /^"[^"]*":\s/.test(content)
}

function parseMapping(tokens, start, parentIndent) {
  const obj = {}
  let i = start
  const baseIndent = tokens[start].indent

  while (i < tokens.length) {
    const tok = tokens[i]
    if (tok.type === 'blank') { i++; continue }
    if (tok.indent < baseIndent) break
    if (tok.indent > baseIndent) { i++; continue } // shouldn't happen at top of loop

    const content = tok.content
    const colonIdx = findKeyColon(content)
    if (colonIdx === -1) { i++; continue }

    const rawKey = content.slice(0, colonIdx).trim()
    const key = unquoteScalar(rawKey)
    const afterColon = content.slice(colonIdx + 1).trim()

    if (afterColon === '' || afterColon === '|' || afterColon === '>') {
      // Value is on following lines
      i++
      // Skip blanks
      while (i < tokens.length && tokens[i].type === 'blank') i++

      if (i < tokens.length && tokens[i].indent > baseIndent) {
        const { value, next } = parseValue(tokens, i, baseIndent)
        obj[key] = value
        i = next
      } else {
        obj[key] = null
      }
    } else {
      // Inline value
      obj[key] = parseScalar(afterColon)
      i++
    }
  }

  return { value: obj, next: i }
}

function parseSequence(tokens, start, parentIndent) {
  const arr = []
  let i = start
  const baseIndent = tokens[start].indent

  while (i < tokens.length) {
    const tok = tokens[i]
    if (tok.type === 'blank') { i++; continue }
    if (tok.indent < baseIndent) break
    if (tok.indent > baseIndent) { i++; continue }

    if (!tok.content.startsWith('- ') && tok.content !== '-') { i++; continue }

    const afterDash = tok.content.slice(1).trim()

    if (afterDash === '') {
      // Value on next lines
      i++
      while (i < tokens.length && tokens[i].type === 'blank') i++
      if (i < tokens.length && tokens[i].indent > baseIndent) {
        const { value, next } = parseValue(tokens, i, baseIndent)
        arr.push(value)
        i = next
      } else {
        arr.push(null)
      }
    } else if (isMapping(afterDash)) {
      // Inline mapping start — collect mapping lines at indent + 2
      // Treat the "- key: val" line as if it starts a mapping at baseIndent+2
      const syntheticLines = [{ type: 'content', indent: baseIndent + 2, content: afterDash, lineNum: tok.lineNum }]
      i++
      while (i < tokens.length && tokens[i].type !== 'blank' && tokens[i].indent > baseIndent) {
        syntheticLines.push(tokens[i])
        i++
      }
      const { value } = parseMapping(syntheticLines, 0, baseIndent + 1)
      arr.push(value)
    } else {
      arr.push(parseScalar(afterDash))
      i++
    }
  }

  return { value: arr, next: i }
}

/**
 * Find the colon that separates key from value (not inside quotes).
 */
function findKeyColon(content) {
  let inSingle = false, inDouble = false
  for (let i = 0; i < content.length - 1; i++) {
    const c = content[i]
    if (c === "'" && !inDouble) inSingle = !inSingle
    if (c === '"' && !inSingle) inDouble = !inDouble
    if (!inSingle && !inDouble && c === ':') {
      const next = content[i + 1]
      if (next === ' ' || next === '\t' || i === content.length - 1 || !next) return i
    }
  }
  // Also check trailing colon (key with empty value)
  if (content.endsWith(':')) return content.length - 1
  return -1
}

/**
 * Remove surrounding quotes from a scalar string key.
 */
function unquoteScalar(str) {
  if ((str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1).replace(/''/g, "'")
  }
  return str
}

/**
 * Parse a YAML scalar value: number, boolean, null, quoted string, or plain string.
 */
export function parseScalar(raw) {
  const s = raw.trim()
  if (s === '' || s === '~' || s === 'null' || s === 'Null' || s === 'NULL') return null
  if (s === 'true' || s === 'True' || s === 'TRUE' || s === 'yes' || s === 'on') return true
  if (s === 'false' || s === 'False' || s === 'FALSE' || s === 'no' || s === 'off') return false

  // Quoted strings
  if ((s.startsWith('"') && s.endsWith('"')) && s.length >= 2) {
    return s.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
  if ((s.startsWith("'") && s.endsWith("'")) && s.length >= 2) {
    return s.slice(1, -1).replace(/''/g, "'")
  }

  // Integer
  if (/^-?0x[0-9a-fA-F]+$/.test(s)) return parseInt(s, 16)
  if (/^-?0o[0-7]+$/.test(s)) return parseInt(s.replace('0o', ''), 8)
  if (/^-?\d+$/.test(s)) return parseInt(s, 10)

  // Float
  if (/^-?\d+\.\d*([eE][+-]?\d+)?$/.test(s) || /^-?\d*\.\d+([eE][+-]?\d+)?$/.test(s)) return parseFloat(s)
  if (s === '.inf' || s === '.Inf' || s === '.INF') return Infinity
  if (s === '-.inf' || s === '-.Inf' || s === '-.INF') return -Infinity
  if (s === '.nan' || s === '.NaN' || s === '.NAN') return NaN

  // Inline JSON array/object
  if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
    try { return JSON.parse(s) } catch (_) {}
  }

  return s
}
