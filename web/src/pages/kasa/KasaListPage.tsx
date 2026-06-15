import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCshAccounts, fetchCshMovements, type CshAccountListItem, type CshTransactionListItem } from '../../api/csh'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDate, formatTry } from '../../utils/format'

export default function KasaListPage() {
  const [items, setItems] = useState<CshAccountListItem[]>([])
  const [movements, setMovements] = useState<CshTransactionListItem[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [movementSearch, setMovementSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([fetchCshAccounts(), fetchCshMovements()])
      .then(([accounts, movementRows]) => {
        setItems(accounts)
        setMovements(movementRows)
      })
      .catch(() => setError('Kasa listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => [row.code, row.name].join(' ').toLowerCase().includes(q))
  }, [items, tableSearch])

  const totalBalance = useMemo(
    () => filteredItems.reduce((sum, row) => sum + row.balance, 0),
    [filteredItems],
  )

  const filteredMovements = useMemo(() => {
    const q = movementSearch.trim().toLowerCase()
    if (!q) return movements
    return movements.filter((row) =>
      [
        row.cashAccountName,
        row.transactionTypeLabel,
        row.referenceNo,
        row.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [movements, movementSearch])

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Kasa</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Kasa</li>
            </ol>
          </nav>
        </div>
        <Link to="/kasa/gun-sonu" className="btn btn-label-secondary">
          <i className="ti ti-report me-1" /> Gün Sonu Raporu
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Toplam bakiye</p>
              <h4 className="mb-0">{formatTry(totalBalance)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Aktif kasa</p>
              <h4 className="mb-0">{items.filter((i) => i.isActive).length}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Kasa hesapları</span>
        </div>
        <TableSearchToolbar placeholder="Kasa ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Kod</th>
                <th>Kasa Adı</th>
                <th>Tip</th>
                <th>Bakiye</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-medium">{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.cashType === 'CASH' ? 'Nakit' : row.cashType}</td>
                    <td className={row.balance >= 0 ? 'text-success' : 'text-danger'}>
                      {formatTry(row.balance)}
                    </td>
                    <td>
                      <span className={`badge ${row.isActive ? 'bg-label-success' : 'bg-label-secondary'}`}>
                        {row.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Kasa hareketleri</span>
        </div>
        <TableSearchToolbar placeholder="Hareket ara..." onSearch={setMovementSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Tarih</th>
                <th>Kasa</th>
                <th>Tip</th>
                <th>Tutar</th>
                <th>Referans</th>
                <th>Açıklama</th>
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
              {!loading && filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredMovements.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.transactionDate)}</td>
                    <td>{row.cashAccountName}</td>
                    <td>{row.transactionTypeLabel}</td>
                    <td className={row.transactionType === 'IN' ? 'text-success' : 'text-danger'}>
                      {formatTry(row.amount)}
                    </td>
                    <td className="font-mono small">{row.referenceNo || '—'}</td>
                    <td>{row.description || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
