import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createSvcTechnician,
  deleteSvcTechnician,
  fetchSvcTechnicians,
  updateSvcTechnician,
  type SvcTechnician,
  type UpsertSvcTechnicianRequest,
} from '../../api/svc'
import { apiErrorMessage } from '../../utils/apiError'
import { useToast } from '../../context/ToastContext'

const emptyForm: UpsertSvcTechnicianRequest = {
  code: '',
  name: '',
  phone: '',
  isActive: true,
  sortOrder: 0,
}

export default function TeknisyenTanimPage() {
  const toast = useToast()
  const [items, setItems] = useState<SvcTechnician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UpsertSvcTechnicianRequest>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchSvcTechnicians(true)
      .then(setItems)
      .catch(() => setError('Teknisyen listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  function startCreate() {
    setEditingId(0)
    setForm(emptyForm)
  }

  function startEdit(row: SvcTechnician) {
    setEditingId(row.id)
    setForm({
      code: row.code,
      name: row.name,
      phone: row.phone ?? '',
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId && editingId > 0) {
        await updateSvcTechnician(editingId, form)
        toast.success('Güncellendi', form.name)
      } else {
        await createSvcTechnician(form)
        toast.success('Eklendi', form.name)
      }
      cancelEdit()
      loadItems()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Kayıt başarısız.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row: SvcTechnician) {
    if (!window.confirm(`${row.name} silinsin mi?`)) return
    setError('')
    try {
      await deleteSvcTechnician(row.id)
      toast.success('Silindi', row.name)
      loadItems()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Silinemedi.'))
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Teknisyen Tanımları</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/servis">Servis</Link>
              </li>
              <li className="breadcrumb-item active">Teknisyen Tanımları</li>
            </ol>
          </nav>
        </div>
        <button type="button" className="btn btn-primary" onClick={startCreate}>
          <i className="ti ti-plus me-1" /> Yeni Teknisyen
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {editingId !== null && (
        <div className="card mb-4">
          <div className="card-header">{editingId > 0 ? 'Teknisyen Düzenle' : 'Yeni Teknisyen'}</div>
          <form className="card-body" onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-2">
                <label className="form-label">Kod</label>
                <input
                  className="form-control"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Ad Soyad</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Telefon</label>
                <input
                  className="form-control"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="col-md-1">
                <label className="form-label">Sıra</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.sortOrder ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="techActive"
                    checked={form.isActive ?? true}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="techActive">
                    Aktif
                  </label>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button type="button" className="btn btn-label-secondary" onClick={cancelEdit}>
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Kod</th>
                <th>Ad</th>
                <th>Telefon</th>
                <th>Sıra</th>
                <th>Durum</th>
                <th className="text-end">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Kayıt yok.
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-medium">{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.phone || '—'}</td>
                    <td>{row.sortOrder}</td>
                    <td>
                      <span className={`badge ${row.isActive ? 'bg-label-success' : 'bg-label-secondary'}`}>
                        {row.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-label-primary me-1" onClick={() => startEdit(row)}>
                        Düzenle
                      </button>
                      <button type="button" className="btn btn-sm btn-label-danger" onClick={() => handleDelete(row)}>
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
