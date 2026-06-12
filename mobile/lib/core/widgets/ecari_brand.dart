import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'ecari_logo.dart';

/// Kurumsal marka: logo + e-Cari yazisi + opsiyonel alt baslik.
class EcariBrand extends StatelessWidget {
  const EcariBrand({
    super.key,
    this.compact = false,
    this.showTagline = true,
    this.light = false,
  });

  final bool compact;
  final bool showTagline;
  final bool light;

  @override
  Widget build(BuildContext context) {
    final logoSize = compact ? 36.0 : 48.0;
    final titleColor = light ? Colors.white : AppColors.heading;
    final taglineColor = light ? Colors.white70 : AppColors.bodyText;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        EcariLogo(size: logoSize),
        SizedBox(width: compact ? 10 : 14),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'e-Cari',
                style: TextStyle(
                  color: titleColor,
                  fontWeight: FontWeight.w700,
                  fontSize: compact ? 17 : 22,
                  letterSpacing: -0.3,
                  height: 1.1,
                ),
              ),
              if (showTagline)
                Text(
                  'Ön Muhasebe',
                  style: TextStyle(
                    color: taglineColor,
                    fontSize: compact ? 11 : 13,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.2,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
