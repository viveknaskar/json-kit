/* ============================================
   CsvToJson.js — Convert CSV to JSON array
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('c2j-input')
  const output = document.getElementById('c2j-output')
  const status = document.getElementById('c2j-status')
  const stats  = document.getElementById('c2j-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('c2j-btn').addEventListener('click', runConvert)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runConvert()
  })

  document.getElementById('c2j-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('c2j-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('c2j-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'data.json', 'application/json')
  })

  function runConvert() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste CSV data to convert.', 'info')
      return
    }

    try {
      const result = csvToJson(raw)
      const json = JSON.stringify(result, null, 2)
      output.textContent = json
      output.className = 'output-area'
      output.dataset.raw = json
      setStatus(`✓ Converted ${result.length} rows`, 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ ${e.message}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Parse CSV string into array of objects.
 * Handles quoted fields with embedded commas, newlines and doubled quotes.
 */
export function csvToJson(csv) {
  const lines = parseCsvLines(csv)
  if (lines.length === 0) throw new Error('CSV is empty')

  const headers = lines[0]
  if (headers.length === 0) throw new Error('No header row found')

  const records = []
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue // skip blank lines
    const obj = {}
    headers.forEach((header, idx) => {
      const cell = row[idx] !== undefined ? row[idx] : ''
      obj[header] = coerce(cell)
    })
    records.push(obj)
  }

  return records
}

/**
 * Parse CSV into array of arrays of strings.
 * Handles quoted fields containing commas, newlines and escaped quotes.
 */
function parseCsvLines(text) {
  const rows = []
  let row = []
  let i = 0
  const n = text.length

  while (i < n) {
    if (text[i] === '"') {
      // Quoted field
      i++ // skip opening quote
      let field = ''
      while (i < n) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') {
            field += '"'
            i += 2
          } else {
            i++ // skip closing quote
            break
          }
        } else {
          field += text[i++]
        }
      }
      row.push(field)
      // Skip separator or newline
      if (i < n && text[i] === ',') i++
    } else {
      // Unquoted field: read until comma or newline
      let start = i
      while (i < n && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') i++
      row.push(text.slice(start, i))
      if (i < n && text[i] === ',') i++
    }

    // Row terminator
    if (i < n && (text[i] === '\n' || text[i] === '\r')) {
      if (text[i] === '\r' && text[i + 1] === '\n') i++ // CRLF
      i++
      rows.push(row)
      row = []
    }
  }

  // Final row (no trailing newline)
  if (row.length > 0) rows.push(row)

  return rows
}

/**
 * Coerce a CSV string cell to number/boolean/null where obvious.
 */
function coerce(str) {
  if (str === '') return ''
  if (str === 'true') return true
  if (str === 'false') return false
  if (str === 'null' || str === 'NULL') return null
  const n = Number(str)
  if (!isNaN(n) && str.trim() !== '') return n
  return str
}
