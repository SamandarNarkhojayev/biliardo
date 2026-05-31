#!/usr/bin/env node
/**
 * Postbuild prerender: для каждого статичного маршрута генерируем HTML с
 * per-route <title>, <meta description>, og:*, canonical И статичным SEO-контентом
 * в <div id="root">.
 *
 * Зачем body-контент: SPA отдаёт пустой <div id="root"></div> до загрузки JS, и
 * Googlebot/Yandexbot часто индексирует страницу как «пустую» (особенно для нового
 * сайта без авторитета). Делаем SSG-light: впрыскиваем H1 + описание + ключевые
 * ссылки. React делает createRoot().render() — он СБРАСЫВАЕТ содержимое корня
 * перед первым рендером (createRoot, не hydrateRoot), поэтому пользователю не
 * видно дублей, а краулер видит полноценный текст в первоначальном HTML.
 *
 * Запрос: nginx (apps/web/nginx.conf) роутит /club, /pricing, /tournaments на
 * соответствующие *.html файлы; всё остальное — на /index.html.
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
const PHONE = '+7 706 686 94 14'
const WHATSAPP = 'https://wa.me/77066869414'

/** Общая навигация — Googlebot увидит внутренние ссылки, ускоряет краул-граф. */
const NAV_LINKS = `
      <nav aria-label="Основная навигация">
        <a href="/">Оборудование</a> ·
        <a href="/club">Турниры и клуб</a> ·
        <a href="/pricing">Тарифы</a> ·
        <a href="/tournaments">Расписание турниров</a> ·
        <a href="/about">О Biliardo</a> ·
        <a href="/contacts">Контакты</a> ·
        <a href="/help">Помощь</a> ·
        <a href="/blog">Блог</a>
      </nav>`

const FOOTER_CTA = `
      <p>
        Связь: <a href="tel:+77066869414">${PHONE}</a> ·
        <a href="${WHATSAPP}" rel="nofollow noopener">WhatsApp</a>
      </p>`

const routes = [
  {
    file: 'index.html',
    path: '/',
    title: 'Biliardo — программа для бильярдного клуба в Казахстане | Автоматизация столов, баров и турниров',
    description: 'Управление столами, тарифами день/ночь, баром, отчётами и турнирами в одном приложении. Поставка оборудования, установка под ключ, обучение персонала. Лицензия пожизненная.',
    keywords: 'программа для бильярдного клуба, автоматизация бильярда, бильярд Казахстан, ПО для бильярда, тарификатор бильярд, оборудование для бильярдного клуба',
    h1: 'Biliardo — программа автоматизации бильярдного клуба',
    body: `
      <p><strong>Biliardo</strong> — комплексное решение для управления бильярдным клубом в Казахстане:
      контроль столов и освещения, гибкие тарифы день/ночь, учёт бара, отчётность и встроенный
      турнирный модуль. Один продукт вместо пяти.</p>
      <h2>Что входит в Biliardo</h2>
      <ul>
        <li>Управление столами: запуск/остановка сессии, режимы «по времени», «по сумме», «безлимит».</li>
        <li>Тарифы день/ночь с автопереключением по расписанию.</li>
        <li>Касса бара: меню, склад, чеки, скидки.</li>
        <li>Сменные отчёты: выручка, маржа, загрузка столов.</li>
        <li>Турниры и сетки: 6 форматов, авто-генерация bracket'ов.</li>
        <li>Веб-кабинет для владельца: статистика онлайн с любого устройства.</li>
      </ul>
      <h2>Поставка оборудования под ключ</h2>
      <p>Мы привозим, устанавливаем и настраиваем компьютер-управление освещением столов, рабочее место
      администратора и POS-периферию (принтер чеков, сканер). Обучаем персонал, даём гарантию.</p>
      <h2>Города Казахстана</h2>
      <p>Работаем по всей стране: <strong>Алматы</strong>, <strong>Астана</strong>, <strong>Шымкент</strong>,
      <strong>Караганда</strong>, <strong>Актобе</strong>, <strong>Павлодар</strong>,
      <strong>Усть-Каменогорск</strong>, <strong>Атырау</strong>, <strong>Семей</strong>.</p>
      <p><a href="/pricing">Посмотреть тарифы Biliardo →</a></p>`,
  },
  {
    file: 'club.html',
    path: '/club',
    title: 'Biliardo — турниры по бильярду без боли | Платформа для клубов и игроков',
    description: 'Создай турнир за 2 минуты. Игроки регистрируются сами, сетка строится автоматически. 6 форматов сетки, real-time обновления, поддержка клубов в Казахстане.',
    keywords: 'турниры по бильярду, бильярдный турнир, сетка турнира, регистрация на турнир, бильярдная платформа, бильярд Казахстан',
    h1: 'Турнирная платформа Biliardo для бильярдных клубов',
    body: `
      <p>Создавай турнир за 2 минуты, игроки регистрируются по ссылке, сетка строится автоматически.
      <strong>6 форматов сетки</strong>: single elimination, double elimination, round-robin, swiss,
      group-playoff, page-playoff.</p>
      <h2>Возможности</h2>
      <ul>
        <li>Автоматическая генерация bracket'а под количество участников.</li>
        <li>Live-результаты: счёт обновляется у всех зрителей моментально.</li>
        <li>Уведомления игрокам в Telegram о матчах и расписании.</li>
        <li>Призовой фонд, регистрационный взнос, контроль оплаты.</li>
        <li>Публичная страница турнира для шеринга в соцсетях.</li>
      </ul>
      <h2>Кому подойдёт</h2>
      <p>Бильярдным клубам Казахстана, частным организаторам, федерациям и любителям, кто проводит турниры
      в Алматы, Астане и других городах.</p>
      <p><a href="/tournaments">Актуальные турниры →</a> · <a href="/pricing">Тарифы →</a></p>`,
  },
  {
    file: 'pricing.html',
    path: '/pricing',
    title: 'Тарифы Biliardo — программа для бильярдного клуба | От бесплатного до Pro',
    description: 'Прозрачные тарифы для бильярдных клубов в Казахстане. Бесплатный старт до 6 игроков, подписки и пожизненная лицензия. Оплата через Kaspi Pay.',
    keywords: 'тарифы бильярдного клуба, цена программа бильярд, подписка бильярд, стоимость автоматизации бильярда',
    h1: 'Тарифы Biliardo',
    body: `
      <p>Платформа Biliardo работает по модели <em>freemium</em>: малые турниры и тест-драйв — бесплатно,
      рост и автоматизация клуба — подписка или пожизненная лицензия. Оплата через <strong>Kaspi Pay</strong>.</p>
      <h2>Доступные планы</h2>
      <ul>
        <li><strong>Бесплатный</strong>: до 6 участников в турнире, базовая статистика.</li>
        <li><strong>Стандарт</strong>: безлимит участников, telegram-уведомления, кастомные призы.</li>
        <li><strong>Pro</strong>: для клубов — мульти-стол, бар, отчёты, поддержка приоритетная.</li>
        <li><strong>Lifetime</strong>: единоразовая оплата, обновления навсегда.</li>
      </ul>
      <h2>Что входит в Pro для клубов</h2>
      <p>Полная автоматизация столов, бар-касса, день/ночь тарификация, отчёты, веб-кабинет владельца,
      установка и обучение персонала, поставка оборудования.</p>
      <p><a href="/contacts">Связаться с менеджером →</a></p>`,
  },
  {
    file: 'tournaments.html',
    path: '/tournaments',
    title: 'Турниры по бильярду в Казахстане — расписание и регистрация | Biliardo',
    description: 'Актуальные турниры по бильярду: Алматы, Астана, Шымкент и другие города Казахстана. Онлайн-регистрация, live-сетки и расписание матчей.',
    keywords: 'турниры по бильярду Казахстан, бильярдные турниры Алматы, бильярдные турниры Астана, расписание турниров',
    h1: 'Турниры по бильярду в Казахстане — расписание',
    body: `
      <p>Каталог открытых турниров на платформе Biliardo. Все турниры идут в режиме онлайн-регистрации:
      участники видят сетку, расписание матчей, своих соперников и обновления счёта в реальном времени.</p>
      <h2>Города Казахстана</h2>
      <p>Турниры проходят в <strong>Алматы</strong>, <strong>Астане</strong>, <strong>Шымкенте</strong>,
      <strong>Караганде</strong>, <strong>Актобе</strong>, <strong>Павлодаре</strong> и других городах.</p>
      <h2>Как принять участие</h2>
      <p>Зарегистрируйся на платформе, выбери турнир, оплати взнос (если он есть) — и сразу попадаешь в сетку.
      Уведомления о матчах приходят в Telegram.</p>
      <p><a href="/club">Подробнее о турнирах →</a> · <a href="/help">Помощь по регистрации →</a></p>`,
  },
  {
    file: 'turnirnaya-setka.html',
    path: '/turnirnaya-setka',
    title: 'Турнирная сетка онлайн — генератор бесплатно | Biliardo',
    description: 'Бесплатный онлайн-генератор турнирной сетки. Single Elimination, Double Elimination, Round Robin, Swiss. Жеребьёвка, автообновление результатов, экспорт PDF.',
    keywords: 'турнирная сетка, турнирная сетка онлайн, составить турнирную сетку, генератор турнирной сетки, сетка на вылет, double elimination, single elimination, круговая турнирная таблица, swiss система, сетка турнира',
    h1: 'Турнирная сетка онлайн — создать бесплатно',
    body: `
      <p><strong>Турнирная сетка</strong> — схема, по которой проходят матчи турнира. Бесплатный
      онлайн-генератор турнирных сеток для бильярда, шахмат, тенниса, киберспорта и любых других видов
      спорта. <a href="/tournaments"><strong>Создать сетку →</strong></a></p>
      <h2>Виды турнирных сеток</h2>
      <ul>
        <li><strong>Single Elimination</strong> — сетка на вылет. Самый быстрый формат: проиграл матч —
        выбыл. В сетке на 16 человек победитель играет 4 матча.</li>
        <li><strong>Double Elimination</strong> — с верхней и нижней сеткой. Участник выбывает только после
        двух поражений. Идеально для первого клубного турнира.</li>
        <li><strong>Round Robin</strong> — круговая турнирная таблица. Каждый играет с каждым. Самый
        объективный формат.</li>
        <li><strong>Swiss</strong> — швейцарская система. Гибрид кругового и на вылет. Все играют
        одинаковое число туров, пары формируются по очкам.</li>
        <li><strong>Group + Playoff</strong> — группы плюс плей-офф. Классический клубный формат.</li>
      </ul>
      <h2>Как составить турнирную сетку</h2>
      <ol>
        <li>Выбрать формат сетки (Single/Double Elimination, Round Robin, Swiss).</li>
        <li>Указать число участников (оптимально кратно 2: 8, 16, 32, 64).</li>
        <li>Добавить игроков вручную или через регистрационную ссылку.</li>
        <li>Провести жеребьёвку — случайную или с посевом топ-игроков.</li>
        <li>Получить готовую турнирную сетку с автообновлением результатов.</li>
      </ol>
      <h2>Турнирная сетка на 8, 16, 32 участников</h2>
      <p><strong>Сетка на 8 человек:</strong> Single Elimination — 7 матчей, 3 раунда (1/4, 1/2, финал).
      Double Elimination — 14 матчей.</p>
      <p><strong>Сетка на 16 человек:</strong> Single Elimination — 15 матчей, 4 раунда. Double Elimination
      — 30 матчей.</p>
      <p><strong>Сетка на 32 человека:</strong> Single Elimination — 31 матч, 5 раундов. Double Elimination
      — 62 матча.</p>
      <h2>Жеребьёвка и посев</h2>
      <p>Случайная жеребьёвка — если все равны. Посев — если есть фавориты: топ-1 и топ-2 разводятся в
      разные половины сетки, встречаются только в финале. Это сохраняет интригу и качество финальных
      матчей.</p>
      <p><a href="/tournaments"><strong>Создать турнирную сетку →</strong></a> ·
      <a href="/tournament-guide">Гид по турнирам →</a></p>`,
  },
]

const baseHtml = readFileSync(indexPath, 'utf-8')

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/**
 * Минимальный inline-CSS для prerender-контента: даём краулеру/пользователю
 * читаемый текст до загрузки JS, но в фирменных тёмных тонах сайта.
 * Когда React стартует createRoot().render() — он сбрасывает innerHTML #root,
 * поэтому продакшн-UI заменит этот блок без видимого мерцания.
 */
const SEO_STYLES = `
  <style id="seo-prerender-style">
    #root > .seo-fallback {
      max-width: 960px;
      margin: 0 auto;
      padding: 32px 20px 64px;
      font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #e2e8f0;
      line-height: 1.65;
    }
    #root > .seo-fallback h1 { font-size: 32px; line-height: 1.2; margin: 0 0 16px; color: #f8fafc; }
    #root > .seo-fallback h2 { font-size: 20px; line-height: 1.3; margin: 28px 0 10px; color: #f8fafc; }
    #root > .seo-fallback p, #root > .seo-fallback ul { margin: 0 0 14px; }
    #root > .seo-fallback ul { padding-left: 20px; }
    #root > .seo-fallback li { margin: 4px 0; }
    #root > .seo-fallback a { color: #34d399; text-decoration: none; }
    #root > .seo-fallback a:hover { text-decoration: underline; }
    #root > .seo-fallback nav { font-size: 14px; color: #94a3b8; margin: 24px 0 8px; }
    #root > .seo-fallback nav a { color: #94a3b8; }
  </style>`

function buildRouteHtml(route) {
  const url = `${SITE}${route.path}`
  let html = baseHtml

  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${route.title}</title>`,
  )
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${escapeAttr(route.description)}" />`,
  )

  const headInjection = `
    <meta name="keywords" content="${escapeAttr(route.keywords)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escapeAttr(route.title)}" />
    <meta property="og:description" content="${escapeAttr(route.description)}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(route.title)}" />
    <meta name="twitter:description" content="${escapeAttr(route.description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    ${SEO_STYLES}`

  html = html.replace('</head>', `${headInjection}\n  </head>`)

  // Впрыскиваем статичный SEO-контент внутрь #root. Когда React.createRoot()
  // зарендерит первое дерево — он полностью заменит innerHTML, дублей не будет.
  // SSG-маркеры нужны для опционального этапа `npm run build:ssg`, который
  // заменяет этот статичный fallback на реальный рендер React через Puppeteer.
  const rootBlock = `<!--SSG-ROOT-->\n    <div id="root"><div class="seo-fallback"><h1>${route.h1}</h1>${route.body}${NAV_LINKS}${FOOTER_CTA}</div></div>\n    <!--/SSG-ROOT-->`
  html = html.replace(/<div id="root"><\/div>/, rootBlock)

  return html
}

for (const route of routes) {
  const html = buildRouteHtml(route)
  const outPath = join(distDir, route.file)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html, 'utf-8')
  console.log(`[prerender] ${route.path} → dist/${route.file}`)
}

console.log(`[prerender] generated ${routes.length} route HTML files with SEO body content`)
