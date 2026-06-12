class CariAccount {
  CariAccount({
    required this.id,
    required this.code,
    required this.title,
    required this.personType,
    required this.balance,
    required this.balanceSide,
    required this.isActive,
    this.phone,
    this.taxNumber,
    this.identityNumber,
  });

  final int id;
  final String code;
  final String title;
  final String personType;
  final double balance;
  final String balanceSide;
  final bool isActive;
  final String? phone;
  final String? taxNumber;
  final String? identityNumber;

  factory CariAccount.fromJson(Map<String, dynamic> json) => CariAccount(
        id: json['id'] as int,
        code: json['code'] as String,
        title: json['title'] as String,
        personType: json['personType'] as String,
        balance: (json['balance'] as num).toDouble(),
        balanceSide: json['balanceSide'] as String? ?? '',
        isActive: json['isActive'] as bool? ?? true,
        phone: json['phone'] as String?,
        taxNumber: json['taxNumber'] as String?,
        identityNumber: json['identityNumber'] as String?,
      );

  String get taxId => taxNumber ?? identityNumber ?? '—';
}

class CariMovement {
  CariMovement({
    required this.accountTitle,
    required this.movementDate,
    required this.movementTypeLabel,
    required this.debit,
    required this.credit,
    required this.runningBalance,
    this.description,
  });

  final String accountTitle;
  final String movementDate;
  final String movementTypeLabel;
  final String? description;
  final double debit;
  final double credit;
  final double runningBalance;

  factory CariMovement.fromJson(Map<String, dynamic> json) => CariMovement(
        accountTitle: json['accountTitle'] as String? ?? '',
        movementDate: json['movementDate'] as String? ?? '',
        movementTypeLabel: json['movementTypeLabel'] as String? ?? '',
        description: json['description'] as String?,
        debit: (json['debit'] as num?)?.toDouble() ?? 0,
        credit: (json['credit'] as num?)?.toDouble() ?? 0,
        runningBalance: (json['runningBalance'] as num?)?.toDouble() ?? 0,
      );
}

class CreateCariRequest {
  CreateCariRequest({
    required this.personType,
    required this.title,
    this.taxNumber,
    this.identityNumber,
    this.phone,
    this.email,
  });

  final String personType;
  final String title;
  final String? taxNumber;
  final String? identityNumber;
  final String? phone;
  final String? email;

  Map<String, dynamic> toJson() => {
        'personType': personType,
        'title': title,
        'taxNumber': taxNumber,
        'identityNumber': identityNumber,
        'phone': phone,
        'email': email,
        'accountType': 'CUSTOMER',
      };
}
