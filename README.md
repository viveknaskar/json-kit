# jsonkit

![jsonkit](public/og-image.png)

![Views](https://visitor-badge.laobi.icu/badge?page_id=viveknaskar.json-kit)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?logo=github-sponsors)](https://github.com/sponsors/viveknaskar)

Live site: https://viveknaskar.github.io/json-kit/

Free, open-source JSON tools that run entirely in your browser. No sign-up, no server uploads, your data never leaves your device.

Built with vanilla JavaScript and [Vite](https://vitejs.dev/).

---

## Screenshots

### Essentials

| Format & Validate | Minify JSON | Sort Keys |
|:---:|:---:|:---:|
| ![Format](public/screenshots/format.png) | ![Minify](public/screenshots/minify.png) | ![Sort Keys](public/screenshots/sort-keys.png) |

| Repair JSON | Escape / Unescape |
|:---:|:---:|
| ![Repair](public/screenshots/repair.png) | ![Escape](public/screenshots/escape.png) |

### Convert

| JSON to CSV | CSV to JSON | JSON to YAML |
|:---:|:---:|:---:|
| ![JSON to CSV](public/screenshots/json-to-csv.png) | ![CSV to JSON](public/screenshots/csv-to-json.png) | ![JSON to YAML](public/screenshots/json-to-yaml.png) |

| YAML to JSON | JSON to XML | XML to JSON |
|:---:|:---:|:---:|
| ![YAML to JSON](public/screenshots/yaml-to-json.png) | ![JSON to XML](public/screenshots/json-to-xml.png) | ![XML to JSON](public/screenshots/xml-to-json.png) |

### Analyze & Transform

| JSON Merge | JSON Diff | Schema Validator |
|:---:|:---:|:---:|
| ![Merge](public/screenshots/merge.png) | ![Diff](public/screenshots/diff.png) | ![Schema](public/screenshots/schema.png) |

| Flatten JSON | Unflatten JSON | JSON Query |
|:---:|:---:|:---:|
| ![Flatten](public/screenshots/flatten.png) | ![Unflatten](public/screenshots/unflatten.png) | ![Query](public/screenshots/query.png) |

---

## Features

- **100% client-side:** all processing happens in the browser, no backend, no cloud
- **No data uploads:** JSON is parsed and transformed entirely in your browser tab
- **Works offline:** once loaded, every tool works without an internet connection
- **No sign-up, no limits, no watermarks**
- **24 tools** covering formatting, conversion, diffing, querying, and more
- **Dark / light mode** toggle with OS preference detection and sound feedback

---

## How does it Work?

When you paste JSON into any tool, it never leaves your device. Here is exactly what happens:

1. **Your input is read into memory** inside the browser tab as a plain JavaScript string.
2. **All parsing and transformation runs locally** using pure JavaScript, no WebAssembly, no server calls.
3. **The result is written back to the page** as a string, still entirely in memory.
4. **If you download**, the browser generates a temporary local `Blob` URL, triggers the download, then immediately revokes it.
5. **When you close the tab**, everything is gone. No trace left anywhere.

No data is ever sent over the network. There is no backend, no database, and no cloud storage involved. You can turn off your WiFi after the page loads and every tool will still work.

---

## Tools

### Essentials

| Tool | Description |
|------|-------------|
| **Format & Validate** | Prettify JSON and detect parse errors with line and column info. |
| **Minify JSON** | Compress JSON by stripping all whitespace. Shows size reduction. |
| **Sort Keys** | Sort all object keys alphabetically, recursively through nested structures. |
| **Repair JSON** | Fix trailing commas, single quotes, unquoted keys, and inline comments. |
| **Escape / Unescape** | Escape a raw string for use inside a JSON value, or unescape it back. |

### Convert

| Tool | Description                                                                       |
|------|-----------------------------------------------------------------------------------|
| **JSON to CSV** | Convert a JSON array to CSV. Headers are sorted; nested values are serialised.    |
| **CSV to JSON** | Parse CSV (including quoted fields and CRLF) into a typed JSON array.             |
| **JSON to YAML** | Hand-rolled YAML serialiser, no external library required.                        |
| **YAML to JSON** | Hand-rolled YAML parser, handles sequences, mappings, and all scalar types.       |
| **JSON to XML** | Convert JSON to structured XML wrapped in `<root>`. Arrays repeat the parent tag. |
| **XML to JSON** | Parse XML back to JSON. Repeated siblings become arrays; text is type-coerced.    |
| **JSON to TypeScript** | Generate TypeScript interface definitions from any JSON object.                   |
| **JSON to Markdown** | Convert a JSON array to a Markdown table.                                         |

### Analyze & Transform

| Tool | Description |
|------|-------------|
| **JSON Merge** | Deep merge two JSON objects. Choose between replace or concat array strategy. |
| **JSON Diff** | Deep-compare two JSON objects and highlight added, removed, and changed keys. |
| **Schema Validator** | Validate JSON against a JSON Schema definition (type, required, pattern, enum, allOf, anyOf, oneOf, not, if/then/else, and more). |
| **Flatten JSON** | Flatten nested objects to dot-notation keys (`a.b.c`, `arr[0]`). Configurable separator. |
| **Unflatten JSON** | Restore dot-notation flat keys back to a nested structure. |
| **JSON Query** | Extract values using path expressions (`users[0].name`, `items[*].id`). |
| **Base64 Encode/Decode** | Encode text or JSON to Base64, or decode it back. |
| **Remove Nulls** | Strip null values, empty strings, and empty collections from JSON. |
| **Pick / Omit Keys** | Extract or remove specific dot-notation key paths from a JSON object. |
| **Mock Generator** | Generate realistic fake JSON data from a JSON Schema. Supports formats, enums, nested objects, and semantic field-name hints. |
| **JWT Decoder** | Decode JWT headers, payloads, and claims. Shows expiry status, time remaining, and human-readable timestamps for iat/exp/nbf. |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, project structure, and how to add a new tool.

---

## License

[MIT](LICENSE)
