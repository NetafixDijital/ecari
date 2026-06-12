import 'package:flutter/material.dart';

import '../../core/widgets/app_empty_state.dart';

class ModulePlaceholderScreen extends StatelessWidget {
  const ModulePlaceholderScreen({
    super.key,
    required this.title,
    this.onBack,
  });

  final String title;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return AppEmptyState(
      icon: Icons.rocket_launch_outlined,
      title: title,
      message: 'Bu modül mobil uygulamada yakında eklenecek.\nŞimdilik Ana Panel ve Cari modüllerini kullanabilirsiniz.',
      actionLabel: onBack != null ? 'Ana Panele Dön' : null,
      onAction: onBack,
    );
  }
}
