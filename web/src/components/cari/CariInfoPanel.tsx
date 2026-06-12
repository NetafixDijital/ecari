import type { CariAccountListItem } from '../../api/cari'
import { displayTaxId, formatCariBalance, personTypeBadge } from '../../utils/format'

type CariInfoPanelProps = {
  cari: CariAccountListItem
  label?: string
}

function accountTypeLabel(type: string) {
  if (type === 'SUPPLIER') return 'Tedarikçi'
  if (type === 'CUSTOMER') return 'Müşteri'
  return type
}

export default function CariInfoPanel({ cari, label = 'Cari Bilgileri' }: CariInfoPanelProps) {
  const tip = personTypeBadge(cari.personType)
  const balance = formatCariBalance(cari.balance, cari.balanceSide)

  return (
    <div className="card mb-4 border-primary border-opacity-25">
      <div className="card-header py-2 d-flex align-items-center gap-2">
        <i className="ti ti-user-circle text-primary" />
        <span className="fw-medium">{label}</span>
        <span className="badge bg-label-primary font-mono ms-1">{cari.code}</span>
      </div>
      <div className="card-body py-3">
        <div className="row g-3">
          <div className="col-md-6 col-lg-4">
            <small className="text-body-secondary d-block mb-1">Ünvan</small>
            <span className="fw-semibold">{cari.title}</span>
          </div>
          <div className="col-md-6 col-lg-2">
            <small className="text-body-secondary d-block mb-1">Cari Tipi</small>
            <span className="badge bg-label-secondary me-1">{accountTypeLabel(cari.accountType)}</span>
            <span className={`badge ${tip.className}`}>{tip.label}</span>
          </div>
          <div className="col-md-6 col-lg-2">
            <small className="text-body-secondary d-block mb-1">VKN / TCKN</small>
            <span>{displayTaxId(cari)}</span>
          </div>
          <div className="col-md-6 col-lg-2">
            <small className="text-body-secondary d-block mb-1">Telefon</small>
            <span>{cari.phone || '—'}</span>
          </div>
          <div className="col-md-6 col-lg-2">
            <small className="text-body-secondary d-block mb-1">E-posta</small>
            <span>{cari.email || '—'}</span>
          </div>
          <div className="col-md-6 col-lg-2">
            <small className="text-body-secondary d-block mb-1">Bakiye</small>
            <span className={balance.className}>{balance.text}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
