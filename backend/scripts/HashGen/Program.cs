using Microsoft.AspNetCore.Identity;

var hasher = new PasswordHasher<string>();
var hash = hasher.HashPassword("user", args.Length > 0 ? args[0] : "Quocbao244405@");
Console.WriteLine(hash);
