import type { ClubStatusSnapshot, ClubSessionsResponse, ClubSessionsSummaryRow, ClubShiftsResponse } from '@billiard/shared'
import { api } from './client'

export const clubApi = {
  status: () => api.get<ClubStatusSnapshot>('/club/status'),
  sessions: (q: { date?: string; from?: string; to?: string; tableId?: number; shiftId?: string } = {}) => {
    const qs = new URLSearchParams()
    if (q.date) qs.set('date', q.date)
    if (q.from) qs.set('from', q.from)
    if (q.to) qs.set('to', q.to)
    if (q.tableId !== undefined) qs.set('tableId', String(q.tableId))
    if (q.shiftId) qs.set('shiftId', q.shiftId)
    const suffix = qs.toString() ? `?${qs}` : ''
    return api.get<ClubSessionsResponse>(`/club/sessions${suffix}`)
  },
  summary: (q: { groupBy: 'day' | 'month'; from?: string; to?: string }) => {
    const qs = new URLSearchParams({ groupBy: q.groupBy })
    if (q.from) qs.set('from', q.from)
    if (q.to) qs.set('to', q.to)
    return api.get<{ rows: ClubSessionsSummaryRow[] }>(`/club/sessions/summary?${qs}`)
  },
  shifts: () => api.get<ClubShiftsResponse>('/club/shifts'),
}
