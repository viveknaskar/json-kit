import { describe, it, expect } from 'vitest'
import { countStats, formatBytes } from '../../src/core/Utils.js'
import { sortKeys } from '../../src/tools/SortKeys.js'
import { flattenJson } from '../../src/tools/FlattenJson.js'
import { unflattenJson } from '../../src/tools/UnflattenJson.js'
import { jsonToCsv } from '../../src/tools/JsonToCsv.js'
import { csvToJson } from '../../src/tools/CsvToJson.js'
import { computeDiff } from '../../src/tools/JsonDiff.js'
import { validate } from '../../src/tools/JsonSchema.js'
import { queryJson } from '../../src/tools/JsonQuery.js'
import { parseScalar } from '../../src/tools/YamlToJson.js'

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
    // 5 ASCII bytes → "5 B"
    const s = countStats('hello')
    expect(s.size).toBe('5 B')
  })

  it('handles multi-line JSON', () => {
    const json = '{\n  "a": 1\n}'
    const s = countStats(json)
    expect(s.lines).toBe(3)
    expect(s.chars).toBe(json.length)
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

  it('quotes cells containing commas', () => {
    const csv = jsonToCsv([{ name: 'Smith, John' }])
    expect(csv).toContain('"Smith, John"')
  })

  it('quotes cells containing double quotes', () => {
    const csv = jsonToCsv([{ note: 'say "hi"' }])
    expect(csv).toContain('"say ""hi"""')
  })

  it('handles empty array gracefully', () => {
    // Should produce at least a header (empty) row
    const csv = jsonToCsv([])
    expect(typeof csv).toBe('string')
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
})

/* ===========================
   validate (JSON Schema)
   =========================== */
describe('validate', () => {
  it('validates matching type', () => {
    expect(validate('hello', { type: 'string' })).toHaveLength(0)
  })

  it('rejects mismatched type', () => {
    const errors = validate(42, { type: 'string' })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('validates required properties', () => {
    const schema = { type: 'object', required: ['name'] }
    expect(validate({}, schema)).toHaveLength(1)
    expect(validate({ name: 'Alice' }, schema)).toHaveLength(0)
  })

  it('validates minLength/maxLength', () => {
    const schema = { type: 'string', minLength: 3, maxLength: 5 }
    expect(validate('ab', schema).length).toBeGreaterThan(0)
    expect(validate('abc', schema)).toHaveLength(0)
    expect(validate('abcdef', schema).length).toBeGreaterThan(0)
  })

  it('validates minimum/maximum', () => {
    const schema = { type: 'number', minimum: 0, maximum: 100 }
    expect(validate(-1, schema).length).toBeGreaterThan(0)
    expect(validate(50, schema)).toHaveLength(0)
    expect(validate(101, schema).length).toBeGreaterThan(0)
  })

  it('validates enum', () => {
    const schema = { enum: ['a', 'b', 'c'] }
    expect(validate('a', schema)).toHaveLength(0)
    expect(validate('d', schema).length).toBeGreaterThan(0)
  })

  it('validates pattern', () => {
    const schema = { type: 'string', pattern: '^[a-z]+$' }
    expect(validate('abc', schema)).toHaveLength(0)
    expect(validate('ABC', schema).length).toBeGreaterThan(0)
  })

  it('validates nested properties', () => {
    const schema = {
      type: 'object',
      properties: {
        age: { type: 'number', minimum: 0 }
      }
    }
    expect(validate({ age: -1 }, schema).length).toBeGreaterThan(0)
    expect(validate({ age: 25 }, schema)).toHaveLength(0)
  })

  it('validates array items', () => {
    const schema = { type: 'array', items: { type: 'number' } }
    expect(validate([1, 2, 3], schema)).toHaveLength(0)
    expect(validate([1, 'x', 3], schema).length).toBeGreaterThan(0)
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
})

/* ===========================
   parseScalar (YAML)
   =========================== */
describe('parseScalar', () => {
  it('parses null values', () => {
    expect(parseScalar('null')).toBeNull()
    expect(parseScalar('~')).toBeNull()
    expect(parseScalar('')).toBeNull()
  })

  it('parses booleans', () => {
    expect(parseScalar('true')).toBe(true)
    expect(parseScalar('false')).toBe(false)
    expect(parseScalar('yes')).toBe(true)
    expect(parseScalar('no')).toBe(false)
  })

  it('parses integers', () => {
    expect(parseScalar('42')).toBe(42)
    expect(parseScalar('-7')).toBe(-7)
    expect(parseScalar('0')).toBe(0)
  })

  it('parses floats', () => {
    expect(parseScalar('3.14')).toBe(3.14)
    expect(parseScalar('-0.5')).toBe(-0.5)
  })

  it('parses quoted strings', () => {
    expect(parseScalar('"hello world"')).toBe('hello world')
    expect(parseScalar("'foo bar'")).toBe('foo bar')
  })

  it('returns plain strings as-is', () => {
    expect(parseScalar('hello')).toBe('hello')
    expect(parseScalar('some string')).toBe('some string')
  })
})
