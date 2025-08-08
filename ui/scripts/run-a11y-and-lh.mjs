import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer'
import lighthouse from 'lighthouse'
import { writeFileSync } from 'node:fs'

const outDir = path.resolve(process.cwd(), 'reports')
await fs.mkdir(outDir, { recursive: true })

const serverUrl = process.env.APP_URL || 'http://localhost:5173'
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1366, height: 900 })

// Landing screenshot
await page.goto(serverUrl, { waitUntil: 'networkidle0' })
await page.screenshot({ path: path.join(outDir, 'landing.png') })

// Analyze example.com
await page.type('input#url', 'https://example.com')
await page.click('button[aria-label="Analyze"]')
await page.waitForSelector('[aria-label="Analysis results"]', { timeout: 5000 })
await page.screenshot({ path: path.join(outDir, 'results.png') })

// Axe via page.evaluate with injected script
const axePath = path.join(path.dirname(new URL(import.meta.url).pathname), '../node_modules/axe-core/axe.min.js')
await page.addScriptTag({ path: axePath }).catch(()=>{})
const axeResults = await page.evaluate(async () => {
  // @ts-ignore
  if (!window.axe) return { error: 'axe not loaded' }
  // @ts-ignore
  return await window.axe.run(document, { runOnly: ['wcag2aa'] })
})
writeFileSync(path.join(outDir, 'axe.json'), JSON.stringify(axeResults, null, 2))

// Lighthouse
const lhOpts = { port: (new URL(browser.wsEndpoint())).port, output: 'json', logLevel: 'error' }
const { lhr } = await lighthouse(`${serverUrl}/`, lhOpts, {
  extends: 'lighthouse:default',
})
writeFileSync(path.join(outDir, 'lighthouse.json'), JSON.stringify(lhr, null, 2))

await browser.close()

console.log('AXE violations:', axeResults.violations ? axeResults.violations.length : 'n/a')
console.log('Lighthouse performance:', lhr?.categories?.performance?.score)