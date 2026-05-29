import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import { Agent } from 'undici'
import { env } from './config.js'

/**
 * Клиент Kaspi QR Merchant API.
 *
 * Порт PHP-SDK burcev-alex/kaspi-qr-sdk на TypeScript. Реальные эндпоинты:
 *   POST  {base}/qr/create            — создать QR-счёт (вернёт QrToken + QrPaymentId)
 *   POST  {base}/qr/create-link       — создать платёжную ссылку (для мобильных)
 *   GET   {base}/payment/status/{id}  — статус платежа (поллинг)
 *   POST  {base}/remote/cancel        — отменить счёт
 *   POST  {base}/payment/return       — возврат (refund)
 *
 * base = {domain}:{port}/{scheme}/v01, где scheme/port:
 *   r1 (EASY)   → 8543   — без mTLS
 *   r2 (MEDIUM) → 8544   — без mTLS
 *   r3 (STRONG) → 8545   — mTLS (клиентский сертификат) + OrganizationBin в теле
 *
 * Заголовки: `Api-Key` (ключ мерчанта) + `X-Request-ID` (uuid на каждый запрос).
 * Конверт ответа: { StatusCode, Message?, Data }. StatusCode === 0 → успех.
 *
 * ВАЖНО: QR Merchant API работает через ПОЛЛИНГ статуса, а не webhook. Поэтому
 * `supportsPolling = true` у live-клиента, и payment-сервис сам опрашивает Kaspi
 * (см. routes.ts → refreshPaymentFromProvider). HMAC-webhook оставлен опционально —
 * Kaspi может присылать callback, если это включено в договоре.
 */

export interface KaspiCreateOrderInput {
  /** Внутренний id нашего платежа — уходит в Kaspi как ExternalId. */
  paymentId: string
  amountKzt: number
  description: string
  /** Куда вернуть пользователя после оплаты. */
  returnUrl: string
}

export interface KaspiCreateOrderResult {
  /** id заказа в Kaspi (QrPaymentId / PaymentId) — по нему опрашиваем статус. */
  externalId: string
  /** Платёжная ссылка (только для create-link). */
  paymentUrl?: string
  /** QR-payload (QrToken) — рендерится в QR-код на фронте. */
  qrPayload?: string
  /** Когда заказ «сгорит», если не оплачен. */
  expiresAt: Date
}

/** Нормализованный статус — общий для webhook и для поллинга. */
export type KaspiNormalizedStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'REFUNDED'

export interface KaspiStatusResult {
  status: KaspiNormalizedStatus
  amountKzt?: number
  transactionId?: string
  raw: unknown
}

export interface KaspiWebhookPayload {
  externalId: string
  /** Ссылка на наш платёж — то, что мы передали в createOrder.paymentId (ExternalId). */
  paymentId: string
  status: 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'REFUNDED'
  amountKzt: number
  paidAt?: string
}

export interface KaspiClient {
  /** Поддерживает ли клиент опрос статуса (live — да, stub — нет). */
  readonly supportsPolling: boolean
  createOrder(input: KaspiCreateOrderInput): Promise<KaspiCreateOrderResult>
  getStatus(externalId: string): Promise<KaspiStatusResult>
  refund(externalId: string, amountKzt: number): Promise<void>
  cancel(externalId: string): Promise<void>
  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean
}

// ─────────────────────────── Stub (dev / e2e) ───────────────────────────

class KaspiStubClient implements KaspiClient {
  readonly supportsPolling = false

  async createOrder(input: KaspiCreateOrderInput): Promise<KaspiCreateOrderResult> {
    const externalId = `stub_${crypto.randomBytes(8).toString('hex')}`
    const expiresAt = new Date(Date.now() + env.PAYMENT_EXPIRY_MINUTES * 60_000)
    return {
      externalId,
      // В stub-режиме UI ведёт на наш экран «имитация оплаты» с кнопкой,
      // которая дёргает /payments/:id/stub-complete.
      paymentUrl: `${env.PUBLIC_APP_URL}/payment/stub?paymentId=${input.paymentId}`,
      qrPayload: `STUB-QR:${externalId}`,
      expiresAt,
    }
  }

  // Stub финализируется через dev-эндпоинт, а не опросом.
  async getStatus(): Promise<KaspiStatusResult> {
    return { status: 'PENDING', raw: { stub: true } }
  }

  async refund(): Promise<void> {
    throw new Error('Refund not supported in stub mode')
  }

  async cancel(): Promise<void> {
    /* no-op в stub */
  }

  // Подпись всё равно требуем — чтобы не оставить открытый «complete by id».
  verifyWebhookSignature(): boolean {
    return false
  }
}

// ─────────────────────────── Live (Kaspi QR Merchant API) ───────────────────────────

const SCHEME_PORTS: Record<string, number> = { r1: 8543, r2: 8544, r3: 8545 }
const API_VERSION = 'v01'

/** Коды ошибок Kaspi (StatusCode != 0). Из PHP-SDK AbstractRequest::getMessageByStatusCode. */
const KASPI_STATUS_MESSAGES: Record<number, string> = {
  [-10000]: 'Отсутствует сертификат клиента',
  [-1501]: 'Устройство с заданным идентификатором не найдено',
  [-1502]: 'Устройство не активно (отключено или удалено)',
  [-1503]: 'Устройство уже добавлено в другую торговую точку',
  [-1601]: 'Покупка не найдена',
  [-14000002]: 'Отсутствуют торговые точки, необходимо создать торговую точку в приложении',
  [-99000001]: 'Покупка с заданным идентификатором не найдена',
  [-99000002]: 'Торговая точка не найдена',
  [-99000003]: 'Торговая точка покупки не соответствует текущему устройству',
  [-99000005]: 'Сумма возврата не может превышать сумму покупки',
  [-99000006]: 'Ошибка возврата, попробуйте ещё раз',
  [-99000011]: 'Невозможно вернуть покупку (несоответствующий статус покупки)',
  [-99000020]: 'Частичный возврат невозможен',
  [990000018]: 'Торговая точка отключена',
  [990000026]: 'Торговая точка не принимает оплату с QR',
  [990000028]: 'Указана неверная сумма операции',
  [990000033]: 'Нет доступных методов оплаты',
  [-999]: 'Сервис временно недоступен',
}

export class KaspiError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(`Kaspi StatusCode ${statusCode}: ${message}`)
    this.name = 'KaspiError'
  }
}

/** Маппинг статусов Kaspi QR → наш нормализованный статус. */
function mapKaspiStatus(status: string): KaspiNormalizedStatus {
  switch (status) {
    case 'Processed':
      return 'COMPLETED'
    case 'Error':
      return 'FAILED'
    case 'Refunded':
    case 'Returned':
      return 'REFUNDED'
    // Wait, QrTokenCreated, Created, CREATED — платёж ещё в процессе
    default:
      return 'PENDING'
  }
}

interface KaspiEnvelope<T> {
  StatusCode?: number
  Message?: string
  Data?: T
}

class KaspiLiveClient implements KaspiClient {
  readonly supportsPolling = true

  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly deviceToken: string
  private readonly scheme: string
  private readonly organizationBin?: string
  private readonly webhookSecret?: string
  private readonly dispatcher?: Agent

  constructor() {
    const domain = env.KASPI_BASE_DOMAIN
    const scheme = env.KASPI_SCHEME
    if (!domain || !env.KASPI_API_KEY || !env.KASPI_DEVICE_TOKEN) {
      throw new Error('KaspiLiveClient: KASPI_BASE_DOMAIN / KASPI_API_KEY / KASPI_DEVICE_TOKEN required')
    }
    const port = SCHEME_PORTS[scheme]
    this.baseUrl = `${domain.replace(/\/$/, '')}:${port}/${scheme}/${API_VERSION}`
    this.apiKey = env.KASPI_API_KEY
    this.deviceToken = env.KASPI_DEVICE_TOKEN
    this.scheme = scheme
    this.organizationBin = env.KASPI_ORGANIZATION_BIN
    this.webhookSecret = env.KASPI_WEBHOOK_SECRET

    if (scheme === 'r3') {
      // STRONG: взаимный TLS (клиентский сертификат) + OrganizationBin в теле.
      if (!env.KASPI_CERT_PATH || !env.KASPI_KEY_PATH) {
        throw new Error('KaspiLiveClient: KASPI_CERT_PATH / KASPI_KEY_PATH required for STRONG (r3) scheme')
      }
      if (!this.organizationBin) {
        throw new Error('KaspiLiveClient: KASPI_ORGANIZATION_BIN required for STRONG (r3) scheme')
      }
      this.dispatcher = new Agent({
        connect: {
          cert: readFileSync(env.KASPI_CERT_PATH, 'utf8'),
          key: readFileSync(env.KASPI_KEY_PATH, 'utf8'),
          ca: env.KASPI_CA_PATH ? readFileSync(env.KASPI_CA_PATH, 'utf8') : undefined,
          passphrase: env.KASPI_KEY_PASS,
          rejectUnauthorized: !env.KASPI_TEST_MODE,
        },
      })
    } else if (env.KASPI_TEST_MODE) {
      this.dispatcher = new Agent({ connect: { rejectUnauthorized: false } })
    }
  }

  private async call<T>(method: 'GET' | 'POST', path: string, body?: Record<string, unknown>): Promise<T> {
    // `dispatcher` — undici-расширение fetch для mTLS; типы undici и undici-types
    // конфликтуют, поэтому собираем init свободно и кастуем один раз.
    const init: Record<string, unknown> = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
        'X-Request-ID': crypto.randomUUID(),
      },
    }
    if (this.dispatcher) init.dispatcher = this.dispatcher
    if (body) init.body = JSON.stringify(this.withOrgBin(body))

    const res = await fetch(`${this.baseUrl}/${path}`, init as unknown as RequestInit)
    const text = await res.text()

    let json: KaspiEnvelope<T>
    try {
      json = JSON.parse(text) as KaspiEnvelope<T>
    } catch {
      throw new Error(`Kaspi ${path}: non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`)
    }

    const code = Number(json.StatusCode ?? (res.ok ? 0 : -1))
    if (code !== 0) {
      throw new KaspiError(code, KASPI_STATUS_MESSAGES[code] ?? json.Message ?? `HTTP ${res.status}`)
    }
    return (json.Data ?? ({} as T)) as T
  }

  /** STRONG-схема требует OrganizationBin в каждом запросе. */
  private withOrgBin(body: Record<string, unknown>): Record<string, unknown> {
    if (this.scheme === 'r3' && this.organizationBin) {
      return { ...body, OrganizationBin: this.organizationBin }
    }
    return body
  }

  async createOrder(input: KaspiCreateOrderInput): Promise<KaspiCreateOrderResult> {
    const data = await this.call<{
      QrToken?: string
      QrPaymentId?: string
      PaymentLink?: string
      PaymentId?: string
      PaymentBehaviorOptions?: {
        StatusPollingInterval?: number
        LinkActivationWaitTimeout?: number
        PaymentConfirmationTimeout?: number
      }
    }>('POST', 'qr/create', {
      DeviceToken: this.deviceToken,
      Amount: input.amountKzt,
      ExternalId: input.paymentId,
    })

    const externalId = data.QrPaymentId ?? data.PaymentId
    if (!externalId) {
      throw new Error('Kaspi qr/create: no QrPaymentId in response')
    }

    const opts = data.PaymentBehaviorOptions
    const ttlSec =
      opts && (opts.LinkActivationWaitTimeout || opts.PaymentConfirmationTimeout)
        ? (opts.LinkActivationWaitTimeout ?? 0) + (opts.PaymentConfirmationTimeout ?? 0)
        : env.PAYMENT_EXPIRY_MINUTES * 60

    return {
      externalId,
      qrPayload: data.QrToken,
      paymentUrl: data.PaymentLink,
      expiresAt: new Date(Date.now() + ttlSec * 1000),
    }
  }

  async getStatus(externalId: string): Promise<KaspiStatusResult> {
    const data = await this.call<{ Status?: string; Amount?: number; TransactionId?: string }>(
      'GET',
      `payment/status/${encodeURIComponent(externalId)}`,
    )
    return {
      status: mapKaspiStatus(data.Status ?? ''),
      amountKzt: data.Amount != null ? Math.round(data.Amount) : undefined,
      transactionId: data.TransactionId,
      raw: data,
    }
  }

  async refund(externalId: string, amountKzt: number): Promise<void> {
    await this.call('POST', 'payment/return', {
      DeviceToken: this.deviceToken,
      QrPaymentId: externalId,
      Amount: amountKzt,
    })
  }

  async cancel(externalId: string): Promise<void> {
    await this.call('POST', 'remote/cancel', {
      DeviceToken: this.deviceToken,
      QrPaymentId: externalId,
    })
  }

  /**
   * Проверка HMAC-SHA256 подписи опционального callback'а от Kaspi.
   * Включается только если задан KASPI_WEBHOOK_SECRET; иначе callback запрещён.
   */
  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    if (!this.webhookSecret || !signature) return false
    const expected = crypto.createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex')
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
    } catch {
      return false
    }
  }
}

// ─────────────────────────── Bridge (надстройка над своим Kaspi Gold) ───────────────────────────

class KaspiBridgeClient implements KaspiClient {
  // Детект оплаты — пуш-уведомлением с телефона (notify-эндпоинт), а не опросом.
  readonly supportsPolling = false

  async createOrder(input: KaspiCreateOrderInput): Promise<KaspiCreateOrderResult> {
    // Никаких внешних вызовов: клиент платит переводом на Kaspi Gold.
    // Реквизиты и точная сумма показываются на чекауте (из env фронта + amountKzt).
    const externalId = `bridge_${crypto.randomBytes(8).toString('hex')}`
    void input
    return {
      externalId,
      expiresAt: new Date(Date.now() + env.PAYMENT_EXPIRY_MINUTES * 60_000),
    }
  }

  // Статус узнаём из уведомления (push), а не поллингом.
  async getStatus(): Promise<KaspiStatusResult> {
    return { status: 'PENDING', raw: { bridge: true } }
  }

  async refund(): Promise<void> {
    throw new Error('Refund must be done manually in Kaspi for bridge mode')
  }

  async cancel(): Promise<void> {
    /* no-op: перевод просто не приходит */
  }

  // Notify-эндпоинт защищён собственным секретом (kaspi-bridge.ts), не HMAC-вебхуком.
  verifyWebhookSignature(): boolean {
    return false
  }
}

export const kaspi: KaspiClient =
  env.KASPI_MODE === 'live'
    ? new KaspiLiveClient()
    : env.KASPI_MODE === 'bridge'
      ? new KaspiBridgeClient()
      : new KaspiStubClient()

// В bridge и live деньги реальные → провайдер KASPI. stub → STUB.
export const KASPI_PROVIDER = env.KASPI_MODE === 'stub' ? 'STUB' : 'KASPI'
