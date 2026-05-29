import type { WebSocket } from 'ws'
import type {
  WsBrowserInbound,
  WsBrowserOutbound,
  WsCommandAckMessage,
  WsDesktopInbound,
  WsDesktopOutbound,
  WsErrorMessage,
  WsSyncMessage,
} from '@billiard/shared'
import { prisma } from './db.js'
import type { Prisma } from './_prisma/index.js'

/**
 * Хаб клубных WS-соединений.
 *
 * Для каждого клуба держим Room { desktop, browsers[] }.
 *  - desktop: одно соединение от billiard-client (если открыто несколько — берём последнее)
 *  - browsers: несколько соединений от админских вкладок одновременно
 *
 * Роутинг:
 *   desktop SYNC      → broadcast browsers + UPSERT ClubSyncSnapshot в БД
 *   desktop ACK       → broadcast browsers
 *   browser COMMAND   → forward desktop (или ERROR DESKTOP_OFFLINE → browser)
 */

interface Room {
  desktop: WebSocket | null
  browsers: Set<WebSocket>
}

export class ClubHub {
  private rooms = new Map<string, Room>()
  private logger: { warn: (...args: unknown[]) => void; error: (...args: unknown[]) => void }

  constructor(logger: { warn: (...args: unknown[]) => void; error: (...args: unknown[]) => void }) {
    this.logger = logger
  }

  private getRoom(clubId: string): Room {
    let room = this.rooms.get(clubId)
    if (!room) {
      room = { desktop: null, browsers: new Set() }
      this.rooms.set(clubId, room)
    }
    return room
  }

  attachDesktop(clubId: string, ws: WebSocket): void {
    const room = this.getRoom(clubId)
    // Если уже есть desktop-соединение — закрываем старое (новое побеждает)
    if (room.desktop && room.desktop !== ws) {
      try { room.desktop.close(1000, 'replaced by new connection') } catch { /* ignore */ }
    }
    room.desktop = ws

    ws.on('close', () => {
      const r = this.rooms.get(clubId)
      if (r && r.desktop === ws) {
        r.desktop = null
        // Уведомляем браузеры что приложение отключилось — пусть покажут «офлайн»
        this.broadcastBrowsers(clubId, {
          type: 'ERROR',
          code: 'DESKTOP_OFFLINE',
          message: 'Приложение отключилось',
        })
      }
    })
  }

  attachBrowser(clubId: string, ws: WebSocket): void {
    const room = this.getRoom(clubId)
    room.browsers.add(ws)

    ws.on('close', () => {
      const r = this.rooms.get(clubId)
      if (r) r.browsers.delete(ws)
    })
  }

  isDesktopOnline(clubId: string): boolean {
    const r = this.rooms.get(clubId)
    return !!(r && r.desktop)
  }

  /** Forward сообщения от desktop'а: SYNC → browsers + persist; ACK → browsers. */
  async handleDesktopMessage(clubId: string, raw: WsDesktopOutbound): Promise<void> {
    if (raw.type === 'SYNC') {
      // Persist snapshot — тот же путь, что и у POST /club/sync
      try {
        const sync = raw as WsSyncMessage
        const now = new Date()
        await prisma.clubSyncSnapshot.upsert({
          where: { clubId },
          create: {
            clubId,
            tables: sync.tables as unknown as Prisma.InputJsonValue,
            revenue: sync.revenue as unknown as Prisma.InputJsonValue,
            syncedAt: now,
          },
          update: {
            tables: sync.tables as unknown as Prisma.InputJsonValue,
            revenue: sync.revenue as unknown as Prisma.InputJsonValue,
            syncedAt: now,
          },
        })
      } catch (err) {
        this.logger.error({ err, clubId }, 'ws: failed to persist SYNC')
      }
      this.broadcastBrowsers(clubId, raw)
      return
    }
    if (raw.type === 'COMMAND_ACK') {
      this.broadcastBrowsers(clubId, raw as WsCommandAckMessage)
      return
    }
    this.logger.warn({ clubId, type: (raw as { type: string }).type }, 'ws: unknown desktop msg type')
  }

  /** Forward команды от browser'а: → desktop или ERROR DESKTOP_OFFLINE. */
  handleBrowserMessage(clubId: string, browserWs: WebSocket, raw: WsBrowserOutbound): void {
    const room = this.rooms.get(clubId)
    if (!room || !room.desktop) {
      const err: WsErrorMessage = {
        type: 'ERROR',
        code: 'DESKTOP_OFFLINE',
        commandId: 'commandId' in raw ? raw.commandId : undefined,
        message: 'Приложение не в сети',
      }
      this.send(browserWs, err)
      return
    }
    this.send(room.desktop, raw as WsDesktopInbound)
  }

  private broadcastBrowsers(clubId: string, msg: WsBrowserInbound): void {
    const room = this.rooms.get(clubId)
    if (!room) return
    const data = JSON.stringify(msg)
    for (const ws of room.browsers) {
      if (ws.readyState === ws.OPEN) {
        try { ws.send(data) } catch { /* ignore broken pipe */ }
      }
    }
  }

  private send(ws: WebSocket, msg: unknown): void {
    if (ws.readyState !== ws.OPEN) return
    try { ws.send(JSON.stringify(msg)) } catch { /* ignore */ }
  }
}
