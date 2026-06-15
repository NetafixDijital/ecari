import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/auth/auth_state.dart';
import '../../core/config/app_menu.dart';
import '../../core/config/bottom_nav_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/widgets/app_bottom_nav.dart';
import '../../core/widgets/app_header.dart';
import '../../core/widgets/app_sub_nav.dart';
import '../cari/cari_form_screen.dart';
import '../cari/cari_list_screen.dart';
import '../chq/chq_form_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../exp/exp_form_screen.dart';
import '../ord/ord_form_screen.dart';
import '../inv/inv_form_screen.dart';
import '../stok/stk_form_screen.dart';
import '../svc/svc_form_screen.dart';
import '../tsk/tsk_form_screen.dart';
import 'app_drawer.dart';
import 'module_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, this.initialMenuId = 'cari'});

  final String initialMenuId;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late String _menuId;
  late int _navIndex;
  int _cariRefreshKey = 0;
  int _moduleRefreshKey = 0;
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    final groupIndex = BottomNavConfig.groupIndexForMenuId(widget.initialMenuId);
    if (groupIndex != null) {
      _menuId = widget.initialMenuId;
      _navIndex = groupIndex;
    } else {
      _menuId = widget.initialMenuId;
      _navIndex = 0;
    }
  }

  int? get _bottomNavGroupIndex => BottomNavConfig.groupIndexForMenuId(_menuId);

  BottomNavGroup? get _activeBottomGroup {
    final idx = _bottomNavGroupIndex;
    if (idx == null) return null;
    return BottomNavConfig.groups[idx];
  }

  bool get _showBottomSubNav => _bottomNavGroupIndex != null;

  void _openDrawer() => _scaffoldKey.currentState?.openDrawer();

  void _selectMenu(String id) {
    final groupIndex = BottomNavConfig.groupIndexForMenuId(id);
    setState(() {
      _menuId = id;
      if (groupIndex != null) _navIndex = groupIndex;
    });
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      Navigator.of(context).pop();
    }
  }

  void _selectBottomNav(int index) {
    final group = BottomNavConfig.groups[index];
    setState(() {
      _navIndex = index;
      _menuId = group.defaultMenuId;
    });
  }

  void _selectSubNav(String menuId) => setState(() => _menuId = menuId);

  void _goCari() => _selectMenu('cari');

  void _goTahsilat() => _selectMenu('tahsilat');

  void _refreshCari() => setState(() => _cariRefreshKey++);

  void _refreshModule() => setState(() => _moduleRefreshKey++);

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
        _navIndex = 0;
        _cariRefreshKey++;
      });
    }
  }

  Future<void> _openCreateForMenu() async {
    final Widget screen = switch (_menuId) {
      'stok' => const StkFormScreen(),
      'fatura-satis' => const InvFormScreen(),
      'fatura-alis' => const InvFormScreen(invoiceType: 'PURCHASE'),
      'gorev' => const TskFormScreen(),
      'servis' => const SvcFormScreen(),
      'masraf' => const ExpFormScreen(),
      'siparis' => const OrdFormScreen(),
      'cek' => const ChqFormScreen(),
      _ => const SizedBox.shrink(),
    };
    if (screen is SizedBox) return;
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => screen),
    );
    if (created == true && mounted) _refreshModule();
  }

  ({String label, VoidCallback action})? _fabAction() {
    return switch (_menuId) {
      'cari' => (label: 'Yeni Cari Kart', action: _openNewCari),
      'stok' => (label: 'Yeni Stok Tanımı', action: _openCreateForMenu),
      'fatura-satis' => (label: 'Yeni Satış Faturası', action: _openCreateForMenu),
      'fatura-alis' => (label: 'Yeni Alış Faturası', action: _openCreateForMenu),
      'gorev' => (label: 'Yeni Görev', action: _openCreateForMenu),
      'servis' => (label: 'Yeni Servis', action: _openCreateForMenu),
      'masraf' => (label: 'Yeni Masraf', action: _openCreateForMenu),
      'siparis' => (label: 'Yeni Sipariş', action: _openCreateForMenu),
      'cek' => (label: 'Yeni Çek', action: _openCreateForMenu),
      _ => null,
    };
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
    final bottomTitle = BottomNavConfig.titleForMenuId(_menuId);
    if (bottomTitle != _menuId) return bottomTitle;
    return AppMenu.titleFor(_menuId);
  }

  String? _headerSubtitle(AuthState auth) {
    if (_menuId == 'home') return dashboardDateSubtitle();
    final group = _activeBottomGroup;
    if (group != null && BottomNavConfig.groupIndexForMenuId(_menuId) != null) {
      return group.label;
    }
    return auth.companyName;
  }

  Widget _moduleContent() {
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
      _ => KeyedSubtree(
          key: ValueKey('module-$_menuId-$_moduleRefreshKey'),
          child: moduleScreenFor(_menuId, onSuccess: _refreshCari),
        ),
    };
  }

  Widget _body() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_showBottomSubNav && _activeBottomGroup != null)
          AppSubNav(
            group: _activeBottomGroup!,
            selectedMenuId: _menuId,
            onSelect: _selectSubNav,
            actionLabel: _fabAction()?.label,
            onAction: _fabAction()?.action,
          ),
        Expanded(child: _moduleContent()),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final fab = _fabAction();

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
        onTap: _selectBottomNav,
      ),
      floatingActionButton: fab == null
          ? null
          : Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: FloatingActionButton.extended(
                onPressed: fab.action,
                elevation: 4,
                icon: const Icon(Icons.add_rounded),
                label: Text(fab.label),
              ),
            ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }
}
