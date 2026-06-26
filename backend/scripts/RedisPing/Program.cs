using StackExchange.Redis;

const string connectionString =
    "language-courageous-superbright-81984.db.redis.io:13982,user=default,password=EIQIgXToFksEeRzvGgUXJWH09HlR2B4t,ssl=False,abortConnect=False";

try
{
    var options = ConfigurationOptions.Parse(connectionString);
    options.AbortOnConnectFail = false;
    options.ConnectTimeout = 10000;

    await using var mux = await ConnectionMultiplexer.ConnectAsync(options);
    var db = mux.GetDatabase();
    var ping = await db.PingAsync();
    var testKey = "eduguard:smoke:backend";
    await db.StringSetAsync(testKey, "ok", TimeSpan.FromMinutes(1));
    var value = await db.StringGetAsync(testKey);

    Console.WriteLine($"PING: {ping.TotalMilliseconds:F0} ms");
    Console.WriteLine($"SET/GET {testKey} = {value}");
    Console.WriteLine("Redis connection: OK");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Redis connection: FAILED");
    Console.Error.WriteLine(ex.Message);
    Environment.Exit(1);
}
