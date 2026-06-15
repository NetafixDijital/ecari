export type MenuLink = {
  id: string
  label: string
  icon: string
  to: string
  tone?: string
  badge?: string
  badgeType?: string
}

export type MenuGroup = {
  id: string
  label: string
  icon: string
  to?: string
  children?: MenuLink[]
}

export const dashboardLinks: MenuLink[] = [
  { id: 'home', label: 'Ana Panel', icon: 'ti-smart-home', to: '/', tone: 'primary' },
  { id: 'rapor-gg', label: 'Gelir / Gider', icon: 'ti-chart-bar', to: '/raporlar/gelir-gider', tone: 'success' },
  { id: 'rapor-kdv', label: 'KDV Raporu', icon: 'ti-receipt-tax', to: '/raporlar/kdv', tone: 'warning' },
  { id: 'fatura-satis', label: 'Satış Faturaları', icon: 'ti-file-invoice', to: '/fatura/satis', tone: 'info', badge: '24', badgeType: 'soft' },
  { id: 'cari', label: 'Cari Hesaplar', icon: 'ti-users', to: '/cari', tone: 'purple' },
  { id: 'stok', label: 'Stok & Ürünler', icon: 'ti-packages', to: '/stok', tone: 'danger' },
  { id: 'bekleyen', label: 'Bekleyen Faturalar', icon: 'ti-clock-hour-4', to: '/fatura/satis', tone: 'warning', badge: '12', badgeType: 'success' },
]

export const moduleGroups: MenuGroup[] = [
  {
    id: 'fatura',
    label: 'Fatura',
    icon: 'ti-file-invoice',
    children: [
      { id: 'fatura-alis', label: 'Alış Fatura', icon: 'ti-file-invoice', to: '/fatura/alis' },
      { id: 'fatura-alis-rapor', label: 'Fatura Raporu', icon: 'ti-file-invoice', to: '/raporlar/fatura-alis' },
      { id: 'fatura-satis', label: 'Satış Fatura', icon: 'ti-file-invoice', to: '/fatura/satis' },
      { id: 'fatura-satis-rapor', label: 'Fatura Raporu', icon: 'ti-file-invoice', to: '/raporlar/fatura-satis' },
    ],
  },
  {
    id: 'irsaliye',
    label: 'İrsaliye',
    icon: 'ti-truck-delivery',
    children: [
      { id: 'irsaliye-alis', label: 'Alış İrsaliye', icon: 'ti-truck-delivery', to: '/irsaliye/alis' },
      { id: 'irsaliye-alis-rapor', label: 'İrsaliye Raporu', icon: 'ti-truck-delivery', to: '/raporlar/irsaliye-alis' },
      { id: 'irsaliye-satis', label: 'Satış İrsaliye', icon: 'ti-truck-delivery', to: '/irsaliye/satis' },
      { id: 'irsaliye-satis-rapor', label: 'İrsaliye Raporu', icon: 'ti-truck-delivery', to: '/raporlar/irsaliye-satis' },
    ],
  },
  {
    id: 'siparis',
    label: 'Sipariş',
    icon: 'ti-shopping-cart',
    children: [
      { id: 'siparis-liste', label: 'Sipariş Listesi', icon: 'ti-shopping-cart', to: '/siparis' },
      { id: 'siparis-yeni', label: 'Yeni Sipariş', icon: 'ti-shopping-cart', to: '/siparis/yeni' },
    ],
  },
  {
    id: 'cari',
    label: 'Cari',
    icon: 'ti-users',
    children: [
      { id: 'cari-liste', label: 'Cari Listesi', icon: 'ti-users', to: '/cari' },
      { id: 'cari-hareketler', label: 'Cari Hareketler', icon: 'ti-arrows-exchange', to: '/cari/hareketler' },
    ],
  },
  {
    id: 'teklif',
    label: 'Teklif',
    icon: 'ti-file-description',
    children: [
      { id: 'teklif-liste', label: 'Teklif Listesi', icon: 'ti-file-description', to: '/teklif' },
      { id: 'teklif-yeni', label: 'Yeni Teklif', icon: 'ti-file-description', to: '/teklif/yeni' },
    ],
  },
  {
    id: 'depo',
    label: 'Depo',
    icon: 'ti-building-warehouse',
    children: [
      { id: 'depo-liste', label: 'Depo Listesi', icon: 'ti-building-warehouse', to: '/depo' },
      { id: 'depo-hareketler', label: 'Stok Hareketleri', icon: 'ti-building-warehouse', to: '/depo/hareketler' },
    ],
  },
  {
    id: 'stok',
    label: 'Stok',
    icon: 'ti-packages',
    children: [{ id: 'stok-liste', label: 'Stok Listesi', icon: 'ti-packages', to: '/stok' }],
  },
  {
    id: 'hizli-satis',
    label: 'Hızlı Satış',
    icon: 'ti-bolt',
    to: '/hizli-satis',
  },
  {
    id: 'servis',
    label: 'Servis',
    icon: 'ti-tool',
    children: [
      { id: 'servis-liste', label: 'Servis Listesi', icon: 'ti-tool', to: '/servis' },
      { id: 'servis-yeni', label: 'Yeni Servis Kaydı', icon: 'ti-tool', to: '/servis/yeni' },
    ],
  },
  {
    id: 'gorev',
    label: 'Görev',
    icon: 'ti-checklist',
    children: [{ id: 'gorev-liste', label: 'Görev Listesi', icon: 'ti-checklist', to: '/gorev' }],
  },
  {
    id: 'kasa',
    label: 'Kasa',
    icon: 'ti-cash',
    children: [
      { id: 'kasa-ana', label: 'Kasa', icon: 'ti-cash', to: '/kasa' },
      { id: 'gun-sonu', label: 'Gün Sonu Raporu', icon: 'ti-report-money', to: '/kasa/gun-sonu' },
    ],
  },
  {
    id: 'banka',
    label: 'Banka',
    icon: 'ti-building-bank',
    to: '/banka',
  },
  {
    id: 'cek',
    label: 'Çek & Senet',
    icon: 'ti-file-check',
    to: '/cek',
  },
  {
    id: 'masraf',
    label: 'Masraf',
    icon: 'ti-receipt-2',
    children: [
      { id: 'masraf-liste', label: 'Masraf Listesi', icon: 'ti-receipt-2', to: '/masraf' },
      { id: 'masraf-yeni', label: 'Yeni Masraf', icon: 'ti-receipt-2', to: '/masraf/yeni' },
      { id: 'masraf-yonetimi', label: 'Masraf Yönetimi', icon: 'ti-receipt-2', to: '/masraf/yonetim' },
    ],
  },
]

export const financeLinks: MenuLink[] = [
  { id: 'kasa', label: 'Kasa', icon: 'ti-cash', to: '/kasa', tone: 'success' },
  { id: 'banka', label: 'Banka', icon: 'ti-building-bank', to: '/banka', tone: 'primary' },
  { id: 'hizli-satis', label: 'Hızlı Satış', icon: 'ti-bolt', to: '/hizli-satis', tone: 'warning' },
  { id: 'cari', label: 'Cari Hesaplar', icon: 'ti-users', to: '/cari', tone: 'purple' },
  { id: 'cari-hareket', label: 'Cari Hareketler', icon: 'ti-arrows-exchange', to: '/cari/hareketler', tone: 'info' },
  { id: 'cek', label: 'Çek & Senet', icon: 'ti-file-check', to: '/cek', tone: 'warning' },
  { id: 'gun-sonu', label: 'Gün Sonu Raporu', icon: 'ti-report-money', to: '/kasa/gun-sonu', tone: 'purple' },
]

export const reportsLinks: MenuLink[] = [
  { id: 'rapor-fs', label: 'Satış Fatura Raporu', icon: 'ti-file-invoice', to: '/raporlar/fatura-satis', tone: 'primary' },
  { id: 'rapor-fa', label: 'Alış Fatura Raporu', icon: 'ti-file-invoice', to: '/raporlar/fatura-alis', tone: 'info' },
  { id: 'rapor-is', label: 'Satış İrsaliye', icon: 'ti-truck-delivery', to: '/raporlar/irsaliye-satis', tone: 'success' },
  { id: 'rapor-ia', label: 'Alış İrsaliye', icon: 'ti-truck-delivery', to: '/raporlar/irsaliye-alis', tone: 'warning' },
  { id: 'rapor-gg', label: 'Gelir / Gider', icon: 'ti-chart-bar', to: '/raporlar/gelir-gider', tone: 'success' },
  { id: 'rapor-kdv', label: 'KDV Raporu', icon: 'ti-receipt-tax', to: '/raporlar/kdv', tone: 'danger' },
]

export const settingsLinks: MenuLink[] = [
  { id: 'ayarlar-genel', label: 'Genel Ayarlar', icon: 'ti-settings', to: '/ayarlar', tone: 'primary' },
  { id: 'ayarlar-kullanicilar', label: 'Kullanıcılar', icon: 'ti-users', to: '/ayarlar/kullanicilar', tone: 'purple' },
  { id: 'ayarlar-menu', label: 'Menü Düzeni', icon: 'ti-layout-sidebar', to: '/ayarlar/menu', tone: 'info' },
  { id: 'ayarlar-ozel', label: 'Özel Ayarlar', icon: 'ti-adjustments', to: '/ayarlar/ozel', tone: 'warning' },
]

export type SidebarTab = 'dashboardTab' | 'modulesTab' | 'financeTab' | 'reportsTab' | 'settingsTab'

const FINANCE_PREFIXES = ['/kasa', '/banka', '/cek', '/hizli-satis', '/cari/hareketler']
const MODULE_PREFIXES = [
  '/cari',
  '/stok',
  '/fatura',
  '/irsaliye',
  '/siparis',
  '/teklif',
  '/depo',
  '/servis',
  '/gorev',
  '/masraf',
  '/cek',
]

export function detectActiveTab(pathname: string): SidebarTab {
  if (pathname.startsWith('/ayarlar')) return 'settingsTab'
  if (pathname.startsWith('/raporlar')) return 'reportsTab'
  if (pathname.startsWith('/cari/hareketler')) return 'financeTab'
  if (FINANCE_PREFIXES.some((p) => pathname.startsWith(p))) return 'financeTab'
  if (MODULE_PREFIXES.some((p) => pathname.startsWith(p))) return 'modulesTab'
  return 'dashboardTab'
}
