/* ============================================
   JsonSchema.js — Validate JSON against JSON Schema
   ============================================ */

import { escapeHtml as escHtml } from '../core/Utils.js'

export function init() {
  const dataEl   = document.getElementById('schema-data')
  const schemaEl = document.getElementById('schema-schema')
  const output   = document.getElementById('schema-output')

  if (!dataEl) return

  document.getElementById('schema-btn').addEventListener('click', runValidate)

  ;[dataEl, schemaEl].forEach(ta => {
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runValidate()
    })
  })

  document.getElementById('schema-clear').addEventListener('click', () => {
    dataEl.value = ''
    schemaEl.value = ''
    output.innerHTML = `
      <div class="empty-state" style="padding:1.5rem;">
        <p>Enter JSON data and a JSON Schema, then click Validate.</p>
      </div>`
  })

  function runValidate() {
    const rawData   = dataEl.value.trim()
    const rawSchema = schemaEl.value.trim()

    if (!rawData || !rawSchema) {
      showResult([{ path: '', message: 'Both JSON Data and JSON Schema are required.' }])
      return
    }

    let data, schema
    try { data = JSON.parse(rawData) } catch (e) { showResult([{ path: 'JSON Data', message: `Parse error: ${e.message}` }]); return }
    try { schema = JSON.parse(rawSchema) } catch (e) { showResult([{ path: 'JSON Schema', message: `Parse error: ${e.message}` }]); return }

    const errors = validate(data, schema, '$')
    showResult(errors)
  }

  function showResult(errors) {
    if (errors.length === 0) {
      output.innerHTML = `
        <div class="validation-valid">
          <span style="font-size:1.25rem;">✓</span>
          <span>Valid — JSON matches the schema with no errors.</span>
        </div>`
    } else {
      const items = errors.map(e => `
        <div class="validation-error-item">
          <span class="error-path">${escHtml(e.path)}</span>
          <span>${escHtml(e.message)}</span>
        </div>`).join('')
      output.innerHTML = `
        <div style="margin-bottom:.5rem;font-size:.78rem;color:var(--error);font-weight:600;">${errors.length} validation error${errors.length !== 1 ? 's' : ''}</div>
        <div class="validation-errors">${items}</div>`
    }
  }
}

/**
 * Validate a JSON value against a JSON Schema.
 * Returns array of {path, message} error objects.
 * Supports: type, required, properties, additionalProperties, items,
 *           minLength, maxLength, minimum, maximum, exclusiveMinimum,
 *           exclusiveMaximum, pattern, enum, minItems, maxItems,
 *           minProperties, maxProperties, allOf, anyOf, oneOf, not, const.
 */
export function validate(data, schema, path = '$') {
  const errors = []

  if (schema === true || schema === undefined) return errors
  if (schema === false) {
    errors.push({ path, message: 'Schema is false — all values are invalid.' })
    return errors
  }
  if (typeof schema !== 'object' || schema === null) return errors

  // const
  if ('const' in schema) {
    if (!deepEqual(data, schema.const)) {
      errors.push({ path, message: `Must be equal to ${JSON.stringify(schema.const)}` })
    }
  }

  // enum
  if (schema.enum !== undefined) {
    if (!schema.enum.some(v => deepEqual(v, data))) {
      errors.push({ path, message: `Must be one of: ${schema.enum.map(v => JSON.stringify(v)).join(', ')}` })
    }
  }

  // type
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    if (!types.some(t => checkType(data, t))) {
      errors.push({ path, message: `Expected type ${types.join(' | ')}, got ${getType(data)}` })
    }
  }

  const t = getType(data)

  // String constraints
  if (t === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({ path, message: `String length (${data.length}) must be >= ${schema.minLength}` })
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({ path, message: `String length (${data.length}) must be <= ${schema.maxLength}` })
    }
    if (schema.pattern !== undefined) {
      let re
      try {
        re = new RegExp(schema.pattern)
      } catch {
        errors.push({ path, message: `Invalid regex pattern: /${schema.pattern}/` })
        re = null
      }
      if (re) {
        try {
          // Guard against ReDoS: only test strings up to 10 000 chars
          const subject = data.length > 10000 ? data.slice(0, 10000) : data
          if (!re.test(subject)) {
            errors.push({ path, message: `String must match pattern /${schema.pattern}/` })
          }
        } catch {
          errors.push({ path, message: `Pattern /${schema.pattern}/ could not be evaluated` })
        }
      }
    }
    if (schema.format !== undefined) {
      // Basic format hints — informational only, we just warn
      // (full format validation is out of scope)
    }
  }

  // Number constraints
  if (t === 'number' || t === 'integer') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({ path, message: `Value (${data}) must be >= ${schema.minimum}` })
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({ path, message: `Value (${data}) must be <= ${schema.maximum}` })
    }
    if (schema.exclusiveMinimum !== undefined) {
      const excMin = typeof schema.exclusiveMinimum === 'boolean'
        ? (schema.exclusiveMinimum ? schema.minimum : undefined)
        : schema.exclusiveMinimum
      if (excMin !== undefined && data <= excMin) {
        errors.push({ path, message: `Value (${data}) must be > ${excMin}` })
      }
    }
    if (schema.exclusiveMaximum !== undefined) {
      const excMax = typeof schema.exclusiveMaximum === 'boolean'
        ? (schema.exclusiveMaximum ? schema.maximum : undefined)
        : schema.exclusiveMaximum
      if (excMax !== undefined && data >= excMax) {
        errors.push({ path, message: `Value (${data}) must be < ${excMax}` })
      }
    }
    if (schema.multipleOf !== undefined && schema.multipleOf !== 0) {
      if (data % schema.multipleOf !== 0) {
        errors.push({ path, message: `Value (${data}) must be a multiple of ${schema.multipleOf}` })
      }
    }
    if (t === 'integer' && !Number.isInteger(data)) {
      errors.push({ path, message: `Expected integer, got float (${data})` })
    }
  }

  // Object constraints
  if (t === 'object') {
    const keys = Object.keys(data)

    if (schema.required !== undefined) {
      for (const req of schema.required) {
        if (!(req in data)) {
          errors.push({ path, message: `Missing required property: "${req}"` })
        }
      }
    }

    if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
      errors.push({ path, message: `Object must have at least ${schema.minProperties} properties` })
    }
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
      errors.push({ path, message: `Object must have at most ${schema.maxProperties} properties` })
    }

    if (schema.properties !== undefined) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          errors.push(...validate(data[key], subSchema, `${path}.${key}`))
        }
      }
    }

    if (schema.additionalProperties !== undefined && schema.properties) {
      const definedKeys = new Set(Object.keys(schema.properties))
      const patternKeys = schema.patternProperties ? Object.keys(schema.patternProperties) : []
      for (const key of keys) {
        if (!definedKeys.has(key) && !patternKeys.some(p => { try { return new RegExp(p).test(key) } catch { return false } })) {
          if (schema.additionalProperties === false) {
            errors.push({ path: `${path}.${key}`, message: `Additional property "${key}" is not allowed` })
          } else if (typeof schema.additionalProperties === 'object') {
            errors.push(...validate(data[key], schema.additionalProperties, `${path}.${key}`))
          }
        }
      }
    }

    if (schema.patternProperties) {
      for (const [pattern, subSchema] of Object.entries(schema.patternProperties)) {
        let re
        try { re = new RegExp(pattern) } catch { continue }
        for (const key of keys) {
          if (re.test(key)) {
            errors.push(...validate(data[key], subSchema, `${path}.${key}`))
          }
        }
      }
    }
  }

  // Array constraints
  if (t === 'array') {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push({ path, message: `Array must have at least ${schema.minItems} items` })
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push({ path, message: `Array must have at most ${schema.maxItems} items` })
    }
    if (schema.items !== undefined) {
      if (Array.isArray(schema.items)) {
        // Tuple validation
        schema.items.forEach((itemSchema, i) => {
          if (i < data.length) {
            errors.push(...validate(data[i], itemSchema, `${path}[${i}]`))
          }
        })
      } else {
        data.forEach((item, i) => {
          errors.push(...validate(item, schema.items, `${path}[${i}]`))
        })
      }
    }
    if (schema.uniqueItems && !hasUniqueItems(data)) {
      errors.push({ path, message: 'Array items must be unique' })
    }
    if (schema.contains !== undefined) {
      const containsValid = data.some(item => validate(item, schema.contains, path).length === 0)
      if (!containsValid) {
        errors.push({ path, message: 'Array must contain at least one item matching the "contains" schema' })
      }
    }
  }

  // Composition
  if (schema.allOf !== undefined) {
    schema.allOf.forEach((sub, i) => {
      errors.push(...validate(data, sub, path).map(e => ({ ...e, message: `(allOf[${i}]) ${e.message}` })))
    })
  }

  if (schema.anyOf !== undefined) {
    const anyValid = schema.anyOf.some(sub => validate(data, sub, path).length === 0)
    if (!anyValid) {
      errors.push({ path, message: `Must match at least one of the anyOf schemas` })
    }
  }

  if (schema.oneOf !== undefined) {
    const passing = schema.oneOf.filter(sub => validate(data, sub, path).length === 0)
    if (passing.length !== 1) {
      errors.push({ path, message: `Must match exactly one of the oneOf schemas (${passing.length} matched)` })
    }
  }

  if (schema.not !== undefined) {
    const notErrors = validate(data, schema.not, path)
    if (notErrors.length === 0) {
      errors.push({ path, message: `Must NOT match the "not" schema` })
    }
  }

  if (schema.if !== undefined) {
    const ifErrors = validate(data, schema.if, path)
    if (ifErrors.length === 0 && schema.then !== undefined) {
      errors.push(...validate(data, schema.then, path))
    } else if (ifErrors.length > 0 && schema.else !== undefined) {
      errors.push(...validate(data, schema.else, path))
    }
  }

  return errors
}

function getType(val) {
  if (val === null) return 'null'
  if (Array.isArray(val)) return 'array'
  if (typeof val === 'boolean') return 'boolean'
  if (typeof val === 'number') return Number.isInteger(val) ? 'integer' : 'number'
  return typeof val
}

function checkType(val, type) {
  const t = getType(val)
  if (type === 'integer') return t === 'integer' || (t === 'number' && Number.isInteger(val))
  if (type === 'number') return t === 'number' || t === 'integer'
  return t === type
}

function deepEqual(a, b) {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]))
  const ka = Object.keys(a), kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every(k => k in b && deepEqual(a[k], b[k]))
}

function hasUniqueItems(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (deepEqual(arr[i], arr[j])) return false
    }
  }
  return true
}

