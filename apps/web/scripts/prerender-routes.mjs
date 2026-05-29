#!/usr/bin/env node
/**
 * Postbuild: для каждого статичного маршрута копируем dist/index.html и
 * подставляем route-specific <title>, <meta description>, og:*, canonical.
 *
 * Зачем: SPA отдаёт пустой <body> до загрузки JS — для Yandex и социальных
 * шарингов это критично. Сгенерированные файлы позволяют nginx отдавать
 * разный HTML по пути, при этом JS-бандл и React-роутер работают как обычно.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const indexPath = join(distDir, 'index.html')

if (!existsSync(indexPath)) {
  console.error('[prerender] dist/index.html not found — run vite build first')
  process.exit(1)
}

const SITE = 'https://biliardo.kz'
const OG_IMAGE = `${SITE}/og-image.png`

const routes = [
  {
    file: 'index.html',
    path: '/',
    title: 'Biliardo — программа для бильярдного клуба в Казахстане | Автоматизация столов, баров и турниров',
    description: 'Управление столами, тарифами день/ночь, баром, отчётами и турнирами в одном приложении. Поставка оборудования, установка под ключ, обучение персонала. Лицензия пожизненная.',
    keywords: 'программа для бильярдного клуба, автоматизация бильярда, бильярд Казахстан, ПО для бильярда, тарификатор бильярд, оборудование для бильярдного клуба',
  },
  {
    file: 'club.html',
    path: '/club',
    title: 'Biliardo — турниры по бильярду без боли | Платформа для клубов и игроков',
    description: 'Создай турнир за 2 минуты. Игроки регистрируются сами, сетка строится автоматически. 6 форматов сетки, real-time обновления, поддержка клубов в Казахстане.',
    keywords: 'турниры по бильярду, бильярдный турнир, сетка турнира, регистрация на турнир, бильярдная платформа, бильярд Казахстан',
  },
  {
    file: 'pricing.html',
    path: '/pricing',
    title: 'Тарифы Biliardo — программа для бильярдного клуба | От бесплатного до Pro',
    description: 'Прозрачные тарифы для бильярдных клубов в Казахстане. Бесплатный старт до 6 игроков, подписки и пожизненная лицензия. Оплата через Kaspi Pay.',
    keywords: 'тарифы бильярдного клуба, цена программа бильярд, подписка бильярд, стоимость автоматизации бильярда',
  },
  {
    file: 'tournaments.html',
    path: '/tournaments',
    title: 'Турниры по бильярду в Казахстане — расписание и регистрация | Biliardo',
    description: 'Актуальные турниры по бильярду: Алматы, Астана, Шымкент и другие города Казахстана. Онлайн-регистрация, live-сетки и расписание матчей.',
    keywords: 'турниры по бильярду Казахстан, бильярдные турниры Алматы, бильярдные турниры Астана, расписание турниров',
  },
]

const baseHtml = readFileSync(indexPath, 'utf-8')

function buildRouteHtml(route) {
  const url = `${SITE}${route.path}`
  let html = baseHtml

  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${route.title}</title>`,
  )
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${route.description}" />`,
  )

  const headInjection = `
    <meta name="keywords" content="${route.keywords}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${route.title}" />
    <meta name="twitter:description" content="${route.description}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />`

  html = html.replace('</head>', `${headInjection}\n  </head>`)
  return html
}

for (const route of routes) {
  const html = buildRouteHtml(route)
  const outPath = join(distDir, route.file)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html, 'utf-8')
  console.log(`[prerender] ${route.path} → dist/${route.file}`)
}

console.log(`[prerender] generated ${routes.length} route HTML files`)
