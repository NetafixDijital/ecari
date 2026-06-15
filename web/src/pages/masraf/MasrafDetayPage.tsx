import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchExpense, payExpense, updateExpenseStatus, type ExpExpenseDetail } from '../../api/exp'
import { apiErrorMessage } from '../../utils/apiError'
import { expenseStatusBadge, formatDate, formatMoneyOptional, formatQuantity, formatTry } from '../../utils/format'

export default function MasrafDetayPage() {
  const { id } = useParams()
  const expenseId = Number(id)
  const [item, setItem] = useState<ExpExpenseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)

  const loadItem = useCallback(() => {
    if (!expenseId) return
    setLoading(true)
    setError('')
    fetchExpense(expenseId)
      .then(setItem)
      .catch(() => setError('Masraf detayı yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [expenseId])

  useEffect(() => {
    loadItem()
  }, [loadItem])

  async function handleApprove() {
    if (!item) return
    setActing(true)
    setError('')
    try {
      setItem(await updateExpenseStatus(item.id, 'approve'))
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Masraf onaylanamadı.'))
    } finally {
      setActing(false)
    }
  }

  async function handleReject() {
    if (!item || !window.confirm('Masraf reddedilsin mi?')) return
    setActing(true)
    setError('')
    try {
      setItem(await updateExpenseStatus(item.id, 'reject'))
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Masraf reddedilemedi.'))
    } finally {
      setActing(false)
    }
  }

  async function handlePay() {
    if (!item || !window.confirm('Masraf ödemesi yapılsın ve alış faturası oluşturulsun mu?')) return
    setActing(true)
    setError('')
    try {
      setItem(await payExpense(item.id))
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Masraf ödenemedi.'))
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return <div className="app-page-content"><p className="text-body-secondary">Yükleniyor...</p></div>
  }

  if (!item) {
    return (
      <div className="app-page-content">
        <div className="alert alert-danger">{error || 'Kayıt bulunamadı.'}</div>
        <Link to="/masraf" className="btn btn-label-secondary">Listeye Dön</Link>
      </div>
    )
  }

  const badge = expenseStatusBadge(item.statusKey)

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Masraf Detayı</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Ana Sayfa</Link></li>
              <li className="breadcrumb-item"><Link to="/masraf">Masraf</Link></li>
              <li className="breadcrumb-item active">{item.documentNo}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {item.statusKey === 'onay_bekliyor' && (
            <>
              <button type="button" className="btn btn-success" disabled={acting} onClick={handleApprove}>
                Onayla
              </button>
              <button type="button" className="btn btn-danger" disabled={acting} onClick={handleReject}>
                Reddet
              </button>
            </>
          )}
          {(item.statusKey === 'onaylandi' || item.statusKey === 'onay_bekliyor') && !item.purchaseInvoiceId && (
            <button type="button" className="btn btn-primary" disabled={acting} onClick={handlePay}>
              Öde
            </button>
          )}
          <Link to="/masraf" className="btn btn-label-secondary">Listeye Dön</Link>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card mb-4">
        <div className="card-body row g-3">
          <div className="col-md-3"><div className="text-body-secondary small">Belge No</div><div className="fw-medium">{item.documentNo}</div></div>
          <div className="col-md-3"><div className="text-body-secondary small">Cari</div><div>{item.accountTitle}</div></div>
          <div className="col-md-2"><div className="text-body-secondary small">Tarih</div><div>{formatDate(item.expenseDate)}</div></div>
          <div className="col-md-2"><div className="text-body-secondary small">Ödeme</div><div>{item.paymentMethodLabel}</div></div>
          <div className="col-md-2"><div className="text-body-secondary small">Durum</div><span className={`badge ${badge.className}`}>{badge.label}</span></div>
          {item.purchaseInvoiceId && (
            <div className="col-12">
              <Link to={`/fatura/onizleme/${item.purchaseInvoiceId}`} className="badge bg-label-info text-decoration-none">
                Alış Faturası #{item.purchaseInvoiceId}
              </Link>
            </div>
          )}
          {item.notes && (
            <div className="col-12"><div className="text-body-secondary small">Not</div><div>{item.notes}</div></div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">Kalemler</div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr><th>#</th><th>Tip</th><th>Hizmet</th><th>Açıklama</th><th>Miktar</th><th>Tutar</th></tr>
            </thead>
            <tbody>
              {item.lines.map((line) => (
                <tr key={line.lineNo}>
                  <td>{line.lineNo}</td>
                  <td>{line.lineType === 'URUN' ? 'Ürün' : 'Hizmet'}</td>
                  <td>{line.serviceName || '—'}</td>
                  <td>{line.description}</td>
                  <td>{formatQuantity(line.quantity)} {line.unitName}</td>
                  <td>{formatTry(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-body text-end">
          <p className="mb-1">Ara Toplam: <strong>{formatMoneyOptional(item.subtotal)}</strong></p>
          <p className="mb-1">KDV: <strong>{formatMoneyOptional(item.taxTotal)}</strong></p>
          <h5 className="mb-0">Genel Toplam: {formatTry(item.grandTotal)}</h5>
        </div>
      </div>
    </div>
  )
}
