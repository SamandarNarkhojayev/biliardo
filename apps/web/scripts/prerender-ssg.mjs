#!/usr/bin/env node
/**
 * Real SSG: запускает `vite preview`, поднимает Puppeteer, навигирует на каждый
 * статичный маршрут, ждёт пока React всё отрендерит, и сохраняет получившийся
 * `#root` обратно в dist/{route}.html. Краулеры видят настоящий React-вывод
 * вместо статичного hand-written текста (который остаётся как fallback).
 *
 * Запуск (только локально перед деплоем):
 *   npm --workspace @billiard/web run build:ssg
 *
 * Зачем не в Docker: Puppeteer тянет Chromium ~170MB. В Dockerfile стоит
 * `PUPPETEER_SKIP_DOWNLOAD=true`, поэтому контейнер не качает Chromium и не
 * умеет SSG. Production-Docker использует только static prerender (этого
 * уже достаточно для индексации, SSG — это дополнительный уровень качества).
 */

import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const webDir = join(__dirname, '..')
const distDir = join(webDir, 'dist')

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('[ssg] dist/index.html not found — сначала запусти `npm run build`')
  process.exit(1)
}

let puppeteer
try {
  puppeteer = (await import('puppeteer')).default
} catch (e) {
  console.error('[ssg] puppeteer не установлен. Запусти:\n  npm --workspace @billiard/web install --include=dev')
  console.error('[ssg] Если ты в Docker — это ожидаемо (PUPPETEER_SKIP_DOWNLOAD=true). Static prerender уже отработал, дополнительный SSG только локально.')
  process.exit(0)
}

const ROUTES = [
  { path: '/', file: 'index.html' },
  { path: '/club', file: 'club.html' },
  { path: '/pricing', file: 'pricing.html' },
  { path: '/tournaments', file: 'tournaments.html' },
]

const PORT = 4174

console.log('[ssg] starting vite preview...')
const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: webDir,
  stdio: ['ignore', 'pipe', 'pipe'],
})

/** Ожидаем строку «Local:» из stdout vite preview. */
const ready = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('preview did not start in 20s')), 20_000)
  const onData = (chunk) => {
    const text = chunk.toString()
    if (text.includes('Local:') || text.includes(`localhost:${PORT}`)) {
      clearTimeout(timer)
      resolve(true)
    }
  }
  preview.stdout.on('data', onData)
  preview.stderr.on('data', onData)
  preview.on('exit', (code) => reject(new Error(`preview exited with code ${code}`)))
}).catch((e) => { console.error('[ssg]', e.message); return false })

if (!ready) {
  preview.kill()
  process.exit(1)
}

console.log('[ssg] launching puppeteer...')
const browser = await puppeteer.launch({ headless: true })

let ok = 0
try {
  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route.path}`
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 })
    } catch (e) {
      // networkidle0 иногда не наступает из-за фоновых fetch — fallback на DOM-load.
      console.warn(`[ssg] ${route.path}: networkidle0 timeout, falling back to domcontentloaded`)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 })
    }
    // Даём React время дорендерить (i18n, framer-motion mount-эффекты).
    await new Promise((r) => setTimeout(r, 1200))

    const rootHtml = await page.$eval('#root', (el) => el.outerHTML).catch(() => null)
    await page.close()

    if (!rootHtml) {
      console.warn(`[ssg] ${route.path}: #root не найден, оставляем static prerender`)
      continue
    }

    const filePath = join(distDir, route.file)
    const original = readFileSync(filePath, 'utf-8')
    const replaced = original.replace(
      /<!--SSG-ROOT-->[\s\S]*?<!--\/SSG-ROOT-->/,
      `<!--SSG-ROOT-->\n    ${rootHtml}\n    <!--/SSG-ROOT-->`,
    )
    if (replaced === original) {
      console.warn(`[ssg] ${route.path}: маркеры <!--SSG-ROOT--> не найдены в ${route.file}, пропуск`)
      continue
    }
    writeFileSync(filePath, replaced, 'utf-8')
    console.log(`[ssg] ${route.path} → dist/${route.file} (${Math.round(rootHtml.length / 1024)} KB)`)
    ok++
  }
} finally {
  await browser.close()
  preview.kill()
}

console.log(`[ssg] done: ${ok}/${ROUTES.length} routes rendered`)
