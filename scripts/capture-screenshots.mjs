import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const BASE = 'http://localhost:3000/json-kit/'
const OUT  = 'public/screenshots'

const tools = [
  { hash: null,             file: 'home'        },
  { hash: 'format-json',   file: 'format'      },
  { hash: 'minify-json',   file: 'minify'      },
  { hash: 'sort-keys',     file: 'sort-keys'   },
  { hash: 'repair-json',   file: 'repair'      },
  { hash: 'escape-json',   file: 'escape'      },
  { hash: 'json-to-csv',   file: 'json-to-csv' },
  { hash: 'csv-to-json',   file: 'csv-to-json' },
  { hash: 'json-to-yaml',  file: 'json-to-yaml'},
  { hash: 'yaml-to-json',  file: 'yaml-to-json'},
  { hash: 'json-to-xml',   file: 'json-to-xml' },
  { hash: 'xml-to-json',   file: 'xml-to-json' },
  { hash: 'json-merge',    file: 'merge'       },
  { hash: 'json-diff',     file: 'diff'        },
  { hash: 'json-schema',   file: 'schema'      },
  { hash: 'flatten-json',  file: 'flatten'     },
  { hash: 'unflatten-json',file: 'unflatten'   },
  { hash: 'json-query',    file: 'query'       },
  { hash: 'json-to-ts',    file: 'json-to-ts'  },
  { hash: 'json-to-table', file: 'json-to-table'},
  { hash: 'base64-json',   file: 'base64'      },
  { hash: 'remove-nulls',  file: 'remove-nulls'},
  { hash: 'pick-omit',     file: 'pick-omit'   },
  { hash: 'mock-json',     file: 'mock-json'   },
  { hash: 'jwt-decode',    file: 'jwt-decode'  },
]

if (!existsSync(OUT)) await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const page    = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 800 })

// Load the app once
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

for (const { hash, file } of tools) {
  if (hash === null) {
    // Click the logo to go home
    await page.click('.site-logo')
    await page.waitForTimeout(500)
  } else {
    // Click the tool card on the home page
    await page.click('.site-logo')
    await page.waitForTimeout(300)
    await page.click(`[data-tool="${hash}"]`)
    await page.waitForSelector(`#view-${hash}`, { timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(400)
  }

  const path = `${OUT}/${file}.png`
  await page.screenshot({ path, fullPage: false })
  console.log(`✓ ${path}`)
}

// OG image = home page
await page.click('.site-logo')
await page.waitForTimeout(500)
await page.screenshot({ path: 'public/og-image.png', fullPage: false })
console.log('✓ public/og-image.png')

await browser.close()
console.log('\nDone.')
