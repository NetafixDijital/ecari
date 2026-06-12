import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import CariHareketlerPage from './pages/cari/CariHareketlerPage'
import CariListPage from './pages/cari/CariListPage'
import StokListPage from './pages/stok/StokListPage'
import CompanySelectPage from './pages/CompanySelectPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AyarlarGenelPage from './pages/ayarlar/AyarlarGenelPage'
import AyarlarMenuPage from './pages/ayarlar/AyarlarMenuPage'
import AyarlarOzelPage from './pages/ayarlar/AyarlarOzelPage'
import GorevListPage from './pages/gorev/GorevListPage'
import HizliSatisPage from './pages/hizli-satis/HizliSatisPage'
import ServisListPage from './pages/servis/ServisListPage'
import ServisYeniPage from './pages/servis/ServisYeniPage'
import DepoListPage from './pages/depo/DepoListPage'
import FaturaListPage from './pages/fatura/FaturaListPage'
import FaturaOnizlemePage from './pages/fatura/FaturaOnizlemePage'
import FaturaYeniPage from './pages/fatura/FaturaYeniPage'
import IrsaliyeListPage from './pages/irsaliye/IrsaliyeListPage'
import IrsaliyeYeniPage from './pages/irsaliye/IrsaliyeYeniPage'
import BankaListPage from './pages/banka/BankaListPage'
import CekListPage from './pages/cek/CekListPage'
import GunSonuRaporuPage from './pages/kasa/GunSonuRaporuPage'
import KasaListPage from './pages/kasa/KasaListPage'
import DepoHareketlerPage from './pages/depo/DepoHareketlerPage'
import BelgeRaporPage from './pages/raporlar/BelgeRaporPage'
import GelirGiderRaporPage from './pages/raporlar/GelirGiderRaporPage'
import KdvRaporPage from './pages/raporlar/KdvRaporPage'
import SiparisListPage from './pages/siparis/SiparisListPage'
import SiparisYeniPage from './pages/siparis/SiparisYeniPage'
import ModuleStubPage from './pages/shared/ModuleStubPage'

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route path="/select-company" element={<CompanySelectPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/cari" element={<CariListPage />} />
          <Route path="/cari/hareketler" element={<CariHareketlerPage />} />
          <Route path="/stok" element={<StokListPage />} />
          <Route path="/fatura/yeni" element={<FaturaYeniPage />} />
          <Route path="/fatura/onizleme/:id" element={<FaturaOnizlemePage />} />
          <Route path="/fatura/satis" element={<FaturaListPage mode="satis" />} />
          <Route path="/fatura/alis" element={<FaturaListPage mode="alis" />} />
          <Route path="/irsaliye/yeni" element={<IrsaliyeYeniPage />} />
          <Route path="/irsaliye/satis" element={<IrsaliyeListPage mode="satis" />} />
          <Route path="/irsaliye/alis" element={<IrsaliyeListPage mode="alis" />} />
          <Route path="/siparis" element={<SiparisListPage />} />
          <Route path="/siparis/yeni" element={<SiparisYeniPage />} />
          <Route path="/depo" element={<DepoListPage />} />
          <Route path="/depo/hareketler" element={<DepoHareketlerPage />} />
          <Route path="/hizli-satis" element={<HizliSatisPage />} />
          <Route path="/servis" element={<ServisListPage />} />
          <Route path="/servis/yeni" element={<ServisYeniPage />} />
          <Route path="/gorev" element={<GorevListPage />} />
          <Route path="/masraf" element={<ModuleStubPage title="Masraf Listesi" />} />
          <Route path="/masraf/yonetim" element={<ModuleStubPage title="Masraf Yönetimi" />} />
          <Route path="/kasa" element={<KasaListPage />} />
          <Route path="/kasa/gun-sonu" element={<GunSonuRaporuPage />} />
          <Route path="/banka" element={<BankaListPage />} />
          <Route path="/cek" element={<CekListPage />} />
          <Route path="/raporlar/fatura-satis" element={<BelgeRaporPage mode="fatura-satis" />} />
          <Route path="/raporlar/fatura-alis" element={<BelgeRaporPage mode="fatura-alis" />} />
          <Route path="/raporlar/irsaliye-satis" element={<BelgeRaporPage mode="irsaliye-satis" />} />
          <Route path="/raporlar/irsaliye-alis" element={<BelgeRaporPage mode="irsaliye-alis" />} />
          <Route path="/raporlar/gelir-gider" element={<GelirGiderRaporPage />} />
          <Route path="/raporlar/kdv" element={<KdvRaporPage />} />
          <Route path="/ayarlar" element={<AyarlarGenelPage />} />
          <Route path="/ayarlar/menu" element={<AyarlarMenuPage />} />
          <Route path="/ayarlar/ozel" element={<AyarlarOzelPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
