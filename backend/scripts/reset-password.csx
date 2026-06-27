// Quick password hash generator for ASP.NET Identity v2
// Run: dotnet script reset-password.csx
using System.Security.Cryptography;
using System.Text;

// ASP.NET Core Identity v2 hash format
static string HashPasswordV2(string password)
{
    const int Pbkdf2IterCount = 100000;
    const int Pbkdf2SubkeyLength = 256 / 8;
    const int SaltSize = 128 / 8;

    byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
    byte[] subkey = Rfc2898DeriveBytes.Pbkdf2(
        Encoding.UTF8.GetBytes(password),
        salt,
        Pbkdf2IterCount,
        HashAlgorithmName.SHA256,
        Pbkdf2SubkeyLength);

    byte[] outputBytes = new byte[13 + salt.Length + subkey.Length];
    outputBytes[0] = 0x01; // format marker
    WriteNetworkByteOrder(outputBytes, 1, (uint)HashAlgorithmName.SHA256.ToString().Length);
    WriteNetworkByteOrder(outputBytes, 5, (uint)Pbkdf2IterCount);
    WriteNetworkByteOrder(outputBytes, 9, (uint)SaltSize);
    Buffer.BlockCopy(salt, 0, outputBytes, 13, salt.Length);
    Buffer.BlockCopy(subkey, 0, outputBytes, 13 + SaltSize, subkey.Length);
    return Convert.ToBase64String(outputBytes);
}

static void WriteNetworkByteOrder(byte[] buffer, int offset, uint value)
{
    buffer[offset + 0] = (byte)(value >> 24);
    buffer[offset + 1] = (byte)(value >> 16);
    buffer[offset + 2] = (byte)(value >> 8);
    buffer[offset + 3] = (byte)(value >> 0);
}

var hash = HashPasswordV2("Quocbao244405@");
Console.WriteLine(hash);
