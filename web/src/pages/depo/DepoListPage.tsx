import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createWarehouse,
  deleteWarehouse,
  fetchWarehouses,
  updateWarehouse,
  type CreateWarehouseRequest,
  type UpdateWarehouseRequest,
  type Warehouse,
} from '../../api/cfg'
import IconActionButton from '../../components/ui/IconActionButton'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'

function openModal(id: string) {
  const el = document.getElementById(id)
  if (!el || !window.bootstrap) return
  window.bootstrap.Modal.getOrCreateInstance(el).show()
}

export default function DepoListPage() {
  const toast = useToast()
  const [items, setItems] = useState<Warehouse[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchWarehouses()
      .then(setItems)
      .catch(() => setError('Depo listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => [row.code, row.name, row.address].join(' ').toLowerCase().includes(q))
  }, [items, tableSearch])

  function resetForm() {
    setEditing(null)
    setCode('')
    setName('')
    setAddress('')
    setIsDefault(false)
    setIsActive(true)
    setFormError('')
  }

  function openCreateModal() {
    resetForm()
    openModal('modalDepoForm')
  }

  function openEditModal(row: Warehouse) {
    setEditing(row)
    setCode(row.code)
    setName(row.name)
    setAddress(row.address ?? '')
    setIsDefault(row.isDefault)
    setIsActive(row.isActive)
    setFormError('')
    openModal('modalDepoForm')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const body: CreateWarehouseRequest | UpdateWarehouseRequest = {
      code: code.trim(),
      name: name.trim(),
      address: address.trim() || null,
      isDefault,
      isActive,
    }
    try {
      if (editing) {
        await updateWarehouse(editing.id, body)
        toast.success('Güncellendi', 'Depo bilgileri kaydedildi.')
      } else {
        await createWarehouse(body)
        toast.success('Kayıt oluşturuldu', 'Depo eklendi.')
      }
      loadItems()
      resetForm()
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Depo kaydedilemedi.')
      setFormError(message)
      toast.error('Kayıt başarısız', message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row: Warehouse) {
    if (!window.confirm(`"${row.name}" deposunu silmek istediğinize emin misiniz?`)) return
    setDeletingId(row.id)
    try {
      await deleteWarehouse(row.id)
      toast.success('Silindi', `"${row.name}" depo kaydı kaldırıldı.`)
      loadItems()
    } catch (err: unknown) {
      toast.error('Silme başarısız', apiErrorMessage(err, 'Depo silinemedi.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <h4 className="mb-0">Depo Listesi</h4>
        <div className="d-flex gap-2">
          <Link to="/depo/hareketler" className="btn btn-label-secondary">
            <i className="ti ti-arrows-exchange me-1" /> Stok Hareketleri
          </Link>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <i className="ti ti-plus me-1" /> Yeni Depo
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <TableSearchToolbar placeholder="Depo ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Kod</th>
                <th>Depo Adı</th>
                <th>Adres</th>
                <th>Varsayılan</th>
                <th>Durum</th>
                <th className="text-center">İşlemler</th>
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
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-medium">{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.address || '—'}</td>
                    <td>{row.isDefault ? <span className="badge bg-label-primary">Evet</span> : '—'}</td>
                    <td>
                      <span className={`badge ${row.isActive ? 'bg-label-success' : 'bg-label-secondary'}`}>
                        {row.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1">
                        <IconActionButton icon="ti-edit" color="primary" title="Düzenle" onClick={() => openEditModal(row)} />
                        <Link to={`/depo/hareketler?warehouseId=${row.id}`} className="btn btn-icon btn-sm btn-label-info" title="Hareketler">
                          <i className="ti ti-history" />
                        </Link>
                        <IconActionButton
                          icon="ti-trash"
                          color="danger"
                          title="Sil"
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal fade nl-modal-form" id="modalDepoForm" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <div className="pe-3">
                  <h5 className="modal-title">{editing ? 'Depo Düzenle' : 'Yeni Depo'}</h5>
                </div>
                <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Kapat" onClick={resetForm} />
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Depo Kodu</label>
                  <input className="form-control" value={code} onChange={(e) => setCode(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Depo Adı</label>
                  <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Adres</label>
                  <textarea className="form-control" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="depoDefault" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                  <label className="form-check-label" htmlFor="depoDefault">Varsayılan depo</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="depoActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <label className="form-check-label" htmlFor="depoActive">Aktif</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal" onClick={resetForm}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
