import { describe, it, expect } from 'vitest'
import { countStats, formatBytes, escapeHtml, safeParseJson, prettyJson, extractErrorPosition } from '../../src/core/Utils.js'
import { sortKeys } from '../../src/tools/SortKeys.js'
import { flattenJson } from '../../src/tools/FlattenJson.js'
import { unflattenJson } from '../../src/tools/UnflattenJson.js'
import { jsonToCsv } from '../../src/tools/JsonToCsv.js'
import { csvToJson } from '../../src/tools/CsvToJson.js'
import { computeDiff } from '../../src/tools/JsonDiff.js'
import { validate } from '../../src/tools/JsonSchema.js'
import { queryJson } from '../../src/tools/JsonQuery.js'
import { parseScalar, parseYaml } from '../../src/tools/YamlToJson.js'
import { jsonToYaml } from '../../src/tools/JsonToYaml.js'

/* ===========================
   countStats
   =========================== */
describe('countStats', () => {
  it('returns zeros for empty string', () => {
    const s = countStats('')
    expect(s.chars).toBe(0)
    expect(s.lines).toBe(0)
    expect(s.size).toBe('0 B')
  })

  it('counts characters correctly', () => {
    const s = countStats('hello')
    expect(s.chars).toBe(5)
  })

  it('counts lines correctly', () => {
    const s = countStats('a\nb\nc')
    expect(s.lines).toBe(3)
  })

  it('reports byte size', () => {
    const s = countStats('hello')
    expect(s.size).toBe('5 B')
  })

  it('handles multi-line JSON', () => {
    const json = '{\n  "a": 1\n}'
    const s = countStats(json)
    expect(s.lines).toBe(3)
    expect(s.chars).toBe(json.length)
  })

  it('returns zeros for null/undefined', () => {
    expect(countStats(null).chars).toBe(0)
    expect(countStats(undefined).chars).toBe(0)
  })

  it('counts multi-byte characters by byte size', () => {
    const s = countStats('é') // 2 UTF-8 bytes
    expect(s.chars).toBe(1)
    expect(s.size).toBe('2 B')
  })
})

/* ===========================
   formatBytes
   =========================== */
describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats bytes < 1024', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB')
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.50 MB')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(1024 ** 3)).toBe('1.00 GB')
  })
})

/* ===========================
   escapeHtml
   =========================== */
describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s')
  })

  it('escapes all special chars together', () => {
    expect(escapeHtml('<script>alert("xss&\'s")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&amp;&#039;s&quot;)&lt;/script&gt;'
    )
  })

  it('coerces non-strings', () => {
    expect(escapeHtml(42)).toBe('42')
    expect(escapeHtml(null)).toBe('null')
  })

  it('returns plain strings unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

/* ===========================
   safeParseJson
   =========================== */
describe('safeParseJson', () => {
  it('parses valid JSON object', () => {
    const { data, error } = safeParseJson('{"a":1}')
    expect(data).toEqual({ a: 1 })
    expect(error).toBeNull()
  })

  it('parses valid JSON array', () => {
    const { data, error } = safeParseJson('[1,2,3]')
    expect(data).toEqual([1, 2, 3])
    expect(error).toBeNull()
  })

  it('returns error for invalid JSON', () => {
    const { data, error } = safeParseJson('{bad}')
    expect(data).toBeNull()
    expect(error).toBeTruthy()
    expect(typeof error).toBe('string')
  })

  it('parses JSON primitives', () => {
    expect(safeParseJson('42').data).toBe(42)
    expect(safeParseJson('"hello"').data).toBe('hello')
    expect(safeParseJson('true').data).toBe(true)
    expect(safeParseJson('null').data).toBeNull()
  })
})

/* ===========================
   prettyJson
   =========================== */
describe('prettyJson', () => {
  it('pretty-prints with default 2-space indent', () => {
    const result = prettyJson({ a: 1 })
    expect(result).toBe('{\n  "a": 1\n}')
  })

  it('pretty-prints with custom indent', () => {
    const result = prettyJson({ a: 1 }, 4)
    expect(result).toBe('{\n    "a": 1\n}')
  })

  it('pretty-prints with tab indent', () => {
    const result = prettyJson({ a: 1 }, '\t')
    expect(result).toBe('{\n\t"a": 1\n}')
  })

  it('handles arrays', () => {
    expect(prettyJson([1, 2])).toBe('[\n  1,\n  2\n]')
  })

  it('handles primitives', () => {
    expect(prettyJson(42)).toBe('42')
    expect(prettyJson(null)).toBe('null')
  })
})

/* ===========================
   extractErrorPosition
   =========================== */
describe('extractErrorPosition', () => {
  it('extracts character position (Chrome format)', () => {
    const result = extractErrorPosition('Unexpected token at position 42')
    expect(result.pos).toBe(42)
  })

  it('extracts line and column (Firefox format)', () => {
    const result = extractErrorPosition('JSON parse error at line 5 column 12')
    expect(result.line).toBe(5)
    expect(result.col).toBe(12)
  })

  it('returns null for unknown format', () => {
    const result = extractErrorPosition('something went wrong')
    expect(result.pos).toBeNull()
    expect(result.line).toBeNull()
    expect(result.col).toBeNull()
  })
})

/* ===========================
   sortKeys
   =========================== */
describe('sortKeys', () => {
  it('sorts top-level keys', () => {
    const result = sortKeys({ z: 1, a: 2, m: 3 })
    expect(Object.keys(result)).toEqual(['a', 'm', 'z'])
  })

  it('sorts nested keys recursively', () => {
    const result = sortKeys({ b: { z: 1, a: 2 }, a: 3 })
    expect(Object.keys(result)).toEqual(['a', 'b'])
    expect(Object.keys(result.b)).toEqual(['a', 'z'])
  })

  it('handles arrays', () => {
    const result = sortKeys([{ z: 1, a: 2 }, { y: 3, b: 4 }])
    expect(Array.isArray(result)).toBe(true)
    expect(Object.keys(result[0])).toEqual(['a', 'z'])
    expect(Object.keys(result[1])).toEqual(['b', 'y'])
  })

  it('handles primitives', () => {
    expect(sortKeys(42)).toBe(42)
    expect(sortKeys('hello')).toBe('hello')
    expect(sortKeys(null)).toBeNull()
  })

  it('handles empty object', () => {
    expect(sortKeys({})).toEqual({})
  })

  it('handles deeply nested structures', () => {
    const result = sortKeys({ c: { z: { b: 1, a: 2 } }, a: 1 })
    expect(Object.keys(result)).toEqual(['a', 'c'])
    expect(Object.keys(result.c.z)).toEqual(['a', 'b'])
  })

  it('does not mutate the original object', () => {
    const original = { z: 1, a: 2 }
    sortKeys(original)
    expect(Object.keys(original)).toEqual(['z', 'a'])
  })
})

/* ===========================
   flattenJson
   =========================== */
describe('flattenJson', () => {
  it('flattens one level', () => {
    const result = flattenJson({ a: { b: 1 } })
    expect(result).toEqual({ 'a.b': 1 })
  })

  it('flattens deeply nested objects', () => {
    const result = flattenJson({ a: { b: { c: 42 } } })
    expect(result['a.b.c']).toBe(42)
  })

  it('flattens arrays with bracket notation', () => {
    const result = flattenJson({ items: [10, 20, 30] })
    expect(result['items[0]']).toBe(10)
    expect(result['items[1]']).toBe(20)
    expect(result['items[2]']).toBe(30)
  })

  it('uses custom separator', () => {
    const result = flattenJson({ a: { b: 1 } }, '/')
    expect(result['a/b']).toBe(1)
  })

  it('preserves leaf primitives', () => {
    const result = flattenJson({ x: true, y: null, z: 'str' })
    expect(result).toEqual({ x: true, y: null, z: 'str' })
  })

  it('handles empty object leaves', () => {
    const result = flattenJson({ a: {} })
    expect(result['a']).toEqual({})
  })

  it('handles empty array leaves', () => {
    const result = flattenJson({ a: [] })
    expect(result['a']).toEqual([])
  })

  it('handles top-level array', () => {
    const result = flattenJson([1, 2, 3])
    expect(result['[0]']).toBe(1)
    expect(result['[1]']).toBe(2)
    expect(result['[2]']).toBe(3)
  })

  it('flattens nested arrays', () => {
    const result = flattenJson({ a: [{ b: 1 }, { b: 2 }] })
    expect(result['a[0].b']).toBe(1)
    expect(result['a[1].b']).toBe(2)
  })

  it('handles mixed separators in key names', () => {
    const result = flattenJson({ a: { b: { c: 1 } } }, '_')
    expect(result['a_b_c']).toBe(1)
  })
})

/* ===========================
   unflattenJson
   =========================== */
describe('unflattenJson', () => {
  it('restores nested objects', () => {
    const result = unflattenJson({ 'a.b.c': 42 })
    expect(result.a.b.c).toBe(42)
  })

  it('restores arrays from bracket notation', () => {
    const result = unflattenJson({ 'items[0]': 10, 'items[1]': 20 })
    expect(Array.isArray(result.items)).toBe(true)
    expect(result.items[0]).toBe(10)
    expect(result.items[1]).toBe(20)
  })

  it('handles mixed paths', () => {
    const result = unflattenJson({ 'a.b': 1, 'a.c': 2 })
    expect(result.a).toEqual({ b: 1, c: 2 })
  })

  it('round-trips with flattenJson', () => {
    const original = { user: { name: 'Alice', age: 30 } }
    const flat     = flattenJson(original)
    const restored = unflattenJson(flat)
    expect(restored).toEqual(original)
  })

  it('round-trips objects with arrays', () => {
    const original = { tags: ['a', 'b', 'c'] }
    const flat = flattenJson(original)
    const restored = unflattenJson(flat)
    expect(restored).toEqual(original)
  })

  it('handles custom separator', () => {
    const result = unflattenJson({ 'a/b': 1 }, '/')
    expect(result.a.b).toBe(1)
  })

  it('handles deeply nested bracket + dot mixed paths', () => {
    const result = unflattenJson({ 'a[0].b': 42 })
    expect(Array.isArray(result.a)).toBe(true)
    expect(result.a[0].b).toBe(42)
  })
})

/* ===========================
   jsonToCsv
   =========================== */
describe('jsonToCsv', () => {
  it('converts simple array', () => {
    const csv = jsonToCsv([{ a: 1, b: 2 }])
    expect(csv).toContain('a,b')
    expect(csv).toContain('1,2')
  })

  it('collects all unique keys across rows', () => {
    const csv = jsonToCsv([{ a: 1 }, { b: 2 }])
    const header = csv.split('\r\n')[0]
    expect(header).toContain('a')
    expect(header).toContain('b')
  })

  it('produces sorted headers regardless of row order', () => {
    const csv1 = jsonToCsv([{ z: 1, a: 2 }])
    const csv2 = jsonToCsv([{ a: 2, z: 1 }])
    const header1 = csv1.split('\r\n')[0]
    const header2 = csv2.split('\r\n')[0]
    expect(header1).toBe('a,z')
    expect(header2).toBe('a,z')
  })

  it('header order is deterministic across multi-row input', () => {
    const csv = jsonToCsv([{ b: 1, a: 2 }, { c: 3, a: 4 }])
    const header = csv.split('\r\n')[0]
    expect(header).toBe('a,b,c')
  })

  it('quotes cells containing commas', () => {
    const csv = jsonToCsv([{ name: 'Smith, John' }])
    expect(csv).toContain('"Smith, John"')
  })

  it('quotes cells containing double quotes', () => {
    const csv = jsonToCsv([{ note: 'say "hi"' }])
    expect(csv).toContain('"say ""hi"""')
  })

  it('handles empty array gracefully', () => {
    const csv = jsonToCsv([])
    expect(typeof csv).toBe('string')
  })

  it('fills missing fields with empty string', () => {
    const csv = jsonToCsv([{ a: 1 }, { a: 2, b: 3 }])
    const rows = csv.split('\r\n')
    // Row 1 has no 'b' field — should be empty
    expect(rows[1]).toBe('1,')
  })

  it('serializes null as empty string', () => {
    const csv = jsonToCsv([{ a: null }])
    const rows = csv.split('\r\n')
    expect(rows[1]).toBe('')
  })
})

/* ===========================
   csvToJson
   =========================== */
describe('csvToJson', () => {
  it('converts simple CSV', () => {
    const result = csvToJson('name,age\nAlice,30\nBob,25')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Alice')
    expect(result[0].age).toBe(30)
  })

  it('coerces numeric values', () => {
    const result = csvToJson('x\n42')
    expect(result[0].x).toBe(42)
  })

  it('coerces boolean values', () => {
    const result = csvToJson('flag\ntrue')
    expect(result[0].flag).toBe(true)
  })

  it('handles quoted fields with commas', () => {
    const result = csvToJson('name\n"Smith, John"')
    expect(result[0].name).toBe('Smith, John')
  })

  it('handles CRLF line endings', () => {
    const result = csvToJson('a,b\r\n1,2\r\n3,4')
    expect(result).toHaveLength(2)
  })

  it('handles false boolean value', () => {
    const result = csvToJson('flag\nfalse')
    expect(result[0].flag).toBe(false)
  })

  it('preserves string values that are not coercible', () => {
    const result = csvToJson('name\nhello world')
    expect(result[0].name).toBe('hello world')
  })

  it('handles empty fields as empty string or null', () => {
    const result = csvToJson('a,b\n1,')
    expect(result[0].a).toBe(1)
    // Empty field should be either empty string or null-like
    expect(result[0].b == null || result[0].b === '').toBe(true)
  })

  it('handles multiple rows correctly', () => {
    const result = csvToJson('x,y\n1,2\n3,4\n5,6')
    expect(result).toHaveLength(3)
    expect(result[2].x).toBe(5)
    expect(result[2].y).toBe(6)
  })
})

/* ===========================
   computeDiff
   =========================== */
describe('computeDiff', () => {
  it('returns empty for identical objects', () => {
    const diffs = []
    computeDiff({ a: 1 }, { a: 1 }, '', diffs)
    expect(diffs).toHaveLength(0)
  })

  it('detects added keys', () => {
    const diffs = []
    computeDiff({}, { a: 1 }, '', diffs)
    expect(diffs.some(d => d.type === 'added' && d.path === 'a')).toBe(true)
  })

  it('detects removed keys', () => {
    const diffs = []
    computeDiff({ a: 1 }, {}, '', diffs)
    expect(diffs.some(d => d.type === 'removed' && d.path === 'a')).toBe(true)
  })

  it('detects changed values', () => {
    const diffs = []
    computeDiff({ a: 1 }, { a: 2 }, '', diffs)
    expect(diffs.some(d => d.type === 'changed' && d.path === 'a')).toBe(true)
  })

  it('detects nested changes', () => {
    const diffs = []
    computeDiff({ a: { b: 1 } }, { a: { b: 2 } }, '', diffs)
    expect(diffs.some(d => d.path === 'a.b')).toBe(true)
  })

  it('handles array additions', () => {
    const diffs = []
    computeDiff([1], [1, 2], '', diffs)
    expect(diffs.some(d => d.type === 'added' && d.path === '[1]')).toBe(true)
  })

  it('handles array removals', () => {
    const diffs = []
    computeDiff([1, 2], [1], '', diffs)
    expect(diffs.some(d => d.type === 'removed' && d.path === '[1]')).toBe(true)
  })

  it('detects type changes', () => {
    const diffs = []
    computeDiff({ a: 1 }, { a: '1' }, '', diffs)
    expect(diffs.some(d => d.type === 'changed' && d.path === 'a')).toBe(true)
  })

  it('treats object vs array as changed', () => {
    const diffs = []
    computeDiff({ a: {} }, { a: [] }, '', diffs)
    expect(diffs.some(d => d.type === 'changed' && d.path === 'a')).toBe(true)
  })

  it('returns empty for identical arrays', () => {
    const diffs = []
    computeDiff([1, 2, 3], [1, 2, 3], '', diffs)
    expect(diffs).toHaveLength(0)
  })

  it('includes original values in diff entries', () => {
    const diffs = []
    computeDiff({ x: 10 }, { x: 20 }, '', diffs)
    const entry = diffs.find(d => d.path === 'x')
    expect(entry.a).toBe(10)
    expect(entry.b).toBe(20)
  })
})

/* ===========================
   validate (JSON Schema)
   =========================== */
describe('validate', () => {
  // --- type ---
  it('validates matching type', () => {
    expect(validate('hello', { type: 'string' })).toHaveLength(0)
  })

  it('rejects mismatched type', () => {
    expect(validate(42, { type: 'string' }).length).toBeGreaterThan(0)
  })

  it('accepts integer as number type', () => {
    expect(validate(1, { type: 'number' })).toHaveLength(0)
  })

  it('validates union types', () => {
    expect(validate(null, { type: ['string', 'null'] })).toHaveLength(0)
    expect(validate('hi', { type: ['string', 'null'] })).toHaveLength(0)
    expect(validate(42, { type: ['string', 'null'] }).length).toBeGreaterThan(0)
  })

  // --- required / properties ---
  it('validates required properties', () => {
    const schema = { type: 'object', required: ['name'] }
    expect(validate({}, schema)).toHaveLength(1)
    expect(validate({ name: 'Alice' }, schema)).toHaveLength(0)
  })

  it('validates nested properties', () => {
    const schema = {
      type: 'object',
      properties: { age: { type: 'number', minimum: 0 } }
    }
    expect(validate({ age: -1 }, schema).length).toBeGreaterThan(0)
    expect(validate({ age: 25 }, schema)).toHaveLength(0)
  })

  // --- string constraints ---
  it('validates minLength/maxLength', () => {
    const schema = { type: 'string', minLength: 3, maxLength: 5 }
    expect(validate('ab', schema).length).toBeGreaterThan(0)
    expect(validate('abc', schema)).toHaveLength(0)
    expect(validate('abcdef', schema).length).toBeGreaterThan(0)
  })

  it('validates pattern', () => {
    const schema = { type: 'string', pattern: '^[a-z]+$' }
    expect(validate('abc', schema)).toHaveLength(0)
    expect(validate('ABC', schema).length).toBeGreaterThan(0)
  })

  it('reports invalid regex pattern without throwing', () => {
    const errors = validate('hello', { type: 'string', pattern: '[invalid(' })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(/invalid regex pattern/i)
  })

  // --- number constraints ---
  it('validates minimum/maximum', () => {
    const schema = { type: 'number', minimum: 0, maximum: 100 }
    expect(validate(-1, schema).length).toBeGreaterThan(0)
    expect(validate(50, schema)).toHaveLength(0)
    expect(validate(101, schema).length).toBeGreaterThan(0)
  })

  it('validates exclusiveMinimum (draft-07 number form)', () => {
    const schema = { type: 'number', exclusiveMinimum: 0 }
    expect(validate(0, schema).length).toBeGreaterThan(0)
    expect(validate(0.1, schema)).toHaveLength(0)
  })

  it('validates exclusiveMaximum (draft-07 number form)', () => {
    const schema = { type: 'number', exclusiveMaximum: 10 }
    expect(validate(10, schema).length).toBeGreaterThan(0)
    expect(validate(9.9, schema)).toHaveLength(0)
  })

  it('validates multipleOf', () => {
    const schema = { type: 'number', multipleOf: 3 }
    expect(validate(9, schema)).toHaveLength(0)
    expect(validate(10, schema).length).toBeGreaterThan(0)
  })

  // --- enum / const ---
  it('validates enum', () => {
    const schema = { enum: ['a', 'b', 'c'] }
    expect(validate('a', schema)).toHaveLength(0)
    expect(validate('d', schema).length).toBeGreaterThan(0)
  })

  it('validates const', () => {
    expect(validate(42, { const: 42 })).toHaveLength(0)
    expect(validate(43, { const: 42 }).length).toBeGreaterThan(0)
    expect(validate({ a: 1 }, { const: { a: 1 } })).toHaveLength(0)
  })

  // --- array constraints ---
  it('validates array items', () => {
    const schema = { type: 'array', items: { type: 'number' } }
    expect(validate([1, 2, 3], schema)).toHaveLength(0)
    expect(validate([1, 'x', 3], schema).length).toBeGreaterThan(0)
  })

  it('validates minItems/maxItems', () => {
    const schema = { type: 'array', minItems: 2, maxItems: 4 }
    expect(validate([1], schema).length).toBeGreaterThan(0)
    expect(validate([1, 2], schema)).toHaveLength(0)
    expect(validate([1, 2, 3, 4, 5], schema).length).toBeGreaterThan(0)
  })

  it('validates uniqueItems', () => {
    const schema = { type: 'array', uniqueItems: true }
    expect(validate([1, 2, 3], schema)).toHaveLength(0)
    expect(validate([1, 2, 1], schema).length).toBeGreaterThan(0)
  })

  it('validates contains', () => {
    const schema = { type: 'array', contains: { type: 'string' } }
    expect(validate([1, 'hello', 2], schema)).toHaveLength(0)
    expect(validate([1, 2, 3], schema).length).toBeGreaterThan(0)
  })

  it('validates tuple items', () => {
    const schema = { type: 'array', items: [{ type: 'number' }, { type: 'string' }] }
    expect(validate([1, 'hello'], schema)).toHaveLength(0)
    expect(validate(['hello', 1], schema).length).toBeGreaterThan(0)
  })

  // --- object constraints ---
  it('validates minProperties/maxProperties', () => {
    const schema = { type: 'object', minProperties: 2, maxProperties: 3 }
    expect(validate({ a: 1 }, schema).length).toBeGreaterThan(0)
    expect(validate({ a: 1, b: 2 }, schema)).toHaveLength(0)
    expect(validate({ a: 1, b: 2, c: 3, d: 4 }, schema).length).toBeGreaterThan(0)
  })

  it('validates additionalProperties: false', () => {
    const schema = { type: 'object', properties: { a: {} }, additionalProperties: false }
    expect(validate({ a: 1 }, schema)).toHaveLength(0)
    expect(validate({ a: 1, b: 2 }, schema).length).toBeGreaterThan(0)
  })

  it('validates additionalProperties as schema', () => {
    const schema = { type: 'object', properties: { a: {} }, additionalProperties: { type: 'number' } }
    expect(validate({ a: 1, b: 2 }, schema)).toHaveLength(0)
    expect(validate({ a: 1, b: 'x' }, schema).length).toBeGreaterThan(0)
  })

  it('validates patternProperties', () => {
    const schema = { type: 'object', patternProperties: { '^s_': { type: 'string' } } }
    expect(validate({ s_name: 'Alice' }, schema)).toHaveLength(0)
    expect(validate({ s_name: 42 }, schema).length).toBeGreaterThan(0)
  })

  // --- composition ---
  it('validates allOf', () => {
    const schema = { allOf: [{ type: 'number' }, { minimum: 0 }] }
    expect(validate(5, schema)).toHaveLength(0)
    expect(validate(-1, schema).length).toBeGreaterThan(0)
    expect(validate('x', schema).length).toBeGreaterThan(0)
  })

  it('validates anyOf', () => {
    const schema = { anyOf: [{ type: 'string' }, { type: 'number' }] }
    expect(validate('hello', schema)).toHaveLength(0)
    expect(validate(42, schema)).toHaveLength(0)
    expect(validate(true, schema).length).toBeGreaterThan(0)
  })

  it('validates oneOf — exactly one match required', () => {
    const schema = { oneOf: [{ type: 'string' }, { type: 'number' }] }
    expect(validate('hello', schema)).toHaveLength(0) // matches string only
    expect(validate(42, schema)).toHaveLength(0)      // matches number only
    expect(validate(true, schema).length).toBeGreaterThan(0) // matches neither
  })

  it('validates oneOf — fails when more than one schema matches', () => {
    // 5 satisfies both minimum:0 and maximum:10 → two matches → oneOf fails
    const schema = { oneOf: [{ minimum: 0 }, { maximum: 10 }] }
    expect(validate(5, schema).length).toBeGreaterThan(0)
    expect(validate(-1, schema)).toHaveLength(0)  // only maximum:10 matches
    expect(validate(20, schema)).toHaveLength(0)  // only minimum:0 matches
  })

  it('validates not', () => {
    const schema = { not: { type: 'string' } }
    expect(validate(42, schema)).toHaveLength(0)
    expect(validate('hello', schema).length).toBeGreaterThan(0)
  })

  it('validates if/then', () => {
    const schema = {
      if: { type: 'number' },
      then: { minimum: 0 }
    }
    expect(validate(5, schema)).toHaveLength(0)
    expect(validate(-1, schema).length).toBeGreaterThan(0)
    expect(validate('hello', schema)).toHaveLength(0) // if fails → no then check
  })

  it('validates if/else', () => {
    const schema = {
      if: { type: 'number' },
      else: { minLength: 3 }
    }
    expect(validate(42, schema)).toHaveLength(0) // if passes → no else check
    expect(validate('hi', schema).length).toBeGreaterThan(0) // if fails → else requires minLength 3
    expect(validate('hello', schema)).toHaveLength(0) // if fails → else passes
  })

  it('returns no errors for schema: true', () => {
    expect(validate('anything', true)).toHaveLength(0)
  })

  it('returns error for schema: false', () => {
    expect(validate('anything', false).length).toBeGreaterThan(0)
  })
})

/* ===========================
   queryJson
   =========================== */
describe('queryJson', () => {
  const data = {
    users: [
      { id: 1, name: 'Alice', address: { city: 'NYC' } },
      { id: 2, name: 'Bob',   address: { city: 'LA'  } },
    ],
    meta: { total: 2 }
  }

  it('returns root for empty path', () => {
    expect(queryJson(data, '')).toBe(data)
  })

  it('returns root for "." path', () => {
    expect(queryJson(data, '.')).toBe(data)
  })

  it('returns root for "$" path', () => {
    expect(queryJson(data, '$')).toBe(data)
  })

  it('returns root for "$." prefix', () => {
    expect(queryJson(data, '$.meta')).toEqual({ total: 2 })
  })

  it('accesses top-level key', () => {
    expect(queryJson(data, 'meta')).toEqual({ total: 2 })
  })

  it('accesses nested key', () => {
    expect(queryJson(data, 'meta.total')).toBe(2)
  })

  it('accesses array index', () => {
    expect(queryJson(data, 'users[0].name')).toBe('Alice')
    expect(queryJson(data, 'users[1].name')).toBe('Bob')
  })

  it('wildcard returns all elements', () => {
    const result = queryJson(data, 'users[*]')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('wildcard with property extracts field from each', () => {
    const result = queryJson(data, 'users[*].name')
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('accesses deeply nested value', () => {
    expect(queryJson(data, 'users[0].address.city')).toBe('NYC')
  })

  it('throws on missing key', () => {
    expect(() => queryJson(data, 'users[0].missing')).toThrow()
  })

  it('throws on out-of-bounds index', () => {
    expect(() => queryJson(data, 'users[99]')).toThrow()
  })

  it('throws when accessing key on non-object', () => {
    expect(() => queryJson(data, 'meta.total.nope')).toThrow()
  })
})

/* ===========================
   parseScalar (YAML)
   =========================== */
describe('parseScalar', () => {
  it('parses null values', () => {
    expect(parseScalar('null')).toBeNull()
    expect(parseScalar('~')).toBeNull()
    expect(parseScalar('')).toBeNull()
    expect(parseScalar('Null')).toBeNull()
    expect(parseScalar('NULL')).toBeNull()
  })

  it('parses booleans', () => {
    expect(parseScalar('true')).toBe(true)
    expect(parseScalar('false')).toBe(false)
    expect(parseScalar('yes')).toBe(true)
    expect(parseScalar('no')).toBe(false)
    expect(parseScalar('on')).toBe(true)
    expect(parseScalar('off')).toBe(false)
    expect(parseScalar('True')).toBe(true)
    expect(parseScalar('False')).toBe(false)
  })

  it('parses integers', () => {
    expect(parseScalar('42')).toBe(42)
    expect(parseScalar('-7')).toBe(-7)
    expect(parseScalar('0')).toBe(0)
  })

  it('parses hex integers', () => {
    expect(parseScalar('0xff')).toBe(255)
    expect(parseScalar('0x10')).toBe(16)
  })

  it('parses octal integers', () => {
    expect(parseScalar('0o17')).toBe(15)
    expect(parseScalar('0o10')).toBe(8)
  })

  it('parses floats', () => {
    expect(parseScalar('3.14')).toBe(3.14)
    expect(parseScalar('-0.5')).toBe(-0.5)
  })

  it('parses scientific notation', () => {
    expect(parseScalar('1.5e2')).toBe(150)
    expect(parseScalar('2.0e-1')).toBeCloseTo(0.2)
  })

  it('parses infinity and NaN', () => {
    expect(parseScalar('.inf')).toBe(Infinity)
    expect(parseScalar('-.inf')).toBe(-Infinity)
    expect(parseScalar('.Inf')).toBe(Infinity)
    expect(Number.isNaN(parseScalar('.nan'))).toBe(true)
    expect(Number.isNaN(parseScalar('.NaN'))).toBe(true)
  })

  it('parses double-quoted strings', () => {
    expect(parseScalar('"hello world"')).toBe('hello world')
    expect(parseScalar('"line1\\nline2"')).toBe('line1\nline2')
    expect(parseScalar('"tab\\there"')).toBe('tab\there')
  })

  it('parses single-quoted strings', () => {
    expect(parseScalar("'foo bar'")).toBe('foo bar')
    expect(parseScalar("'it''s'")).toBe("it's")
  })

  it('returns plain strings as-is', () => {
    expect(parseScalar('hello')).toBe('hello')
    expect(parseScalar('some string')).toBe('some string')
  })

  it('parses inline JSON arrays', () => {
    const result = parseScalar('[1,2,3]')
    expect(result).toEqual([1, 2, 3])
  })

  it('parses inline JSON objects', () => {
    const result = parseScalar('{"a":1}')
    expect(result).toEqual({ a: 1 })
  })
})

/* ===========================
   parseYaml
   =========================== */
describe('parseYaml', () => {
  it('parses a simple mapping', () => {
    expect(parseYaml('name: Alice')).toEqual({ name: 'Alice' })
  })

  it('parses scalar types in mappings', () => {
    const result = parseYaml('name: Alice\nage: 30\nactive: true')
    expect(result.name).toBe('Alice')
    expect(result.age).toBe(30)
    expect(result.active).toBe(true)
  })

  it('parses a simple sequence', () => {
    expect(parseYaml('- 1\n- 2\n- 3')).toEqual([1, 2, 3])
  })

  it('parses a sequence of strings', () => {
    expect(parseYaml('- foo\n- bar\n- baz')).toEqual(['foo', 'bar', 'baz'])
  })

  it('parses nested mappings', () => {
    const yaml = 'person:\n  name: Alice\n  age: 30'
    expect(parseYaml(yaml)).toEqual({ person: { name: 'Alice', age: 30 } })
  })

  it('parses mapping with array value', () => {
    const yaml = 'items:\n  - 1\n  - 2\n  - 3'
    expect(parseYaml(yaml)).toEqual({ items: [1, 2, 3] })
  })

  it('parses sequence of mappings', () => {
    const yaml = '- name: Alice\n  age: 30\n- name: Bob\n  age: 25'
    const result = parseYaml(yaml)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'Alice', age: 30 })
    expect(result[1]).toEqual({ name: 'Bob', age: 25 })
  })

  it('strips YAML document markers', () => {
    expect(parseYaml('---\nkey: value')).toEqual({ key: 'value' })
    expect(parseYaml('---\nkey: value\n...')).toEqual({ key: 'value' })
  })

  it('ignores inline comments', () => {
    const result = parseYaml('name: Alice # the user')
    expect(result.name).toBe('Alice')
  })

  it('parses quoted string values', () => {
    const result = parseYaml("name: 'Alice Smith'")
    expect(result.name).toBe('Alice Smith')
  })

  it('parses null values', () => {
    const result = parseYaml('key: null')
    expect(result.key).toBeNull()
  })

  it('parses empty mapping as null value', () => {
    const result = parseYaml('key:')
    expect(result.key).toBeNull()
  })

  it('handles blank lines between entries', () => {
    const yaml = 'a: 1\n\nb: 2'
    expect(parseYaml(yaml)).toEqual({ a: 1, b: 2 })
  })

  it('parses deeply nested structure', () => {
    const yaml = 'a:\n  b:\n    c: 42'
    expect(parseYaml(yaml)).toEqual({ a: { b: { c: 42 } } })
  })
})

/* ===========================
   jsonToYaml
   =========================== */
describe('jsonToYaml', () => {
  // --- primitives ---
  it('serializes null', () => {
    expect(jsonToYaml(null)).toBe('null')
  })

  it('serializes true/false', () => {
    expect(jsonToYaml(true)).toBe('true')
    expect(jsonToYaml(false)).toBe('false')
  })

  it('serializes integers', () => {
    expect(jsonToYaml(0)).toBe('0')
    expect(jsonToYaml(42)).toBe('42')
    expect(jsonToYaml(-7)).toBe('-7')
  })

  it('serializes floats', () => {
    expect(jsonToYaml(3.14)).toBe('3.14')
  })

  it('serializes Infinity as .inf', () => {
    expect(jsonToYaml(Infinity)).toBe('.inf')
  })

  // --- strings ---
  it('serializes empty string as single-quoted empty', () => {
    expect(jsonToYaml('')).toBe("''")
  })

  it('serializes plain strings without quotes', () => {
    expect(jsonToYaml('hello')).toBe('hello')
  })

  it('quotes reserved words', () => {
    expect(jsonToYaml('true')).toContain("'")
    expect(jsonToYaml('null')).toContain("'")
    expect(jsonToYaml('yes')).toContain("'")
  })

  it('quotes strings starting with digits', () => {
    expect(jsonToYaml('123abc')).toContain("'")
  })

  it('quotes strings with special YAML characters', () => {
    expect(jsonToYaml('key: value')).toContain("'")
    expect(jsonToYaml('{object}')).toContain("'")
  })

  it('double-quotes multi-line strings', () => {
    const result = jsonToYaml('line1\nline2')
    expect(result.startsWith('"')).toBe(true)
  })

  // --- arrays ---
  it('serializes empty array as []', () => {
    expect(jsonToYaml([])).toBe('[]')
  })

  it('serializes array of primitives', () => {
    const result = jsonToYaml([1, 2, 3])
    expect(result).toContain('- 1')
    expect(result).toContain('- 2')
    expect(result).toContain('- 3')
  })

  // --- objects ---
  it('serializes empty object as {}', () => {
    expect(jsonToYaml({})).toBe('{}')
  })

  it('serializes object with primitive values', () => {
    const result = jsonToYaml({ name: 'Alice', age: 30 })
    expect(result).toContain('name: Alice')
    expect(result).toContain('age: 30')
  })

  it('serializes nested objects', () => {
    const result = jsonToYaml({ a: { b: 1 } })
    expect(result).toContain('a:')
    expect(result).toContain('b: 1')
  })

  it('serializes object with array value', () => {
    const result = jsonToYaml({ items: [1, 2] })
    expect(result).toContain('items:')
    expect(result).toContain('- 1')
    expect(result).toContain('- 2')
  })

  // --- round-trip ---
  it('round-trips simple object through parseYaml', () => {
    const original = { name: 'Alice', age: 30, active: true }
    const yaml = jsonToYaml(original)
    const restored = parseYaml(yaml)
    expect(restored).toEqual(original)
  })

  it('round-trips object with nested structure', () => {
    const original = { user: { name: 'Bob', score: 99 } }
    const yaml = jsonToYaml(original)
    const restored = parseYaml(yaml)
    expect(restored).toEqual(original)
  })
})
