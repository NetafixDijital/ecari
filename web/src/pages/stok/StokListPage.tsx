import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchUnits, type LookupItem } from '../../api/core'
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
import StokListModals from './StokListModals'

export default function StokListPage() {
  const [items, setItems] = useState<StkItemListItem[]>([])
  const [units, setUnits] = useState<LookupItem[]>([])
  const [editItem, setEditItem] = useState<StkItemDetail | null>(null)
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

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
      loadItems()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Stok kaydı oluşturulamadı.'
      setCreateError(message)
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
      loadItems()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Stok güncellenemedi.'
      setUpdateError(message)
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
      window.alert('Stok detayı yüklenemedi.')
    }
  }

  async function handleDelete(row: StkItemListItem) {
    if (!window.confirm(`"${row.name}" stok kartını silmek istediğinize emin misiniz?`)) return
    setDeletingId(row.id)
    try {
      await deleteStkItem(row.id)
      loadItems()
    } catch {
      window.alert('Stok silinemedi.')
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
                            icon="ti-history"
                            color="info"
                            title="Hareketler"
                            onClick={() => window.alert('Depo hareketleri fatura modülü ile eklenecek.')}
                          />
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
        editItem={editItem}
        onEditClose={() => setEditItem(null)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        creating={creating}
        updating={updating}
        createError={createError}
        updateError={updateError}
      />
    </div>
  )
}
