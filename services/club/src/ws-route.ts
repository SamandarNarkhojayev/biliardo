import type { FastifyInstance } from 'fastify'
import websocket from '@fastify/websocket'
import type {
  WsBrowserOutbound,
  WsDesktopOutbound,
} from '@billiard/shared'
import { ClubHub } from './ws-hub.js'
import { verifyAnyToken } from './jwt-verifier.js'

/**
 * WS endpoint: /ws/club/:clubId?token=<jwt>
 *
 * Авторизация: токен в query string (browser-CLUB или desktop). Проверяем что
 * clubId из токена совпадает с :clubId в URL — иначе 1008 close.
 */
export async function registerWebSocket(app: FastifyInstance): Promise<ClubHub> {
  await app.register(websocket, {
    options: {
      // 1MB должно хватить с запасом — снимок 64 столов с ревеню << 100KB
      maxPayload: 1_048_576,
    },
  })

  const hub = new ClubHub({
    warn: (...args) => app.log.warn(...args as [Record<string, unknown>, string?]),
    error: (...args) => app.log.error(...args as [Record<string, unknown>, string?]),
  })

  app.get<{ Params: { clubId: string }; Querystring: { token?: string } }>(
    '/ws/club/:clubId',
    { websocket: true },
    async (socket, req) => {
      const ws = socket
      const token = req.query.token
      const routeClubId = req.params.clubId

      if (!token) {
        ws.close(1008, 'TOKEN_REQUIRED')
        return
      }

      const verified = await verifyAnyToken(token)
      if (!verified) {
        ws.close(1008, 'INVALID_TOKEN')
        return
      }
      // Browser: только CLUB-аккаунт получает доступ к клубному каналу
      if (verified.kind === 'browser' && verified.accountType !== 'CLUB') {
        ws.close(1008, 'NOT_A_CLUB')
        return
      }
      // Кросс-клубный спам: clubId в URL должен совпадать с тем, что в токене
      if (verified.clubId !== routeClubId) {
        ws.close(1008, 'CLUB_MISMATCH')
        return
      }

      if (verified.kind === 'desktop') {
        hub.attachDesktop(routeClubId, ws)
      } else {
        hub.attachBrowser(routeClubId, ws)
      }

      ws.on('message', (raw: Buffer) => {
        let msg: unknown
        try {
          msg = JSON.parse(raw.toString())
        } catch {
          return
        }
        if (!msg || typeof msg !== 'object' || !('type' in msg)) return

        if (verified.kind === 'desktop') {
          void hub.handleDesktopMessage(routeClubId, msg as WsDesktopOutbound)
        } else {
          hub.handleBrowserMessage(routeClubId, ws, msg as WsBrowserOutbound)
        }
      })
    },
  )

  return hub
}
