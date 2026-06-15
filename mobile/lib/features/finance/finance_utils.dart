import 'package:intl/intl.dart';

import '../cari/cari_models.dart';

final financeCurrency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

String todayIso() => DateTime.now().toIso8601String().substring(0, 10);

String addDaysIso(String iso, int days) {
  final d = DateTime.parse(iso);
  return d.add(Duration(days: days)).toIso8601String().substring(0, 10);
}

/// Cari borç bakiyesi (tahsilat için).
double cariDebtAmount(CariAccount cari) => cari.balance > 0 ? cari.balance : 0;

/// Cari alacak bakiyesi (tediye için).
double cariCreditAmount(CariAccount cari) => cari.balance < 0 ? cari.balance.abs() : 0;
