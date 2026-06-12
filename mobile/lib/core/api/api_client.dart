import 'package:dio/dio.dart';

import '../auth/token_storage.dart';
import '../config/app_config.dart';

class ApiClient {
  ApiClient(this._tokenStorage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json; charset=utf-8'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final TokenStorage _tokenStorage;
  late final Dio _dio;

  Dio get dio => _dio;

  Future<T> getJson<T>(String path, {Map<String, dynamic>? query}) async {
    final response = await _dio.get(path, queryParameters: query);
    return response.data as T;
  }

  Future<T> postJson<T>(String path, {Object? data}) async {
    final response = await _dio.post(path, data: data);
    return response.data as T;
  }

  Future<void> putJson(String path, {Object? data}) async {
    await _dio.put(path, data: data);
  }

  Future<void> delete(String path) async {
    await _dio.delete(path);
  }

  String messageFromError(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] is String) return data['message'] as String;
      return error.message ?? 'Bağlantı hatası';
    }
    return error.toString();
  }
}
