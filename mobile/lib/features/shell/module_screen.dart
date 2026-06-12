import 'package:flutter/material.dart';

import '../finance/tahsilat_screen.dart';
import '../finance/tediye_screen.dart';
import '../finance/virman_screen.dart';
import '../bnk/bnk_list_screen.dart';
import '../cari/cari_models.dart';
import '../cari/cari_movements_screen.dart';
import '../chq/chq_list_screen.dart';
import '../csh/csh_list_screen.dart';
import '../depo/depo_list_screen.dart';
import '../dln/dln_list_screen.dart';
import '../exp/exp_list_screen.dart';
import '../inv/inv_list_screen.dart';
import '../ord/ord_list_screen.dart';
import '../reports/gun_sonu_screen.dart';
import '../reports/report_screens.dart';
import '../settings/settings_screen.dart';
import '../stok/stk_list_screen.dart';
import '../stok/stk_movements_screen.dart';
import '../svc/svc_list_screen.dart';
import '../tsk/tsk_list_screen.dart';

/// Menü id → ekran eşlemesi.
Widget moduleScreenFor(String menuId, {CariAccount? initialCari, VoidCallback? onSuccess}) {
  return switch (menuId) {
    'cari-hareketler' => const CariMovementsScreen(),
    'stok' => const StkListScreen(),
    'depo' => const DepoListScreen(),
    'depo-hareketler' => const StkMovementsScreen(),
    'fatura-satis' => const InvListScreen(type: 'SALES', title: 'Satış Fatura'),
    'fatura-alis' => const InvListScreen(type: 'PURCHASE', title: 'Alış Fatura'),
    'irsaliye-satis' => const DlnListScreen(fixedType: 'SALES'),
    'irsaliye-alis' => const DlnListScreen(fixedType: 'PURCHASE'),
    'siparis' => const OrdListScreen(),
    'servis' => const SvcListScreen(),
    'gorev' => const TskListScreen(),
    'masraf' => const ExpListScreen(),
    'tahsilat' => TahsilatScreen(initialCari: initialCari, onSuccess: onSuccess),
    'tediye' => TediyeScreen(initialCari: initialCari, onSuccess: onSuccess),
    'virman' => VirmanScreen(initialSource: initialCari, onSuccess: onSuccess),
    'kasa' => const CshListScreen(),
    'banka' => const BnkListScreen(),
    'cek' => const ChqListScreen(),
    'gun-sonu' => const GunSonuScreen(),
    'rapor-gg' => const GelirGiderReportScreen(),
    'rapor-kdv' => const KdvReportScreen(),
    'rapor-fs' => const InvListScreen(type: 'SALES', title: 'Satış Fatura Raporu'),
    'rapor-fa' => const InvListScreen(type: 'PURCHASE', title: 'Alış Fatura Raporu'),
    'rapor-is' => const DlnListScreen(fixedType: 'SALES', reportMode: true),
    'rapor-ia' => const DlnListScreen(fixedType: 'PURCHASE', reportMode: true),
    'ayarlar' => const SettingsScreen(),
    _ => Center(child: Text('Modül: $menuId')),
  };
}
