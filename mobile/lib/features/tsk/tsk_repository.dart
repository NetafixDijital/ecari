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

  Future<List<TskTask>> list({String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/tsk/tasks',
      query: search != null && search.isNotEmpty ? {'search': search} : null,
    );
    return data.map((e) => TskTask.fromJson(e as Map<String, dynamic>)).toList();
  }
}
