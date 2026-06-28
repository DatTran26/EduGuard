using StackExchange.Redis;

DotNetEnv.Env.TraversePath().Load();

var connectionString =
    Environment.GetEnvironmentVariable("ConnectionStrings__Redis")
    ?? args.FirstOrDefault()
    ?? "localhost:6379";

Console.WriteLine($"Redis target: {connectionString}");

try
{
    var options = ConfigurationOptions.Parse(connectionString);
    options.AbortOnConnectFail = true;
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
    Console.Error.WriteLine("Redis connection: FAILED");
    Console.Error.WriteLine(ex.Message);
    Console.Error.WriteLine("Kiem tra: docker start eduguard-redis hoac docker run -d --name eduguard-redis -p 6379:6379 redis:7-alpine");
    Environment.Exit(1);
}
