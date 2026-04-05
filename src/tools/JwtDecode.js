/* ============================================
   JwtDecode.js — Decode and inspect JWT tokens
   ============================================ */

import { copyToClipboard, escapeHtml as escHtml } from '../core/Utils.js'

export function init() {
  const input  = document.getElementById('jd-input')
  const output = document.getElementById('jd-output')
  const status = document.getElementById('jd-status')

  if (!input) return

  // Auto-decode as the user types / pastes
  input.addEventListener('input', run)

  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run()
  })

  document.getElementById('jd-btn').addEventListener('click', run)

  document.getElementById('jd-clear').addEventListener('click', () => {
    input.value = ''
    output.innerHTML = '<div class="empty-state"><p>Paste a JWT token to decode it.</p></div>'
    setStatus('', '')
  })

  // Event delegation for copy buttons inside the rendered output
  let _decoded = null
  output.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-jd-copy]')
    if (!btn || !_decoded) return
    const which = btn.dataset.jdCopy
    if (which === 'header')  copyToClipboard(JSON.stringify(_decoded.header,  null, 2))
    if (which === 'payload') copyToClipboard(JSON.stringify(_decoded.payload, null, 2))
  })

  function run() {
    const raw = input.value.trim()
    if (!raw) {
      output.innerHTML = '<div class="empty-state"><p>Paste a JWT token to decode it.</p></div>'
      setStatus('', '')
      return
    }

    try {
      _decoded = decodeJwt(raw)
      output.innerHTML = renderOutput(_decoded)
      setStatus('', '')
    } catch (e) {
      _decoded = null
      output.innerHTML = `
        <div class="jwt-error">
          <span style="font-size:1.1rem;">✕</span>
          <span>${escHtml(e.message)}</span>
        </div>`
      setStatus(`✕ ${e.message}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

// ---- Core decoder ----

/**
 * Decode a JWT into its three parts.
 * @param {string} token
 * @returns {{ header: object, payload: object, signature: string }}
 */
export function decodeJwt(token) {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    throw new Error('Not a valid JWT — expected 3 dot-separated parts')
  }

  let header, payload
  try {
    header = JSON.parse(b64urlDecode(parts[0]))
  } catch {
    throw new Error('Header could not be decoded — is this a valid JWT?')
  }
  try {
    payload = JSON.parse(b64urlDecode(parts[1]))
  } catch {
    throw new Error('Payload could not be decoded — is this a valid JWT?')
  }

  return { header, payload, signature: parts[2] }
}

function b64urlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
  const binary = atob(padded)
  const bytes  = Uint8Array.from(binary, c => c.codePointAt(0))
  return new TextDecoder().decode(bytes)
}

// ---- Rendering ----

function renderOutput({ header, payload, signature }) {
  const { type, icon, label, detail } = getStatus(payload)
  const headerJson  = JSON.stringify(header,  null, 2)
  const payloadJson = JSON.stringify(payload, null, 2)

  return `
    <div class="jwt-status jwt-status-${type}">
      <span class="jwt-status-icon">${icon}</span>
      <div>
        <span class="jwt-status-label">${label}</span>
        <span class="jwt-status-detail">${detail}</span>
      </div>
    </div>

    <div class="jwt-section">
      <div class="jwt-section-title">
        <span>Header</span>
        <button class="btn btn-ghost btn-sm" data-jd-copy="header">Copy</button>
      </div>
      <pre class="jwt-pre">${escHtml(headerJson)}</pre>
    </div>

    <div class="jwt-section">
      <div class="jwt-section-title">
        <span>Payload</span>
        <button class="btn btn-ghost btn-sm" data-jd-copy="payload">Copy</button>
      </div>
      <pre class="jwt-pre">${escHtml(payloadJson)}</pre>
      ${renderClaims(payload)}
    </div>

    <div class="jwt-section">
      <div class="jwt-section-title"><span>Signature</span></div>
      <div class="jwt-sig">${escHtml(signature)}</div>
      <p class="jwt-note">Signature verification requires the secret or public key and is not supported client-side without it.</p>
    </div>
  `
}

const CLAIM_NAMES = {
  iss: 'Issuer',        sub: 'Subject',          aud: 'Audience',
  exp: 'Expires At',    nbf: 'Not Before',        iat: 'Issued At',
  jti: 'JWT ID',        azp: 'Authorized Party',  scope: 'Scope',
  email: 'Email',       email_verified: 'Email Verified',
  name: 'Name',         given_name: 'Given Name', family_name: 'Family Name',
  picture: 'Picture',   locale: 'Locale',         roles: 'Roles',
  permissions: 'Permissions',
}

const TIME_CLAIMS = new Set(['iat', 'exp', 'nbf'])

function renderClaims(payload) {
  const rows = Object.entries(payload).map(([k, v]) => {
    const name    = CLAIM_NAMES[k] || k
    const isTime  = TIME_CLAIMS.has(k) && typeof v === 'number'
    const display = isTime
      ? `${v} <span class="jwt-claim-date">${formatDate(v)}</span>`
      : escHtml(JSON.stringify(v))
    return `
      <div class="jwt-claim">
        <span class="jwt-claim-key">${escHtml(k)}</span>
        <span class="jwt-claim-name">${escHtml(name)}</span>
        <span class="jwt-claim-val">${display}</span>
      </div>`
  }).join('')

  return `<div class="jwt-claims">${rows}</div>`
}

// ---- Status ----

function getStatus(payload) {
  const now = Math.floor(Date.now() / 1000)

  if (payload.nbf && typeof payload.nbf === 'number' && now < payload.nbf) {
    return {
      type: 'warning', icon: '⚠',
      label: 'Not Yet Valid',
      detail: `Valid from ${formatDate(payload.nbf)}`,
    }
  }
  if (payload.exp && typeof payload.exp === 'number') {
    if (now > payload.exp) {
      return {
        type: 'error', icon: '✕',
        label: 'Expired',
        detail: `Expired ${formatRelative(now - payload.exp)} ago (${formatDate(payload.exp)})`,
      }
    }
    return {
      type: 'success', icon: '✓',
      label: 'Valid',
      detail: `Expires in ${formatRelative(payload.exp - now)} (${formatDate(payload.exp)})`,
    }
  }
  return {
    type: 'info', icon: 'ℹ',
    label: 'No Expiry',
    detail: 'Token has no exp claim',
  }
}

// ---- Helpers ----

function formatDate(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleString()
}

function formatRelative(seconds) {
  if (seconds < 60)   return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (seconds < 86400) return `${h}h ${m}m`
  const d = Math.floor(seconds / 86400)
  return `${d}d ${Math.floor((seconds % 86400) / 3600)}h`
}
