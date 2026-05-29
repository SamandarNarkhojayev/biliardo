import type { Plan, PlanCode } from '@billiard/shared'

/**
 * Каталог тарифов. Статичный — менять редко, поэтому держим в коде, не в БД.
 * priceKzt = 0 → FREE, без обращения в Kaspi.
 */
export const PLANS: Plan[] = [
  {
    code: 'FREE',
    name: 'Старт',
    maxParticipants: 6,
    priceKzt: 0,
    billing: 'one-time',
    features: ['До 6 игроков', 'Single-elimination сетка', 'Базовая страница турнира'],
    order: 0,
  },
  {
    code: 'STANDARD',
    name: 'Стандарт',
    maxParticipants: 50,
    priceKzt: 10_000,
    billing: 'one-time',
    features: ['До 50 игроков', 'Все 6 форматов сетки', 'Призовые места', 'Invite-ссылки'],
    order: 1,
  },
  {
    code: 'PRO',
    name: 'Про',
    maxParticipants: 100,
    priceKzt: 20_000,
    billing: 'one-time',
    features: ['До 100 игроков', 'Брендирование турнира', 'Экспорт результатов'],
    order: 2,
  },
  {
    code: 'BUSINESS',
    name: 'Бизнес',
    maxParticipants: 200,
    priceKzt: 35_000,
    billing: 'one-time',
    features: ['До 200 игроков', 'Несколько столов параллельно', 'Поддержка по WhatsApp'],
    order: 3,
  },
  {
    code: 'ENTERPRISE',
    name: 'Клуб',
    maxParticipants: -1,
    priceKzt: 50_000,
    billing: 'monthly',
    features: ['Безлимит игроков', 'Безлимит турниров в месяц', 'Кастомный домен', 'Приоритетная поддержка'],
    order: 4,
  },
  {
    code: 'LIFETIME',
    name: 'Клуб Навсегда',
    maxParticipants: -1,
    priceKzt: 50_000,
    billing: 'lifetime',
    features: [
      'Безлимит игроков и турниров',
      'Единоразовая оплата — без подписки',
      'Брендинг клуба (лого, цвета)',
      'Все будущие обновления',
      'Приоритетная поддержка 24/7',
    ],
    order: 5,
  },
]

const PLAN_BY_CODE = new Map<PlanCode, Plan>(PLANS.map((p) => [p.code, p]))

export function findPlan(code: PlanCode): Plan | undefined {
  return PLAN_BY_CODE.get(code)
}
