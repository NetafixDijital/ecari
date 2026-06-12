/// API tabanı — ortama göre değiştirin.
///
/// Android emülatör: `http://10.0.2.2:5050`
/// iOS simülatör / Windows desktop: `http://localhost:5050`
/// Fiziksel cihaz: `http://{bilgisayar-ip}:5050`
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5050',
  );
}
