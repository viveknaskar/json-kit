/* ============================================
   Utils.js — Shared utility functions
   ============================================ */

/**
 * Copy text to clipboard, fallback to execCommand for older browsers.
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    showSuccess('Copied to clipboard')
  } catch {
    showError('Failed to copy — please select and copy manually')
  }
}

/**
 * Trigger a browser download for a text file.
 * @param {string} content
 * @param {string} filename
 * @param {string} [mimeType]
 */
export function downloadText(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 100)
  showSuccess(`Downloaded ${filename}`)
}

/**
 * Show an error toast.
 * @param {string} msg
 */
export function showError(msg) {
  showToast(msg, 'error')
}

/**
 * Show a success toast.
 * @param {string} msg
 */
export function showSuccess(msg) {
  showToast(msg, 'success')
}

/**
 * Show a toast notification.
 * @param {string} msg
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} [duration]
 */
export function showToast(msg, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    document.body.appendChild(container)
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '!' }
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${escapeHtml(msg)}</span>`
  container.appendChild(toast)

  // Auto-dismiss
  const timer = setTimeout(() => dismiss(toast), duration)
  toast.addEventListener('click', () => {
    clearTimeout(timer)
    dismiss(toast)
  })
}

function dismiss(toast) {
  toast.classList.add('leaving')
  toast.addEventListener('animationend', () => toast.remove(), { once: true })
}

/**
 * Format bytes into human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

/**
 * Count characters, lines, and byte size of a string.
 * @param {string} text
 * @returns {{ chars: number, lines: number, size: string }}
 */
export function countStats(text) {
  if (!text) return { chars: 0, lines: 0, size: '0 B' }
  const chars = text.length
  const lines = text.split('\n').length
  const bytes = new TextEncoder().encode(text).length
  return { chars, lines, size: formatBytes(bytes) }
}

/**
 * Safely escape HTML for insertion into innerHTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Parse JSON safely, returning {data, error}.
 * @param {string} text
 * @returns {{ data: any, error: string|null }}
 */
export function safeParseJson(text) {
  try {
    return { data: JSON.parse(text), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

/**
 * Pretty-print JSON with a given indent.
 * @param {any} data
 * @param {number|string} indent
 * @returns {string}
 */
export function prettyJson(data, indent = 2) {
  return JSON.stringify(data, null, indent)
}

/**
 * Extract line/column from a JSON parse error message.
 * @param {string} errorMsg
 * @returns {{ line: number|null, col: number|null }}
 */
export function extractErrorPosition(errorMsg) {
  // Chrome: "Unexpected token ... at position N"
  const posMatch = errorMsg.match(/position (\d+)/i)
  // Firefox/Safari: "... at line N column N"
  const lineMatch = errorMsg.match(/line (\d+)/i)
  const colMatch  = errorMsg.match(/column (\d+)/i)
  return {
    pos:  posMatch  ? parseInt(posMatch[1])  : null,
    line: lineMatch ? parseInt(lineMatch[1]) : null,
    col:  colMatch  ? parseInt(colMatch[1])  : null,
  }
}
