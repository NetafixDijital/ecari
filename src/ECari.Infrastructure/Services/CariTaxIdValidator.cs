namespace ECari.Infrastructure.Services;

internal static class CariTaxIdValidator
{
    public static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : new string(value.Where(char.IsDigit).ToArray());

    public static bool IsValidVkn(string? value)
    {
        var vkn = Normalize(value);
        if (vkn.Length != 10)
            return false;

        var digits = vkn.Select(c => c - '0').ToArray();
        var sum = 0;
        for (var i = 0; i < 9; i++)
        {
            var tmp = (digits[i] + (9 - i)) % 10;
            var mod = (tmp * (int)Math.Pow(2, 9 - i)) % 9;
            if (tmp != 0 && mod == 0)
                mod = 9;
            sum += mod;
        }

        return (10 - (sum % 10)) % 10 == digits[9];
    }

    public static bool IsValidTckn(string? value)
    {
        var tckn = Normalize(value);
        if (tckn.Length != 11 || tckn[0] == '0')
            return false;
        if (!tckn.All(char.IsDigit))
            return false;

        var d = tckn.Select(c => c - '0').ToArray();
        var sumOdd = d[0] + d[2] + d[4] + d[6] + d[8];
        var sumEven = d[1] + d[3] + d[5] + d[7];
        var digit10 = ((sumOdd * 7) - sumEven) % 10;
        if (digit10 < 0)
            digit10 += 10;
        if (d[9] != digit10)
            return false;

        var sum10 = d.Take(10).Sum();
        return d[10] == sum10 % 10;
    }
}
