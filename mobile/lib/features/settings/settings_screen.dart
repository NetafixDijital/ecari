import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../auth_users/auth_user_list_screen.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/auth_state.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_surface.dart';

class CompanyProfile {
  CompanyProfile({
    required this.legalName,
    this.tradeName,
    required this.taxNumber,
    required this.taxOffice,
    this.address,
    this.phone,
    this.email,
    this.website,
  });

  final String legalName;
  final String? tradeName;
  final String taxNumber;
  final String taxOffice;
  final String? address;
  final String? phone;
  final String? email;
  final String? website;

  factory CompanyProfile.fromJson(Map<String, dynamic> json) => CompanyProfile(
        legalName: json['legalName'] as String? ?? '',
        tradeName: json['tradeName'] as String?,
        taxNumber: json['taxNumber'] as String? ?? '',
        taxOffice: json['taxOffice'] as String? ?? '',
        address: json['address'] as String?,
        phone: json['phone'] as String?,
        email: json['email'] as String?,
        website: json['website'] as String?,
      );
}

class CfgRepository {
  CfgRepository(this._api);
  final ApiClient _api;

  Future<CompanyProfile> companyProfile() async {
    final data = await _api.getJson<Map<String, dynamic>>('/api/cfg/company-profile');
    return CompanyProfile.fromJson(data);
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _loading = true;
  String? _error;
  CompanyProfile? _profile;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = CfgRepository(context.read<ApiClient>());
      final profile = await repo.companyProfile();
      if (mounted) setState(() => _profile = profile);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    if (_error != null) {
      return AppEmptyState(
        icon: Icons.cloud_off_outlined,
        title: 'Ayarlar yüklenemedi',
        message: _error!,
        actionLabel: 'Tekrar Dene',
        onAction: _load,
      );
    }

    final p = _profile!;
    final auth = context.watch<AuthState>();
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Şirket Bilgileri', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: AppSpacing.lg),
                _InfoRow('Unvan', p.legalName),
                if (p.tradeName != null) _InfoRow('Ticari Unvan', p.tradeName!),
                _InfoRow('VKN', p.taxNumber),
                _InfoRow('Vergi Dairesi', p.taxOffice),
                if (p.address != null) _InfoRow('Adres', p.address!),
                if (p.phone != null) _InfoRow('Telefon', p.phone!),
                if (p.email != null) _InfoRow('E-posta', p.email!),
                if (p.website != null) _InfoRow('Web', p.website!),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          if (auth.hasPermission('AUTH.USER.VIEW'))
            AppCard(
              child: ListTile(
                leading: const Icon(Icons.people_outline, color: AppColors.primary),
                title: const Text('Kullanıcılar', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Hesap ve izin yönetimi'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const AuthUserListScreen()),
                ),
              ),
            ),
          if (auth.hasPermission('AUTH.USER.VIEW')) const SizedBox(height: AppSpacing.md),
          Text(
            'Detaylı düzenleme web panelinden yapılabilir.',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.heading)),
        ],
      ),
    );
  }
}
