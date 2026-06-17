import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWarehouses } from '../../api/cfg'
import { fetchStkMovements, type StkStockMovementListItem } from '../../api/stk'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDateTime, formatQuantity } from '../../utils/format'

function monthStartIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(';'), ...rows.map((r) => r.map(escape).join(';'))]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function StokHareketRaporPage() {
  const [items, setItems] = useState<StkStockMovementListItem[]>([])
  const [warehouses, setWarehouses] = useState<Awaited<ReturnType<typeof fetchWarehouses>>>([])
  const [warehouseId, setWarehouseId] = useState<number | ''>('')
  const [movementType, setMovementType] = useState('')
  const [dateFrom, setDateFrom] = useState(monthStartIso())
  const [dateTo, setDateTo] = useState(todayIso())
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchStkMovements({
      warehouseId: warehouseId === '' ? undefined : Number(warehouseId),
      movementType: movementType || undefined,
      dateFrom,
      dateTo,
    })
      .then(setItems)
      .catch(() => setError('Stok hareket raporu yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [warehouseId, movementType, dateFrom, dateTo])

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
      [row.itemCode, row.itemName, row.description, row.warehouseName, row.movementTypeLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [items, tableSearch])

  const summary = useMemo(() => {
    let inQty = 0
    let outQty = 0
    for (const row of filteredItems) {
      if (row.movementType === 'IN') inQty += row.quantity
      else if (row.movementType === 'OUT') outQty += row.quantity
    }
    return { inQty, outQty, count: filteredItems.length }
  }, [filteredItems])

  function handleExport() {
    downloadCsv(
      `stok-hareket-raporu-${todayIso()}.csv`,
      ['Tarih', 'Stok Kodu', 'Ürün', 'Depo', 'İşlem', 'Miktar', 'Birim', 'Açıklama'],
      filteredItems.map((r) => [
        r.movementDate,
        r.itemCode,
        r.itemName,
        r.warehouseName,
        r.movementTypeLabel,
        String(r.quantity),
        r.unitName,
        r.description ?? '',
      ]),
    )
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Stok Hareket Raporu</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Stok Hareket Raporu</li>
            </ol>
          </nav>
        </div>
        <button type="button" className="btn btn-label-primary" onClick={handleExport} disabled={loading}>
          <i className="ti ti-download me-1" /> Excel (CSV)
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-body-secondary small">Kayıt</div>
              <div className="h4 mb-0">{summary.count}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-body-secondary small">Toplam Giriş</div>
              <div className="h4 mb-0 text-success">{formatQuantity(summary.inQty)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-body-secondary small">Toplam Çıkış</div>
              <div className="h4 mb-0 text-danger">{formatQuantity(summary.outQty)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Hareketler</span>
          <div className="d-flex flex-wrap gap-2">
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <select
              className="form-select form-select-sm"
              style={{ minWidth: '10rem' }}
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
            <select
              className="form-select form-select-sm"
              style={{ minWidth: '9rem' }}
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
            >
              <option value="">Tüm işlemler</option>
              <option value="IN">Giriş</option>
              <option value="OUT">Çıkış</option>
              <option value="TRANSFER">Transfer</option>
              <option value="ADJUSTMENT">Sayım</option>
            </select>
          </div>
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
