import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createTask, fetchTaskStats, fetchTasks, type TskTaskListItem } from '../../api/tsk'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import {
  formatDate,
  taskPriorityBadge,
  taskStatusBadge,
} from '../../utils/format'

type StatusFilter = 'all' | 'PENDING' | 'IN_PROGRESS' | 'OVERDUE' | 'COMPLETED'

const PRIORITIES = [
  { value: 'LOW', label: 'Düşük' },
  { value: 'NORMAL', label: 'Orta' },
  { value: 'HIGH', label: 'Yüksek' },
  { value: 'URGENT', label: 'Acil' },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function closeModal(id: string) {
  const el = document.getElementById(id)
  if (el && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(el).hide()
}

export default function GorevListPage() {
  const [items, setItems] = useState<TskTaskListItem[]>([])
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchTaskStats>> | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(addDaysIso(todayIso(), 7))
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([
      fetchTasks(statusFilter === 'all' ? undefined : statusFilter),
      fetchTaskStats(),
    ])
      .then(([listData, statsData]) => {
        setItems(listData)
        setStats(statsData)
      })
      .catch(() => setError('Görev listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [row.taskNo, row.title, row.assigneeName].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  function resetForm() {
    setTitle('')
    setStartDate(todayIso())
    setEndDate(addDaysIso(todayIso(), 7))
    setAssignee('')
    setPriority('NORMAL')
    setCreateError('')
  }

  async function handleCreate() {
    if (!title.trim()) {
      setCreateError('Görev başlığı zorunludur.')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      await createTask({
        title: title.trim(),
        startDate,
        endDate,
        assigneeName: assignee.trim() || null,
        priority,
      })
      closeModal('modalYeniGorev')
      resetForm()
      loadItems()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Görev oluşturulamadı.'
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Görev Listesi</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Görev</li>
            </ol>
          </nav>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#modalYeniGorev"
          onClick={resetForm}
        >
          <i className="ti ti-plus me-1" /> Yeni Görev
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-4 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Yapılacak</p>
              <h4 className="mb-0">{loading ? '—' : (stats?.pending ?? 0)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Devam Eden</p>
              <h4 className="mb-0 text-info">{loading ? '—' : (stats?.inProgress ?? 0)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Gecikmiş</p>
              <h4 className="mb-0 text-danger">{loading ? '—' : (stats?.overdue ?? 0)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Tamamlanan</p>
              <h4 className="mb-0 text-success">{loading ? '—' : (stats?.completed ?? 0)}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Görevler</span>
          <div className="btn-group btn-group-sm flex-wrap">
            {(
              [
                ['all', 'Tümü'],
                ['PENDING', 'Yapılacak'],
                ['IN_PROGRESS', 'Devam Eden'],
                ['OVERDUE', 'Gecikmiş'],
                ['COMPLETED', 'Tamamlanan'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`btn ${statusFilter === key ? 'btn-primary' : 'btn-label-secondary'}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <TableSearchToolbar placeholder="Görev ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Görev No</th>
                <th>Başlık</th>
                <th>Atanan</th>
                <th>Başlangıç</th>
                <th>Bitiş</th>
                <th>Öncelik</th>
                <th>Durum</th>
                <th>İlerleme</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((row) => {
                  const status = taskStatusBadge(row.statusKey)
                  const prio = taskPriorityBadge(row.priorityKey)
                  return (
                    <tr key={row.id}>
                      <td className="fw-medium">{row.taskNo}</td>
                      <td>{row.title}</td>
                      <td>{row.assigneeName || '—'}</td>
                      <td>{formatDate(row.startDate)}</td>
                      <td>{formatDate(row.endDate)}</td>
                      <td>
                        <span className={`badge ${prio.className}`}>{prio.label}</span>
                      </td>
                      <td>
                        <span className={`badge ${status.className}`}>{status.label}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px', minWidth: '4rem' }}>
                            <div className="progress-bar" style={{ width: `${row.progressPercent}%` }} />
                          </div>
                          <span className="small">{row.progressPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal fade" id="modalYeniGorev" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-checklist me-2 text-primary" />
                Yeni Görev
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              {createError && <div className="alert alert-danger py-2">{createError}</div>}
              <div className="mb-3">
                <label className="form-label">Görev Başlığı</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Görev başlığı"
                />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Bitiş Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Atanan Kişi</label>
                <input
                  type="text"
                  className="form-control"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Öncelik</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
                İptal
              </button>
              <button type="button" className="btn btn-primary" disabled={creating} onClick={handleCreate}>
                {creating ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
