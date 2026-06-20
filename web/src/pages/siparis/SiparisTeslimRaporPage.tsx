import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCariAccounts, type CariAccountListItem } from '../../api/cari'
import { fetchOrderDeliveryReport, type OrdDeliveryReportItem } from '../../api/ord'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDate, formatMoneyOptional, formatQuantity, orderStatusBadge } from '../../utils/format'

export default function SiparisTeslimRaporPage() {
  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [selectedCariId, setSelectedCariId] = useState<number | ''>('')
  const [items, setItems] = useState<OrdDeliveryReportItem[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCariAccounts()
      .then(setCariler)
      .catch(() => setError('Cari listesi yüklenemedi.'))
  }, [])

  useEffect(() => {
    if (!selectedCariId) {
      setItems([])
      return
    }

    setLoading(true)
    setError('')
    fetchOrderDeliveryReport(Number(selectedCariId))
      .then(setItems)
      .catch(() => setError('Teslim raporu yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [selectedCariId])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => [row.documentNo, row.orderType].join(' ').toLowerCase().includes(q))
  }, [items, tableSearch])

  const selectedCari = cariler.find((c) => c.id === selectedCariId)

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Sipariş Teslim Raporu</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/siparis">Sipariş</Link>
              </li>
              <li className="breadcrumb-item active">Teslim Raporu</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label">Cari Hesap</label>
            <select
              className="form-select"
              value={selectedCariId}
              onChange={(e) => setSelectedCariId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Cari seçin...</option>
              {cariler.map((cari) => (
                <option key={cari.id} value={cari.id}>
                  {cari.code} — {cari.title}
                </option>
              ))}
            </select>
          </div>
          {selectedCari && (
            <div className="col-md-6">
              <div className="text-body-secondary small">Seçili Cari</div>
              <div className="fw-medium">{selectedCari.title}</div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <TableSearchToolbar placeholder="Sipariş ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Sipariş No</th>
                <th>Tip</th>
                <th>Tarih</th>
                <th>Teslim Tarihi</th>
                <th>Toplam Miktar</th>
                <th>Teslim Edilen</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {!selectedCariId && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Rapor için cari hesap seçin.
                  </td>
                </tr>
              )}
              {selectedCariId && loading && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {selectedCariId && !loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {selectedCariId &&
                !loading &&
                filteredItems.map((row) => {
                  const badge = orderStatusBadge(row.statusKey)
                  return (
                    <tr key={row.id}>
                      <td className="fw-medium">
                        <Link to={`/siparis/${row.id}`}>{row.documentNo}</Link>
                      </td>
                      <td>{row.orderType === 'SALES' ? 'Satış' : 'Alış'}</td>
                      <td>{formatDate(row.documentDate)}</td>
                      <td>{formatDate(row.deliveryDate)}</td>
                      <td>{formatQuantity(row.totalQuantity)}</td>
                      <td>{formatQuantity(row.deliveredQuantity)}</td>
                      <td>{formatMoneyOptional(row.grandTotal)}</td>
                      <td>
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
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
