/* ============================================
   Theme.js — Dark / light mode toggle
   ============================================ */

const STORAGE_KEY = 'json-kit-theme'

// ---- Audio ----

let _audioCtx = null
let _clickBuffer = null

async function _loadClick() {
  if (_clickBuffer) return _clickBuffer
  if (!_audioCtx) _audioCtx = new AudioContext()
  const res = await fetch('/json-kit/audio/click.wav')
  const arrayBuf = await res.arrayBuffer()
  _clickBuffer = await _audioCtx.decodeAudioData(arrayBuf)
  return _clickBuffer
}

async function _playClick() {
  try {
    const buffer = await _loadClick()
    if (!_audioCtx) return
    if (_audioCtx.state === 'suspended') await _audioCtx.resume()
    const source = _audioCtx.createBufferSource()
    const gain   = _audioCtx.createGain()
    source.buffer = buffer
    gain.gain.value = 0.5
    source.connect(gain)
    gain.connect(_audioCtx.destination)
    source.start(0)
  } catch {
    // silently fail if audio is unavailable or blocked
  }
}

// ---- Theme ----

export function initTheme() {
  _updateToggle()

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = _current() === 'dark' ? 'light' : 'dark'
    _playClick()
    _apply(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch (_) {}
    _updateToggle()
  })

  // Sync with OS preference changes only when the user has no saved choice
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    try { if (localStorage.getItem(STORAGE_KEY)) return } catch (_) {}
    _apply(e.matches ? 'dark' : 'light')
    _updateToggle()
  })
}

function _current() {
  return document.documentElement.getAttribute('data-theme') || 'dark'
}

function _apply(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function _updateToggle() {
  const btn = document.getElementById('theme-toggle')
  if (!btn) return
  const dark = _current() === 'dark'
  btn.textContent = dark ? '☀' : '☾'
  btn.title       = dark ? 'Switch to light mode' : 'Switch to dark mode'
  btn.setAttribute('aria-label', btn.title)
}
