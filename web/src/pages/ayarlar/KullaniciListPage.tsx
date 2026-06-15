import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteAuthUser, fetchAuthUsers, type AuthUserListItem } from '../../api/authUsers'
import { useToast } from '../../context/ToastContext'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDate } from '../../utils/format'

export default function KullaniciListPage() {
  const toast = useToast()
  const [items, setItems] = useState<AuthUserListItem[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchAuthUsers()
      .then(setItems)
      .catch(() => setError('Kullanıcı listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [row.fullName, row.email, row.phone ?? '', row.permissionSummary].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`"${name}" kullanıcısını silmek istediğinize emin misiniz?`)) return
    setDeletingId(id)
    setError('')
    try {
      await deleteAuthUser(id)
      toast.success('Silindi', `"${name}" kullanıcısı kaldırıldı.`)
      loadItems()
    } catch {
      const msg = 'Kullanıcı silinemedi.'
      setError(msg)
      toast.error('Silme başarısız', msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Kullanıcılar</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Ana Sayfa</Link></li>
              <li className="breadcrumb-item"><Link to="/ayarlar">Ayarlar</Link></li>
              <li className="breadcrumb-item active">Kullanıcılar</li>
            </ol>
          </nav>
        </div>
        <Link to="/ayarlar/kullanicilar/yeni" className="btn btn-primary">
          <i className="ti ti-plus me-1" /> Yeni Kullanıcı
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <div className="card-header">Kullanıcı Listesi</div>
        <TableSearchToolbar placeholder="Ad, e-posta ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>İzinler</th>
                <th>Durum</th>
                <th>Oluşturulma</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center text-body-secondary py-4">Yükleniyor...</td></tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr><td colSpan={7} className="text-center text-body-secondary py-4">Kayıt bulunamadı.</td></tr>
              )}
              {!loading && filteredItems.map((row) => (
                <tr key={row.id}>
                  <td>{row.fullName}</td>
                  <td>{row.email}</td>
                  <td>{row.phone ?? '—'}</td>
                  <td className="text-truncate" style={{ maxWidth: 220 }}>{row.permissionSummary || '—'}</td>
                  <td>
                    <span className={`badge bg-label-${row.isActive ? 'success' : 'secondary'}`}>
                      {row.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td className="text-end text-nowrap">
                    <Link to={`/ayarlar/kullanicilar/${row.id}`} className="btn btn-sm btn-icon btn-label-primary me-1">
                      <i className="ti ti-edit" />
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-icon btn-label-danger"
                      disabled={deletingId === row.id}
                      onClick={() => handleDelete(row.id, row.fullName)}
                    >
                      <i className="ti ti-trash" />
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
