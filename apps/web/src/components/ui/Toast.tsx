import { create } from 'zustand'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Check, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastVariant = 'success' | 'info' | 'warning' | 'error'

interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration: number
}

interface ToastState {
  items: ToastItem[]
  push: (t: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }) => string
  dismiss: (id: string) => void
}

const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: ({ duration = 4000, ...rest }) => {
    const id = 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    set({ items: [...get().items, { id, duration, ...rest }] })
    return id
  },
  dismiss: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
}))

export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ variant: 'success', title, description }),
  info: (title: string, description?: string) => useToastStore.getState().push({ variant: 'info', title, description }),
  warning: (title: string, description?: string) => useToastStore.getState().push({ variant: 'warning', title, description }),
  error: (title: string, description?: string) => useToastStore.getState().push({ variant: 'error', title, description }),
}

const config: Record<ToastVariant, { icon: typeof Check; cls: string; iconCls: string }> = {
  success: { icon: Check, cls: 'border-emerald-500/30 bg-emerald-500/[0.08]', iconCls: 'bg-emerald-500/20 text-emerald-400' },
  info: { icon: Info, cls: 'border-sky-500/30 bg-sky-500/[0.08]', iconCls: 'bg-sky-500/20 text-sky-400' },
  warning: { icon: AlertTriangle, cls: 'border-amber-500/30 bg-amber-500/[0.08]', iconCls: 'bg-amber-500/20 text-amber-300' },
  error: { icon: AlertTriangle, cls: 'border-red-500/30 bg-red-500/[0.08]', iconCls: 'bg-red-500/20 text-red-400' },
}

export function ToastViewport() {
  const items = useToastStore((s) => s.items)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[100] flex w-full max-w-sm flex-col gap-2.5 sm:bottom-28 sm:right-6">
      <AnimatePresence>
        {items.map((it) => (
          <ToastCard key={it.id} item={it} onDismiss={() => dismiss(it.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const cfg = config[item.variant]
  const Icon = cfg.icon

  useEffect(() => {
    const t = setTimeout(onDismiss, item.duration)
    return () => clearTimeout(t)
  }, [item.duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 backdrop-blur-xl shadow-lg',
        cfg.cls,
      )}
    >
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cfg.iconCls)}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-text-primary">{item.title}</div>
        {item.description && <div className="mt-0.5 text-xs text-text-secondary">{item.description}</div>}
      </div>
      <button
        onClick={onDismiss}
        className="ring-focus inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-[var(--surface-card)]"
        aria-label="Закрыть"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
