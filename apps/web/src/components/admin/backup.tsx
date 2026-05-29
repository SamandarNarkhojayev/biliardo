import { useState } from 'react'
import { Download, Database, RefreshCw, FileDown, FileJson, FileArchive } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { ApiException } from '@/api/client'
import { adminApi, type BackupList } from '@/api/admin'
import { Panel, Loading, ErrorBox, useAsync, useAdminCaps, fmtDate, fmtBytes } from './kit'

export function BackupPanel() {
  const { isSuper } = useAdminCaps()
  const { data, loading, error, reload } = useAsync<BackupList>(() => adminApi.listBackups(), [])
  const [streaming, setStreaming] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [making, setMaking] = useState(false)

  if (!isSuper) return null

  async function streamBackup() {
    setStreaming(true)
    try { await adminApi.backupNow(); toast.success('Бэкап скачан (.sql)') }
    catch (e) { toast.error('Ошибка бэкапа', e instanceof ApiException ? e.message : '') }
    finally { setStreaming(false) }
  }

  async function exportJson() {
    setExporting(true)
    try {
      const dump = await adminApi.exportDb()
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `billiard-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
      toast.success('JSON-экспорт скачан', `Таблиц: ${Object.keys(dump.tables).length}`)
    } catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') }
    finally { setExporting(false) }
  }

  async function makeFile() {
    setMaking(true)
    try { const r = await adminApi.triggerBackup(); toast.success('Бэкап создан', `${r.name} · ${fmtBytes(r.sizeBytes)}`); reload() }
    catch (e) { toast.error('Бэкап не сделан', e instanceof ApiException ? e.message : '') }
    finally { setMaking(false) }
  }

  async function downloadOne(name: string) {
    try { await adminApi.downloadBackupFile(name) }
    catch (e) { toast.error('Ошибка', e instanceof ApiException ? e.message : '') }
  }

  return (
    <Panel>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <Database size={15} /> Бэкап БД
      </h3>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" leftIcon={<FileDown size={14} />} loading={streaming} onClick={() => void streamBackup()}>
          Скачать .sql (pg_dump)
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<FileArchive size={14} />} loading={making} onClick={() => void makeFile()}>
          Сделать файл-бэкап
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<FileJson size={14} />} loading={exporting} onClick={() => void exportJson()}>
          JSON-экспорт
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={reload}>Обновить</Button>
      </div>

      <div className="mt-3 text-xs text-text-muted">
        {data && (
          <>Расписание: {data.intervalHours > 0 ? <span className="text-emerald-400">каждые {data.intervalHours} ч</span> : 'выключено'} · ретеншн {data.retentionDays} дней. Настраивается в <span className="font-mono">services/admin/.env</span>.</>
        )}
      </div>

      {loading ? <Loading /> : error ? <ErrorBox msg={error} /> : data && data.files.length > 0 ? (
        <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-input)] text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-3 py-2">Файл</th>
                <th className="px-3 py-2">Размер</th>
                <th className="px-3 py-2">Создан</th>
                <th className="px-3 py-2 text-right" />
              </tr>
            </thead>
            <tbody>
              {data.files.map((f) => (
                <tr key={f.name} className="border-t border-[var(--line)] hover:bg-[var(--surface-card-hover)]">
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">{f.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{fmtBytes(f.sizeBytes)}</td>
                  <td className="px-3 py-2 text-text-secondary">{fmtDate(f.createdAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => void downloadOne(f.name)} className="inline-flex items-center gap-1 text-emerald-400 hover:underline">
                      <Download size={12} /> скачать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : data && data.files.length === 0 ? (
        <div className="mt-3 rounded-xl border border-[var(--line)] p-4 text-center text-sm text-text-muted">
          Файловых бэкапов нет. Жми «Сделать файл-бэкап» или включи фоновое расписание (<span className="font-mono">BACKUP_INTERVAL_HOURS</span>).
        </div>
      ) : null}
    </Panel>
  )
}
