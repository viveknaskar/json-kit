/* ============================================
   App.js — SPA shell with routing and HTML rendering
   ============================================ */

const tools = [
  // Essentials
  { id: 'format-json',    name: 'Format & Validate',  desc: 'Prettify JSON and detect errors with line numbers',       icon: '✦', accent: '#3b82f6', category: 'essentials' },
  { id: 'minify-json',    name: 'Minify JSON',         desc: 'Compress JSON by removing all whitespace',                icon: '⊟', accent: '#8b5cf6', category: 'essentials' },
  { id: 'sort-keys',      name: 'Sort Keys',           desc: 'Sort all JSON object keys alphabetically',                icon: '⇅', accent: '#06b6d4', category: 'essentials' },
  { id: 'repair-json',    name: 'Repair JSON',         desc: 'Fix trailing commas, single quotes, unquoted keys and comments', icon: '⚙', accent: '#f43f5e', category: 'essentials' },
  { id: 'escape-json',    name: 'Escape / Unescape',   desc: 'Escape a string for use inside JSON, or unescape it back',        icon: '⇔', accent: '#0ea5e9', category: 'essentials' },
  // Convert
  { id: 'json-to-csv',    name: 'JSON to CSV',         desc: 'Convert JSON arrays to CSV spreadsheet format',           icon: '⇢', accent: '#10b981', category: 'convert'   },
  { id: 'csv-to-json',    name: 'CSV to JSON',         desc: 'Convert CSV data to a JSON array',                        icon: '⇠', accent: '#f59e0b', category: 'convert'   },
  { id: 'json-to-yaml',   name: 'JSON to YAML',        desc: 'Convert JSON to human-readable YAML format',              icon: '⟿', accent: '#ef4444', category: 'convert'   },
  { id: 'yaml-to-json',   name: 'YAML to JSON',        desc: 'Convert YAML configuration back to JSON',                 icon: '⟻', accent: '#ec4899', category: 'convert'   },
  { id: 'json-to-xml',    name: 'JSON to XML',         desc: 'Convert JSON to structured XML markup',                   icon: '⟩', accent: '#0891b2', category: 'convert'   },
  { id: 'xml-to-json',    name: 'XML to JSON',         desc: 'Parse XML and convert it back to JSON',                   icon: '⟨', accent: '#7c3aed', category: 'convert'   },
  // Analyze & Transform
  { id: 'json-merge',     name: 'JSON Merge',          desc: 'Deep merge two JSON objects, with B values taking precedence', icon: '⊞', accent: '#6366f1', category: 'transform' },
  { id: 'json-diff',      name: 'JSON Diff',           desc: 'Compare two JSON objects and highlight differences',      icon: '⊕', accent: '#f97316', category: 'transform' },
  { id: 'json-schema',    name: 'Schema Validator',    desc: 'Validate JSON against a JSON Schema definition',          icon: '✓', accent: '#84cc16', category: 'transform' },
  { id: 'flatten-json',   name: 'Flatten JSON',        desc: 'Flatten nested objects to dot-notation keys',             icon: '⬇', accent: '#14b8a6', category: 'transform' },
  { id: 'unflatten-json', name: 'Unflatten JSON',      desc: 'Restore dot-notation keys to nested structure',           icon: '⬆', accent: '#a855f7', category: 'transform' },
  { id: 'json-query',     name: 'JSON Query',          desc: 'Extract data from JSON using path expressions',           icon: '⌕', accent: '#fb923c', category: 'transform' },
]

export default class App {
  constructor(container) {
    this.container = container
    this.currentView = 'home'
    this.render()
    this.initNav()
  }

  render() {
    this.container.innerHTML = `
      ${this.headerHTML()}
      <main class="site-main" id="site-main">
        ${this.homeHTML()}
        ${this.toolViewsHTML()}
      </main>
      ${this.footerHTML()}
      <div id="toast-container"></div>
    `
  }

  headerHTML() {
    return `
      <header class="site-header">
        <div class="header-inner">
          <a class="site-logo" data-nav="home" href="#" aria-label="JSON Kit home">json<span>kit</span></a>
          <nav class="site-nav" aria-label="Main navigation">
            <a class="nav-link" data-nav="home" data-section="essentials" href="#">Essentials</a>
            <a class="nav-link" data-nav="home" data-section="convert" href="#">Convert</a>
            <a class="nav-link" data-nav="home" data-section="transform" href="#">Analyze &amp; Transform</a>
            <a class="nav-link" data-nav="home" data-section="about" href="#">About</a>
          </nav>
        </div>
      </header>
    `
  }

  homeHTML() {
    const essentials = tools.filter(t => t.category === 'essentials')
    const convert    = tools.filter(t => t.category === 'convert')
    const transform  = tools.filter(t => t.category === 'transform')

    return `
      <div id="view-home" class="home-view">
        <!-- Hero -->
        <section class="hero">
          <h1 class="hero-title">Free JSON tools,<br><em>no server needed</em></h1>
          <p class="hero-tagline">Format, convert, diff, query and merge JSON right in your browser. No uploads to servers. No sign-up. 17 tools and counting.</p>
          <div class="hero-badges">
            <span>Zero uploads</span>
            <span>Runs locally</span>
            <span>Works offline</span>
            <span>100% free</span>
          </div>
        </section>

        <!-- Tools -->
        <div class="tools-page">
          <!-- Essentials -->
          <section class="tools-section" id="section-essentials">
            <div class="section-header">
              <h2 class="section-title">Essentials</h2>
              <span class="section-count">${essentials.length} tools</span>
            </div>
            <div class="tool-grid">
              ${essentials.map(t => this.toolCardHTML(t)).join('')}
            </div>
          </section>

          <!-- Convert -->
          <section class="tools-section" id="section-convert">
            <div class="section-header">
              <h2 class="section-title">Convert</h2>
              <span class="section-count">${convert.length} tools</span>
            </div>
            <div class="tool-grid">
              ${convert.map(t => this.toolCardHTML(t)).join('')}
            </div>
          </section>

          <!-- Analyze & Transform -->
          <section class="tools-section" id="section-transform">
            <div class="section-header">
              <h2 class="section-title">Analyze &amp; Transform</h2>
              <span class="section-count">${transform.length} tools</span>
            </div>
            <div class="tool-grid">
              ${transform.map(t => this.toolCardHTML(t)).join('')}
            </div>
          </section>

          <!-- About -->
          <section id="section-about" class="about-section" style="padding:0;margin-top:1rem;">
            <div class="section-header">
              <h2 class="section-title">About</h2>
            </div>
            <div class="about-card">
              <div>
                <h2>Private by design</h2>
                <p>Every tool in JSON Kit runs entirely in your browser using JavaScript. Your JSON data is never sent to any server — not even ours.</p>
                <p>This makes JSON Kit safe for sensitive payloads: API responses, config files, internal data structures. Process freely.</p>
                <p>Built with Vite and vanilla ES modules — no tracking, no ads, no frameworks bloat.</p>
              </div>
              <div class="about-features">
                <div class="about-feature">
                  <div class="about-feature-icon">⚡</div>
                  <div><strong>Instant processing</strong> — transformations happen as you type, with no server round-trips adding latency.</div>
                </div>
                <div class="about-feature">
                  <div class="about-feature-icon">🔒</div>
                  <div><strong>Zero uploads</strong> — all parsing, conversion and diffing happens inside your tab.</div>
                </div>
                <div class="about-feature">
                  <div class="about-feature-icon">◎</div>
                  <div><strong>Open source</strong> — inspect the code, contribute tools, or self-host on your own domain.</div>
                </div>
                <div class="about-feature">
                  <div class="about-feature-icon">♿</div>
                  <div><strong>Keyboard friendly</strong> — navigate with Tab, trigger actions with Enter, copy with Ctrl+C.</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `
  }

  toolCardHTML(tool) {
    return `
      <div class="tool-card" data-tool="${tool.id}" role="button" tabindex="0" aria-label="Open ${tool.name}">
        <div class="card-top">
          <div class="card-icon" style="background:${tool.accent}18;border:1px solid ${tool.accent}30;">
            <span style="color:${tool.accent}">${tool.icon}</span>
          </div>
          <span class="card-arrow" style="color:${tool.accent}">→</span>
        </div>
        <div class="card-name">${tool.name}</div>
        <div class="card-desc">${tool.desc}</div>
      </div>
    `
  }

  toolViewsHTML() {
    return `
      ${this.formatJsonViewHTML()}
      ${this.minifyJsonViewHTML()}
      ${this.sortKeysViewHTML()}
      ${this.jsonToCsvViewHTML()}
      ${this.csvToJsonViewHTML()}
      ${this.jsonToYamlViewHTML()}
      ${this.yamlToJsonViewHTML()}
      ${this.jsonToXmlViewHTML()}
      ${this.xmlToJsonViewHTML()}
      ${this.jsonMergeViewHTML()}
      ${this.jsonDiffViewHTML()}
      ${this.jsonSchemaViewHTML()}
      ${this.flattenJsonViewHTML()}
      ${this.unflattenJsonViewHTML()}
      ${this.jsonQueryViewHTML()}
      ${this.repairJsonViewHTML()}
      ${this.escapeJsonViewHTML()}
    `
  }

  // ---- Individual Tool Views ----

  formatJsonViewHTML() {
    const t = tools.find(x => x.id === 'format-json')
    return `
      <div id="view-format-json" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input JSON</span>
              <div class="pane-actions">
                <div class="indent-opts" id="format-indent-opts">
                  <button class="btn btn-secondary btn-sm active" data-indent="2">2</button>
                  <button class="btn btn-secondary btn-sm" data-indent="4">4</button>
                  <button class="btn btn-secondary btn-sm" data-indent="tab">⇥</button>
                </div>
                <button class="btn btn-ghost btn-sm" id="format-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="format-input" class="code-area" placeholder='Paste your JSON here…\n\n{"name":"Alice","age":30}' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="format-btn">Format JSON</button>
              <div class="stats-bar" id="format-input-stats">
                <span>0 chars</span>
              </div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Formatted Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="format-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="format-download">Download</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="format-output" class="output-area empty">Formatted JSON will appear here…</div>
            </div>
            <div class="status-message" id="format-status"></div>
          </div>
        </div>
      </div>
    `
  }

  minifyJsonViewHTML() {
    const t = tools.find(x => x.id === 'minify-json')
    return `
      <div id="view-minify-json" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input JSON</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="minify-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="minify-input" class="code-area" placeholder='Paste formatted JSON to minify…' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="minify-btn">Minify JSON</button>
              <div class="stats-bar" id="minify-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Minified Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="minify-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="minify-download">Download</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="minify-output" class="output-area empty">Minified JSON will appear here…</div>
            </div>
            <div class="status-message" id="minify-status"></div>
          </div>
        </div>
      </div>
    `
  }

  sortKeysViewHTML() {
    const t = tools.find(x => x.id === 'sort-keys')
    return `
      <div id="view-sort-keys" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input JSON</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="sort-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="sort-input" class="code-area" placeholder='Paste JSON with unsorted keys…' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="sort-btn">Sort Keys</button>
              <div class="stats-bar" id="sort-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Sorted Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="sort-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="sort-download">Download</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="sort-output" class="output-area empty">Sorted JSON will appear here…</div>
            </div>
            <div class="status-message" id="sort-status"></div>
          </div>
        </div>
      </div>
    `
  }

  jsonToCsvViewHTML() {
    const t = tools.find(x => x.id === 'json-to-csv')
    return `
      <div id="view-json-to-csv" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input JSON (array of objects)</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="j2c-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="j2c-input" class="code-area" placeholder='[&#10;  {"name":"Alice","age":30},&#10;  {"name":"Bob","age":25}&#10;]' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="j2c-btn">Convert to CSV</button>
              <div class="stats-bar" id="j2c-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">CSV Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="j2c-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="j2c-download">Download .csv</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="j2c-output" class="output-area empty">CSV output will appear here…</div>
            </div>
            <div class="status-message" id="j2c-status"></div>
          </div>
        </div>
      </div>
    `
  }

  csvToJsonViewHTML() {
    const t = tools.find(x => x.id === 'csv-to-json')
    return `
      <div id="view-csv-to-json" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input CSV</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="c2j-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="c2j-input" class="code-area" placeholder='name,age,city&#10;Alice,30,NYC&#10;Bob,25,LA' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="c2j-btn">Convert to JSON</button>
              <div class="stats-bar" id="c2j-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">JSON Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="c2j-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="c2j-download">Download .json</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="c2j-output" class="output-area empty">JSON output will appear here…</div>
            </div>
            <div class="status-message" id="c2j-status"></div>
          </div>
        </div>
      </div>
    `
  }

  jsonToYamlViewHTML() {
    const t = tools.find(x => x.id === 'json-to-yaml')
    return `
      <div id="view-json-to-yaml" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input JSON</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="j2y-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="j2y-input" class="code-area" placeholder='{"server":{"host":"localhost","port":8080}}' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="j2y-btn">Convert to YAML</button>
              <div class="stats-bar" id="j2y-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">YAML Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="j2y-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="j2y-download">Download .yaml</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="j2y-output" class="output-area empty">YAML output will appear here…</div>
            </div>
            <div class="status-message" id="j2y-status"></div>
          </div>
        </div>
      </div>
    `
  }

  yamlToJsonViewHTML() {
    const t = tools.find(x => x.id === 'yaml-to-json')
    return `
      <div id="view-yaml-to-json" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input YAML</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="y2j-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="y2j-input" class="code-area" placeholder='server:&#10;  host: localhost&#10;  port: 8080&#10;tags:&#10;  - api&#10;  - v2' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="y2j-btn">Convert to JSON</button>
              <div class="stats-bar" id="y2j-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">JSON Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="y2j-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="y2j-download">Download .json</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="y2j-output" class="output-area empty">JSON output will appear here…</div>
            </div>
            <div class="status-message" id="y2j-status"></div>
          </div>
        </div>
      </div>
    `
  }

  jsonToXmlViewHTML() {
    const t = tools.find(x => x.id === 'json-to-xml')
    return `
      <div id="view-json-to-xml" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input JSON</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="j2x-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="j2x-input" class="code-area" placeholder='{"person":{"name":"Alice","age":30},"tags":["admin","user"]}' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="j2x-btn">Convert to XML</button>
              <div class="stats-bar" id="j2x-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">XML Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="j2x-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="j2x-download">Download .xml</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="j2x-output" class="output-area empty">XML output will appear here…</div>
            </div>
            <div class="status-message" id="j2x-status"></div>
          </div>
        </div>
      </div>
    `
  }

  xmlToJsonViewHTML() {
    const t = tools.find(x => x.id === 'xml-to-json')
    return `
      <div id="view-xml-to-json" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input XML</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="x2j-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="x2j-input" class="code-area" placeholder='<?xml version="1.0"?>&#10;<root>&#10;  <person>&#10;    <name>Alice</name>&#10;    <age>30</age>&#10;  </person>&#10;</root>' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="x2j-btn">Convert to JSON</button>
              <div class="stats-bar" id="x2j-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">JSON Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="x2j-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="x2j-download">Download .json</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="x2j-output" class="output-area empty">JSON output will appear here…</div>
            </div>
            <div class="status-message" id="x2j-status"></div>
          </div>
        </div>
      </div>
    `
  }

  jsonMergeViewHTML() {
    const t = tools.find(x => x.id === 'json-merge')
    return `
      <div id="view-json-merge" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">JSON A (base)</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="merge-clear">Clear both</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="merge-a" class="code-area" placeholder='{"name":"Alice","role":"admin","settings":{"theme":"dark"}}' spellcheck="false" autocomplete="off"></textarea>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">JSON B (overrides)</span>
            </div>
            <div class="editor-pane-body">
              <textarea id="merge-b" class="code-area" placeholder='{"role":"user","settings":{"lang":"en"},"email":"alice@example.com"}' spellcheck="false" autocomplete="off"></textarea>
            </div>
          </div>
        </div>

        <div class="editor-pane" style="margin-top:1rem;min-height:260px;">
          <div class="editor-pane-header">
            <span class="pane-label">Merged Output</span>
            <div class="pane-actions">
              <select id="merge-strategy" class="btn btn-ghost btn-sm" style="cursor:pointer;">
                <option value="deep">Deep merge</option>
                <option value="shallow">Shallow merge</option>
              </select>
              <select id="merge-arrays" class="btn btn-ghost btn-sm" style="cursor:pointer;">
                <option value="replace">Arrays: replace</option>
                <option value="concat">Arrays: concat</option>
              </select>
              <button class="btn btn-primary btn-sm" id="merge-btn">Merge</button>
              <button class="btn btn-secondary btn-sm" id="merge-copy">Copy</button>
              <button class="btn btn-secondary btn-sm" id="merge-download">Download</button>
            </div>
          </div>
          <div class="editor-pane-body">
            <div id="merge-output" class="output-area empty">Merged JSON will appear here…</div>
          </div>
          <div class="status-message" id="merge-status"></div>
        </div>
      </div>
    `
  }

  jsonDiffViewHTML() {
    const t = tools.find(x => x.id === 'json-diff')
    return `
      <div id="view-json-diff" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">JSON A (original)</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="diff-clear">Clear both</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="diff-a" class="code-area" placeholder='{"name":"Alice","role":"admin"}' spellcheck="false" autocomplete="off"></textarea>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">JSON B (modified)</span>
            </div>
            <div class="editor-pane-body">
              <textarea id="diff-b" class="code-area" placeholder='{"name":"Alice","role":"user","email":"alice@example.com"}' spellcheck="false" autocomplete="off"></textarea>
            </div>
          </div>
        </div>

        <div class="editor-pane" style="margin-top:1rem;min-height:260px;">
          <div class="editor-pane-header">
            <span class="pane-label">Diff Result</span>
            <div class="pane-actions">
              <button class="btn btn-primary btn-sm" id="diff-btn">Compare</button>
              <button class="btn btn-secondary btn-sm" id="diff-copy">Copy</button>
            </div>
          </div>
          <div id="diff-output" class="diff-output">
            <div class="empty-state">
              <div class="empty-state-icon">{Δ}</div>
              <p>Enter JSON in both panels and click Compare to see the differences.</p>
            </div>
          </div>
          <div class="diff-summary" id="diff-summary" style="display:none;">
            <div class="diff-summary-item"><div class="diff-dot" style="background:#22c55e"></div><span id="diff-added-count">0 added</span></div>
            <div class="diff-summary-item"><div class="diff-dot" style="background:#ef4444"></div><span id="diff-removed-count">0 removed</span></div>
            <div class="diff-summary-item"><div class="diff-dot" style="background:#f59e0b"></div><span id="diff-changed-count">0 changed</span></div>
          </div>
        </div>
      </div>
    `
  }

  jsonSchemaViewHTML() {
    const t = tools.find(x => x.id === 'json-schema')
    return `
      <div id="view-json-schema" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">JSON Data</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="schema-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="schema-data" class="code-area" placeholder='{"name":"Alice","age":30}' spellcheck="false" autocomplete="off"></textarea>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">JSON Schema</span>
            </div>
            <div class="editor-pane-body">
              <textarea id="schema-schema" class="code-area" placeholder='{&#10;  "type": "object",&#10;  "required": ["name","age"],&#10;  "properties": {&#10;    "name": {"type":"string","minLength":1},&#10;    "age":  {"type":"number","minimum":0}&#10;  }&#10;}' spellcheck="false" autocomplete="off"></textarea>
            </div>
          </div>
        </div>

        <div class="editor-pane" style="margin-top:1rem;">
          <div class="editor-pane-header">
            <span class="pane-label">Validation Result</span>
            <div class="pane-actions">
              <button class="btn btn-primary btn-sm" id="schema-btn">Validate</button>
            </div>
          </div>
          <div id="schema-output" class="validation-result">
            <div class="empty-state" style="padding:1.5rem;">
              <p>Enter JSON data and a JSON Schema, then click Validate.</p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  flattenJsonViewHTML() {
    const t = tools.find(x => x.id === 'flatten-json')
    return `
      <div id="view-flatten-json" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input JSON</span>
              <div class="pane-actions">
                <div class="separator-group">
                  <span>Separator:</span>
                  <select id="flatten-sep">
                    <option value=".">Dot (.)</option>
                    <option value="/">Slash (/)</option>
                    <option value="_">Underscore (_)</option>
                  </select>
                </div>
                <button class="btn btn-ghost btn-sm" id="flatten-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="flatten-input" class="code-area" placeholder='{"a":{"b":{"c":1}},"arr":[10,20]}' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="flatten-btn">Flatten JSON</button>
              <div class="stats-bar" id="flatten-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Flattened Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="flatten-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="flatten-download">Download</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="flatten-output" class="output-area empty">Flattened JSON will appear here…</div>
            </div>
            <div class="status-message" id="flatten-status"></div>
          </div>
        </div>
      </div>
    `
  }

  unflattenJsonViewHTML() {
    const t = tools.find(x => x.id === 'unflatten-json')
    return `
      <div id="view-unflatten-json" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Flat JSON Input</span>
              <div class="pane-actions">
                <div class="separator-group">
                  <span>Separator:</span>
                  <select id="unflatten-sep">
                    <option value=".">Dot (.)</option>
                    <option value="/">Slash (/)</option>
                    <option value="_">Underscore (_)</option>
                  </select>
                </div>
                <button class="btn btn-ghost btn-sm" id="unflatten-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="unflatten-input" class="code-area" placeholder='{"a.b.c":1,"arr[0]":10,"arr[1]":20}' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="unflatten-btn">Unflatten JSON</button>
              <div class="stats-bar" id="unflatten-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Nested Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="unflatten-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="unflatten-download">Download</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="unflatten-output" class="output-area empty">Nested JSON will appear here…</div>
            </div>
            <div class="status-message" id="unflatten-status"></div>
          </div>
        </div>
      </div>
    `
  }

  jsonQueryViewHTML() {
    const t = tools.find(x => x.id === 'json-query')
    return `
      <div id="view-json-query" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input JSON</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="query-clear">Clear</button>
              </div>
            </div>
            <div class="query-input-row">
              <input type="text" id="query-path" class="query-input" placeholder='e.g.  users[0].name  or  items[*].id' spellcheck="false" autocomplete="off" />
              <button class="btn btn-primary btn-sm" id="query-btn">Run Query</button>
            </div>
            <div class="editor-pane-body">
              <textarea id="query-input" class="code-area" placeholder='{"users":[{"name":"Alice","id":1},{"name":"Bob","id":2}]}' spellcheck="false" autocomplete="off" style="min-height:320px;"></textarea>
            </div>
            <div class="action-bar">
              <div class="stats-bar" id="query-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Query Result</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="query-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="query-download">Download</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="query-output" class="output-area empty">Query result will appear here…</div>
            </div>
            <div class="status-message" id="query-status"></div>
          </div>
        </div>
      </div>
    `
  }

  escapeJsonViewHTML() {
    const t = tools.find(x => x.id === 'escape-json')
    return `
      <div id="view-escape-json" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Input</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="escape-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="escape-input" class="code-area" placeholder='Paste raw text to escape, or an escaped JSON string to unescape…' spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="escape-btn">Escape →</button>
              <button class="btn btn-secondary" id="unescape-btn">← Unescape</button>
              <div class="stats-bar" id="escape-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="escape-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="escape-download">Download</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="escape-output" class="output-area empty">Result will appear here…</div>
            </div>
            <div class="status-message" id="escape-status"></div>
          </div>
        </div>
      </div>
    `
  }

  repairJsonViewHTML() {
    const t = tools.find(x => x.id === 'repair-json')
    return `
      <div id="view-repair-json" class="tool-view" role="main">
        ${this.toolHeaderHTML(t)}
        <div class="editor-layout">
          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Broken JSON</span>
              <div class="pane-actions">
                <button class="btn btn-ghost btn-sm" id="repair-clear">Clear</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <textarea id="repair-input" class="code-area" placeholder="Paste broken JSON here…\n\n// trailing commas, single quotes, unquoted keys\n{name: 'Alice', scores: [10, 20,],}" spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" id="repair-btn">Repair JSON</button>
              <div class="stats-bar" id="repair-input-stats"><span>0 chars</span></div>
            </div>
          </div>

          <div class="editor-pane">
            <div class="editor-pane-header">
              <span class="pane-label">Repaired Output</span>
              <div class="pane-actions">
                <button class="btn btn-secondary btn-sm" id="repair-copy">Copy</button>
                <button class="btn btn-secondary btn-sm" id="repair-download">Download</button>
              </div>
            </div>
            <div class="editor-pane-body">
              <div id="repair-output" class="output-area empty">Repaired JSON will appear here…</div>
            </div>
            <div class="status-message" id="repair-status"></div>
          </div>
        </div>
      </div>
    `
  }

  // ---- Shared tool header ----

  toolHeaderHTML(tool) {
    return `
      <div class="tool-header">
        <button class="back-btn" data-nav="home" aria-label="Back to home">← Back</button>
        <div class="tool-title-wrap">
          <div class="tool-title-icon" style="background:${tool.accent}18;border:1px solid ${tool.accent}30;">
            <span style="color:${tool.accent}">${tool.icon}</span>
          </div>
          <div>
            <div class="tool-title">${tool.name}</div>
            <div class="tool-subtitle">${tool.desc}</div>
          </div>
        </div>
      </div>
    `
  }

  footerHTML() {
    return `
      <footer class="site-footer">
        <div class="footer-inner">
          <span class="footer-copy">© ${new Date().getFullYear()} JSON Kit — free &amp; open source</span>
          <div class="footer-links">
            <a class="footer-link" href="https://github.com/viveknaskar/json-kit" target="_blank" rel="noopener">GitHub</a>
          </div>
        </div>
      </footer>
    `
  }

  // ---- Navigation / Routing ----

  initNav() {
    // Click delegation for tool cards and nav links
    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-tool]')
      const navEl = e.target.closest('[data-nav]')

      if (card) {
        e.preventDefault()
        this.showTool(card.dataset.tool)
        return
      }

      if (navEl) {
        e.preventDefault()
        const section = navEl.dataset.section
        this.showHome()
        if (section) {
          setTimeout(() => {
            const el = document.getElementById(`section-${section}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 50)
        }
      }
    })

    // Keyboard for tool cards
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('[data-tool]')
        if (card) {
          e.preventDefault()
          this.showTool(card.dataset.tool)
        }
      }
    })

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.tool) {
        this._activateTool(e.state.tool)
      } else {
        this._activateHome()
      }
    })
  }

  showTool(toolId) {
    this._activateTool(toolId)
    history.pushState({ tool: toolId }, '', `#${toolId}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  showHome() {
    this._activateHome()
    history.pushState({}, '', location.pathname + location.search)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  _activateTool(toolId) {
    // Hide home
    const homeView = document.getElementById('view-home')
    if (homeView) homeView.style.display = 'none'

    // Hide all tool views
    document.querySelectorAll('.tool-view').forEach(v => v.classList.remove('active'))

    // Show requested tool
    const view = document.getElementById(`view-${toolId}`)
    if (view) {
      view.classList.add('active')
      this.currentView = toolId
    }

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'))
  }

  _activateHome() {
    // Show home
    const homeView = document.getElementById('view-home')
    if (homeView) homeView.style.display = ''

    // Hide all tool views
    document.querySelectorAll('.tool-view').forEach(v => v.classList.remove('active'))
    this.currentView = 'home'
  }

  // Restore view from hash on page load
  restoreFromHash() {
    const hash = location.hash.slice(1)
    if (hash) {
      const tool = tools.find(t => t.id === hash)
      if (tool) {
        this._activateTool(tool.id)
        return
      }
    }
    this._activateHome()
  }
}
