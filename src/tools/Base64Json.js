/* ============================================
   Base64Json.js — Base64 encode / decode JSON (or any text)
   ============================================ */

import { copyToClipboard, downloadText, countStats } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('b64-input')
  const output = document.getElementById('b64-output')
  const status = document.getElementById('b64-status')
  const stats  = document.getElementById('b64-input-stats')

  if (!input) return

  input.addEventListener('input', () => {
    const s = countStats(input.value)
    stats.innerHTML = `<span>${s.chars.toLocaleString()} chars</span><span>${s.lines} lines</span><span>${s.size}</span>`
  })

  document.getElementById('b64-encode-btn').addEventListener('click', runEncode)
  document.getElementById('b64-decode-btn').addEventListener('click', runDecode)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runEncode()
  })

  document.getElementById('b64-clear').addEventListener('click', () => {
    input.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
    stats.innerHTML = '<span>0 chars</span>'
  })

  document.getElementById('b64-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('b64-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'output.txt', 'text/plain')
  })

  function runEncode() {
    const raw = input.value
    if (!raw) { setStatus('Paste text to encode.', 'info'); return }
    const result = encodeBase64(raw)
    output.textContent = result
    output.className = 'output-area'
    output.dataset.raw = result
    setStatus(`✓ Encoded · ${raw.length.toLocaleString()} chars → ${result.length.toLocaleString()} chars`, 'success')
  }

  function runDecode() {
    const raw = input.value.trim()
    if (!raw) { setStatus('Paste a Base64 string to decode.', 'info'); return }
    try {
      const result = decodeBase64(raw)
      output.textContent = result
      output.className = 'output-area'
      output.dataset.raw = result
      setStatus(`✓ Decoded · ${result.length.toLocaleString()} chars`, 'success')
    } catch (e) {
      output.textContent = ''
      output.className = 'output-area empty'
      output.dataset.raw = ''
      setStatus(`✕ Invalid Base64: ${e.message}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

/**
 * Encode a UTF-8 string to Base64.
 * @param {string} text
 * @returns {string}
 */
export function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text)
  const bin   = Array.from(bytes, b => String.fromCodePoint(b)).join('')
  return btoa(bin)
}

/**
 * Decode a Base64 string back to UTF-8 text.
 * @param {string} b64
 * @returns {string}
 */
export function decodeBase64(b64) {
  const bin   = atob(b64)
  const bytes = Uint8Array.from(bin, c => c.codePointAt(0))
  return new TextDecoder().decode(bytes)
}
