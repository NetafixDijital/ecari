import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchUnits, fetchTaxRates, type LookupItem, type TaxRate } from '../../api/core'
import {
  createStkItem,
  deleteStkItem,
  fetchStkItem,
  fetchStkItems,
  updateStkItem,
  type CreateStkItemRequest,
  type StkItemDetail,
  type StkItemListItem,
  type UpdateStkItemRequest,
} from '../../api/stk'
import IconActionButton from '../../components/ui/IconActionButton'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatMoneyOptional, formatQuantity, statusBadge } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'
import StokListModals from './StokListModals'
import StokMovementModal, { closeStokMovementModal, openStokMovementModal } from './StokMovementModal'

export default function StokListPage() {
  const toast = useToast()
  const [items, setItems] = useState<StkItemListItem[]>([])
  const [units, setUnits] = useState<LookupItem[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [editItem, setEditItem] = useState<StkItemDetail | null>(null)
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [movementItem, setMovementItem] = useState<StkItemListItem | null>(null)

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchStkItems()
      .then(setItems)
      .catch(() => setError('Stok listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadItems()
    fetchUnits().then(setUnits).catch(() => undefined)
    fetchTaxRates().then(setTaxRates).catch(() => undefined)
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [row.code, row.name, row.barcode, row.brandName, row.baseUnitName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  const handleSearch = useCallback((query: string) => {
    setTableSearch(query)
  }, [])

  async function handleCreate(body: CreateStkItemRequest) {
    setCreating(true)
    setCreateError('')
    try {
      await createStkItem(body)
      toast.success('Kayıt oluşturuldu', 'Stok kartı eklendi.')
      loadItems()
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Stok kaydı oluşturulamadı.')
      setCreateError(message)
      toast.error('Kayıt başarısız', message)
      throw err
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(body: UpdateStkItemRequest) {
    if (!editItem) return
    setUpdating(true)
    setUpdateError('')
    try {
      await updateStkItem(editItem.id, body)
      toast.success('Güncellendi', 'Stok bilgileri kaydedildi.')
      loadItems()
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Stok güncellenemedi.')
      setUpdateError(message)
      toast.error('Kayıt başarısız', message)
      throw err
    } finally {
      setUpdating(false)
    }
  }

  async function handleEdit(row: StkItemListItem) {
    setUpdateError('')
    try {
      const detail = await fetchStkItem(row.id)
      setEditItem(detail)
    } catch {
      toast.error('Yükleme başarısız', 'Stok detayı yüklenemedi.')
    }
  }

  async function handleDelete(row: StkItemListItem) {
    if (!window.confirm(`"${row.name}" stok kartını silmek istediğinize emin misiniz?`)) return
    setDeletingId(row.id)
    try {
      await deleteStkItem(row.id)
      toast.success('Silindi', `"${row.name}" stok kartı kaldırıldı.`)
      loadItems()
    } catch (err: unknown) {
      toast.error('Silme başarısız', apiErrorMessage(err, 'Stok silinemedi.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <h4 className="mb-0">Stok Listesi</h4>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <button type="button" className="btn btn-label-secondary" data-bs-toggle="modal" data-bs-target="#modalExcelStok">
            <i className="ti ti-file-spreadsheet me-1" /> Excel&apos;den Aktar
          </button>
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalYeniStok">
            <i className="ti ti-plus me-1" /> Yeni Stok
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <TableSearchToolbar placeholder="Stok ara..." onSearch={handleSearch} />
        <div className="table-responsive">
          <table className="table table-hover datatables-ajax mb-0">
            <thead className="border-top">
              <tr>
                <th>Stok Kodu</th>
                <th>Ürün Adı</th>
                <th>Birim</th>
                <th>Miktar</th>
                <th>Alış</th>
                <th>Satış</th>
                <th>Durum</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Yükleniyor…
                  </td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    {tableSearch ? 'Arama kriterine uygun kayıt bulunamadı.' : 'Kayıt bulunamadı.'}
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((row) => {
                  const badge = statusBadge(row.stockStatus)
                  return (
                    <tr key={row.id}>
                      <td className="font-mono">{row.code}</td>
                      <td>{row.name}</td>
                      <td>{row.baseUnitName}</td>
                      <td>{formatQuantity(row.stockQuantity)}</td>
                      <td className="text-end amount">{formatMoneyOptional(row.purchasePrice)}</td>
                      <td className="text-end amount">{formatMoneyOptional(row.salesPrice)}</td>
                      <td>
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <IconActionButton icon="ti-edit" color="primary" title="Düzenle" onClick={() => handleEdit(row)} />
                          <IconActionButton
                            icon="ti-arrows-exchange"
                            color="warning"
                            title="Stok Hareketi"
                            onClick={() => openStokMovementModal(row, setMovementItem)}
                          />
                          <Link to={`/depo/hareketler?itemId=${row.id}`} className="btn btn-icon btn-sm btn-label-info" title="Hareket Geçmişi">
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
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      <StokListModals
        units={units}
        taxRates={taxRates}
        editItem={editItem}
        onEditClose={() => setEditItem(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        creating={creating}
        updating={updating}
        createError={createError}
        updateError={updateError}
      />
      <StokMovementModal
        item={movementItem}
        onSaved={() => {
          closeStokMovementModal()
          setMovementItem(null)
          toast.success('Kayıt oluşturuldu', 'Stok hareketi kaydedildi.')
          loadItems()
        }}
      />
    </div>
  )
}
