import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_state.dart';
import '../../core/theme/app_colors.dart';
import 'auth_users_repository.dart';

class AuthUserFormScreen extends StatefulWidget {
  const AuthUserFormScreen({super.key, this.userId});

  final int? userId;

  @override
  State<AuthUserFormScreen> createState() => _AuthUserFormScreenState();
}

class _AuthUserFormScreenState extends State<AuthUserFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _passwordConfirm = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  bool _isActive = true;
  bool _branchRestriction = false;
  int _maxBranchAccess = 3;
  String? _error;
  List<AuthPermissionGroup> _groups = [];
  List<AuthBranch> _branches = [];
  final Set<int> _permissionIds = {};
  final Set<int> _deniedBranchIds = {};

  bool get _isEdit => widget.userId != null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _passwordConfirm.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = AuthUsersRepository(context.read<ApiClient>());
      final groups = await repo.permissionTree();
      final branches = await repo.branches();
      AuthUserDetail? user;
      if (_isEdit) user = await repo.getById(widget.userId!);
      if (!mounted) return;
      setState(() {
        _groups = groups;
        _branches = branches;
        if (user != null) {
          _fullName.text = user.fullName;
          _email.text = user.email;
          _phone.text = user.phone ?? '';
          _isActive = user.isActive;
          _branchRestriction = user.isBranchRestrictionEnabled;
          _maxBranchAccess = user.maxBranchAccess;
          _permissionIds
            ..clear()
            ..addAll(user.permissionIds);
          _deniedBranchIds
            ..clear()
            ..addAll(user.deniedBranchIds);
        }
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = context.read<ApiClient>().messageFromError(e);
        });
      }
    }
  }

  void _toggleGroup(AuthPermissionGroup group, bool? checked) {
    setState(() {
      for (final p in group.permissions) {
        if (checked == true) {
          _permissionIds.add(p.id);
        } else {
          _permissionIds.remove(p.id);
        }
      }
    });
  }

  Map<String, dynamic> _buildPayload() => {
        'fullName': _fullName.text.trim(),
        'email': _email.text.trim(),
        'phone': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        'isActive': _isActive,
        'isBranchRestrictionEnabled': _branchRestriction,
        'maxBranchAccess': _maxBranchAccess,
        'permissionIds': _permissionIds.toList(),
        'deniedBranchIds': _branchRestriction ? _deniedBranchIds.toList() : <int>[],
      };

  Future<void> _delete() async {
    if (widget.userId == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Kullanıcıyı Sil'),
        content: const Text('Bu kullanıcı hesabı silinsin mi?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await AuthUsersRepository(context.read<ApiClient>()).delete(widget.userId!);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_isEdit) {
      if (_password.text.length < 6) {
        setState(() => _error = 'Şifre en az 6 karakter olmalıdır.');
        return;
      }
      if (_password.text != _passwordConfirm.text) {
        setState(() => _error = 'Şifreler eşleşmiyor.');
        return;
      }
    } else if (_password.text.isNotEmpty && _password.text != _passwordConfirm.text) {
      setState(() => _error = 'Şifreler eşleşmiyor.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = AuthUsersRepository(context.read<ApiClient>());
      final payload = _buildPayload();
      if (_isEdit) {
        payload['password'] = _password.text.isEmpty ? null : _password.text;
        await repo.update(widget.userId!, payload);
      } else {
        payload['password'] = _password.text;
        await repo.create(payload);
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = context.read<ApiClient>().messageFromError(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(_isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'),
        actions: [
          if (_isEdit && context.watch<AuthState>().hasPermission('AUTH.USER.DELETE'))
            IconButton(
              icon: const Icon(Icons.delete_outline, color: AppColors.danger),
              onPressed: _saving ? null : _delete,
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.dangerSubtle, borderRadius: BorderRadius.circular(8)),
                child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
              ),
              const SizedBox(height: 12),
            ],
            TextFormField(
              controller: _fullName,
              decoration: const InputDecoration(labelText: 'Ad Soyad *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _email,
              decoration: const InputDecoration(labelText: 'E-posta *'),
              keyboardType: TextInputType.emailAddress,
              validator: (v) => v == null || v.trim().isEmpty ? 'Zorunlu' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _phone,
              decoration: const InputDecoration(labelText: 'Telefon'),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _password,
              decoration: InputDecoration(labelText: _isEdit ? 'Yeni Şifre' : 'Şifre *'),
              obscureText: true,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _passwordConfirm,
              decoration: InputDecoration(labelText: _isEdit ? 'Şifre Tekrar' : 'Şifre Tekrar *'),
              obscureText: true,
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Aktif kullanıcı'),
              value: _isActive,
              onChanged: (v) => setState(() => _isActive = v),
            ),
            const SizedBox(height: 8),
            const Text('İzinler', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 8),
            ..._groups.map((group) {
              final ids = group.permissions.map((p) => p.id).toList();
              final allChecked = ids.isNotEmpty && ids.every(_permissionIds.contains);
              final someChecked = ids.any(_permissionIds.contains);
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ExpansionTile(
                  title: Text(group.name),
                  leading: Checkbox(
                    tristate: true,
                    value: allChecked ? true : (someChecked ? null : false),
                    onChanged: (v) => _toggleGroup(group, v ?? false),
                  ),
                  children: group.permissions
                      .map(
                        (p) => CheckboxListTile(
                          title: Text(p.name),
                          subtitle: Text(p.code, style: Theme.of(context).textTheme.bodySmall),
                          value: _permissionIds.contains(p.id),
                          onChanged: (v) {
                            setState(() {
                              if (v == true) {
                                _permissionIds.add(p.id);
                              } else {
                                _permissionIds.remove(p.id);
                              }
                            });
                          },
                        ),
                      )
                      .toList(),
                ),
              );
            }),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Şube kısıt modu'),
              subtitle: const Text('İşaretli şubelere erişim yok'),
              value: _branchRestriction,
              onChanged: (v) => setState(() => _branchRestriction = v),
            ),
            if (_branchRestriction)
              ..._branches.map(
                (b) => CheckboxListTile(
                  title: Text(b.name),
                  subtitle: b.isHeadquarters ? const Text('Merkez') : null,
                  value: _deniedBranchIds.contains(b.id),
                  onChanged: (v) {
                    setState(() {
                      if (v == true) {
                        _deniedBranchIds.add(b.id);
                      } else {
                        _deniedBranchIds.remove(b.id);
                      }
                    });
                  },
                ),
              )
            else
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Varsayılan max şube'),
                trailing: SizedBox(
                  width: 72,
                  child: TextFormField(
                    initialValue: '$_maxBranchAccess',
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    onChanged: (v) => _maxBranchAccess = int.tryParse(v) ?? 3,
                  ),
                ),
              ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _saving ? null : _submit,
              child: Text(_saving ? 'Kaydediliyor...' : (_isEdit ? 'Güncelle' : 'Kaydet')),
            ),
          ],
        ),
      ),
    );
  }
}
