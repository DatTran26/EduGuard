# Tat che do LAN: firewall rules + Docker LiveKit (coturn)
# Can chay PowerShell/CMD as Administrator de tat firewall.

$ErrorActionPreference = "Continue"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$livekitDir = Join-Path $repoRoot "infra\livekit"

$firewallRules = @(
    "EduGuard Vite 5173",
    "EduGuard API 5157",
    "LiveKit WS 7880",
    "LiveKit Media UDP"
)

Write-Host "=== Tat che do LAN (proctoring) ===" -ForegroundColor Cyan
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
    Write-Host "Canh bao: Khong chay Administrator - khong the tat firewall rule." -ForegroundColor Yellow
    Write-Host "Chuot phai close-lan.cmd -> Run as administrator" -ForegroundColor Yellow
    Write-Host ""
}
else {
    foreach ($name in $firewallRules) {
        $rule = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
        if ($rule) {
            Disable-NetFirewallRule -DisplayName $name
            Write-Host "[OK] Da tat firewall: $name" -ForegroundColor Green
        }
        else {
            Write-Host "[--] Khong co rule: $name" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "Dung Docker LiveKit + coturn..." -ForegroundColor Cyan
Push-Location $livekitDir
try {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $dockerOutput = & docker compose stop 2>&1
    $ErrorActionPreference = $prevEap

    foreach ($line in $dockerOutput) {
        $text = if ($line -is [System.Management.Automation.ErrorRecord]) { $line.ToString() } else { "$line" }
        if ($text.Trim()) {
            Write-Host $text
        }
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker compose stop" -ForegroundColor Green
    }
    else {
        Write-Host "[!!] Docker compose stop exit code: $LASTEXITCODE" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "[!!] Docker stop loi: $_" -ForegroundColor Yellow
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Luu y:" -ForegroundColor Yellow
Write-Host "  - API (dotnet) va Vite (npm) van chay neu chua Ctrl+C trong terminal."
Write-Host "  - cloudflared KHONG bi tat boi script nay."
Write-Host '  - Mo lai LAN: open-lan-firewall.cmd -> docker compose up -d'
Write-Host ""
