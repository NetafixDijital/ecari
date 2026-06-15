namespace ECari.Domain.Dtos;

public record AuthUserListItemDto(
    long Id,
    string FullName,
    string Email,
    string? Phone,
    string PermissionSummary,
    bool IsActive,
    DateTime CreatedAt);

public record AuthUserDetailDto(
    long Id,
    long SystemUserId,
    string FullName,
    string Email,
    string? Phone,
    bool IsActive,
    bool IsBranchRestrictionEnabled,
    int MaxBranchAccess,
    IReadOnlyList<long> PermissionIds,
    IReadOnlyList<long> DeniedBranchIds,
    DateTime CreatedAt);

public record CreateAuthUserRequest(
    string FullName,
    string Email,
    string? Phone,
    string Password,
    bool IsActive,
    bool IsBranchRestrictionEnabled,
    int MaxBranchAccess,
    IReadOnlyList<long> PermissionIds,
    IReadOnlyList<long> DeniedBranchIds);

public record UpdateAuthUserRequest(
    string FullName,
    string Email,
    string? Phone,
    string? Password,
    bool IsActive,
    bool IsBranchRestrictionEnabled,
    int MaxBranchAccess,
    IReadOnlyList<long> PermissionIds,
    IReadOnlyList<long> DeniedBranchIds);

public record AuthPermissionDto(
    long Id,
    string Code,
    string Name,
    string ModuleCode,
    string ActionCode);

public record AuthPermissionGroupDto(
    long Id,
    string Code,
    string Name,
    IReadOnlyList<AuthPermissionDto> Permissions);

public record AuthBranchDto(long Id, string Code, string Name, bool IsHeadquarters);

public record MeResponseDto(
    long OrgUserId,
    long SystemUserId,
    string FullName,
    string Email,
    string? Phone,
    IReadOnlyList<string> Permissions);
