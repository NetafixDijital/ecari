import '../../core/api/api_client.dart';

class TskTask {
  TskTask({
    required this.id,
    required this.taskNo,
    required this.title,
    required this.endDate,
    required this.statusKey,
    required this.statusLabel,
    required this.progressPercent,
    this.assigneeName,
    this.priorityLabel,
  });

  final int id;
  final String taskNo;
  final String title;
  final String endDate;
  final String? assigneeName;
  final String? priorityLabel;
  final String statusKey;
  final String statusLabel;
  final int progressPercent;

  factory TskTask.fromJson(Map<String, dynamic> json) => TskTask(
        id: json['id'] as int,
        taskNo: json['taskNo'] as String? ?? '',
        title: json['title'] as String? ?? '',
        endDate: json['endDate'] as String? ?? '',
        assigneeName: json['assigneeName'] as String?,
        priorityLabel: json['priorityLabel'] as String?,
        statusKey: json['statusKey'] as String? ?? '',
        statusLabel: json['statusLabel'] as String? ?? '',
        progressPercent: json['progressPercent'] as int? ?? 0,
      );
}

class TskRepository {
  TskRepository(this._api);
  final ApiClient _api;

  Future<List<TskTask>> list({String? status, String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/tsk/tasks',
      query: {
        if (status != null && status.isNotEmpty) 'status': status,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return data.map((e) => TskTask.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TskTask> getById(int id) async {
    final data = await _api.getJson<Map<String, dynamic>>('/api/tsk/tasks/$id');
    return TskTask.fromJson(data);
  }

  Future<TskTask> create({
    required String title,
    required String startDate,
    required String endDate,
    String? description,
    String? assigneeName,
    String priority = 'NORMAL',
  }) async {
    final data = await _api.postJson<Map<String, dynamic>>('/api/tsk/tasks', data: {
      'title': title,
      'description': description,
      'startDate': startDate,
      'endDate': endDate,
      'assigneeName': assigneeName,
      'priority': priority,
    });
    return TskTask.fromJson(data);
  }

  Future<TskTask> update({
    required int id,
    required String title,
    required String startDate,
    required String endDate,
    String? description,
    String? assigneeName,
    String priority = 'NORMAL',
    int? progressPercent,
  }) async {
    final data = await _api.putJsonData<Map<String, dynamic>>('/api/tsk/tasks/$id', data: {
      'title': title,
      'description': description,
      'startDate': startDate,
      'endDate': endDate,
      'assigneeName': assigneeName,
      'priority': priority,
      if (progressPercent != null) 'progressPercent': progressPercent,
    });
    return TskTask.fromJson(data);
  }

  Future<TskTask> updateStatus({
    required int id,
    required String status,
    int? progressPercent,
  }) async {
    final data = await _api.patchJsonData<Map<String, dynamic>>('/api/tsk/tasks/$id/status', data: {
      'status': status,
      if (progressPercent != null) 'progressPercent': progressPercent,
    });
    return TskTask.fromJson(data);
  }

  Future<void> delete(int id) async {
    await _api.delete('/api/tsk/tasks/$id');
  }
}
