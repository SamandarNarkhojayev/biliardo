#!/usr/bin/env node
/**
 * One-shot скрипт создания S3-бакетов в ps.kz и применения политик.
 * Запускается из корня проекта:
 *
 *   node scripts/setup-s3-buckets.mjs
 *
 * Читает env из ./.env.prod (если есть) или из process.env. Ключи в .env.prod
 * имеют приоритет, потому что dev-ключи могут отличаться.
 *
 * Что делает:
 *   1. Проверяет/создаёт бакет S3_BUCKET_MEDIA с public-read policy + CORS
 *   2. Проверяет/создаёт бакет S3_BUCKET_BACKUPS (private)
 *
 * Идемпотентно: повторный запуск не ломает уже настроенные бакеты.
 */

import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from '@aws-sdk/client-s3'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Парсим .env.prod вручную (без зависимостей) — берём только нужные ключи.
function loadDotenv(path) {
  if (!existsSync(path)) return {}
  const txt = readFileSync(path, 'utf-8')
  const out = {}
  let inQuoted = null  // имя ключа, если внутри многострочной кавычки
  let buf = ''
  for (const raw of txt.split('\n')) {
    if (inQuoted) {
      buf += '\n' + raw
      if (raw.endsWith('"')) {
        out[inQuoted] = buf.slice(0, -1)
        inQuoted = null
        buf = ''
      }
      continue
    }
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const k = line.slice(0, eq).trim()
    let v = line.slice(eq + 1).trim()
    // Уберём inline-комментарий, если значение НЕ в кавычках.
    if (!v.startsWith('"') && !v.startsWith("'")) {
      const hash = v.indexOf('#')
      if (hash !== -1) v = v.slice(0, hash).trim()
    }
    if (v.startsWith('"') && !v.endsWith('"')) {
      inQuoted = k
      buf = v.slice(1)
      continue
    }
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    out[k] = v
  }
  return out
}

const fromFile = loadDotenv(resolve(ROOT, '.env.prod'))
const env = { ...process.env, ...fromFile }

const endpoint = env.S3_ENDPOINT
const region = env.S3_REGION || 'kz-1'
const accessKeyId = env.S3_ACCESS_KEY_ID
const secretAccessKey = env.S3_SECRET_ACCESS_KEY
const bucketMedia = env.S3_BUCKET_MEDIA || 'biliardo-media'
const bucketBackups = env.S3_BUCKET_BACKUPS || 'biliardo-backups'

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error('❌ Не хватает env: S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY (проверь .env.prod)')
  process.exit(1)
}

const allowedOrigins = ['https://biliardo.kz', 'http://localhost:5173', 'http://localhost:5174']

const s3 = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
})

async function bucketExists(name) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: name }))
    return true
  } catch (e) {
    if (e?.$metadata?.httpStatusCode === 404 || e?.name === 'NotFound') return false
    if (e?.$metadata?.httpStatusCode === 403) {
      console.warn(`⚠️  ${name}: HEAD вернул 403 — возможно, ключ не имеет прав HeadBucket. Попробую создать (CreateBucket вернёт ошибку, если уже существует).`)
      return false
    }
    throw e
  }
}

async function ensureBucket(name) {
  if (await bucketExists(name)) {
    console.log(`✅ ${name}: уже существует`)
    return
  }
  try {
    await s3.send(new CreateBucketCommand({ Bucket: name }))
    console.log(`🆕 ${name}: создан`)
  } catch (e) {
    if (e?.name === 'BucketAlreadyOwnedByYou' || e?.name === 'BucketAlreadyExists') {
      console.log(`✅ ${name}: уже принадлежит вам`)
      return
    }
    throw e
  }
}

async function applyPublicReadPolicy(name) {
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicRead',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${name}/*`,
      },
    ],
  }
  try {
    await s3.send(new PutBucketPolicyCommand({
      Bucket: name,
      Policy: JSON.stringify(policy),
    }))
    console.log(`🔓 ${name}: public-read policy применён`)
  } catch (e) {
    console.warn(`⚠️  ${name}: PutBucketPolicy не сработал — ${e?.message || e}`)
    console.warn(`    Возможно, ps.kz требует включить публичный доступ через панель управления.`)
  }
}

async function applyCors(name, origins) {
  const cfg = {
    CORSRules: [
      {
        AllowedOrigins: origins,
        AllowedMethods: ['GET', 'PUT', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3000,
      },
    ],
  }
  try {
    await s3.send(new PutBucketCorsCommand({ Bucket: name, CORSConfiguration: cfg }))
    console.log(`🌐 ${name}: CORS применён для ${origins.join(', ')}`)
  } catch (e) {
    console.warn(`⚠️  ${name}: PutBucketCors не сработал — ${e?.message || e}`)
  }
}

async function showCors(name) {
  try {
    const res = await s3.send(new GetBucketCorsCommand({ Bucket: name }))
    console.log(`   текущий CORS у ${name}:`, JSON.stringify(res.CORSRules, null, 2))
  } catch {
    // нет CORS — не страшно для backups
  }
}

async function main() {
  console.log(`🔧 endpoint=${endpoint}  region=${region}`)
  console.log()

  console.log(`── ${bucketMedia} ────────────────────────`)
  await ensureBucket(bucketMedia)
  await applyPublicReadPolicy(bucketMedia)
  await applyCors(bucketMedia, allowedOrigins)
  await showCors(bucketMedia)
  console.log()

  console.log(`── ${bucketBackups} ────────────────────────`)
  await ensureBucket(bucketBackups)
  // backups оставляем приватным — никакой policy
  console.log()

  console.log('🎉 Готово.')
}

main().catch((e) => {
  console.error('💥 Ошибка:', e?.message || e)
  if (e?.$metadata) console.error('   metadata:', e.$metadata)
  process.exit(1)
})
