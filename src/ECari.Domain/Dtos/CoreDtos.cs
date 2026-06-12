namespace ECari.Domain.Dtos;

public record LookupItemDto(long Id, string Code, string Name);

public record CityDto(long Id, string? PlateCode, string Name);

public record DistrictDto(long Id, long CityId, string Name);

public record TaxRateDto(long Id, string Code, string Name, decimal Rate);

public record PaymentTermDto(long Id, string Code, string Name, int DueDays);
