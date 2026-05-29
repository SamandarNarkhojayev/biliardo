import { q } from './sql.js'

export interface HealthSample {
  service: string
  ok: boolean
  status: number | null
  latencyMs: number | null
  createdAt: string
}

/** Сэмплы пинга сервисов за последние `minutes` минут (по возрастанию времени). */
export async function healthHistory(minutes: number): Promise<HealthSample[]> {
  return q<HealthSample>(
    `SELECT service, ok, status, "latencyMs", "createdAt"
     FROM admin.service_health_sample
     WHERE "createdAt" > now() - ($1::int * interval '1 minute')
     ORDER BY "createdAt" ASC`,
    minutes,
  )
}
