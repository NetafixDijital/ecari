using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace ECari.Infrastructure.Integrations.Edm;

public class CredentialProtector(IConfiguration configuration)
{
    private byte[] GetKey()
    {
        var keyText = configuration["CredentialEncryption:Key"]
            ?? configuration["Jwt:Secret"]
            ?? "ecari-default-credential-key-32b!";
        return SHA256.HashData(Encoding.UTF8.GetBytes(keyText));
    }

    public byte[] Protect(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return Array.Empty<byte>();

        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        using var aes = Aes.Create();
        aes.Key = GetKey();
        aes.GenerateIV();
        using var encryptor = aes.CreateEncryptor();
        var cipher = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        var result = new byte[aes.IV.Length + cipher.Length];
        Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
        Buffer.BlockCopy(cipher, 0, result, aes.IV.Length, cipher.Length);
        return result;
    }

    public string Unprotect(byte[] protectedBytes)
    {
        if (protectedBytes.Length == 0)
            return string.Empty;

        using var aes = Aes.Create();
        aes.Key = GetKey();
        var iv = new byte[aes.BlockSize / 8];
        var cipher = new byte[protectedBytes.Length - iv.Length];
        Buffer.BlockCopy(protectedBytes, 0, iv, 0, iv.Length);
        Buffer.BlockCopy(protectedBytes, iv.Length, cipher, 0, cipher.Length);
        aes.IV = iv;
        using var decryptor = aes.CreateDecryptor();
        var plain = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
        return Encoding.UTF8.GetString(plain);
    }
}
