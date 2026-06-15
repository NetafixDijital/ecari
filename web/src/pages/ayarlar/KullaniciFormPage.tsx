import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import {
  createAuthUser,
  fetchAuthBranches,
  fetchAuthUser,
  fetchPermissionTree,
  updateAuthUser,
  type AuthBranch,
  type AuthPermissionGroup,
} from '../../api/authUsers'

type FormState = {
  fullName: string
  email: string
  phone: string
  password: string
  passwordConfirm: string
  isActive: boolean
  isBranchRestrictionEnabled: boolean
  maxBranchAccess: number
  permissionIds: number[]
  deniedBranchIds: number[]
}

const emptyForm: FormState = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  isActive: true,
  isBranchRestrictionEnabled: false,
  maxBranchAccess: 3,
  permissionIds: [],
  deniedBranchIds: [],
}

export default function KullaniciFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isEdit = Boolean(id)
  const userId = id ? Number(id) : null

  const [form, setForm] = useState<FormState>(emptyForm)
  const [groups, setGroups] = useState<AuthPermissionGroup[]>([])
  const [branches, setBranches] = useState<AuthBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([fetchPermissionTree(), fetchAuthBranches(), isEdit && userId ? fetchAuthUser(userId) : null])
      .then(([tree, branchList, user]) => {
        setGroups(tree)
        setBranches(branchList)
        if (user) {
          setForm({
            fullName: user.fullName,
            email: user.email,
            phone: user.phone ?? '',
            password: '',
            passwordConfirm: '',
            isActive: user.isActive,
            isBranchRestrictionEnabled: user.isBranchRestrictionEnabled,
            maxBranchAccess: user.maxBranchAccess,
            permissionIds: user.permissionIds,
            deniedBranchIds: user.deniedBranchIds,
          })
        }
      })
      .catch(() => setError('Form verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [isEdit, userId])

  const allPermissionIds = useMemo(
    () => groups.flatMap((g) => g.permissions.map((p) => p.id)),
    [groups],
  )

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function togglePermission(permissionId: number) {
    setForm((prev) => {
      const exists = prev.permissionIds.includes(permissionId)
      return {
        ...prev,
        permissionIds: exists
          ? prev.permissionIds.filter((x) => x !== permissionId)
          : [...prev.permissionIds, permissionId],
      }
    })
  }

  function toggleGroup(group: AuthPermissionGroup, checked: boolean) {
    const ids = group.permissions.map((p) => p.id)
    setForm((prev) => {
      const set = new Set(prev.permissionIds)
      ids.forEach((pid) => (checked ? set.add(pid) : set.delete(pid)))
      return { ...prev, permissionIds: Array.from(set) }
    })
  }

  function toggleDeniedBranch(branchId: number) {
    setForm((prev) => {
      const exists = prev.deniedBranchIds.includes(branchId)
      return {
        ...prev,
        deniedBranchIds: exists
          ? prev.deniedBranchIds.filter((x) => x !== branchId)
          : [...prev.deniedBranchIds, branchId],
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.fullName.trim()) {
      setError('Ad soyad zorunludur.')
      return
    }
    if (!form.email.trim()) {
      setError('E-posta zorunludur.')
      return
    }
    if (!isEdit) {
      if (!form.password || form.password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.')
        return
      }
      if (form.password !== form.passwordConfirm) {
        setError('Şifreler eşleşmiyor.')
        return
      }
    } else if (form.password && form.password !== form.passwordConfirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        isActive: form.isActive,
        isBranchRestrictionEnabled: form.isBranchRestrictionEnabled,
        maxBranchAccess: form.maxBranchAccess,
        permissionIds: form.permissionIds,
        deniedBranchIds: form.isBranchRestrictionEnabled ? form.deniedBranchIds : [],
      }

      if (isEdit && userId) {
        await updateAuthUser(userId, {
          ...payload,
          password: form.password || null,
        })
        toast.success('Güncellendi', 'Kullanıcı bilgileri kaydedildi.')
      } else {
        const created = await createAuthUser({ ...payload, password: form.password })
        toast.success('Kullanıcı oluşturuldu', created.fullName)
        navigate(`/ayarlar/kullanicilar/${created.id}`, { replace: true })
      }
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
          <h4 className="mb-1">{isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Ana Sayfa</Link></li>
              <li className="breadcrumb-item"><Link to="/ayarlar">Ayarlar</Link></li>
              <li className="breadcrumb-item"><Link to="/ayarlar/kullanicilar">Kullanıcılar</Link></li>
              <li className="breadcrumb-item active">{isEdit ? 'Düzenle' : 'Yeni'}</li>
            </ol>
          </nav>
        </div>
        <Link to="/ayarlar/kullanicilar" className="btn btn-label-secondary">
          <i className="ti ti-arrow-left me-1" /> Listeye Dön
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card h-100">
              <div className="card-header">Kimlik Bilgileri</div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Ad Soyad *</label>
                  <input
                    className="form-control"
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">E-posta *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Telefon</label>
                  <input
                    className="form-control"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">{isEdit ? 'Yeni Şifre' : 'Şifre *'}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    autoComplete="new-password"
                  />
                  {isEdit && <small className="text-body-secondary">Boş bırakırsanız şifre değişmez.</small>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Şifre Tekrar {isEdit ? '' : '*'}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={form.passwordConfirm}
                    onChange={(e) => updateField('passwordConfirm', e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => updateField('isActive', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="isActive">Aktif kullanıcı</label>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>İzinler</span>
                <div className="btn-group btn-group-sm">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => updateField('permissionIds', allPermissionIds)}
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => updateField('permissionIds', [])}
                  >
                    Temizle
                  </button>
                </div>
              </div>
              <div className="card-body" style={{ maxHeight: 360, overflowY: 'auto' }}>
                {groups.map((group) => {
                  const groupIds = group.permissions.map((p) => p.id)
                  const checkedCount = groupIds.filter((pid) => form.permissionIds.includes(pid)).length
                  const allChecked = checkedCount === groupIds.length && groupIds.length > 0
                  return (
                    <div key={group.id} className="mb-3">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`group-${group.id}`}
                          checked={allChecked}
                          onChange={(e) => toggleGroup(group, e.target.checked)}
                        />
                        <label className="form-check-label fw-medium" htmlFor={`group-${group.id}`}>
                          {group.name}
                        </label>
                      </div>
                      <div className="ps-4">
                        {group.permissions.map((perm) => (
                          <div className="form-check" key={perm.id}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`perm-${perm.id}`}
                              checked={form.permissionIds.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                            />
                            <label className="form-check-label" htmlFor={`perm-${perm.id}`}>
                              {perm.name}
                              <small className="text-body-secondary ms-1">({perm.code})</small>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-header">Şube Erişim Kısıtlamaları</div>
              <div className="card-body">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="branchRestriction"
                    checked={form.isBranchRestrictionEnabled}
                    onChange={(e) => updateField('isBranchRestrictionEnabled', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="branchRestriction">
                    Şube kısıt modu (işaretli şubelere erişim yok)
                  </label>
                </div>
                {!form.isBranchRestrictionEnabled && (
                  <div className="mb-3">
                    <label className="form-label">Varsayılan max şube sayısı</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      className="form-control"
                      style={{ maxWidth: 120 }}
                      value={form.maxBranchAccess}
                      onChange={(e) => updateField('maxBranchAccess', Number(e.target.value) || 3)}
                    />
                  </div>
                )}
                {form.isBranchRestrictionEnabled && (
                  <div className="row g-2">
                    {branches.map((branch) => (
                      <div className="col-md-6" key={branch.id}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`branch-${branch.id}`}
                            checked={form.deniedBranchIds.includes(branch.id)}
                            onChange={() => toggleDeniedBranch(branch.id)}
                          />
                          <label className="form-check-label" htmlFor={`branch-${branch.id}`}>
                            {branch.name}
                            {branch.isHeadquarters && <span className="badge bg-label-primary ms-1">Merkez</span>}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
