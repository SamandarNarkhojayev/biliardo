import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomBytes } from 'node:crypto'
import { env } from './config.js'

/**
 * S3-клиент для ps.kz (или любого S3-совместимого хранилища).
 *
 * Используем path-style (forcePathStyle: true) — большинство non-AWS провайдеров
 * требуют именно его, потому что у них wildcard-DNS на под-домен бакета не настроен.
 */
let _client: S3Client | null = null

export function s3Configured(): boolean {
  return Boolean(env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY)
}

export function getS3Client(): S3Client {
  if (!s3Configured()) {
    throw new Error('S3 не сконфигурирован. Установите S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.')
  }
  if (_client) return _client
  _client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT!,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  })
  return _client
}

const ALLOWED_AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function isAllowedAvatarMime(mime: string): boolean {
  return ALLOWED_AVATAR_MIME.has(mime.toLowerCase())
}

export function extFromMime(mime: string): string {
  switch (mime.toLowerCase()) {
    case 'image/jpeg': return 'jpg'
    case 'image/png': return 'png'
    case 'image/webp': return 'webp'
    case 'image/gif': return 'gif'
    default: return 'bin'
  }
}

/**
 * Generate a presigned PUT URL for the client to upload directly to S3.
 * Returns { uploadUrl, publicUrl, key } — клиент кладёт файл по uploadUrl,
 * потом сохраняет publicUrl в user.avatar через PATCH /auth/me.
 *
 * Лимит размера: enforce-им на стороне S3 через `Content-Length` в подписи.
 */
export async function presignAvatarUpload(opts: {
  userId: string
  contentType: string
  maxBytes: number
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  if (!isAllowedAvatarMime(opts.contentType)) {
    throw new Error('Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF.')
  }
  const client = getS3Client()
  const ext = extFromMime(opts.contentType)
  // Cache-bust имя через random suffix — старые URL после обновления остаются валидны.
  const key = `avatars/${opts.userId}/${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`

  const cmd = new PutObjectCommand({
    Bucket: env.S3_BUCKET_MEDIA,
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.maxBytes,
    CacheControl: 'public, max-age=31536000, immutable',
    ACL: 'public-read',
  })
  const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 300 })

  const publicBase = env.S3_PUBLIC_URL ?? `${env.S3_ENDPOINT}/${env.S3_BUCKET_MEDIA}`
  const publicUrl = `${publicBase.replace(/\/$/, '')}/${key}`
  return { uploadUrl, publicUrl, key }
}

/**
 * Удалить старый аватар при замене (best-effort, не критично если упадёт).
 */
export async function deleteAvatar(key: string): Promise<void> {
  if (!s3Configured()) return
  const client = getS3Client()
  await client.send(new DeleteObjectCommand({
    Bucket: env.S3_BUCKET_MEDIA,
    Key: key,
  }))
}
