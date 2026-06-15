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
    this.email,
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
  final String? email;

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
        email: json['email'] as String?,
      );

  String get taxId => taxNumber ?? identityNumber ?? '—';
  bool get isTuzel => personType == 'TUZEL_KISI';
}

class CariAccountDetail {
  CariAccountDetail({
    required this.id,
    required this.code,
    required this.accountType,
    required this.title,
    required this.personType,
    required this.countryCode,
    required this.balance,
    required this.isActive,
    this.addressLine,
    this.cityId,
    this.districtId,
    this.postalCode,
    this.paymentTermId,
    this.dueDays,
    this.taxNumber,
    this.identityNumber,
    this.taxOffice,
    this.phone,
    this.email,
  });

  final int id;
  final String code;
  final String accountType;
  final String title;
  final String personType;
  final String? addressLine;
  final int? cityId;
  final int? districtId;
  final String countryCode;
  final String? postalCode;
  final int? paymentTermId;
  final int? dueDays;
  final String? taxNumber;
  final String? identityNumber;
  final String? taxOffice;
  final String? phone;
  final String? email;
  final double balance;
  final bool isActive;

  factory CariAccountDetail.fromJson(Map<String, dynamic> json) => CariAccountDetail(
        id: json['id'] as int,
        code: json['code'] as String? ?? '',
        accountType: json['accountType'] as String? ?? '',
        title: json['title'] as String? ?? '',
        personType: json['personType'] as String? ?? '',
        addressLine: json['addressLine'] as String?,
        cityId: json['cityId'] as int?,
        districtId: json['districtId'] as int?,
        countryCode: json['countryCode'] as String? ?? 'TR',
        postalCode: json['postalCode'] as String?,
        paymentTermId: json['paymentTermId'] as int?,
        dueDays: json['dueDays'] as int?,
        taxNumber: json['taxNumber'] as String?,
        identityNumber: json['identityNumber'] as String?,
        taxOffice: json['taxOffice'] as String?,
        phone: json['phone'] as String?,
        email: json['email'] as String?,
        balance: (json['balance'] as num?)?.toDouble() ?? 0,
        isActive: json['isActive'] as bool? ?? true,
      );

  bool get isTuzel => personType == 'TUZEL_KISI';
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
    this.taxOffice,
    this.phone,
    this.email,
    this.addressLine,
    this.cityId,
    this.districtId,
    this.countryCode,
    this.postalCode,
    this.paymentTermId,
    this.dueDays,
  });

  final String personType;
  final String title;
  final String? taxNumber;
  final String? identityNumber;
  final String? taxOffice;
  final String? phone;
  final String? email;
  final String? addressLine;
  final int? cityId;
  final int? districtId;
  final String? countryCode;
  final String? postalCode;
  final int? paymentTermId;
  final int? dueDays;

  Map<String, dynamic> toJson() => {
        'personType': personType,
        'title': title,
        'taxNumber': taxNumber,
        'identityNumber': identityNumber,
        'taxOffice': taxOffice,
        'phone': phone,
        'email': email,
        'addressLine': addressLine,
        'cityId': cityId,
        'districtId': districtId,
        'countryCode': countryCode ?? 'TR',
        'postalCode': postalCode,
        'paymentTermId': paymentTermId,
        'dueDays': dueDays,
        'accountType': 'CUSTOMER',
      };
}

class UpdateCariRequest {
  UpdateCariRequest({
    required this.title,
    required this.isActive,
    this.taxNumber,
    this.identityNumber,
    this.taxOffice,
    this.phone,
    this.email,
    this.addressLine,
    this.cityId,
    this.districtId,
    this.countryCode,
    this.postalCode,
    this.paymentTermId,
    this.dueDays,
  });

  final String title;
  final bool isActive;
  final String? taxNumber;
  final String? identityNumber;
  final String? taxOffice;
  final String? phone;
  final String? email;
  final String? addressLine;
  final int? cityId;
  final int? districtId;
  final String? countryCode;
  final String? postalCode;
  final int? paymentTermId;
  final int? dueDays;

  Map<String, dynamic> toJson() => {
        'title': title,
        'isActive': isActive,
        'taxNumber': taxNumber,
        'identityNumber': identityNumber,
        'taxOffice': taxOffice,
        'phone': phone,
        'email': email,
        'addressLine': addressLine,
        'cityId': cityId,
        'districtId': districtId,
        'countryCode': countryCode ?? 'TR',
        'postalCode': postalCode,
        'paymentTermId': paymentTermId,
        'dueDays': dueDays,
      };
}
