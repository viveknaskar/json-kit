# JSON Kit

**Free browser-based JSON tools — format, convert, diff, query and more.**

All processing happens entirely in your browser. No data is ever uploaded to a server.

## Tools (12 total)

### Essentials
| Tool | Description |
|------|-------------|
| Format & Validate | Prettify JSON and detect parse errors with line/column info |
| Minify JSON | Compact JSON by removing all whitespace, shows size reduction |
| Sort Keys | Sort all object keys alphabetically, recursively |

### Convert
| Tool | Description |
|------|-------------|
| JSON to CSV | Convert JSON arrays to CSV, sorted headers, flattens one level of nesting |
| CSV to JSON | Parse CSV (including quoted fields) to a JSON array |
| JSON to YAML | Hand-rolled YAML serializer — no external library |
| YAML to JSON | Hand-rolled YAML parser — handles sequences, mappings, scalars |

### Analyze & Transform
| Tool | Description |
|------|-------------|
| JSON Diff | Deep-compare two JSON objects, highlight added/removed/changed keys |
| Schema Validator | Validate JSON against a JSON Schema (type, required, properties, pattern, enum, allOf, anyOf, oneOf, not, if/then/else, …) |
| Flatten JSON | Flatten nested objects to dot-notation keys (`a.b.c`, `arr[0]`) |
| Unflatten JSON | Restore dot-notation keys to nested structure |
| JSON Query | Extract values with path expressions (`users[0].name`, `items[*].id`) |

## Stack

- **Vite 8** — build & dev server
- **Vanilla ES modules** — no framework
- **Vitest 4** — unit tests (238 tests)
- **GitHub Actions** — CI/CD to GitHub Pages

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run unit tests
npm test

# Watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy

The project deploys automatically to GitHub Pages on every push to `master` via the GitHub Actions workflow at `.github/workflows/deploy.yml`.

To deploy manually:

```bash
npm run deploy
```

This runs `vite build` then pushes `dist/` to the `gh-pages` branch.

The site is served from the base path `/json-kit/`, so the live URL is:

```
https://<your-github-username>.github.io/json-kit/
```

## Project Structure

```
src/
  core/
    App.js          SPA shell — renders all HTML and handles routing
    Utils.js        Shared utilities (clipboard, download, toast, stats, escapeHtml)
  styles/
    base.css        CSS variables, dark theme, reset, animations
    layout.css      Header, footer, hero, tool grid
    components.css  Cards, buttons, toasts, tabs
    tools.css       Two-column editor layout, diff highlighting
  tools/            One module per tool, each exports init()
  main.js           Entry point — imports CSS, boots App, calls init()
tests/
  unit/             Vitest unit tests
public/
  favicon.svg
  robots.txt
```

## License

MIT
