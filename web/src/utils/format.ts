export function formatTry(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function personTypeBadge(personType: string) {
  if (personType === 'GERCEK_KISI') {
    return { label: 'Gerçek Kişi', className: 'bg-label-info' }
  }
  return { label: 'Tüzel Kişi', className: 'bg-label-primary' }
}

export function displayTaxId(row: { taxNumber?: string | null; identityNumber?: string | null }) {
  return row.taxNumber || row.identityNumber || '—'
}

export function balanceSide(balance: number): 'A' | 'B' | '' {
  if (balance > 0) return 'A'
  if (balance < 0) return 'B'
  return ''
}

export function formatCariBalance(balance: number, side?: string) {
  const resolvedSide = side || balanceSide(balance)
  const cls = resolvedSide === 'A' ? 'text-success' : resolvedSide === 'B' ? 'text-danger' : ''
  const suffix = resolvedSide ? ` (${resolvedSide})` : ''
  return { text: `${formatTry(Math.abs(balance))}${suffix}`, className: cls }
}

/** Tahsilat: cari borç bakiyesi (pozitif / A) */
export function cariDebtBalanceAmount(balance: number) {
  return balance > 0 ? Math.round(balance * 100) / 100 : 0
}

/** Tediye: cari alacak bakiyesi (negatif bakiyenin tutarı / B) */
export function cariCreditBalanceAmount(balance: number) {
  return balance < 0 ? Math.round(Math.abs(balance) * 100) / 100 : 0
}

const DURUM_MAP: Record<string, { label: string; className: string }> = {
  odendi: { label: 'Ödendi', className: 'bg-label-success' },
  bekliyor: { label: 'Bekliyor', className: 'bg-label-warning' },
  vadesi_gecmis: { label: 'Vadesi Geçti', className: 'bg-label-danger' },
  tamamlandi: { label: 'Tamamlandı', className: 'bg-label-success' },
  kismi: { label: 'Kısmi ödeme', className: 'bg-label-info' },
  hazirlaniyor: { label: 'Hazırlanıyor', className: 'bg-label-warning' },
  sevkte: { label: 'Sevkte', className: 'bg-label-info' },
  teslim: { label: 'Teslim', className: 'bg-label-success' },
  iptal: { label: 'İptal', className: 'bg-label-secondary' },
  onayli: { label: 'Onaylı', className: 'bg-label-success' },
  taslak: { label: 'Taslak', className: 'bg-label-secondary' },
}

export function statusBadge(key: string) {
  return DURUM_MAP[key] ?? { label: key, className: 'bg-label-secondary' }
}

export function deliveryStatusBadge(key: string) {
  return statusBadge(key)
}

export function orderStatusBadge(key: string) {
  return statusBadge(key)
}

export function checkStatusBadge(key: string) {
  return statusBadge(key)
}

export function formatMoneyOptional(amount?: number | null) {
  if (amount == null) return '—'
  return formatTry(amount)
}

export function formatQuantity(qty: number) {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2,
  }).format(qty)
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('tr-TR').format(d)
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

const EXPENSE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  onay_bekliyor: { label: 'Onay Bekliyor', className: 'bg-label-warning' },
  pending: { label: 'Beklemede', className: 'bg-label-warning' },
  portfolio: { label: 'Portföyde', className: 'bg-label-info' },
  collected: { label: 'Tahsil edildi', className: 'bg-label-success' },
  paid: { label: 'Ödendi', className: 'bg-label-success' },
  bounced: { label: 'Karşılıksız', className: 'bg-label-danger' },
  endorsed: { label: 'Ciro edildi', className: 'bg-label-primary' },
  onaylandi: { label: 'Onaylandı', className: 'bg-label-info' },
  odendi: { label: 'Ödendi', className: 'bg-label-success' },
  reddedildi: { label: 'Reddedildi', className: 'bg-label-danger' },
}

export function expenseStatusBadge(key: string) {
  return EXPENSE_STATUS_MAP[key] ?? { label: key, className: 'bg-label-secondary' }
}

const SVC_STATUS_MAP: Record<string, { label: string; className: string }> = {
  beklemede: { label: 'Beklemede', className: 'bg-label-warning' },
  islemde: { label: 'İşlemde', className: 'bg-label-info' },
  tamamlandi: { label: 'Tamamlandı', className: 'bg-label-success' },
  teslim: { label: 'Teslim Edildi', className: 'bg-label-primary' },
}

export function svcStatusBadge(key: string) {
  return SVC_STATUS_MAP[key] ?? { label: key, className: 'bg-label-secondary' }
}

const QUOTATION_STATUS_MAP: Record<string, { label: string; className: string }> = {
  taslak: { label: 'Taslak', className: 'bg-label-secondary' },
  gonderildi: { label: 'Gönderildi', className: 'bg-label-info' },
  kabul: { label: 'Kabul', className: 'bg-label-success' },
  red: { label: 'Red', className: 'bg-label-danger' },
  suresi_doldu: { label: 'Süresi Doldu', className: 'bg-label-warning' },
  iptal: { label: 'İptal', className: 'bg-label-secondary' },
  donusturuldu: { label: 'Siparişe Dönüştü', className: 'bg-label-primary' },
}

export function quotationStatusBadge(key: string) {
  return QUOTATION_STATUS_MAP[key] ?? { label: key, className: 'bg-label-secondary' }
}

const TASK_STATUS_MAP: Record<string, { label: string; className: string }> = {
  yapilacak: { label: 'Yapılacak', className: 'bg-label-secondary' },
  devam_ediyor: { label: 'Devam Ediyor', className: 'bg-label-info' },
  gecikti: { label: 'Gecikmiş', className: 'bg-label-danger' },
  tamamlandi: { label: 'Tamamlandı', className: 'bg-label-success' },
}

export function taskStatusBadge(key: string) {
  return TASK_STATUS_MAP[key] ?? { label: key, className: 'bg-label-secondary' }
}

const TASK_PRIORITY_MAP: Record<string, { label: string; className: string }> = {
  dusuk: { label: 'Düşük', className: 'bg-label-secondary' },
  normal: { label: 'Orta', className: 'bg-label-info' },
  yuksek: { label: 'Yüksek', className: 'bg-label-warning' },
  acil: { label: 'Acil', className: 'bg-label-danger' },
}

export function taskPriorityBadge(key: string) {
  return TASK_PRIORITY_MAP[key] ?? { label: key, className: 'bg-label-secondary' }
}

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  yakit: 'Yakıt',
  kirtasiye: 'Kırtasiye',
  yemek: 'Yemek',
  konaklama: 'Konaklama',
  diger: 'Diğer',
}

export function expenseCategoryLabel(category: string) {
  return EXPENSE_CATEGORY_LABELS[category] ?? category
}
