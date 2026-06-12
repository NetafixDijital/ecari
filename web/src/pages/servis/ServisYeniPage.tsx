import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCariAccounts, type CariAccountListItem } from '../../api/cari'
import CariInfoPanel from '../../components/cari/CariInfoPanel'
import CariSecModal from '../../components/cari/CariSecModal'
import { createSvcTicket } from '../../api/svc'

const PRIORITIES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Yüksek' },
  { value: 'URGENT', label: 'Acil' },
]

export default function ServisYeniPage() {
  const navigate = useNavigate()
  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [selectedCari, setSelectedCari] = useState<CariAccountListItem | null>(null)
  const [device, setDevice] = useState('')
  const [problem, setProblem] = useState('')
  const [technician, setTechnician] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCariAccounts()
      .then(setCariler)
      .catch(() => setError('Cari listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCari) {
      setError('Lütfen bir cari seçin.')
      return
    }
    if (!problem.trim()) {
      setError('Arıza / talep açıklaması zorunludur.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createSvcTicket({
        accountId: selectedCari.id,
        deviceName: device.trim() || null,
        problemDescription: problem.trim(),
        technicianName: technician.trim() || null,
        priority,
      })
      navigate('/servis')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Servis kaydı oluşturulamadı.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Yeni Servis Kaydı</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/servis">Servis</Link>
              </li>
              <li className="breadcrumb-item active">Yeni Kayıt</li>
            </ol>
          </nav>
        </div>
        <Link to="/servis" className="btn btn-label-secondary">
          <i className="ti ti-arrow-left me-1" /> Listeye Dön
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">Servis Bilgileri</div>
              <div className="card-body">
                <div className="mb-4">
                  <label className="form-label">Cari</label>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control"
                      readOnly
                      value={selectedCari ? `${selectedCari.code} — ${selectedCari.title}` : ''}
                      placeholder="Cari seçin..."
                    />
                    <button
                      type="button"
                      className="btn btn-primary text-nowrap"
                      data-bs-toggle="modal"
                      data-bs-target="#modalCariSecServis"
                      disabled={loading}
                    >
                      <i className="ti ti-search me-1" /> Seç
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Cihaz / Ürün</label>
                  <input
                    type="text"
                    className="form-control"
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    placeholder="Örn. Dell Latitude 5520"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Arıza / Talep Açıklaması</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Sorun veya talep detayını yazın"
                    required
                  />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Teknisyen</label>
                    <input
                      type="text"
                      className="form-control"
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      placeholder="Atanan teknisyen"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Öncelik</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-footer d-flex justify-content-end gap-2">
                <Link to="/servis" className="btn btn-label-secondary">
                  İptal
                </Link>
                <button type="submit" className="btn btn-primary" disabled={saving || loading}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            {selectedCari ? (
              <CariInfoPanel cari={selectedCari} />
            ) : (
              <div className="card">
                <div className="card-body text-body-secondary small">
                  Cari seçildiğinde bilgiler burada görüntülenir.
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      <CariSecModal
        modalId="modalCariSecServis"
        description="Servis kaydı için müşteri cari hesabını seçin."
        cariler={cariler}
        loading={loading}
        accountTypeFilter="CUSTOMER"
        onSelect={setSelectedCari}
      />
    </div>
  )
}
