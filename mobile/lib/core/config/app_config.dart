/// API tabanı — ortama göre değiştirin.
///
/// Canlı (APK): `https://ecariapi.netafix.com`
/// Android emülatör (lokal): `--dart-define=API_BASE_URL=http://10.0.2.2:5050`
/// Windows desktop (lokal): `--dart-define=API_BASE_URL=http://localhost:5050`
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://ecariapi.netafix.com',
  );
}
