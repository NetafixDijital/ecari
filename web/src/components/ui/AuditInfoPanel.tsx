import { formatDateTime } from '../../utils/format'

export type AuditInfo = {
  createdAt: string
  createdByName?: string | null
  updatedAt?: string | null
  updatedByName?: string | null
}

export default function AuditInfoPanel({ audit }: { audit?: AuditInfo | null }) {
  if (!audit) return null

  return (
    <div className="card mt-4">
      <div className="card-body py-3">
        <div className="row g-3 small">
          <div className="col-md-3">
            <div className="text-body-secondary">Kayıt Tarihi</div>
            <div>{formatDateTime(audit.createdAt)}</div>
          </div>
          <div className="col-md-3">
            <div className="text-body-secondary">Kaydeden</div>
            <div>{audit.createdByName || '—'}</div>
          </div>
          <div className="col-md-3">
            <div className="text-body-secondary">Düzenleme Tarihi</div>
            <div>{audit.updatedAt ? formatDateTime(audit.updatedAt) : '—'}</div>
          </div>
          <div className="col-md-3">
            <div className="text-body-secondary">Düzenleyen</div>
            <div>{audit.updatedByName || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
