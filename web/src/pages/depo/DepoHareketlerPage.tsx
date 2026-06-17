import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchWarehouses } from '../../api/cfg'
import { fetchStkMovements, type StkStockMovementListItem } from '../../api/stk'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDateTime, formatQuantity } from '../../utils/format'

export default function DepoHareketlerPage() {
  const [searchParams] = useSearchParams()
  const initialItemId = Number(searchParams.get('itemId') || '') || ''
  const [items, setItems] = useState<StkStockMovementListItem[]>([])
  const [warehouses, setWarehouses] = useState<Awaited<ReturnType<typeof fetchWarehouses>>>([])
  const [warehouseId, setWarehouseId] = useState<number | ''>('')
  const [itemId] = useState<number | ''>(initialItemId)
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchStkMovements({
      warehouseId: warehouseId === '' ? undefined : Number(warehouseId),
      itemId: itemId === '' ? undefined : Number(itemId),
    })
      .then(setItems)
      .catch(() => setError('Stok hareketleri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [warehouseId, itemId])

  useEffect(() => {
    fetchWarehouses().then(setWarehouses).catch(() => undefined)
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) =>
      [row.itemCode, row.itemName, row.description, row.warehouseName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [items, tableSearch])

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Stok Hareketleri</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/depo">Depo</Link>
              </li>
              <li className="breadcrumb-item active">Hareketler</li>
            </ol>
          </nav>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Stok hareketleri</span>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: '14rem' }}
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Tüm depolar</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <TableSearchToolbar placeholder="Stok veya açıklama ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover datatables-ajax mb-0">
            <thead className="border-top">
              <tr>
                <th>Tarih</th>
                <th>Stok Kodu</th>
                <th>Ürün</th>
                <th>Depo</th>
                <th>İşlem</th>
                <th className="text-end">Miktar</th>
                <th>Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTime(row.movementDate)}</td>
                    <td className="font-mono">{row.itemCode}</td>
                    <td>{row.itemName}</td>
                    <td>{row.warehouseName}</td>
                    <td>
                      <span
                        className={`badge ${row.movementType === 'IN' ? 'bg-label-success' : row.movementType === 'OUT' ? 'bg-label-danger' : 'bg-label-info'}`}
                      >
                        {row.movementTypeLabel}
                      </span>
                    </td>
                    <td className="text-end">
                      {formatQuantity(row.quantity)} {row.unitName}
                    </td>
                    <td>{row.description ?? '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
