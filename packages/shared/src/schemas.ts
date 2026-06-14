// ============================================================
// Zod-схемы для API. Используются и в backend (валидация запросов),
// и в frontend (типобезопасный API-клиент через z.infer).
// ============================================================
import { z } from 'zod'

// ----- Auth -----

/** +7XXXXXXXXXX — 12 символов с плюсом. */
export const phoneSchema = z
  .string()
  .regex(/^\+7\d{10}$/, 'Номер должен быть в формате +7XXXXXXXXXX')

export const passwordSchema = z
  .string()
  .min(6, 'Пароль должен содержать минимум 6 символов')
  .max(128, 'Пароль слишком длинный')

export const accountTypeSchema = z.enum(['PLAYER', 'CLUB'])

export const registerInputSchema = z.object({
  name: z.string().trim().min(2, 'Имя слишком короткое').max(80),
  phone: phoneSchema,
  password: passwordSchema,
  accountType: accountTypeSchema.default('PLAYER'),
  clubName: z.string().trim().min(2, 'Название клуба слишком короткое').max(120).optional(),
}).refine(
  (d) => d.accountType !== 'CLUB' || (d.clubName && d.clubName.trim().length >= 2),
  { message: 'Для клубного аккаунта нужно указать название клуба', path: ['clubName'] },
)
export type RegisterInput = z.infer<typeof registerInputSchema>

export const loginInputSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Введи пароль'),
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const updateProfileInputSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneSchema.optional(),
  avatar: z.string().url().nullable().optional(),
  clubName: z.string().trim().min(2).max(120).optional(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>

// API-пароль для подключения desktop-приложения клуба (минимум 8 символов).
export const setApiPasswordInputSchema = z.object({
  password: z.string().min(8, 'Минимум 8 символов').max(128),
})
export type SetApiPasswordInput = z.infer<typeof setApiPasswordInputSchema>

// ----- Club / Desktop integration schemas -----

export const clubAuthInputSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1).max(128),
})
export type ClubAuthInput = z.infer<typeof clubAuthInputSchema>

const tableStatusSchema = z.enum(['free', 'occupied', 'reserved', 'maintenance'])
const sessionModeSchema = z.enum(['time', 'amount', 'unlimited'])

const tableSessionSchema = z.object({
  startTime: z.number().int().positive(),
  mode: sessionModeSchema,
  plannedDuration: z.number().int().positive().nullable(),
  /** Название тарифа (если сессия запущена по тарифу) — для отображения в UI. */
  tariffName: z.string().max(80).nullable().optional(),
  /** Текущая стоимость стола на момент sync, тенге. Считается desktop'ом. */
  currentTableCost: z.number().int().min(0).optional(),
  /** Текущая стоимость бар-заказов сессии, тенге. */
  currentBarCost: z.number().int().min(0).optional(),
})

const reservationSchema = z.object({
  customerName: z.string().max(120).nullable().optional(),
  customerPhone: z.string().max(40).nullable().optional(),
  reservedFor: z.number().int().positive().optional(),
  notes: z.string().max(500).nullable().optional(),
})

const tableSnapshotSchema = z.object({
  id: z.number().int(),
  name: z.string().max(80),
  status: tableStatusSchema,
  lightOn: z.boolean(),
  session: tableSessionSchema.nullable(),
  /** Действующая ставка ₸/час — для отображения и fallback-расчёта в web. */
  pricePerHour: z.number().int().min(0).optional(),
  /** Бронь, если status='reserved'. */
  reservation: reservationSchema.nullable().optional(),
})

export const clubSyncInputSchema = z.object({
  tables: z.array(tableSnapshotSchema).max(64),
  todayRevenue: z.object({
    table: z.number().int().min(0),
    bar: z.number().int().min(0),
    total: z.number().int().min(0),
    sessionsCount: z.number().int().min(0),
  }),
})
export type ClubSyncInput = z.infer<typeof clubSyncInputSchema>

const barOrderItemSchema = z.object({
  menuItemName: z.string().max(120),
  quantity: z.number().int().min(1),
  price: z.number().int().min(0),
})

export const clubSessionInputSchema = z.object({
  /** Внешний id из desktop — для idempotency (повторные отправки не дублируются). */
  id: z.string().min(1).max(120),
  tableId: z.number().int(),
  tableName: z.string().max(80),
  mode: sessionModeSchema,
  /** Название тарифа (если запущен по тарифу) — опционально. */
  tariffName: z.string().max(80).nullable().optional(),
  /** Unix ms */
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive(),
  /** Минуты */
  duration: z.number().int().min(0),
  tableCost: z.number().int().min(0),
  barCost: z.number().int().min(0),
  totalCost: z.number().int().min(0),
  /** YYYY-MM-DD */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Опциональный список бар-позиций — для детализации в web-отчётах. */
  barOrders: z.array(barOrderItemSchema).max(50).optional(),
  /** Опциональный externalId смены, в которой завершена сессия. */
  shiftId: z.string().max(120).nullable().optional(),
})
export type ClubSessionInput = z.infer<typeof clubSessionInputSchema>

// ----- Shifts -----

export const clubShiftInputSchema = z.object({
  /** Внешний id смены из desktop'а (идемпотентность). */
  id: z.string().min(1).max(120),
  operatorId: z.string().min(1).max(120),
  operatorName: z.string().min(1).max(120),
  /** Unix ms */
  startTime: z.number().int().positive(),
  /** Unix ms или null если смена ещё открыта. */
  endTime: z.number().int().positive().nullable(),
  /** Итоги по смене — посчитаны на десктопе. */
  totalRevenue: z.number().int().min(0),
  tableRevenue: z.number().int().min(0),
  barRevenue: z.number().int().min(0),
  sessionsCount: z.number().int().min(0),
})
export type ClubShiftInput = z.infer<typeof clubShiftInputSchema>

// ----- Tournament (для будущего tournament-сервиса) -----

export const bracketTypeSchema = z.enum([
  'single-elimination',
  'double-elimination',
  'round-robin',
  'swiss',
  'group-playoff',
  'page-playoff',
])

export const prizePlaceSchema = z.object({
  place: z.number().int().min(1),
  prize: z.string().min(1).max(200),
})

export const createTournamentInputSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(2000).optional(),
  bracketType: bracketTypeSchema,
  maxParticipants: z.number().int().min(2).max(500),
  isPublic: z.boolean(),
  scheduledAt: z.string().datetime().optional(),
  location: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  prizeFund: z.number().int().min(0).optional(),
  entryFee: z.number().int().min(0).optional(),
  prizePlaces: z.array(prizePlaceSchema).max(20),
})
export type CreateTournamentInput = z.infer<typeof createTournamentInputSchema>

export const registerParticipantInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema.optional(),
})
export type RegisterParticipantInput = z.infer<typeof registerParticipantInputSchema>

export const setMatchScoreInputSchema = z.object({
  score1: z.number().int().min(0).max(99),
  score2: z.number().int().min(0).max(99),
}).refine((d) => d.score1 !== d.score2, {
  message: 'Ничьи не допускаются — счёт должен быть разным',
})
export type SetMatchScoreInput = z.infer<typeof setMatchScoreInputSchema>

// ----- Payments -----

export const planCodeSchema = z.enum(['FREE', 'STANDARD', 'PRO', 'BUSINESS', 'ENTERPRISE', 'LIFETIME'])

export const createPaymentInputSchema = z.object({
  planCode: planCodeSchema,
  /** Если указан — оплата за конкретный турнир. Иначе — подписка (ENTERPRISE). */
  tournamentId: z.string().min(1).optional(),
})
export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>
