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
  /** Глобальный счётчик команд в полёте (для общей индикации). */
  pendingCommands: Set<string>
  /**
   * Map commandId → tableId. Позволяет UI блокировать кнопки только у того стола,
   * на который ушла команда, а не у всех сразу. Очищается при ACK/ERROR/watchdog.
   */
  pendingByCommand: Map<string, number>
  /** Текущее WS-соединение */
  ws: WebSocket | null
  /** Reconnect attempts (экспоненциальный backoff) */
  retryAttempt: number
  /** true пока пытаемся переподключиться */
  reconnecting: boolean

  /** Загрузить snapshot через REST (init) + открыть WS */
  bootstrap: () => Promise<void>
  /** Перетянуть REST-снимок (для периодического polling без re-open WS). */
  refresh: () => Promise<void>
  /** Закрыть WS, очистить state */
  teardown: () => void

  /** Отправить команду в desktop через WS. Возвращает commandId. */
  sendCommand: (cmd: BrowserCommandInput) => string
  /** true если на этот стол сейчас летит команда (для disable конкретных кнопок). */
  isPendingForTable: (tableId: number) => boolean
}

// Distributive Omit — иначе TS теряет поле `payload` (оно есть только в одной варианте союза).
type DistOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
type BrowserCommandInput = DistOmit<WsBrowserOutbound, 'commandId'>

let reconnectTimer: number | null = null
/**
 * Флаг "мы сами закрываем сокет" — выставляется в teardown() перед ws.close().
 * Внутри ws.onclose проверяем: если флаг true → НЕ запускаем reconnect-timer,
 * иначе StrictMode размонтирование/HMR порождает бесконечный цикл
 * close → reconnect → connect → mount → cleanup → close → ...
 */
let closingIntentionally = false

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
  pendingByCommand: new Map(),
  ws: null,
  retryAttempt: 0,
  reconnecting: false,

  isPendingForTable: (tableId) => {
    for (const tid of get().pendingByCommand.values()) {
      if (tid === tableId) return true
    }
    return false
  },

  bootstrap: async () => {
    // Загружаем последний снимок через REST — фронт может что-то рендерить даже без WS.
    if (!useAuthStore.getState().user) return
    try {
      const snap = await clubApi.status()
      set({ snapshot: snap, desktopOnline: snap.isOnline })
    } catch {
      // 401/403/network — пусть UI покажет «не подключено»
    }
    // WS подключаем только если осталось залогинены (auth могло истечь после await).
    if (useAuthStore.getState().user) connect(get, set)
  },

  refresh: async () => {
    // Не пытаемся, если уже не залогинены — иначе кругами генерим 401 в консоль.
    if (!useAuthStore.getState().user) return
    try {
      const snap = await clubApi.status()
      set({ snapshot: snap, desktopOnline: snap.isOnline })
    } catch {
      /* offline / 401 — onAuthExpired в auth.ts выкидывает user, ProtectedRoute редиректит */
    }
  },

  teardown: () => {
    const ws = get().ws
    if (ws) {
      closingIntentionally = true
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
      return commandId
    }
    try {
      ws.send(JSON.stringify(full))
      set((s) => {
        const next = new Set(s.pendingCommands)
        next.add(commandId)
        const byCmd = new Map(s.pendingByCommand)
        byCmd.set(commandId, cmd.tableId)
        return { pendingCommands: next, pendingByCommand: byCmd }
      })
      // 10-секундный watchdog: если ACK не пришёл — снимаем pending
      window.setTimeout(() => {
        set((s) => {
          if (!s.pendingCommands.has(commandId)) return s
          const next = new Set(s.pendingCommands)
          next.delete(commandId)
          const byCmd = new Map(s.pendingByCommand)
          byCmd.delete(commandId)
          return { pendingCommands: next, pendingByCommand: byCmd }
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
  // Перед открытием НОВОГО ws: если у нас уже был "наш" (например, mount-cleanup-mount),
  // помечаем его как намеренно закрываемый — иначе его поздний onclose запустит лишний reconnect.
  const prev = get().ws
  if (prev && prev !== ws) {
    closingIntentionally = true
    try { prev.close(1000, 'replaced') } catch { /* ignore */ }
  }
  set({ ws, reconnecting: false })

  ws.onopen = () => {
    // Гонка: убеждаемся что в store именно мы (а не "победивший" более новый сокет).
    if (get().ws !== ws) return
    console.log('[club WS] open ✓')
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
        const byCmd = new Map(s.pendingByCommand)
        byCmd.delete(msg.commandId)
        return {
          pendingCommands: next,
          pendingByCommand: byCmd,
          snapshot: updateTablesFromAck(s.snapshot, msg),
        }
      })
      return
    }
    if (msg.type === 'ERROR') {
      if (msg.code === 'DESKTOP_OFFLINE') {
        set({ desktopOnline: false })
      }
      // Любая ошибка с commandId должна разблокировать кнопки — не только OFFLINE.
      if (msg.commandId) {
        set((s) => {
          const next = new Set(s.pendingCommands)
          next.delete(msg.commandId!)
          const byCmd = new Map(s.pendingByCommand)
          byCmd.delete(msg.commandId!)
          return { pendingCommands: next, pendingByCommand: byCmd }
        })
      }
      return
    }
  }

  ws.onclose = (ev) => {
    const wasIntentional = closingIntentionally
    const isCurrentWs = get().ws === ws
    if (isCurrentWs) {
      closingIntentionally = false
      set({ ws: null })
    }
    if (wasIntentional) {
      console.log('[club WS] closed (intentional) — skipping reconnect')
      return
    }
    // Если этот сокет — НЕ текущий (его уже заменили в store), не реконнектимся.
    if (!isCurrentWs) {
      console.log('[club WS] closed (stale ws) — ignoring')
      return
    }
    console.log('[club WS] closed, code=', ev.code, 'reason=', ev.reason || '(empty)', '→ schedule reconnect')
    const state = get()
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
