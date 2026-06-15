import '../../core/api/api_client.dart';

class AuthUserListItem {
  AuthUserListItem({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.permissionSummary,
    required this.isActive,
    required this.createdAt,
  });

  final int id;
  final String fullName;
  final String email;
  final String? phone;
  final String permissionSummary;
  final bool isActive;
  final String createdAt;

  factory AuthUserListItem.fromJson(Map<String, dynamic> json) => AuthUserListItem(
        id: json['id'] as int,
        fullName: json['fullName'] as String? ?? '',
        email: json['email'] as String? ?? '',
        phone: json['phone'] as String?,
        permissionSummary: json['permissionSummary'] as String? ?? '',
        isActive: json['isActive'] as bool? ?? true,
        createdAt: json['createdAt'] as String? ?? '',
      );
}

class AuthUserDetail {
  AuthUserDetail({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.isActive,
    required this.isBranchRestrictionEnabled,
    required this.maxBranchAccess,
    required this.permissionIds,
    required this.deniedBranchIds,
  });

  final int id;
  final String fullName;
  final String email;
  final String? phone;
  final bool isActive;
  final bool isBranchRestrictionEnabled;
  final int maxBranchAccess;
  final List<int> permissionIds;
  final List<int> deniedBranchIds;

  factory AuthUserDetail.fromJson(Map<String, dynamic> json) => AuthUserDetail(
        id: json['id'] as int,
        fullName: json['fullName'] as String? ?? '',
        email: json['email'] as String? ?? '',
        phone: json['phone'] as String?,
        isActive: json['isActive'] as bool? ?? true,
        isBranchRestrictionEnabled: json['isBranchRestrictionEnabled'] as bool? ?? false,
        maxBranchAccess: json['maxBranchAccess'] as int? ?? 3,
        permissionIds: (json['permissionIds'] as List<dynamic>? ?? []).map((e) => e as int).toList(),
        deniedBranchIds: (json['deniedBranchIds'] as List<dynamic>? ?? []).map((e) => e as int).toList(),
      );
}

class AuthPermission {
  AuthPermission({
    required this.id,
    required this.code,
    required this.name,
  });

  final int id;
  final String code;
  final String name;

  factory AuthPermission.fromJson(Map<String, dynamic> json) => AuthPermission(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
      );
}

class AuthPermissionGroup {
  AuthPermissionGroup({
    required this.id,
    required this.code,
    required this.name,
    required this.permissions,
  });

  final int id;
  final String code;
  final String name;
  final List<AuthPermission> permissions;

  factory AuthPermissionGroup.fromJson(Map<String, dynamic> json) => AuthPermissionGroup(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        permissions: (json['permissions'] as List<dynamic>? ?? [])
            .map((e) => AuthPermission.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class AuthBranch {
  AuthBranch({
    required this.id,
    required this.code,
    required this.name,
    required this.isHeadquarters,
  });

  final int id;
  final String code;
  final String name;
  final bool isHeadquarters;

  factory AuthBranch.fromJson(Map<String, dynamic> json) => AuthBranch(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        isHeadquarters: json['isHeadquarters'] as bool? ?? false,
      );
}

class AuthUsersRepository {
  AuthUsersRepository(this._api);
  final ApiClient _api;

  Future<List<AuthUserListItem>> list({String? search}) async {
    final data = await _api.getJson<List<dynamic>>(
      '/api/auth/users',
      query: search != null && search.isNotEmpty ? {'search': search} : null,
    );
    return data.map((e) => AuthUserListItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AuthUserDetail> getById(int id) async {
    final data = await _api.getJson<Map<String, dynamic>>('/api/auth/users/$id');
    return AuthUserDetail.fromJson(data);
  }

  Future<AuthUserDetail> create(Map<String, dynamic> body) async {
    final data = await _api.postJson<Map<String, dynamic>>('/api/auth/users', data: body);
    return AuthUserDetail.fromJson(data);
  }

  Future<AuthUserDetail> update(int id, Map<String, dynamic> body) async {
    final data = await _api.putJsonData<Map<String, dynamic>>('/api/auth/users/$id', data: body);
    return AuthUserDetail.fromJson(data);
  }

  Future<void> delete(int id) async {
    await _api.delete('/api/auth/users/$id');
  }

  Future<List<AuthPermissionGroup>> permissionTree() async {
    final data = await _api.getJson<List<dynamic>>('/api/auth/permissions/tree');
    return data.map((e) => AuthPermissionGroup.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<AuthBranch>> branches() async {
    final data = await _api.getJson<List<dynamic>>('/api/auth/branches');
    return data.map((e) => AuthBranch.fromJson(e as Map<String, dynamic>)).toList();
  }
}
