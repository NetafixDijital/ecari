import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWarehouses, type Warehouse } from '../../api/cfg'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'

export default function DepoListPage() {
  const [items, setItems] = useState<Warehouse[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div className="app-page-content">
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <h4 className="mb-0">Depo Listesi</h4>
        <Link to="/depo/hareketler" className="btn btn-label-secondary">
          <i className="ti ti-arrows-exchange me-1" /> Stok Hareketleri
        </Link>
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
                    <td>{row.address || '—'}</td>
                    <td>{row.isDefault ? <span className="badge bg-label-primary">Evet</span> : '—'}</td>
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
    </div>
  )
}
