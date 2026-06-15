import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastType = 'success' | 'info' | 'warning' | 'danger' | 'action'

export type ToastAction = {
  label: string
  onClick: () => void
  style?: 'primary' | 'secondary'
}

export type ToastItem = {
  id: string
  type: ToastType
  title: string
  message?: string
  icon?: string
  actions?: ToastAction[]
}

type ToastInput = {
  type?: ToastType
  title: string
  message?: string
  icon?: string
  duration?: number
  actions?: ToastAction[]
}

interface ToastContextValue {
  show: (input: ToastInput) => string
  success: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  dismiss: (id: string) => void
  toasts: ToastItem[]
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICON_BG: Record<ToastType, string> = {
  success: 'bg-label-success',
  info: 'bg-label-info',
  warning: 'bg-label-warning',
  danger: 'bg-label-danger',
  action: 'bg-label-primary',
}

const ICON: Record<ToastType, string> = {
  success: 'ti-circle-check',
  info: 'ti-info-circle',
  warning: 'ti-alert-triangle',
  danger: 'ti-alert-circle',
  action: 'ti-send',
}

function ToastView({
  toast,
  visible,
  onDismiss,
}: {
  toast: ToastItem
  visible: boolean
  onDismiss: (id: string) => void
}) {
  const stateClass = visible ? 'ecari-toast-visible' : 'ecari-toast-hiding'

  return (
    <div className={`ecari-toast ecari-toast-${toast.type} ${stateClass}`} role="alert">
      <div className="ecari-toast-inner">
        <div className={`ecari-toast-icon ${ICON_BG[toast.type]}`}>
          <i className={`ti ${toast.icon ?? ICON[toast.type]}`} />
        </div>
        <div className="ecari-toast-body flex-grow-1">
          <div className="ecari-toast-title">{toast.title}</div>
          {toast.message && <div className="ecari-toast-message">{toast.message}</div>}
          {toast.actions && toast.actions.length > 0 && (
            <div className="ecari-toast-actions d-flex flex-wrap gap-2 mt-2">
              {toast.actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`btn btn-sm ${action.style === 'primary' ? 'btn-primary' : 'btn-label-secondary'}`}
                  onClick={() => {
                    action.onClick()
                    onDismiss(toast.id)
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="ecari-toast-close btn btn-sm btn-icon btn-text-secondary"
          aria-label="Kapat"
          onClick={() => onDismiss(toast.id)}
        >
          <i className="ti ti-x" />
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 280)
  }, [])

  const show = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID()
      const item: ToastItem = {
        id,
        type: input.type ?? 'success',
        title: input.title,
        message: input.message,
        icon: input.icon,
        actions: input.actions,
      }
      setToasts((prev) => [...prev, item])
      requestAnimationFrame(() => {
        setVisibleIds((prev) => new Set(prev).add(id))
      })
      const duration = input.duration ?? (input.actions?.length ? 0 : 4200)
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toasts,
      show,
      success: (title: string, message?: string) => show({ type: 'success', title, message }),
      info: (title: string, message?: string) => show({ type: 'info', title, message }),
      warning: (title: string, message?: string) => show({ type: 'warning', title, message }),
      error: (title: string, message?: string) => show({ type: 'danger', title, message }),
      dismiss,
    }),
    [toasts, show, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div id="ecari-toast-container" className="ecari-toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <ToastView
            key={toast.id}
            toast={toast}
            visible={visibleIds.has(toast.id)}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast ToastProvider içinde kullanılmalı')
  return ctx
}
