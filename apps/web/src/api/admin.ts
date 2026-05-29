import type {
  AdminOverview,
  AdminUserRow,
  AdminHealth,
  AdminSqlResult,
  AdminTimeseriesPoint,
  ActivityLogDto,
  ActivitySessionDto,
  AlertLogDto,
} from '@billiard/shared'
import { api, downloadFile } from './client'

export interface AdminTournamentRow {
  id: string
  name: string
  status: string
  bracketType: string
  organizerId: string
  organizerName: string | null
  maxParticipants: number
  participantCount: number
  isPublic: boolean
  city: string | null
  entryFee: number | null
  prizeFund: number | null
  scheduledAt: string | null
  createdAt: string
}

export interface AdminPaymentRow {
  id: string
  userId: string
  userName: string | null
  userPhone: string | null
  planCode: string
  amountKzt: number
  status: string
  provider: string
  targetType: string
  tournamentId: string | null
  externalId: string | null
  createdAt: string
  completedAt: string | null
}

export interface AdminClubRow {
  id: string
  name: string
  clubName: string | null
  phone: string
  createdAt: string
  syncedAt: string | null
  online: boolean | null
  revenue: unknown
}

export interface AdminParticipantRow {
  id: string
  name: string
  phone: string | null
  userId: string | null
  seed: number | null
  checkedIn: boolean
  paid: boolean
  position: number
  registeredAt: string
}

export interface AdminUserFull {
  id: string
  phone: string
  name: string
  role: string
  accountType: string
  clubName: string | null
  avatar: string | null
  telegramUsername: string | null
  telegramLinked: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminUserDetail {
  user: AdminUserFull
  tournaments: { id: string; name: string; status: string; participantCount: number; maxParticipants: number; createdAt: string }[]
  payments: { id: string; planCode: string; amountKzt: number; status: string; targetType: string; createdAt: string }[]
  participations: { tournamentId: string; name: string; registeredAt: string; position: number; checkedIn: boolean }[]
  recentActivity: { method: string; path: string; statusCode: number | null; ip: string | null; createdAt: string }[]
}

export interface AdminTournamentDetail {
  tournament: Record<string, unknown>
  participants: AdminParticipantRow[]
  matches: { id: string; round: number; matchNumber: number; participant1Id: string | null; participant2Id: string | null; winnerId: string | null; score1: number | null; score2: number | null; status: string; tableLabel: string | null; stage: string }[]
  prizes: { place: number; prize: string }[]
  payments: { id: string; userId: string; amountKzt: number; status: string; createdAt: string }[]
}

export interface AdminPaymentDetail {
  payment: Record<string, unknown> & { id: string; status: string; amountKzt: number; planCode: string; userName: string | null; userPhone: string | null }
}

export interface AdminClubDetail {
  club: { id: string; name: string; clubName: string | null; phone: string; createdAt: string; telegramUsername: string | null; telegramLinked: boolean }
  snapshot: { tables: unknown; revenue: unknown; syncedAt: string; online: boolean } | null
  sessions: { id: string; tableId: number; tableName: string; mode: string; startTime: string; endTime: string; duration: number; tableCost: number; barCost: number; totalCost: number; date: string }[]
  summary: { sessions: number; revenue: number }
}

export interface AdminMe {
  id: string
  name: string
  role: string
  isSuper: boolean
}

export interface HealthSample {
  service: string
  ok: boolean
  status: number | null
  latencyMs: number | null
  createdAt: string
}

export interface DbDump {
  generatedAt: string
  rowCap: number
  tables: Record<string, { total: number; truncated: boolean; rows: Record<string, unknown>[] }>
}

export interface BackupFile {
  name: string
  sizeBytes: number
  createdAt: string
}

export interface BackupList {
  files: BackupFile[]
  intervalHours: number
  retentionDays: number
}

interface Page {
  search?: string
  limit?: number
  offset?: number
}

function qs(p: Page = {}): string {
  const sp = new URLSearchParams()
  if (p.search) sp.set('search', p.search)
  if (p.limit != null) sp.set('limit', String(p.limit))
  if (p.offset != null) sp.set('offset', String(p.offset))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const adminApi = {
  overview: () => api.get<AdminOverview>('/admin/overview'),
  users: (p?: Page) => api.get<{ users: AdminUserRow[] }>(`/admin/users${qs(p)}`),
  tournaments: (p?: Page) => api.get<{ tournaments: AdminTournamentRow[] }>(`/admin/tournaments${qs(p)}`),
  tournamentParticipants: (id: string) =>
    api.get<{ participants: AdminParticipantRow[] }>(`/admin/tournaments/${id}/participants`),
  payments: (p?: Page) => api.get<{ payments: AdminPaymentRow[] }>(`/admin/payments${qs(p)}`),
  clubs: () => api.get<{ clubs: AdminClubRow[] }>('/admin/clubs'),
  activity: (p?: Page) => api.get<{ activity: ActivityLogDto[] }>(`/admin/activity${qs(p)}`),
  sessions: (limit = 100) => api.get<{ sessions: ActivitySessionDto[] }>(`/admin/activity/sessions?limit=${limit}`),
  alerts: (p?: Page) => api.get<{ alerts: AlertLogDto[] }>(`/admin/alerts${qs(p)}`),
  testAlert: () => api.post<{ logged: boolean; notified: boolean }>('/admin/alerts/test'),
  health: () => api.get<AdminHealth>('/admin/health'),
  sql: (sql: string) => api.post<AdminSqlResult>('/admin/sql', { sql }),

  // ---- Карточки ----
  userDetail: (id: string) => api.get<AdminUserDetail>(`/admin/users/${id}`),
  tournamentDetail: (id: string) => api.get<AdminTournamentDetail>(`/admin/tournaments/${id}`),
  paymentDetail: (id: string) => api.get<AdminPaymentDetail>(`/admin/payments/${id}`),
  clubDetail: (id: string) => api.get<AdminClubDetail>(`/admin/clubs/${id}`),

  // ---- Редактирование / удаление ----
  updateUser: (id: string, patch: Record<string, unknown>) => api.patch<{ user: AdminUserRow }>(`/admin/users/${id}`, patch),
  deleteUser: (id: string) => api.delete<void>(`/admin/users/${id}`),
  updateTournament: (id: string, patch: Record<string, unknown>) => api.patch<{ tournament: Record<string, unknown> }>(`/admin/tournaments/${id}`, patch),
  deleteTournament: (id: string) => api.delete<void>(`/admin/tournaments/${id}`),
  updatePayment: (id: string, patch: Record<string, unknown>) => api.patch<{ payment: Record<string, unknown> }>(`/admin/payments/${id}`, patch),
  deletePayment: (id: string) => api.delete<void>(`/admin/payments/${id}`),

  // ---- Метрики / обслуживание ----
  timeseries: (days = 30) => api.get<{ points: AdminTimeseriesPoint[] }>(`/admin/metrics/timeseries?days=${days}`),
  purgeActivity: () => api.post<{ deleted: number; retentionDays: number }>('/admin/activity/purge'),

  // ---- Роль / здоровье / дамп ----
  me: () => api.get<AdminMe>('/admin/me'),
  healthHistory: (minutes = 60) => api.get<{ series: HealthSample[] }>(`/admin/health/history?minutes=${minutes}`),
  exportDb: () => api.get<DbDump>('/admin/export'),

  // ---- Настоящий бэкап (pg_dump) ----
  /** Скачать .sql-дамп прямо сейчас (стрим). */
  backupNow: () => downloadFile('/admin/backup', `billiard-${new Date().toISOString().slice(0, 10)}.sql`),
  /** Список файловых бэкапов (фоновых + ручных). */
  listBackups: () => api.get<BackupList>('/admin/backups'),
  /** Запустить бэкап в файл. */
  triggerBackup: () => api.post<BackupFile>('/admin/backups'),
  /** Скачать конкретный файл бэкапа. */
  downloadBackupFile: (name: string) => downloadFile(`/admin/backups/${encodeURIComponent(name)}`, name),
}
