import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PermissionRoute from './components/PermissionRoute'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import CariHareketlerPage from './pages/cari/CariHareketlerPage'
import CariListPage from './pages/cari/CariListPage'
import StokListPage from './pages/stok/StokListPage'
import CompanySelectPage from './pages/CompanySelectPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ApiTestPage from './pages/ApiTestPage'
import AyarlarGenelPage from './pages/ayarlar/AyarlarGenelPage'
import AyarlarMenuPage from './pages/ayarlar/AyarlarMenuPage'
import AyarlarOzelPage from './pages/ayarlar/AyarlarOzelPage'
import KullaniciFormPage from './pages/ayarlar/KullaniciFormPage'
import KullaniciListPage from './pages/ayarlar/KullaniciListPage'
import GorevListPage from './pages/gorev/GorevListPage'
import HizliSatisPage from './pages/hizli-satis/HizliSatisPage'
import ServisDetayPage from './pages/servis/ServisDetayPage'
import ServisListPage from './pages/servis/ServisListPage'
import ServisYeniPage from './pages/servis/ServisYeniPage'
import TeknisyenTanimPage from './pages/servis/TeknisyenTanimPage'
import HizmetTanimPage from './pages/servis/HizmetTanimPage'
import TeklifDetayPage from './pages/teklif/TeklifDetayPage'
import TeklifListPage from './pages/teklif/TeklifListPage'
import TeklifYeniPage from './pages/teklif/TeklifYeniPage'
import DepoListPage from './pages/depo/DepoListPage'
import FaturaListPage from './pages/fatura/FaturaListPage'
import FaturaOnizlemePage from './pages/fatura/FaturaOnizlemePage'
import FaturaYeniPage from './pages/fatura/FaturaYeniPage'
import IrsaliyeDetayPage from './pages/irsaliye/IrsaliyeDetayPage'
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
import StokHareketRaporPage from './pages/raporlar/StokHareketRaporPage'
import SiparisDetayPage from './pages/siparis/SiparisDetayPage'
import SiparisListPage from './pages/siparis/SiparisListPage'
import SiparisYeniPage from './pages/siparis/SiparisYeniPage'
import MasrafDetayPage from './pages/masraf/MasrafDetayPage'
import MasrafListPage from './pages/masraf/MasrafListPage'
import MasrafYeniPage from './pages/masraf/MasrafYeniPage'
import MasrafYonetimPage from './pages/masraf/MasrafYonetimPage'

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
      <Route path="/api-test" element={<ApiTestPage />} />
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
          <Route path="/fatura/satis-iade" element={<FaturaListPage mode="satis-iade" />} />
          <Route path="/fatura/alis-iade" element={<FaturaListPage mode="alis-iade" />} />
          <Route path="/irsaliye/yeni" element={<IrsaliyeYeniPage />} />
          <Route path="/irsaliye/satis" element={<IrsaliyeListPage mode="satis" />} />
          <Route path="/irsaliye/alis" element={<IrsaliyeListPage mode="alis" />} />
          <Route path="/irsaliye/:id" element={<IrsaliyeDetayPage />} />
          <Route path="/siparis" element={<SiparisListPage />} />
          <Route path="/siparis/yeni" element={<SiparisYeniPage />} />
          <Route path="/siparis/:id" element={<SiparisDetayPage />} />
          <Route path="/teklif" element={<TeklifListPage />} />
          <Route path="/teklif/yeni" element={<TeklifYeniPage />} />
          <Route path="/teklif/:id" element={<TeklifDetayPage />} />
          <Route path="/depo" element={<DepoListPage />} />
          <Route path="/depo/hareketler" element={<DepoHareketlerPage />} />
          <Route path="/hizli-satis" element={<HizliSatisPage />} />
          <Route path="/servis" element={<ServisListPage />} />
          <Route path="/servis/yeni" element={<ServisYeniPage />} />
          <Route path="/servis/teknisyenler" element={<TeknisyenTanimPage />} />
          <Route path="/servis/hizmetler" element={<HizmetTanimPage />} />
          <Route path="/servis/:id" element={<ServisDetayPage />} />
          <Route path="/gorev" element={<GorevListPage />} />
          <Route path="/masraf" element={<MasrafListPage />} />
          <Route path="/masraf/yeni" element={<MasrafYeniPage />} />
          <Route path="/masraf/yonetim" element={<MasrafYonetimPage />} />
          <Route path="/masraf/:id" element={<MasrafDetayPage />} />
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
          <Route path="/raporlar/stok-hareket" element={<StokHareketRaporPage />} />
          <Route path="/ayarlar" element={<AyarlarGenelPage />} />
          <Route path="/ayarlar/menu" element={<AyarlarMenuPage />} />
          <Route path="/ayarlar/ozel" element={<AyarlarOzelPage />} />
          <Route element={<PermissionRoute permission="AUTH.USER.VIEW" />}>
            <Route path="/ayarlar/kullanicilar" element={<KullaniciListPage />} />
            <Route path="/ayarlar/kullanicilar/yeni" element={<KullaniciFormPage />} />
            <Route path="/ayarlar/kullanicilar/:id" element={<KullaniciFormPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
