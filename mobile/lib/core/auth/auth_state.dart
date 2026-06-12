import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import 'token_storage.dart';

class AuthUser {
  const AuthUser({required this.id, required this.fullName, required this.email});
  final int id;
  final String fullName;
  final String email;
}

class CompanyItem {
  const CompanyItem({
    required this.id,
    required this.code,
    required this.name,
    required this.isDefault,
  });
  final int id;
  final String code;
  final String name;
  final bool isDefault;

  factory CompanyItem.fromJson(Map<String, dynamic> json) => CompanyItem(
        id: json['id'] as int,
        code: json['code'] as String,
        name: json['name'] as String,
        isDefault: json['isDefault'] as bool? ?? false,
      );
}

class AuthState extends ChangeNotifier {
  AuthState({required ApiClient api, required TokenStorage storage})
      : _api = api,
        _storage = storage;

  final ApiClient _api;
  final TokenStorage _storage;

  bool _loading = true;
  AuthUser? _user;
  String? _companyCode;
  String? _companyName;

  bool get loading => _loading;
  AuthUser? get user => _user;
  String? get companyCode => _companyCode;
  String? get companyName => _companyName;
  bool get isAuthenticated => _user != null && _companyCode != null;

  Future<void> bootstrap() async {
    _loading = true;
    notifyListeners();
    try {
      final hasSession = await _storage.hasSession();
      if (hasSession) {
        _user = AuthUser(
          id: 0,
          fullName: await _storage.getUserName() ?? 'Kullanıcı',
          email: '',
        );
        _companyCode = await _storage.getCompanyCode();
        _companyName = await _storage.getCompanyName();
      }
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final data = await _api.postJson<Map<String, dynamic>>(
      '/api/auth/login',
      data: {'email': email, 'password': password},
    );
    final userJson = data['user'] as Map<String, dynamic>;
    _user = AuthUser(
      id: userJson['id'] as int,
      fullName: userJson['fullName'] as String,
      email: userJson['email'] as String,
    );
    await _storage.saveSession(
      token: data['accessToken'] as String,
      userName: _user!.fullName,
    );
    notifyListeners();
  }

  Future<List<CompanyItem>> fetchCompanies() async {
    final list = await _api.getJson<List<dynamic>>('/api/auth/companies');
    return list.map((e) => CompanyItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> selectCompany(CompanyItem company) async {
    final data = await _api.postJson<Map<String, dynamic>>(
      '/api/auth/select-company',
      data: {'companyId': company.id},
    );
    _companyCode = company.code;
    _companyName = company.name;
    await _storage.saveSession(
      token: data['accessToken'] as String,
      userName: _user?.fullName,
      companyCode: company.code,
      companyName: company.name,
    );
    notifyListeners();
  }

  Future<void> logout() async {
    await _storage.clear();
    _user = null;
    _companyCode = null;
    _companyName = null;
    notifyListeners();
  }
}
