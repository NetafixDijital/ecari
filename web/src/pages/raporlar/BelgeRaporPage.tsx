import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDeliveryNotes, type DlnDeliveryNoteListItem } from '../../api/dln'
import { fetchInvoices, type InvInvoiceListItem } from '../../api/inv'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { deliveryStatusBadge, formatDate, formatMoneyOptional, statusBadge } from '../../utils/format'

type ReportMode =
  | 'fatura-satis'
  | 'fatura-alis'
  | 'irsaliye-satis'
  | 'irsaliye-alis'

const CONFIG: Record<
  ReportMode,
  { title: string; breadcrumb: string; searchPlaceholder: string; isInvoice: boolean; docType: 'SALES' | 'PURCHASE' }
> = {
  'fatura-satis': {
    title: 'Satış Fatura Raporu',
    breadcrumb: 'Satış Fatura Raporu',
    searchPlaceholder: 'Fatura ara...',
    isInvoice: true,
    docType: 'SALES',
  },
  'fatura-alis': {
    title: 'Alış Fatura Raporu',
    breadcrumb: 'Alış Fatura Raporu',
    searchPlaceholder: 'Fatura ara...',
    isInvoice: true,
    docType: 'PURCHASE',
  },
  'irsaliye-satis': {
    title: 'Satış İrsaliye Raporu',
    breadcrumb: 'Satış İrsaliye Raporu',
    searchPlaceholder: 'İrsaliye ara...',
    isInvoice: false,
    docType: 'SALES',
  },
  'irsaliye-alis': {
    title: 'Alış İrsaliye Raporu',
    breadcrumb: 'Alış İrsaliye Raporu',
    searchPlaceholder: 'İrsaliye ara...',
    isInvoice: false,
    docType: 'PURCHASE',
  },
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

export default function BelgeRaporPage({ mode }: { mode: ReportMode }) {
  const cfg = CONFIG[mode]
  const [invoices, setInvoices] = useState<InvInvoiceListItem[]>([])
  const [deliveryNotes, setDeliveryNotes] = useState<DlnDeliveryNoteListItem[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    const loader = cfg.isInvoice
      ? fetchInvoices(cfg.docType).then(setInvoices)
      : fetchDeliveryNotes(cfg.docType).then(setDeliveryNotes)
    loader.catch(() => setError('Rapor verisi yüklenemedi.')).finally(() => setLoading(false))
  }, [cfg.docType, cfg.isInvoice])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const invoiceRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter((r) => [r.documentNo, r.accountTitle].join(' ').toLowerCase().includes(q))
  }, [invoices, tableSearch])

  const dlnRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return deliveryNotes
    return deliveryNotes.filter((r) =>
      [r.documentNo, r.accountTitle, r.shippingAddress].filter(Boolean).join(' ').toLowerCase().includes(q),
    )
  }, [deliveryNotes, tableSearch])

  const totalAmount = useMemo(
    () => (cfg.isInvoice ? invoiceRows.reduce((s, r) => s + r.grandTotal, 0) : 0),
    [cfg.isInvoice, invoiceRows],
  )

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10)
    if (cfg.isInvoice) {
      downloadCsv(
        `${mode}-${date}.csv`,
        ['Belge No', 'Cari', 'Tarih', 'Tutar', 'Durum'],
        invoiceRows.map((r) => [
          r.documentNo,
          r.accountTitle,
          r.documentDate,
          String(r.grandTotal),
          r.paymentStatusLabel,
        ]),
      )
      return
    }
    downloadCsv(
      `${mode}-${date}.csv`,
      ['Belge No', 'Cari', 'Tarih', 'Sevk Adresi', 'Durum'],
      dlnRows.map((r) => [
        r.documentNo,
        r.accountTitle,
        r.documentDate,
        r.shippingAddress ?? '',
        r.statusLabel,
      ]),
    )
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">{cfg.title}</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <span>Raporlar</span>
              </li>
              <li className="breadcrumb-item active">{cfg.breadcrumb}</li>
            </ol>
          </nav>
        </div>
        <button
          type="button"
          className="btn btn-label-secondary"
          disabled={loading || (cfg.isInvoice ? invoiceRows.length === 0 : dlnRows.length === 0)}
          onClick={handleExport}
        >
          <i className="ti ti-file-export me-1" /> CSV İndir
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {cfg.isInvoice && (
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <p className="text-body-secondary mb-1 small">Kayıt sayısı</p>
                <h4 className="mb-0">{invoiceRows.length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <p className="text-body-secondary mb-1 small">Toplam tutar</p>
                <h4 className="mb-0">{formatMoneyOptional(totalAmount)}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card datatables-toolbar-hidden">
        <TableSearchToolbar placeholder={cfg.searchPlaceholder} onSearch={setTableSearch} />
        <div className="table-responsive">
          {cfg.isInvoice ? (
            <table className="table table-hover mb-0">
              <thead className="border-top">
                <tr>
                  <th>Belge No</th>
                  <th>Cari</th>
                  <th>Tarih</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-body-secondary">
                      Yükleniyor...
                    </td>
                  </tr>
                )}
                {!loading &&
                  invoiceRows.map((row) => {
                    const badge = statusBadge(row.paymentStatusKey)
                    return (
                      <tr key={row.id}>
                        <td>{row.documentNo}</td>
                        <td>{row.accountTitle}</td>
                        <td>{formatDate(row.documentDate)}</td>
                        <td>{formatMoneyOptional(row.grandTotal)}</td>
                        <td>
                          <span className={`badge ${badge.className}`}>{badge.label}</span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="border-top">
                <tr>
                  <th>Belge No</th>
                  <th>Cari</th>
                  <th>Tarih</th>
                  <th>Sevk Adresi</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-body-secondary">
                      Yükleniyor...
                    </td>
                  </tr>
                )}
                {!loading &&
                  dlnRows.map((row) => {
                    const badge = deliveryStatusBadge(row.statusKey)
                    return (
                      <tr key={row.id}>
                        <td>{row.documentNo}</td>
                        <td>{row.accountTitle}</td>
                        <td>{formatDate(row.documentDate)}</td>
                        <td>{row.shippingAddress ?? '—'}</td>
                        <td>
                          <span className={`badge ${badge.className}`}>{badge.label}</span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
