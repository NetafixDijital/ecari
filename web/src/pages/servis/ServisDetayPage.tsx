import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchTaxRates, fetchUnits, type LookupItem, type TaxRate } from '../../api/core'
import {
  convertSvcToInvoice,
  deleteSvcTicket,
  fetchSvcServices,
  fetchSvcTicket,
  saveSvcTicketLines,
  updateSvcTicket,
  updateSvcTicketStatus,
  type SvcServiceDefinition,
  type SvcTicketDetail,
} from '../../api/svc'
import { fetchStkItem, fetchStkItems, type StkItemListItem } from '../../api/stk'
import StokLineSearch from '../../components/stok/StokLineSearch'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'
import { formatDateTime, formatMoneyOptional, formatTry, svcStatusBadge } from '../../utils/format'

type LineDraft = {
  key: string
  serviceDefinitionId: number | ''
  itemId: number | ''
  description: string
  quantity: string
  unitId: number
  unitPrice: string
  taxRateId: number
}

function newLine(units: LookupItem[], taxRates: TaxRate[]): LineDraft {
  return {
    key: crypto.randomUUID(),
    serviceDefinitionId: '',
    itemId: '',
    description: '',
    quantity: '1',
    unitId: units[0]?.id ?? 0,
    unitPrice: '0',
    taxRateId: taxRates.find((t) => t.rate === 20)?.id ?? taxRates[0]?.id ?? 0,
  }
}

function calcLine(line: LineDraft, taxRates: TaxRate[]) {
  const qty = Number(line.quantity) || 0
  const price = Number(line.unitPrice) || 0
  const net = Math.round(qty * price * 100) / 100
  const rate = taxRates.find((t) => t.id === line.taxRateId)?.rate ?? 0
  const tax = Math.round(net * rate) / 100
  return { net, tax, total: net + tax }
}

function linesFromDetail(item: SvcTicketDetail, units: LookupItem[], taxRates: TaxRate[]): LineDraft[] {
  if (item.lines.length === 0) return [newLine(units, taxRates)]
  return item.lines.map((line) => ({
    key: crypto.randomUUID(),
    serviceDefinitionId: line.serviceDefinitionId ?? '',
    itemId: line.itemId ?? '',
    description: line.description,
    quantity: String(line.quantity),
    unitId: units.find((u) => u.name === line.unitName)?.id ?? units[0]?.id ?? 0,
    unitPrice: String(line.unitPrice),
    taxRateId: line.taxRateId,
  }))
}

export default function ServisDetayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const ticketId = Number(id)
  const [item, setItem] = useState<SvcTicketDetail | null>(null)
  const [services, setServices] = useState<SvcServiceDefinition[]>([])
  const [items, setItems] = useState<StkItemListItem[]>([])
  const [units, setUnits] = useState<LookupItem[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [lines, setLines] = useState<LineDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingLines, setSavingLines] = useState(false)
  const [converting, setConverting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'NAKIT' | 'VERESIYE'>('NAKIT')
  const [error, setError] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [problemDescription, setProblemDescription] = useState('')
  const [technicianName, setTechnicianName] = useState('')
  const [resolution, setResolution] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [stkLoadingKey, setStkLoadingKey] = useState<string | null>(null)

  const loadItem = useCallback(() => {
    if (!ticketId) return
    setLoading(true)
    setError('')
    Promise.all([
      fetchSvcTicket(ticketId),
      fetchSvcServices(),
      fetchStkItems(),
      fetchUnits(),
      fetchTaxRates(),
    ])
      .then(([ticket, svcData, stkData, unitData, taxData]) => {
        setItem(ticket)
        setServices(svcData)
        setItems(stkData)
        setUnits(unitData)
        setTaxRates(taxData)
        setLines(linesFromDetail(ticket, unitData, taxData))
        setDeviceName(ticket.deviceName ?? '')
        setProblemDescription(ticket.problemDescription)
        setTechnicianName(ticket.technicianName ?? '')
        setResolution(ticket.resolution ?? '')
        setPriority(
          ticket.priorityKey === 'dusuk'
            ? 'LOW'
            : ticket.priorityKey === 'yuksek'
              ? 'HIGH'
              : ticket.priorityKey === 'acil'
                ? 'URGENT'
                : 'NORMAL',
        )
      })
      .catch(() => setError('Servis detayı yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [ticketId])

  useEffect(() => {
    loadItem()
  }, [loadItem])

  const totals = useMemo(() => {
    let subtotal = 0
    let taxTotal = 0
    for (const line of lines) {
      const c = calcLine(line, taxRates)
      subtotal += c.net
      taxTotal += c.tax
    }
    return { subtotal, taxTotal, grandTotal: subtotal + taxTotal }
  }, [lines, taxRates])

  const isInvoiced = Boolean(item?.invoiceId)

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function handleServiceSelect(lineKey: string, serviceId: number) {
    const svc = services.find((s) => s.id === serviceId)
    if (!svc) return
    updateLine(lineKey, {
      serviceDefinitionId: serviceId,
      itemId: '',
      description: svc.name,
      taxRateId: svc.defaultTaxRateId || taxRates[0]?.id || 0,
    })
  }

  async function handleStokSelect(lineKey: string, stk: StkItemListItem) {
    setStkLoadingKey(lineKey)
    try {
      const detail = await fetchStkItem(stk.id)
      updateLine(lineKey, {
        serviceDefinitionId: '',
        itemId: stk.id,
        description: stk.name,
        unitId: detail.baseUnitId,
        unitPrice: String(detail.salesPrice ?? detail.purchasePrice ?? 0),
        taxRateId: detail.taxRateId || taxRates[0]?.id || 0,
      })
    } catch {
      setError('Stok bilgisi yüklenemedi.')
    } finally {
      setStkLoadingKey(null)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!ticketId) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateSvcTicket(ticketId, {
        deviceName: deviceName.trim() || null,
        problemDescription: problemDescription.trim(),
        technicianName: technicianName.trim() || null,
        priority,
        resolution: resolution.trim() || null,
      })
      setItem(updated)
      setLines(linesFromDetail(updated, units, taxRates))
      toast.success('Kaydedildi', 'Servis bilgileri güncellendi.')
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Kayıt güncellenemedi.')
      setError(message)
      toast.error('Kayıt başarısız', message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveLines() {
    if (!ticketId) return
    setSavingLines(true)
    setError('')
    try {
      const updated = await saveSvcTicketLines(
        ticketId,
        lines.map((line) => ({
          serviceDefinitionId: line.serviceDefinitionId === '' ? null : Number(line.serviceDefinitionId),
          itemId: line.itemId === '' ? null : Number(line.itemId),
          description: line.description.trim(),
          quantity: Number(line.quantity),
          unitId: line.unitId,
          unitPrice: Number(line.unitPrice),
          taxRateId: line.taxRateId,
        })),
      )
      setItem(updated)
      setLines(linesFromDetail(updated, units, taxRates))
      toast.success('Kaydedildi', 'Malzeme ve hizmet kalemleri güncellendi.')
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Kalemler kaydedilemedi.')
      setError(message)
      toast.error('Kayıt başarısız', message)
    } finally {
      setSavingLines(false)
    }
  }

  async function handleConvertInvoice() {
    if (!ticketId) return
    if (totals.grandTotal <= 0) {
      setError('Faturalandırma için en az bir kalem ve tutar gerekli.')
      return
    }
    setConverting(true)
    setError('')
    try {
      if (!isInvoiced && item && item.lines.length === 0) {
        await saveSvcTicketLines(
          ticketId,
          lines.map((line) => ({
            serviceDefinitionId: line.serviceDefinitionId === '' ? null : Number(line.serviceDefinitionId),
            itemId: line.itemId === '' ? null : Number(line.itemId),
            description: line.description.trim(),
            quantity: Number(line.quantity),
            unitId: line.unitId,
            unitPrice: Number(line.unitPrice),
            taxRateId: line.taxRateId,
          })),
        )
      }
      const result = await convertSvcToInvoice(ticketId, paymentMethod)
      toast.success('Fatura oluşturuldu', result.invoiceDocumentNo)
      loadItem()
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Faturaya dönüştürülemedi.')
      setError(message)
      toast.error('Faturalama başarısız', message)
    } finally {
      setConverting(false)
    }
  }

  async function handleDelete() {
    if (!ticketId || !window.confirm('Bu servis kaydı silinsin mi?')) return
    setDeleting(true)
    setError('')
    try {
      await deleteSvcTicket(ticketId)
      toast.success('Silindi', 'Servis kaydı kaldırıldı.')
      navigate('/servis')
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Kayıt silinemedi.')
      setError(message)
      toast.error('Silme başarısız', message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleStatus(status: string) {
    if (!ticketId) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateSvcTicketStatus(ticketId, status)
      setItem(updated)
      toast.success('Durum güncellendi', updated.statusLabel)
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Durum güncellenemedi.')
      setError(message)
      toast.error('Güncelleme başarısız', message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="app-page-content">
        <p className="text-body-secondary">Yükleniyor...</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="app-page-content">
        <div className="alert alert-danger">{error || 'Kayıt bulunamadı.'}</div>
        <Link to="/servis" className="btn btn-label-secondary">Listeye Dön</Link>
      </div>
    )
  }

  const badge = svcStatusBadge(item.statusKey)

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Servis Detayı</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Ana Sayfa</Link></li>
              <li className="breadcrumb-item"><Link to="/servis">Servis</Link></li>
              <li className="breadcrumb-item active">{item.ticketNo}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          {!isInvoiced && (
            <button type="button" className="btn btn-label-danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Siliniyor...' : 'Sil'}
            </button>
          )}
          <Link to="/servis" className="btn btn-label-secondary">Listeye Dön</Link>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3"><div className="text-body-secondary small">Kayıt No</div><div className="fw-medium">{item.ticketNo}</div></div>
            <div className="col-md-3"><div className="text-body-secondary small">Cari</div><div>{item.accountTitle}</div></div>
            <div className="col-md-3"><div className="text-body-secondary small">Tarih</div><div>{formatDateTime(item.ticketDate)}</div></div>
            <div className="col-md-3"><div className="text-body-secondary small">Durum</div><span className={`badge ${badge.className}`}>{badge.label}</span></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="card mb-4">
        <div className="card-header">Servis Bilgileri</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Cihaz / Ürün</label>
              <input className="form-control" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Teknisyen</label>
              <input className="form-control" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label">Problem Açıklaması</label>
              <textarea className="form-control" rows={3} value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} required />
            </div>
            <div className="col-12">
              <label className="form-label">Çözüm / Yapılan İşlem</label>
              <textarea className="form-control" rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Öncelik</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Düşük</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Yüksek</option>
                <option value="URGENT">Acil</option>
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </div>
      </form>

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Malzeme & Hizmet Kalemleri</span>
          {!isInvoiced && (
            <button type="button" className="btn btn-sm btn-label-primary" onClick={() => setLines((p) => [...p, newLine(units, taxRates)])}>
              <i className="ti ti-plus me-1" /> Satır Ekle
            </button>
          )}
        </div>
        <div className="card-body">
          {lines.map((line) => {
            const calc = calcLine(line, taxRates)
            return (
              <div key={line.key} className="border rounded p-3 mb-3">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Hizmet</label>
                    <select
                      className="form-select"
                      value={line.serviceDefinitionId}
                      disabled={isInvoiced}
                      onChange={(e) => handleServiceSelect(line.key, Number(e.target.value))}
                    >
                      <option value="">— Hizmet seç —</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Stok / Malzeme</label>
                    <StokLineSearch
                      items={items}
                      selectedId={line.itemId}
                      priceMode="sales"
                      disabled={isInvoiced || stkLoadingKey === line.key}
                      onSelect={(stk) => handleStokSelect(line.key, stk)}
                      onClear={() => updateLine(line.key, { itemId: '', serviceDefinitionId: '', description: '' })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Açıklama</label>
                    <input className="form-control" value={line.description} disabled={isInvoiced} onChange={(e) => updateLine(line.key, { description: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Miktar</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={line.quantity} disabled={isInvoiced} onChange={(e) => updateLine(line.key, { quantity: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Birim Fiyat</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={line.unitPrice} disabled={isInvoiced} onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">KDV</label>
                    <select className="form-select" value={line.taxRateId} disabled={isInvoiced} onChange={(e) => updateLine(line.key, { taxRateId: Number(e.target.value) })}>
                      {taxRates.map((t) => (
                        <option key={t.id} value={t.id}>%{t.rate}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 d-flex justify-content-between align-items-center">
                    <span className="text-body-secondary small">
                      Satır: {formatMoneyOptional(calc.net)} + KDV {formatMoneyOptional(calc.tax)} = <strong>{formatTry(calc.total)}</strong>
                    </span>
                    {!isInvoiced && lines.length > 1 && (
                      <button type="button" className="btn btn-sm btn-label-danger" onClick={() => setLines((p) => p.filter((l) => l.key !== line.key))}>Sil</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div className="d-flex justify-content-between align-items-center border-top pt-3">
            <div>
              <span className="me-3">Ara Toplam: <strong>{formatTry(totals.subtotal)}</strong></span>
              <span className="me-3">KDV: <strong>{formatTry(totals.taxTotal)}</strong></span>
              <span>Genel Toplam: <strong>{formatTry(totals.grandTotal)}</strong></span>
            </div>
            {!isInvoiced && (
              <button type="button" className="btn btn-primary" disabled={savingLines} onClick={handleSaveLines}>
                {savingLines ? 'Kaydediliyor...' : 'Kalemleri Kaydet'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">Durum Güncelle</div>
        <div className="card-body d-flex flex-wrap gap-2">
          {item.statusKey !== 'islemde' && (
            <button type="button" className="btn btn-label-info" disabled={saving} onClick={() => handleStatus('IN_PROGRESS')}>İşlemde</button>
          )}
          {item.statusKey !== 'tamamlandi' && (
            <button type="button" className="btn btn-label-success" disabled={saving} onClick={() => handleStatus('COMPLETED')}>Tamamlandı</button>
          )}
          {item.statusKey !== 'teslim' && (
            <button type="button" className="btn btn-label-primary" disabled={saving} onClick={() => handleStatus('DELIVERED')}>Teslim Edildi</button>
          )}
        </div>
      </div>

      {(item.statusKey === 'tamamlandi' || item.statusKey === 'teslim') && !item.invoiceId && (
        <div className="card">
          <div className="card-header">Satış Faturasına Dönüştür</div>
          <div className="card-body">
            <p className="text-body-secondary small mb-3">
              Kayıtlı kalemler satış faturasına aktarılır. Nakit = ödenmiş (kapalı), Veresiye = ödemesiz açık fatura.
            </p>
            <div className="mb-3">
              <label className="form-label">Ödeme Yöntemi</label>
              <div className="d-flex flex-wrap gap-2">
                <button type="button" className={`btn btn-sm ${paymentMethod === 'NAKIT' ? 'btn-primary' : 'btn-label-secondary'}`} onClick={() => setPaymentMethod('NAKIT')}>Nakit (Ödendi)</button>
                <button type="button" className={`btn btn-sm ${paymentMethod === 'VERESIYE' ? 'btn-primary' : 'btn-label-secondary'}`} onClick={() => setPaymentMethod('VERESIYE')}>Veresiye (Açık)</button>
              </div>
            </div>
            <button type="button" className="btn btn-primary" disabled={converting || totals.grandTotal <= 0} onClick={handleConvertInvoice}>
              {converting ? 'Oluşturuluyor...' : `Faturaya Dönüştür (${formatTry(totals.grandTotal)})`}
            </button>
          </div>
        </div>
      )}

      {item.invoiceId && (
        <div className="alert alert-info mt-4 mb-0">
          Bu servis kaydı faturalandırıldı.{' '}
          <Link to={`/fatura/onizleme/${item.invoiceId}`}>Satış Faturası #{item.invoiceId}</Link>
        </div>
      )}
    </div>
  )
}
