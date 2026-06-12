import '../../core/api/api_client.dart';
import 'dashboard_models.dart';

class DashboardRepository {
  DashboardRepository(this._api);

  final ApiClient _api;

  Future<DashboardSummary> fetchSummary() async {
    final data = await _api.getJson<Map<String, dynamic>>('/api/core/dashboard');
    return DashboardSummary.fromJson(data);
  }
}
