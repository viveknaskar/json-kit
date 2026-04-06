/* ============================================
   MockJson.js — Generate mock data from a JSON Schema
   ============================================ */

import { copyToClipboard, downloadText } from '../core/Utils.js'

export function init() {
  const schemaEl = document.getElementById('mg-schema')
  const countEl  = document.getElementById('mg-count')
  const output   = document.getElementById('mg-output')
  const status   = document.getElementById('mg-status')

  if (!schemaEl) return

  document.getElementById('mg-btn').addEventListener('click', run)
  document.getElementById('mg-regen').addEventListener('click', run)

  schemaEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run()
  })

  document.getElementById('mg-clear').addEventListener('click', () => {
    schemaEl.value = ''
    output.textContent = ''
    output.className = 'output-area empty'
    output.dataset.raw = ''
    setStatus('', '')
  })

  document.getElementById('mg-copy').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) copyToClipboard(text)
  })

  document.getElementById('mg-download').addEventListener('click', () => {
    const text = output.dataset.raw
    if (text) downloadText(text, 'mock.json', 'application/json')
  })

  function run() {
    const raw = schemaEl.value.trim()
    if (!raw) { setStatus('Paste a JSON Schema to generate mock data.', 'info'); return }

    let schema
    try {
      schema = JSON.parse(raw)
    } catch (e) {
      setStatus(`✕ Schema parse error: ${e.message.split('\n')[0]}`, 'error')
      return
    }

    const count = Math.max(1, Math.min(50, parseInt(countEl.value, 10) || 3))

    try {
      const generated = count === 1
        ? generateValue(schema)
        : Array.from({ length: count }, () => generateValue(schema))
      const json = JSON.stringify(generated, null, 2)
      output.textContent = json
      output.className = 'output-area'
      output.dataset.raw = json
      setStatus(`✓ Generated ${count === 1 ? '1 record' : count + ' records'}`, 'success')
    } catch (e) {
      setStatus(`✕ ${e.message}`, 'error')
    }
  }

  function setStatus(msg, type) {
    status.textContent = msg
    status.className = `status-message${msg ? ' show ' + type : ''}`
  }
}

// ---- Mock generation engine ----

const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack']
const LAST_NAMES  = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore']
const DOMAINS     = ['example.com', 'test.org', 'demo.net', 'sample.io', 'mock.dev']
const WORDS       = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do']

/**
 * Generate a mock value conforming to a JSON Schema.
 * @param {object} schema
 * @param {string} [key] — parent property name, used for semantic hints
 * @returns {*}
 */
export function generateValue(schema, key = '') {
  if (!schema || typeof schema !== 'object') return null

  if ('const' in schema) return schema.const
  if (schema.enum)  return pick(schema.enum)
  if (schema.anyOf) return generateValue(pick(schema.anyOf), key)
  if (schema.oneOf) return generateValue(pick(schema.oneOf), key)

  if (schema.allOf) {
    const safe = schema.allOf.filter(s => s && typeof s === 'object' && !Array.isArray(s))
    const merged = {}
    for (const s of safe) {
      for (const k of Object.keys(s)) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue
        merged[k] = s[k]
      }
    }
    return generateValue(merged, key)
  }

  const type = resolveType(schema, key)

  switch (type) {
    case 'object':  return generateObject(schema)
    case 'array':   return generateArray(schema)
    case 'string':  return generateString(schema, key)
    case 'number':  return generateNumber(schema)
    case 'integer': return generateInteger(schema, key)
    case 'boolean': return Math.random() < 0.5
    case 'null':    return null
    default:        return null
  }
}

function resolveType(schema, key) {
  if (schema.type) {
    return Array.isArray(schema.type) ? pick(schema.type.filter(t => t !== 'null')) : schema.type
  }
  if (schema.properties || schema.additionalProperties) return 'object'
  if (schema.items) return 'array'
  return guessTypeFromKey(key)
}

function guessTypeFromKey(key) {
  if (!key) return 'string'
  const k = key.toLowerCase()
  if (/^(is|has|can|was|did|enabled|active|visible|checked|flag)/.test(k)) return 'boolean'
  if (/(count|num|number|total|amount|qty|quantity|size|length|age|year|price|cost)/.test(k)) return 'integer'
  return 'string'
}

function generateObject(schema) {
  const obj = {}
  const props    = schema.properties || {}
  const required = new Set(schema.required || [])

  for (const [key, subSchema] of Object.entries(props)) {
    if (required.has(key) || Math.random() > 0.2) {
      obj[key] = generateValue(subSchema, key)
    }
  }

  return obj
}

function generateArray(schema) {
  const min = schema.minItems ?? 2
  const max = schema.maxItems ?? Math.max(min, 4)
  const n   = randInt(min, max)
  const itemSchema = Array.isArray(schema.items)
    ? schema.items[0] || {}
    : (schema.items || {})
  return Array.from({ length: n }, () => generateValue(itemSchema))
}

function generateString(schema, key = '') {
  if (schema.format) return generateFormat(schema.format)

  const k = key.toLowerCase()

  if (/email/.test(k))                                return generateFormat('email')
  if (/url|uri|href|link/.test(k))                    return generateFormat('uri')
  if (/(created|updated|modified|timestamp)_?at/.test(k)) return generateFormat('date-time')
  if (/date/.test(k))                                 return generateFormat('date')
  if (/time/.test(k))                                 return generateFormat('time')
  if (/uuid|guid/.test(k))                            return generateFormat('uuid')
  if (/phone|tel/.test(k))                            return `+1-555-${randInt(100, 999)}-${randInt(1000, 9999)}`
  if (/(first.?name|given.?name|fname)/.test(k))      return pick(FIRST_NAMES)
  if (/(last.?name|surname|lname|family.?name)/.test(k)) return pick(LAST_NAMES)
  if (/\bname\b/.test(k))                             return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
  if (/(title|label|heading)/.test(k))                return `${capitalize(pick(WORDS))} ${capitalize(pick(WORDS))}`
  if (/(description|desc|summary|bio|about|text|body|content)/.test(k))
    return WORDS.slice(0, 4 + randInt(0, 4)).map(capitalize).join(' ')
  if (/city/.test(k))     return pick(['New York', 'London', 'Tokyo', 'Paris', 'Sydney'])
  if (/country/.test(k))  return pick(['US', 'GB', 'JP', 'FR', 'AU'])
  if (/(street|address)/.test(k)) return `${randInt(1, 999)} ${capitalize(pick(WORDS))} St`
  if (/(zip|postal)/.test(k))     return String(randInt(10000, 99999))
  if (/(color|colour)/.test(k))   return pick(['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'])
  if (/status|state/.test(k))     return pick(['active', 'inactive', 'pending', 'archived'])
  if (/(type|kind|category)/.test(k)) return pick(['typeA', 'typeB', 'typeC'])
  if (/\bid\b|_id$/.test(k))      return generateFormat('uuid')
  if (/(token|secret)/.test(k))   return randomHex(32)
  if (/password|pass/.test(k))    return `P@ss${randInt(1000, 9999)}`
  if (/version|ver/.test(k))      return `${randInt(1, 3)}.${randInt(0, 9)}.${randInt(0, 9)}`
  if (/tag/.test(k))              return pick(['alpha', 'beta', 'v1', 'stable', 'latest'])
  if (/lang/.test(k))             return pick(['en', 'fr', 'de', 'es', 'ja'])
  if (/currency/.test(k))         return pick(['USD', 'EUR', 'GBP', 'JPY'])

  const min = schema.minLength ?? 5
  const max = schema.maxLength ?? Math.max(min, 12)
  return randomAlpha(randInt(min, max))
}

function generateFormat(format) {
  switch (format) {
    case 'email':
      return `${pick(FIRST_NAMES).toLowerCase()}${randInt(1, 99)}@${pick(DOMAINS)}`
    case 'uri':
    case 'url':
      return `https://${pick(DOMAINS)}/${randomAlpha(6)}`
    case 'uri-reference':
      return `/${randomAlpha(4)}/resource`
    case 'date':
      return randomDate()
    case 'date-time':
      return `${randomDate()}T${randomTime()}Z`
    case 'time':
      return randomTime()
    case 'uuid':
      return randomUuid()
    case 'hostname':
      return pick(DOMAINS)
    case 'ipv4':
      return `${randInt(1, 254)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`
    case 'ipv6':
      return '::1'
    case 'json-pointer':
      return '/path/to/value'
    case 'regex':
      return '^[a-z]+$'
    default:
      return randomAlpha(8)
  }
}

function generateNumber(schema) {
  const min = schema.minimum ?? (schema.exclusiveMinimum ?? 0)
  const max = schema.maximum ?? (schema.exclusiveMaximum ?? 100)
  return parseFloat((Math.random() * (max - min) + min).toFixed(2))
}

function generateInteger(schema, key = '') {
  const k = key.toLowerCase()
  if (/age/.test(k))              return randInt(18, 80)
  if (/year/.test(k))             return randInt(2000, 2025)
  if (/(price|cost|amount)/.test(k)) return randInt(1, 500)
  if (/(count|num|total|qty)/.test(k)) return randInt(0, 100)

  const hasExcMin = typeof schema.exclusiveMinimum === 'number'
  const hasExcMax = typeof schema.exclusiveMaximum === 'number'
  const min = schema.minimum ?? (hasExcMin ? schema.exclusiveMinimum + 1 : 1)
  const max = schema.maximum ?? (hasExcMax ? schema.exclusiveMaximum - 1 : 1000)
  return randInt(Math.ceil(min), Math.floor(max))
}

// ---- Helpers ----

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function randomAlpha(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function randomHex(len) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function randomUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function randomDate() {
  const y = randInt(2020, 2025)
  const m = String(randInt(1, 12)).padStart(2, '0')
  const d = String(randInt(1, 28)).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function randomTime() {
  return [randInt(0, 23), randInt(0, 59), randInt(0, 59)]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
}
