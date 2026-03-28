/* ============================================
   XmlToJson.js — Convert XML to JSON
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('x2j-input')
  const output = document.getElementById('x2j-output')
  const status = document.getElementById('x2j-status')
  const stats  = document.getElementById('x2j-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('x2j-btn').addEventListener('click', runConvert)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runConvert()
  })

  document.getElementById('x2j-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('x2j-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('x2j-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'output.json', 'application/json')
  })

  function runConvert() {
    const raw = input.value.trim()
    if (!raw) {
      setStatus('Paste XML to convert to JSON.', 'info')
      return
    }
    try {
      const parsed = xmlToJson(raw)
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
 * Parse an XML string into a JavaScript value.
 *
 * Rules:
 *  - The root element is unwrapped (its children are returned).
 *  - Elements with only text content are coerced to number/boolean/null/string.
 *  - Elements with child elements become objects.
 *  - Repeated sibling elements with the same tag become an array.
 *  - Self-closing elements become null.
 *  - XML declarations, comments, and CDATA sections are handled gracefully.
 *
 * @param {string} xmlStr
 * @returns {*}
 */
export function xmlToJson(xmlStr) {
  let pos = 0
  const s = xmlStr.trim()

  // Skip XML declaration
  if (s.startsWith('<?xml')) {
    const end = s.indexOf('?>', pos)
    if (end !== -1) pos = end + 2
  }

  skip()

  const root = parseNode()
  if (!root) throw new Error('No root element found')

  // Unwrap the root element so callers get the inner content
  const rootVal = Object.values(root)[0]
  return rootVal ?? {}

  /* ---- helpers ---- */

  function skip() {
    for (;;) {
      // whitespace
      while (pos < s.length && s[pos] <= ' ') pos++
      // comments
      if (s.startsWith('<!--', pos)) {
        const end = s.indexOf('-->', pos)
        if (end === -1) break
        pos = end + 3
        continue
      }
      // processing instructions
      if (s.startsWith('<?', pos)) {
        const end = s.indexOf('?>', pos)
        if (end === -1) break
        pos = end + 2
        continue
      }
      break
    }
  }

  function parseNode() {
    skip()
    if (pos >= s.length || s[pos] !== '<' || s.startsWith('</', pos)) return null

    pos++ // consume <

    // Tag name
    const nameMatch = s.slice(pos).match(/^([\w:.-]+)/)
    if (!nameMatch) throw new Error(`Invalid tag at position ${pos}`)
    const tag = nameMatch[1]
    pos += tag.length

    // Skip attributes
    while (pos < s.length && s[pos] !== '>' && !(s[pos] === '/' && s[pos + 1] === '>')) {
      if (s[pos] <= ' ') { pos++; continue }
      const attr = s.slice(pos).match(/^[\w:.-]+=(?:"[^"]*"|'[^']*')/)
      if (attr) { pos += attr[0].length; continue }
      pos++
    }

    // Self-closing?
    if (s[pos] === '/' && s[pos + 1] === '>') {
      pos += 2
      return { [tag]: null }
    }

    if (s[pos] !== '>') throw new Error(`Expected > at position ${pos}`)
    pos++ // consume >

    // Parse content
    const children = {}
    let text = ''

    while (pos < s.length) {
      skip()

      // Closing tag?
      if (s.startsWith('</', pos)) {
        const end = s.indexOf('>', pos)
        if (end !== -1) pos = end + 1
        break
      }

      // CDATA?
      if (s.startsWith('<![CDATA[', pos)) {
        const end = s.indexOf(']]>', pos)
        if (end === -1) throw new Error('Unclosed CDATA section')
        text += s.slice(pos + 9, end)
        pos = end + 3
        continue
      }

      // Child element?
      if (s[pos] === '<') {
        const child = parseNode()
        if (child) {
          const [cTag, cVal] = Object.entries(child)[0]
          if (cTag in children) {
            if (!Array.isArray(children[cTag])) children[cTag] = [children[cTag]]
            children[cTag].push(cVal)
          } else {
            children[cTag] = cVal
          }
        }
        continue
      }

      // Text content
      const end = s.indexOf('<', pos)
      text += end === -1 ? s.slice(pos) : s.slice(pos, end)
      pos = end === -1 ? s.length : end
    }

    if (Object.keys(children).length > 0) return { [tag]: children }

    const trimmed = unescapeXml(text.trim())
    if (!trimmed) return { [tag]: null }
    return { [tag]: coerce(trimmed) }
  }
}

function unescapeXml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function coerce(str) {
  if (str === 'null')  return null
  if (str === 'true')  return true
  if (str === 'false') return false
  const n = Number(str)
  if (!isNaN(n) && str !== '') return n
  return str
}
