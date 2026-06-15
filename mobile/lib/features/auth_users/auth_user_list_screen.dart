import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_state.dart';
import '../../core/widgets/label_badge.dart';
import '../../core/widgets/module_list_page.dart';
import '../../core/widgets/module_list_tile.dart';
import 'auth_user_form_screen.dart';
import 'auth_users_repository.dart';

class AuthUserListScreen extends StatefulWidget {
  const AuthUserListScreen({super.key});

  @override
  State<AuthUserListScreen> createState() => _AuthUserListScreenState();
}

class _AuthUserListScreenState extends State<AuthUserListScreen> {
  int _refreshKey = 0;

  Future<void> _openCreate() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const AuthUserFormScreen()),
    );
    if (created == true && mounted) setState(() => _refreshKey++);
  }

  Future<void> _openEdit(AuthUserListItem item) async {
    final updated = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => AuthUserFormScreen(userId: item.id)),
    );
    if (updated == true && mounted) setState(() => _refreshKey++);
  }

  @override
  Widget build(BuildContext context) {
    final repo = AuthUsersRepository(context.read<ApiClient>());
    final auth = context.watch<AuthState>();
    final canCreate = auth.hasPermission('AUTH.USER.CREATE');

    return Scaffold(
      body: ModuleListPage<AuthUserListItem>(
        key: ValueKey(_refreshKey),
        searchHint: 'Ad veya e-posta ara…',
        emptyIcon: Icons.people_outline,
        emptyTitle: 'Kullanıcı bulunamadı',
        loadItems: (s) => repo.list(search: s),
        itemBuilder: (context, item) => ModuleListTile(
          leadingIcon: Icons.person_outline,
          title: item.fullName,
          subtitle: '${item.email}${item.phone != null ? ' · ${item.phone}' : ''}',
          trailing: item.isActive ? 'Aktif' : 'Pasif',
          badge: item.permissionSummary.isEmpty ? null : item.permissionSummary,
          badgeTone: LabelBadgeTone.primary,
          onTap: () => _openEdit(item),
        ),
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: _openCreate,
              icon: const Icon(Icons.person_add_outlined),
              label: const Text('Yeni Kullanıcı'),
            )
          : null,
    );
  }
}
