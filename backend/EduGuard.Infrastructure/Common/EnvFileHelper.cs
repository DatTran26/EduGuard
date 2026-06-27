using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace EduGuard.Infrastructure.Common;

public static class EnvFileHelper
{
    private static string GetEnvFilePath()
    {
        var currentDir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (currentDir != null)
        {
            var tempFile = Path.Combine(currentDir.FullName, ".env");
            if (File.Exists(tempFile))
            {
                return tempFile;
            }
            currentDir = currentDir.Parent;
        }
        return Path.Combine(Directory.GetCurrentDirectory(), ".env");
    }

    public static void LoadEnv()
    {
        var path = GetEnvFilePath();
        if (!File.Exists(path)) return;

        try
        {
            var lines = File.ReadAllLines(path);
            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                    continue;

                var parts = line.Split('=', 2);
                if (parts.Length == 2)
                {
                    var key = parts[0].Trim();
                    var value = parts[1].Trim().Trim('"').Trim('\'');
                    Environment.SetEnvironmentVariable(key, value);
                    
                    if (key == "OPENAI_API_KEY")
                        Environment.SetEnvironmentVariable("OpenAI__ApiKey", value);
                    else if (key == "OPENAI_MODEL")
                        Environment.SetEnvironmentVariable("OpenAI__Model", value);
                    else if (key == "OPENAI_BASE_URL")
                        Environment.SetEnvironmentVariable("OpenAI__BaseUrl", value);
                }
            }
        }
        catch
        {
            // Ignore loading failures
        }
    }

    public static void SaveEnv(Dictionary<string, string> newValues)
    {
        var path = GetEnvFilePath();
        var lines = new List<string>();
        
        if (File.Exists(path))
        {
            lines = File.ReadAllLines(path).ToList();
        }

        var keysToUpdate = new HashSet<string>(newValues.Keys);

        for (int i = 0; i < lines.Count; i++)
        {
            var line = lines[i];
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                continue;

            var parts = line.Split('=', 2);
            if (parts.Length == 2)
            {
                var key = parts[0].Trim();
                if (keysToUpdate.Contains(key))
                {
                    lines[i] = $"{key}={newValues[key]}";
                    keysToUpdate.Remove(key);
                }
            }
        }

        foreach (var key in keysToUpdate)
        {
            lines.Add($"{key}={newValues[key]}");
        }

        File.WriteAllLines(path, lines);

        foreach (var kvp in newValues)
        {
            Environment.SetEnvironmentVariable(kvp.Key, kvp.Value);
            
            if (kvp.Key == "OPENAI_API_KEY")
                Environment.SetEnvironmentVariable("OpenAI__ApiKey", kvp.Value);
            else if (kvp.Key == "OPENAI_MODEL")
                Environment.SetEnvironmentVariable("OpenAI__Model", kvp.Value);
            else if (kvp.Key == "OPENAI_BASE_URL")
                Environment.SetEnvironmentVariable("OpenAI__BaseUrl", kvp.Value);
        }
    }
}
