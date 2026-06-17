import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTaxRates, type TaxRate } from '../../api/core'
import {
  createSvcService,
  deleteSvcService,
  fetchSvcServices,
  updateSvcService,
  type SvcServiceDefinition,
  type UpsertSvcServiceDefinitionRequest,
} from '../../api/svc'
import { apiErrorMessage } from '../../utils/apiError'
import { useToast } from '../../context/ToastContext'

const emptyForm: UpsertSvcServiceDefinitionRequest = {
  code: '',
  name: '',
  defaultTaxRateId: null,
  isActive: true,
  sortOrder: 0,
}

export default function HizmetTanimPage() {
  const toast = useToast()
  const [items, setItems] = useState<SvcServiceDefinition[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UpsertSvcServiceDefinitionRequest>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([fetchSvcServices(true), fetchTaxRates()])
      .then(([serviceData, taxData]) => {
        setItems(serviceData)
        setTaxRates(taxData)
      })
      .catch(() => setError('Hizmet listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  function startCreate() {
    setEditingId(0)
    setForm({
      ...emptyForm,
      defaultTaxRateId: taxRates.find((t) => t.rate === 20)?.id ?? taxRates[0]?.id ?? null,
    })
  }

  function startEdit(row: SvcServiceDefinition) {
    setEditingId(row.id)
    setForm({
      code: row.code,
      name: row.name,
      defaultTaxRateId: row.defaultTaxRateId,
      isActive: row.isActive ?? true,
      sortOrder: row.sortOrder ?? 0,
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
        await updateSvcService(editingId, form)
        toast.success('Güncellendi', form.name)
      } else {
        await createSvcService(form)
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

  async function handleDelete(row: SvcServiceDefinition) {
    if (!window.confirm(`${row.name} silinsin mi?`)) return
    setError('')
    try {
      await deleteSvcService(row.id)
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
          <h4 className="mb-1">Hizmet Tanımları</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/servis">Servis</Link>
              </li>
              <li className="breadcrumb-item active">Hizmet Tanımları</li>
            </ol>
          </nav>
        </div>
        <button type="button" className="btn btn-primary" onClick={startCreate}>
          <i className="ti ti-plus me-1" /> Yeni Hizmet
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {editingId !== null && (
        <div className="card mb-4">
          <div className="card-header">{editingId > 0 ? 'Hizmet Düzenle' : 'Yeni Hizmet'}</div>
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
                <label className="form-label">Hizmet Adı</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Varsayılan KDV</label>
                <select
                  className="form-select"
                  value={form.defaultTaxRateId ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      defaultTaxRateId: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                >
                  <option value="">Seçiniz</option>
                  {taxRates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (%{t.rate})
                    </option>
                  ))}
                </select>
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
                    id="svcActive"
                    checked={form.isActive ?? true}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="svcActive">
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
                <th>Hizmet</th>
                <th>KDV</th>
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
                items.map((row) => {
                  const tax = taxRates.find((t) => t.id === row.defaultTaxRateId)
                  return (
                    <tr key={row.id}>
                      <td className="fw-medium">{row.code}</td>
                      <td>{row.name}</td>
                      <td>{tax ? `%${tax.rate}` : '—'}</td>
                      <td>{row.sortOrder ?? 0}</td>
                      <td>
                        <span className={`badge ${row.isActive !== false ? 'bg-label-success' : 'bg-label-secondary'}`}>
                          {row.isActive !== false ? 'Aktif' : 'Pasif'}
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
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
