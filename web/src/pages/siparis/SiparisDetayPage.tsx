import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  approveOrder,
  convertOrderToDeliveryNote,
  convertOrderToInvoice,
  deleteOrder,
  fetchOrder,
  type OrdOrderDetail,
} from '../../api/ord'
import SiparisConvertModal from '../../components/siparis/SiparisConvertModal'
import AuditInfoPanel from '../../components/ui/AuditInfoPanel'
import { apiErrorMessage } from '../../utils/apiError'
import { formatDate, formatMoneyOptional, formatQuantity, formatTry, orderStatusBadge } from '../../utils/format'

function openModal(id: string) {
  const el = document.getElementById(id)
  if (!el || !window.bootstrap) return
  window.bootstrap.Modal.getOrCreateInstance(el).show()
}

function closeModal(id: string) {
  const el = document.getElementById(id)
  if (!el || !window.bootstrap) return
  window.bootstrap.Modal.getOrCreateInstance(el).hide()
}

export default function SiparisDetayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const orderId = Number(id)
  const [item, setItem] = useState<OrdOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [convertError, setConvertError] = useState('')
  const [acting, setActing] = useState(false)
  const [convertMode, setConvertMode] = useState<'invoice' | 'delivery-note' | null>(null)

  const loadItem = useCallback(() => {
    if (!orderId) return
    setLoading(true)
    setError('')
    fetchOrder(orderId)
      .then(setItem)
      .catch(() => setError('Sipariş detayı yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [orderId])

  useEffect(() => {
    loadItem()
  }, [loadItem])

  async function handleApprove() {
    if (!item) return
    setActing(true)
    setError('')
    try {
      const updated = await approveOrder(item.id)
      setItem(updated)
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Sipariş onaylanamadı.'))
    } finally {
      setActing(false)
    }
  }

  function openConvertModal(mode: 'invoice' | 'delivery-note') {
    setConvertMode(mode)
    setConvertError('')
    openModal('modalSiparisConvert')
  }

  async function handleConvertSubmit(lines: Array<{ lineId: number; quantity: number }>) {
    if (!item || !convertMode) return
    setActing(true)
    setConvertError('')
    try {
      const body = { lines }
      if (convertMode === 'delivery-note') {
        const result = await convertOrderToDeliveryNote(item.id, body)
        closeModal('modalSiparisConvert')
        navigate(`/irsaliye/${result.deliveryNoteId}`)
      } else {
        const result = await convertOrderToInvoice(item.id, body)
        closeModal('modalSiparisConvert')
        navigate(`/fatura/onizleme/${result.invoiceId}`)
      }
    } catch (err: unknown) {
      setConvertError(apiErrorMessage(err, 'Dönüştürme başarısız.'))
    } finally {
      setActing(false)
    }
  }

  async function handleDelete() {
    if (!item || !window.confirm(`${item.documentNo} siparişi silinsin mi?`)) return
    setActing(true)
    setError('')
    try {
      await deleteOrder(item.id)
      navigate('/siparis')
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Sipariş silinemedi.'))
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
        <Link to="/siparis" className="btn btn-label-secondary">Listeye Dön</Link>
      </div>
    )
  }

  const badge = orderStatusBadge(item.statusKey)
  const canApprove = item.statusKey === 'beklemede'
  const canConvert = item.statusKey === 'onaylandi' || item.statusKey === 'onayli' || item.statusKey === 'kismi'

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Sipariş Detayı</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Ana Sayfa</Link></li>
              <li className="breadcrumb-item"><Link to="/siparis">Sipariş</Link></li>
              <li className="breadcrumb-item active">{item.documentNo}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {canApprove && (
            <button type="button" className="btn btn-label-success" disabled={acting} onClick={handleApprove}>
              Onayla
            </button>
          )}
          {canConvert && (
            <>
              <button type="button" className="btn btn-label-primary" disabled={acting} onClick={() => openConvertModal('delivery-note')}>
                İrsaliyeye Dönüştür
              </button>
              <button type="button" className="btn btn-label-success" disabled={acting} onClick={() => openConvertModal('invoice')}>
                Faturaya Dönüştür
              </button>
            </>
          )}
          <button type="button" className="btn btn-label-danger" disabled={acting} onClick={handleDelete}>
            Sil
          </button>
          <Link to="/siparis" className="btn btn-label-secondary">Listeye Dön</Link>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card mb-4">
        <div className="card-body row g-3">
          <div className="col-md-3"><div className="text-body-secondary small">Sipariş No</div><div className="fw-medium">{item.documentNo}</div></div>
          <div className="col-md-3"><div className="text-body-secondary small">Cari</div><div>{item.accountTitle}</div></div>
          <div className="col-md-2"><div className="text-body-secondary small">Tip</div><div>{item.orderType === 'SALES' ? 'Satış' : 'Alış'}</div></div>
          <div className="col-md-2"><div className="text-body-secondary small">Tarih</div><div>{formatDate(item.documentDate)}</div></div>
          <div className="col-md-2"><div className="text-body-secondary small">Durum</div><span className={`badge ${badge.className}`}>{badge.label}</span></div>
          {item.deliveryDate && (
            <div className="col-md-3"><div className="text-body-secondary small">Teslim Tarihi</div><div>{formatDate(item.deliveryDate)}</div></div>
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
              <tr>
                <th>#</th>
                <th>Açıklama</th>
                <th>Miktar</th>
                <th>Teslim</th>
                <th>Fatura</th>
                <th>Birim Fiyat</th>
                <th>KDV</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {item.lines.map((line) => (
                <tr key={line.lineNo}>
                  <td>{line.lineNo}</td>
                  <td>{line.description}</td>
                  <td>{formatQuantity(line.quantity)} {line.unitName}</td>
                  <td>{formatQuantity(line.deliveredQuantity)}</td>
                  <td>{formatQuantity(line.invoicedQuantity)}</td>
                  <td>{formatMoneyOptional(line.unitPrice)}</td>
                  <td>{formatMoneyOptional(line.taxAmount)}</td>
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

      <AuditInfoPanel audit={item.audit} />

      <SiparisConvertModal
        modalId="modalSiparisConvert"
        mode={convertMode}
        order={item}
        acting={acting}
        error={convertError}
        onSubmit={handleConvertSubmit}
      />
    </div>
  )
}
