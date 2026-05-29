import { create } from 'zustand'
import type {
  ClubStatusSnapshot,
  TableSnapshot,
  ClubRevenue,
  WsBrowserInbound,
  WsBrowserOutbound,
  WsCommandAckMessage,
} from '@billiard/shared'
import { useAuthStore } from './auth'
import { clubApi } from '@/api/club'

const WS_BASE_URL: string = (import.meta.env.VITE_CLUB_WS_URL as string | undefined) ?? 'ws://localhost:3004'
const RECONNECT_BASE_MS = 2_000
const RECONNECT_MAX_MS = 60_000

/**
 * Состояние клубного дашборда (real-time через WS).
 *
 *  - snapshot: последний полученный/загруженный снимок
 *  - desktopOnline: пришёл ли SYNC за последние N секунд
 *  - pendingCommands: command-id'ы в полёте, чтобы UI крутил спиннер на конкретной кнопке
 */

interface ClubState {
  snapshot: ClubStatusSnapshot | null
  desktopOnline: boolean
  pendingCommands: Set<string>
  /** Текущее WS-соединение */
  ws: WebSocket | null
  /** Reconnect attempts (экспоненциальный backoff) */
  retryAttempt: number
  /** true пока пытаемся переподключиться */
  reconnecting: boolean

  /** Загрузить snapshot через REST (init) + открыть WS */
  bootstrap: () => Promise<void>
  /** Закрыть WS, очистить state */
  teardown: () => void

  /** Отправить команду в desktop через WS. Возвращает commandId. */
  sendCommand: (cmd: BrowserCommandInput) => string
}

// Distributive Omit — иначе TS теряет поле `payload` (оно есть только в одной варианте союза).
type DistOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
type BrowserCommandInput = DistOmit<WsBrowserOutbound, 'commandId'>

let reconnectTimer: number | null = null

function makeCommandId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function updateTablesFromAck(snap: ClubStatusSnapshot | null, ack: WsCommandAckMessage): ClubStatusSnapshot | null {
  if (!snap) return snap
  return {
    ...snap,
    tables: snap.tables.map((t) =>
      t.id === ack.tableId ? { ...t, status: ack.newStatus } : t,
    ),
  }
}

export const useClubStore = create<ClubState>((set, get) => ({
  snapshot: null,
  desktopOnline: false,
  pendingCommands: new Set(),
  ws: null,
  retryAttempt: 0,
  reconnecting: false,

  bootstrap: async () => {
    // Загружаем последний снимок через REST — фронт может что-то рендерить даже без WS.
    try {
      const snap = await clubApi.status()
      set({ snapshot: snap, desktopOnline: snap.isOnline })
    } catch {
      // 401/403/network — пусть UI покажет «не подключено»
    }
    connect(get, set)
  },

  teardown: () => {
    const ws = get().ws
    if (ws) {
      try { ws.close(1000, 'teardown') } catch { /* ignore */ }
    }
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    set({ ws: null, retryAttempt: 0, reconnecting: false })
  },

  sendCommand: (cmd) => {
    const ws = get().ws
    const commandId = makeCommandId()
    const full = { ...cmd, commandId } as WsBrowserOutbound
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // Сообщаем UI напрямую — приложение оффлайн / WS закрыт
      return commandId
    }
    try {
      ws.send(JSON.stringify(full))
      set((s) => {
        const next = new Set(s.pendingCommands)
        next.add(commandId)
        return { pendingCommands: next }
      })
      // 10-секундный watchdog: если ACK не пришёл — снимаем pending
      window.setTimeout(() => {
        set((s) => {
          if (!s.pendingCommands.has(commandId)) return s
          const next = new Set(s.pendingCommands)
          next.delete(commandId)
          return { pendingCommands: next }
        })
      }, 10_000)
    } catch { /* ignore */ }
    return commandId
  },
}))

function connect(
  get: () => ClubState,
  set: (partial: Partial<ClubState> | ((s: ClubState) => Partial<ClubState>)) => void,
): void {
  const user = useAuthStore.getState().user
  const token = useAuthStore.getState().accessToken
  if (!user || !token) return
  if (user.accountType !== 'CLUB') return

  const url = `${WS_BASE_URL.replace(/\/$/, '')}/ws/club/${user.id}?token=${encodeURIComponent(token)}`
  const ws = new WebSocket(url)
  set({ ws, reconnecting: false })

  ws.onopen = () => {
    set({ retryAttempt: 0 })
  }

  ws.onmessage = (ev) => {
    let msg: WsBrowserInbound
    try { msg = JSON.parse(ev.data) as WsBrowserInbound } catch { return }
    if (!msg || typeof msg !== 'object' || !('type' in msg)) return

    if (msg.type === 'SYNC') {
      set((s) => ({
        snapshot: {
          clubId: s.snapshot?.clubId ?? user.id,
          clubName: s.snapshot?.clubName ?? user.clubName ?? user.name,
          isOnline: true,
          lastSyncAt: new Date().toISOString(),
          tables: msg.tables as TableSnapshot[],
          todayRevenue: msg.revenue as ClubRevenue,
        },
        desktopOnline: true,
      }))
      return
    }
    if (msg.type === 'COMMAND_ACK') {
      set((s) => {
        const next = new Set(s.pendingCommands)
        next.delete(msg.commandId)
        return {
          pendingCommands: next,
          snapshot: updateTablesFromAck(s.snapshot, msg),
        }
      })
      return
    }
    if (msg.type === 'ERROR') {
      if (msg.code === 'DESKTOP_OFFLINE') {
        set({ desktopOnline: false })
        if (msg.commandId) {
          set((s) => {
            const next = new Set(s.pendingCommands)
            next.delete(msg.commandId!)
            return { pendingCommands: next }
          })
        }
      }
      return
    }
  }

  ws.onclose = () => {
    const state = get()
    set({ ws: null })
    // Авто-reconnect с экспоненциальным backoff
    const attempt = state.retryAttempt + 1
    const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, attempt - 1), RECONNECT_MAX_MS)
    set({ retryAttempt: attempt, reconnecting: true })
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer)
    reconnectTimer = window.setTimeout(() => connect(get, set), delay)
  }

  ws.onerror = () => {
    // close обработает reconnect; здесь молчим
  }
}
