import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'core/api/api_client.dart';
import 'core/auth/auth_state.dart';
import 'core/auth/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/company_select_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/shell/home_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = true;
  await initializeDateFormatting('tr_TR');
  runApp(const EcariApp());
}

class EcariApp extends StatelessWidget {
  const EcariApp({super.key});

  @override
  Widget build(BuildContext context) {
    final storage = TokenStorage();
    final api = ApiClient(storage);
    final auth = AuthState(api: api, storage: storage)..bootstrap();

    return MultiProvider(
      providers: [
        Provider<TokenStorage>.value(value: storage),
        Provider<ApiClient>.value(value: api),
        ChangeNotifierProvider<AuthState>.value(value: auth),
      ],
      child: MaterialApp(
        title: 'E-Cari',
        theme: AppTheme.light(),
        home: const _RootGate(),
        routes: {
          '/login': (_) => const LoginScreen(),
          '/company': (_) => const CompanySelectScreen(),
          '/home': (_) => const HomeShell(initialMenuId: 'cari'),
        },
      ),
    );
  }
}

class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    if (auth.loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (!auth.isAuthenticated) {
      if (auth.user != null) return const CompanySelectScreen();
      return const LoginScreen();
    }
    return const HomeShell(initialMenuId: 'cari');
  }
}
