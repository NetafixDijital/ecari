import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/auth/auth_state.dart';
import '../../core/config/app_menu.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_bottom_nav.dart';
import '../../core/widgets/app_header.dart';
import '../cari/cari_form_screen.dart';
import '../cari/cari_list_screen.dart';
import '../dashboard/dashboard_screen.dart';
import 'app_drawer.dart';
import 'module_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, this.initialMenuId = 'home'});

  final String initialMenuId;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late String _menuId;
  int _cariRefreshKey = 0;
  int _navIndex = 0;
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _menuId = widget.initialMenuId;
    _navIndex = _menuId == 'cari' ? 1 : 0;
  }

  void _openDrawer() => _scaffoldKey.currentState?.openDrawer();

  void _selectMenu(String id) {
    setState(() {
      _menuId = id;
      if (id == 'home') {
        _navIndex = 0;
      } else if (id == 'cari') {
        _navIndex = 1;
      }
    });
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      Navigator.of(context).pop();
    }
  }

  void _goCari() => _selectMenu('cari');

  void _goTahsilat() => _selectMenu('tahsilat');

  void _refreshCari() => setState(() => _cariRefreshKey++);

  void _onNavTap(int index) {
    if (index == 2) {
      _openDrawer();
      return;
    }
    setState(() {
      _navIndex = index;
      _menuId = index == 0 ? 'home' : 'cari';
    });
  }

  Future<void> _logout() async {
    await context.read<AuthState>().logout();
    if (!mounted) return;
    Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
  }

  Future<void> _openNewCari() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const CariFormScreen()),
    );
    if (created == true && mounted) {
      setState(() {
        _menuId = 'cari';
        _navIndex = 1;
        _cariRefreshKey++;
      });
    }
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  String _headerTitle(AuthState auth) {
    if (_menuId == 'home') {
      final first = auth.user?.fullName.trim().split(RegExp(r'\s+')).firstOrNull;
      return first != null && first.isNotEmpty ? 'Merhaba, $first' : 'Ana Panel';
    }
    return AppMenu.titleFor(_menuId);
  }

  String? _headerSubtitle(AuthState auth) {
    if (_menuId == 'home') return dashboardDateSubtitle();
    return auth.companyName;
  }

  Widget _body() {
    return switch (_menuId) {
      'home' => DashboardScreen(
          onOpenCari: _goCari,
          onOpenTahsilat: _goTahsilat,
        ),
      'cari' => CariListScreen(
          key: ValueKey(_cariRefreshKey),
          onNewCari: _openNewCari,
          onFinanceDone: _refreshCari,
        ),
      _ => moduleScreenFor(_menuId, onSuccess: _refreshCari),
    };
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.bodyBg,
      appBar: AppHeader(
        title: _headerTitle(auth),
        subtitle: _headerSubtitle(auth),
        onMenuTap: _openDrawer,
        userInitials: auth.user != null ? _initials(auth.user!.fullName) : null,
      ),
      drawer: AppDrawer(
        selectedId: _menuId,
        onSelect: _selectMenu,
        onLogout: _logout,
      ),
      body: _body(),
      bottomNavigationBar: AppBottomNav(
        selectedIndex: _navIndex,
        onTap: _onNavTap,
      ),
      floatingActionButton: _menuId == 'cari'
          ? Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: FloatingActionButton.extended(
                onPressed: _openNewCari,
                elevation: 4,
                icon: const Icon(Icons.add_rounded),
                label: const Text('Yeni Cari'),
              ),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }
}
