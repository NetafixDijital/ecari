import 'package:flutter/material.dart';

enum AppMenuSection { dashboard, modules, finance, reports, settings }

class AppMenuItem {
  const AppMenuItem({
    required this.id,
    required this.label,
    required this.icon,
    this.section = AppMenuSection.modules,
  });

  final String id;
  final String label;
  final IconData icon;
  final AppMenuSection section;
}

/// Web menüsü ile uyumlu mobil modül listesi.
abstract final class AppMenu {
  static const dashboard = AppMenuItem(
    id: 'home',
    label: 'Ana Panel',
    icon: Icons.dashboard_outlined,
    section: AppMenuSection.dashboard,
  );

  static const modules = [
    AppMenuItem(id: 'cari', label: 'Cari Listesi', icon: Icons.people_outline),
    AppMenuItem(id: 'cari-hareketler', label: 'Cari Hareketler', icon: Icons.swap_vert_outlined),
    AppMenuItem(id: 'stok', label: 'Stok Listesi', icon: Icons.inventory_2_outlined),
    AppMenuItem(id: 'depo', label: 'Depo Listesi', icon: Icons.warehouse_outlined),
    AppMenuItem(id: 'depo-hareketler', label: 'Stok Hareketleri', icon: Icons.sync_alt_outlined),
    AppMenuItem(id: 'fatura-satis', label: 'Satış Fatura', icon: Icons.receipt_long_outlined),
    AppMenuItem(id: 'fatura-alis', label: 'Alış Fatura', icon: Icons.receipt_outlined),
    AppMenuItem(id: 'irsaliye-satis', label: 'Satış İrsaliye', icon: Icons.local_shipping_outlined),
    AppMenuItem(id: 'irsaliye-alis', label: 'Alış İrsaliye', icon: Icons.local_shipping_outlined),
    AppMenuItem(id: 'siparis', label: 'Sipariş', icon: Icons.shopping_cart_outlined),
    AppMenuItem(id: 'teklif', label: 'Teklif', icon: Icons.description_outlined),
    AppMenuItem(id: 'hizli-satis', label: 'Hızlı Satış', icon: Icons.point_of_sale_outlined),
    AppMenuItem(id: 'servis', label: 'Servis', icon: Icons.build_outlined),
    AppMenuItem(id: 'gorev', label: 'Görev', icon: Icons.checklist_outlined),
    AppMenuItem(id: 'masraf', label: 'Masraf', icon: Icons.request_quote_outlined),
  ];

  static const finance = [
    AppMenuItem(id: 'tahsilat', label: 'Tahsilat', icon: Icons.call_received_outlined, section: AppMenuSection.finance),
    AppMenuItem(id: 'tediye', label: 'Tediye', icon: Icons.call_made_outlined, section: AppMenuSection.finance),
    AppMenuItem(id: 'virman', label: 'Virman', icon: Icons.swap_horiz_outlined, section: AppMenuSection.finance),
    AppMenuItem(id: 'kasa', label: 'Kasa', icon: Icons.payments_outlined, section: AppMenuSection.finance),
    AppMenuItem(id: 'banka', label: 'Banka', icon: Icons.account_balance_outlined, section: AppMenuSection.finance),
    AppMenuItem(id: 'cek', label: 'Çek & Senet', icon: Icons.fact_check_outlined, section: AppMenuSection.finance),
    AppMenuItem(id: 'gun-sonu', label: 'Gün Sonu Raporu', icon: Icons.today_outlined, section: AppMenuSection.finance),
  ];

  static const reports = [
    AppMenuItem(id: 'rapor-gg', label: 'Gelir / Gider', icon: Icons.bar_chart_outlined, section: AppMenuSection.reports),
    AppMenuItem(id: 'rapor-kdv', label: 'KDV Raporu', icon: Icons.percent_outlined, section: AppMenuSection.reports),
    AppMenuItem(id: 'rapor-fs', label: 'Satış Fatura Raporu', icon: Icons.summarize_outlined, section: AppMenuSection.reports),
    AppMenuItem(id: 'rapor-fa', label: 'Alış Fatura Raporu', icon: Icons.summarize_outlined, section: AppMenuSection.reports),
    AppMenuItem(id: 'rapor-is', label: 'Satış İrsaliye Raporu', icon: Icons.local_shipping_outlined, section: AppMenuSection.reports),
    AppMenuItem(id: 'rapor-ia', label: 'Alış İrsaliye Raporu', icon: Icons.local_shipping_outlined, section: AppMenuSection.reports),
  ];

  static const settings = [
    AppMenuItem(id: 'ayarlar', label: 'Genel Ayarlar', icon: Icons.settings_outlined, section: AppMenuSection.settings),
    AppMenuItem(id: 'ayarlar-kullanicilar', label: 'Kullanıcılar', icon: Icons.people_outline, section: AppMenuSection.settings),
  ];

  static List<AppMenuItem> get all => [dashboard, ...modules, ...finance, ...reports, ...settings];

  static AppMenuItem? findById(String id) {
    for (final item in all) {
      if (item.id == id) return item;
    }
    return null;
  }

  static String titleFor(String id) => findById(id)?.label ?? 'E-Cari';
}
