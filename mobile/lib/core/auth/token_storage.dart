import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _tokenKey = 'access_token';
  static const _userNameKey = 'user_name';
  static const _companyCodeKey = 'company_code';
  static const _companyNameKey = 'company_name';

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<void> saveSession({
    required String token,
    String? userName,
    String? companyCode,
    String? companyName,
  }) async {
    await _storage.write(key: _tokenKey, value: token);
    if (userName != null) await _storage.write(key: _userNameKey, value: userName);
    if (companyCode != null) await _storage.write(key: _companyCodeKey, value: companyCode);
    if (companyName != null) await _storage.write(key: _companyNameKey, value: companyName);
  }

  Future<void> updateToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<String?> getUserName() => _storage.read(key: _userNameKey);
  Future<String?> getCompanyCode() => _storage.read(key: _companyCodeKey);
  Future<String?> getCompanyName() => _storage.read(key: _companyNameKey);

  Future<bool> hasSession() async {
    final token = await getToken();
    final company = await getCompanyCode();
    return token != null && token.isNotEmpty && company != null && company.isNotEmpty;
  }

  Future<void> clear() => _storage.deleteAll();
}
