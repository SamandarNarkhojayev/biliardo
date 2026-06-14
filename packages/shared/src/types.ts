// ============================================================
// Доменные типы — общие для backend и frontend.
// Не импортирует ничего, кроме TypeScript-типов. Без runtime-зависимостей.
// ============================================================

export type UserRole = 'PLAYER' | 'ORGANIZER' | 'ADMIN'

/** PLAYER — обычный игрок. CLUB — администратор бильярдного клуба. */
export type AccountType = 'PLAYER' | 'CLUB'

export interface User {
  id: string
  phone: string
  name: string
  avatar?: string | null
  role: UserRole
  accountType: AccountType
  /** Название клуба (только для accountType=CLUB) */
  clubName?: string | null
  /** Установлен ли API-пароль для desktop-интеграции (только для CLUB) */
  hasApiPassword?: boolean
  createdAt: string
}

// ----- Tournament -----

export type TournamentStatus = 'DRAFT' | 'REGISTRATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export type BracketType =
  | 'single-elimination'
  | 'double-elimination'
  | 'round-robin'
  | 'swiss'
  | 'group-playoff'
  | 'page-playoff'

export type MatchStatus = 'pending' | 'in-progress' | 'completed' | 'bye'

export type MatchStage =
  | 'winners' | 'losers' | 'grand-final'
  | `group:${string}`
  | 'playoff'
  | 'final' | 'third-place'
  | 'main'

export interface Participant {
  id: string
  tournamentId: string
  userId?: string | null
  name: string
  phone?: string | null
  /** URL аватара. Подтягивается из профиля при поиске по телефону или ставится вручную. */
  avatar?: string | null
  seed?: number | null
  registeredAt: string
  checkedIn: boolean
  /** Оплатил ли участник вступительный взнос. Отмечает организатор вручную. */
  paid: boolean
  position: number
}

export interface Match {
  id: string
  tournamentId: string
  round: number
  matchNumber: number
  participant1Id?: string
  participant2Id?: string
  winnerId?: string
  score1?: number
  score2?: number
  status: MatchStatus
  tableLabel?: string
  stage?: MatchStage
}

export interface PrizePlace {
  place: number
  prize: string
}

export interface Tournament {
  id: string
  name: string
  description?: string | null
  organizerId: string
  organizerName?: string | null
  status: TournamentStatus
  bracketType: BracketType
  maxParticipants: number
  /** Счётчик зарегистрированных — для прогресса в каталоге. */
  participantCount?: number
  isPublic: boolean
  inviteCode: string
  scheduledAt?: string | null
  prizeFund?: number | null
  entryFee?: number | null
  location?: string | null
  city?: string | null
  /** Номера столов, выделенных под турнир. Используются для авто-распределения матчей. */
  tables?: number[] | null
  coverGradient?: string | null
  prizePlaces: PrizePlace[]
  participants: Participant[]
  matches: Match[]
  createdAt: string
  updatedAt: string
}

// ----- Plans / Payments -----

export type PlanCode = 'FREE' | 'STANDARD' | 'PRO' | 'BUSINESS' | 'ENTERPRISE' | 'LIFETIME'

/**
 * one-time — оплата за один турнир.
 * monthly — ежемесячная подписка (рекуррентная).
 * lifetime — единоразовая оплата за безлимитный доступ к клубным фичам, без истечения.
 */
export type PlanBilling = 'one-time' | 'monthly' | 'lifetime'

export interface Plan {
  code: PlanCode
  name: string
  /** -1 = unlimited */
  maxParticipants: number
  priceKzt: number
  billing: PlanBilling
  features: string[]
  order: number
}

export interface PlanCheck {
  allowed: boolean
  plan: PlanCode
  price: number
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'REFUNDED'

export type PaymentProvider = 'KASPI' | 'STUB'

export type PaymentTargetType = 'TOURNAMENT' | 'SUBSCRIPTION'

export interface Payment {
  id: string
  userId: string
  planCode: PlanCode
  amountKzt: number
  status: PaymentStatus
  provider: PaymentProvider
  targetType: PaymentTargetType
  /** id турнира (для TOURNAMENT) или null (для SUBSCRIPTION) */
  tournamentId?: string | null
  /** id заказа в Kaspi (или stub-id в dev) */
  externalId?: string | null
  /** URL для редиректа пользователя на оплату (если применимо) */
  paymentUrl?: string | null
  /** base64-PNG QR-кода или строка-payload (если применимо) */
  qrCode?: string | null
  createdAt: string
  completedAt?: string | null
  expiresAt?: string | null
}

/** Стандартный успешный ответ на POST /payments — создан платёж, дальше идём в Kaspi. */
export interface CreatePaymentSuccess {
  payment: Payment
  /** В stub-режиме — путь к dev-эндпоинту "оплатить" */
  stubCompleteUrl?: string
}

/** Free-by-automation: клуб с подключённой автоматизацией не платит за per-tournament тариф. */
export interface FreeByAutomationResponse {
  free: true
  reason: 'AUTOMATION_CONNECTED'
  message: string
  plan: { code: PlanCode; name: string }
}

export type CreatePaymentResponse = CreatePaymentSuccess | FreeByAutomationResponse

// ----- Club / Desktop integration -----

export type TableStatus = 'free' | 'occupied' | 'reserved' | 'maintenance'
export type SessionMode = 'time' | 'amount' | 'unlimited'

export interface TableSession {
  /** Unix ms — когда стол был запущен. Клиент пересчитывает таймер сам. */
  startTime: number
  mode: SessionMode
  /** Минуты, null если не задано (для unlimited). */
  plannedDuration: number | null
  /** Название тарифа (если запущен по тарифу) — для отображения. Optional для обратной совместимости. */
  tariffName?: string | null
  /** Текущая стоимость стола ₸, посчитана на десктопе на момент sync. */
  currentTableCost?: number
  /** Стоимость бара, добавленного к сессии. */
  currentBarCost?: number
}

export interface TableReservation {
  customerName?: string | null
  customerPhone?: string | null
  /** Unix ms — на какое время бронь. */
  reservedFor?: number
  notes?: string | null
}

export interface TableSnapshot {
  id: number
  name: string
  status: TableStatus
  lightOn: boolean
  /** null если стол free / reserved / maintenance */
  session: TableSession | null
  /** Тариф ₸/час — для отображения в карточке стола. Optional для обратной совместимости. */
  pricePerHour?: number
  /** Детали брони, если status='reserved'. */
  reservation?: TableReservation | null
}

export interface ClubRevenue {
  table: number
  bar: number
  total: number
  sessionsCount: number
}

export interface ClubStatusSnapshot {
  clubId: string
  clubName: string
  /** true если последний sync был < 60 секунд назад */
  isOnline: boolean
  /** ISO datetime последнего SYNC, либо null если ни разу не было */
  lastSyncAt: string | null
  tables: TableSnapshot[]
  todayRevenue: ClubRevenue
}

export interface ClubBarOrderItemDto {
  menuItemName: string
  quantity: number
  price: number
}

export interface ClubSessionRecordDto {
  id: string
  tableId: number
  tableName: string
  mode: SessionMode
  /** Название тарифа (если запущен по тарифу). Optional для обратной совместимости. */
  tariffName?: string | null
  startTime: string
  endTime: string
  /** Минуты */
  duration: number
  tableCost: number
  barCost: number
  totalCost: number
  /** Детализация бара (если десктоп прислал). */
  barOrders?: ClubBarOrderItemDto[]
  /** YYYY-MM-DD */
  date: string
  /** Опциональный externalId смены. */
  shiftId?: string | null
}

export interface ClubShiftDto {
  id: string
  externalId: string
  operatorId: string
  operatorName: string
  /** ISO datetime */
  startTime: string
  /** ISO datetime или null если активна. */
  endTime: string | null
  isActive: boolean
  totalRevenue: number
  tableRevenue: number
  barRevenue: number
  sessionsCount: number
}

export interface ClubShiftsResponse {
  shifts: ClubShiftDto[]
}

export interface ClubSessionsResponse {
  sessions: ClubSessionRecordDto[]
  totals: { table: number; bar: number; total: number; count: number }
}

export interface ClubSessionsSummaryRow {
  /** "YYYY-MM-DD" для day, "YYYY-MM" для month */
  period: string
  table: number
  bar: number
  total: number
  sessions: number
}

export interface ClubAuthResponse {
  /** Long-lived JWT (90d) для desktop-клиента */
  token: string
  clubId: string
  clubName: string
}

// ----- Club WebSocket protocol -----
// Сообщения двусторонние; различаются по `type`. Хаб роутит:
//   desktop → server: SYNC, COMMAND_ACK
//   browser → server: TABLE_TOGGLE_LIGHT, TABLE_START_SESSION, TABLE_END_SESSION
//   server → browsers: SYNC, COMMAND_ACK, ERROR (когда desktop offline)
//   server → desktop: TABLE_*  (forward от browser)

export interface WsSyncMessage {
  type: 'SYNC'
  tables: TableSnapshot[]
  revenue: ClubRevenue
}

export interface WsTableToggleLightMessage {
  type: 'TABLE_TOGGLE_LIGHT'
  /** id команды для отслеживания ACK */
  commandId: string
  tableId: number
}

export interface WsTableStartSessionMessage {
  type: 'TABLE_START_SESSION'
  commandId: string
  tableId: number
  /**
   * Опциональные параметры запуска: mode + длительность/сумма.
   * - mode='time'      → hours+minutes (или plannedDurationSeconds)
   * - mode='amount'    → amount в тенге
   * - mode='unlimited' → без параметров
   * Если поле отсутствует — десктоп использует дефолт (mode='unlimited').
   */
  payload?: {
    mode?: SessionMode
    hours?: number
    minutes?: number
    amount?: number
    plannedDurationSeconds?: number
    packagePrice?: number
    tariffName?: string
  }
}

export interface WsTableEndSessionMessage {
  type: 'TABLE_END_SESSION'
  commandId: string
  tableId: number
}

export interface WsCommandAckMessage {
  type: 'COMMAND_ACK'
  commandId: string
  tableId: number
  newStatus: TableStatus
}

export interface WsErrorMessage {
  type: 'ERROR'
  code: 'DESKTOP_OFFLINE' | 'INVALID_PAYLOAD' | 'UNAUTHORIZED' | 'INTERNAL'
  /** id команды, к которой относится ошибка (если применимо) */
  commandId?: string
  message?: string
}

/** Все сообщения, которые может прислать desktop. */
export type WsDesktopOutbound = WsSyncMessage | WsCommandAckMessage

/** Все сообщения, которые может прислать browser. */
export type WsBrowserOutbound =
  | WsTableToggleLightMessage
  | WsTableStartSessionMessage
  | WsTableEndSessionMessage

/** Что browser получает от сервера. */
export type WsBrowserInbound = WsSyncMessage | WsCommandAckMessage | WsErrorMessage

/** Что desktop получает от сервера. */
export type WsDesktopInbound = WsBrowserOutbound | WsErrorMessage

// ----- API DTOs (что ходит между сервисами и клиентом) -----

export interface AuthTokens {
  accessToken: string
  /** refreshToken — выставляется в httpOnly Secure cookie сервером */
  refreshToken?: string
}

export interface LoginResponse {
  user: User
  accessToken: string
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

// ----- Admin (super-admin panel) -----

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical'

/** Запись аудита: один проксированный запрос через gateway. */
export interface ActivityLogDto {
  id: string
  userId: string | null
  userName: string | null
  role: string | null
  method: string
  path: string
  statusCode: number | null
  ip: string | null
  userAgent: string | null
  durationMs: number | null
  createdAt: string
}

/** Агрегированная «сессия» пользователя — склейка активности по таймауту бездействия. */
export interface ActivitySessionDto {
  userId: string | null
  userName: string | null
  startedAt: string
  lastSeenAt: string
  /** Длительность в секундах (lastSeen - started). */
  durationSec: number
  requests: number
}

/** Алерт об ошибке/аномалии/падении (для Telegram и журнала). */
export interface AlertLogDto {
  id: string
  level: AlertLevel
  source: string
  title: string
  message: string
  context: unknown
  notified: boolean
  createdAt: string
}

export interface AdminOverview {
  users: { total: number; players: number; clubs: number; admins: number; newToday: number }
  tournaments: { total: number; active: number; registration: number; completed: number }
  participants: { total: number }
  payments: { total: number; completed: number; pending: number; revenueKzt: number }
  subscriptions: { active: number }
  clubs: { total: number; online: number }
  activity: { last24h: number; uniqueUsers24h: number }
  alerts: { last24h: number }
}

export interface AdminUserRow {
  id: string
  phone: string
  name: string
  role: UserRole
  accountType: AccountType
  clubName: string | null
  telegramUsername: string | null
  telegramLinked: boolean
  createdAt: string
  tournamentsCount: number
  paymentsCount: number
}

export interface AdminServiceHealth {
  name: string
  url: string
  ok: boolean
  status: number | null
  latencyMs: number | null
  body?: unknown
}

export interface AdminDbTableStat {
  schema: string
  table: string
  rows: number
}

export interface AdminHealth {
  services: AdminServiceHealth[]
  db: {
    sizeBytes: number
    connections: number
    tables: AdminDbTableStat[]
  }
}

/** Ответ SQL-консоли: либо строки (SELECT), либо число затронутых строк. */
export interface AdminSqlResult {
  kind: 'rows' | 'command'
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  command: string
  durationMs: number
}

/** Точка временного ряда — дневной бакет для графиков на дашборде. */
export interface AdminTimeseriesPoint {
  date: string
  users: number
  tournaments: number
  payments: number
  revenue: number
  activity: number
}
