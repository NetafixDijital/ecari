import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import {
  fetchModuleSettings,
  updateModuleSettings,
  type ModuleSetting,
} from '../../api/cfg'

type SettingMeta = {
  moduleCode: string
  settingKey: string
  label: string
  description?: string
  dataType: 'BOOL' | 'INT' | 'STRING'
}

const KNOWN_SETTINGS: SettingMeta[] = [
  {
    moduleCode: 'STK',
    settingKey: 'stk.allow_negative_stock',
    label: 'Negatif stok izni',
    description: 'Stok çıkışında bakiye sıfırın altına düşebilir.',
    dataType: 'BOOL',
  },
  {
    moduleCode: 'INV',
    settingKey: 'inv.auto_post_cari',
    label: 'Faturada otomatik cari hareketi',
    description: 'Satış/alış faturalarında cari hesaba otomatik kayıt.',
    dataType: 'BOOL',
  },
  {
    moduleCode: 'INV',
    settingKey: 'inv.default_tax_rate_id',
    label: 'Varsayılan KDV oranı (ID)',
    dataType: 'INT',
  },
  {
    moduleCode: 'CHQ',
    settingKey: 'chq.due_date_alert_days',
    label: 'Çek vade uyarı günü',
    description: 'Vadesi yaklaşan çekler için kaç gün önce uyarı verilsin.',
    dataType: 'INT',
  },
]

function mergeSettings(loaded: ModuleSetting[]): ModuleSetting[] {
  const map = new Map(loaded.map((s) => [`${s.moduleCode}:${s.settingKey}`, s]))
  const merged: ModuleSetting[] = []
  for (const meta of KNOWN_SETTINGS) {
    const key = `${meta.moduleCode}:${meta.settingKey}`
    const existing = map.get(key)
    merged.push(
      existing ?? {
        moduleCode: meta.moduleCode,
        settingKey: meta.settingKey,
        settingValue: meta.dataType === 'BOOL' ? 'false' : meta.dataType === 'INT' ? '0' : '',
        dataType: meta.dataType,
      },
    )
  }
  for (const s of loaded) {
    const key = `${s.moduleCode}:${s.settingKey}`
    if (!KNOWN_SETTINGS.some((m) => `${m.moduleCode}:${m.settingKey}` === key)) {
      merged.push(s)
    }
  }
  return merged
}

function settingLabel(setting: ModuleSetting) {
  const meta = KNOWN_SETTINGS.find(
    (m) => m.moduleCode === setting.moduleCode && m.settingKey === setting.settingKey,
  )
  return meta?.label ?? `${setting.moduleCode}.${setting.settingKey}`
}

function settingDescription(setting: ModuleSetting) {
  const meta = KNOWN_SETTINGS.find(
    (m) => m.moduleCode === setting.moduleCode && m.settingKey === setting.settingKey,
  )
  return meta?.description
}

export default function AyarlarOzelPage() {
  const toast = useToast()
  const [settings, setSettings] = useState<ModuleSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchModuleSettings()
      .then((data) => setSettings(mergeSettings(data)))
      .catch(() => setError('Modül ayarları yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, ModuleSetting[]>()
    for (const s of settings) {
      const list = map.get(s.moduleCode) ?? []
      list.push(s)
      map.set(s.moduleCode, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [settings])

  function updateSetting(index: number, value: string) {
    setSettings((prev) => prev.map((s, i) => (i === index ? { ...s, settingValue: value } : s)))
  }

  function findIndex(setting: ModuleSetting) {
    return settings.findIndex(
      (s) => s.moduleCode === setting.moduleCode && s.settingKey === setting.settingKey,
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await updateModuleSettings({ settings })
      setSettings(mergeSettings(updated))
      toast.success('Kaydedildi', 'Modül ayarları güncellendi.')
    } catch {
      const msg = 'Kayıt sırasında hata oluştu.'
      setError(msg)
      toast.error('Kayıt başarısız', msg)
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

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Özel Ayarlar</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/ayarlar">Ayarlar</Link>
              </li>
              <li className="breadcrumb-item active">Özel Ayarlar</li>
            </ol>
          </nav>
        </div>
        <Link to="/ayarlar" className="btn btn-label-secondary">
          <i className="ti ti-arrow-left me-1" /> Ayarlara Dön
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="row g-4">
          {grouped.map(([moduleCode, moduleSettings]) => (
            <div key={moduleCode} className="col-md-6">
              <div className="card h-100">
                <div className="card-header">{moduleCode} Modülü</div>
                <div className="card-body">
                  {moduleSettings.map((setting) => {
                    const idx = findIndex(setting)
                    const desc = settingDescription(setting)
                    if (setting.dataType === 'BOOL') {
                      return (
                        <div key={`${setting.moduleCode}-${setting.settingKey}`} className="mb-3">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`${setting.moduleCode}-${setting.settingKey}`}
                              checked={setting.settingValue === 'true'}
                              onChange={(e) =>
                                updateSetting(idx, e.target.checked ? 'true' : 'false')
                              }
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`${setting.moduleCode}-${setting.settingKey}`}
                            >
                              {settingLabel(setting)}
                            </label>
                          </div>
                          {desc && <p className="text-body-secondary small mb-0">{desc}</p>}
                        </div>
                      )
                    }
                    if (setting.dataType === 'INT') {
                      return (
                        <div key={`${setting.moduleCode}-${setting.settingKey}`} className="mb-3">
                          <label className="form-label">{settingLabel(setting)}</label>
                          <input
                            type="number"
                            className="form-control"
                            value={setting.settingValue}
                            onChange={(e) => updateSetting(idx, e.target.value)}
                          />
                          {desc && <p className="text-body-secondary small mb-0 mt-1">{desc}</p>}
                        </div>
                      )
                    }
                    return (
                      <div key={`${setting.moduleCode}-${setting.settingKey}`} className="mb-3">
                        <label className="form-label">{settingLabel(setting)}</label>
                        <input
                          type="text"
                          className="form-control"
                          value={setting.settingValue}
                          onChange={(e) => updateSetting(idx, e.target.value)}
                        />
                        {desc && <p className="text-body-secondary small mb-0 mt-1">{desc}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
