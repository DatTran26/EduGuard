# Mo firewall cho che do LAN (can Administrator)
$ErrorActionPreference = "Stop"

$firewallRules = @(
    @{ Name = "EduGuard Vite 5173"; Protocol = "TCP"; Port = 5173 },
    @{ Name = "EduGuard API 5157"; Protocol = "TCP"; Port = 5157 },
    @{ Name = "LiveKit WS 7880"; Protocol = "TCP"; Port = 7880 },
    @{ Name = "LiveKit Media UDP"; Protocol = "UDP"; Port = "50000-50100" }
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
    Write-Host "Can chay as Administrator." -ForegroundColor Red
    exit 1
}

foreach ($r in $firewallRules) {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Enable-NetFirewallRule -DisplayName $r.Name
        Write-Host "[OK] Bat lai: $($r.Name)" -ForegroundColor Green
    }
    else {
        New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Protocol $r.Protocol -LocalPort $r.Port -Action Allow -Profile Private | Out-Null
        Write-Host "[OK] Tao moi: $($r.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Xong. Tiep theo: use-lan.cmd hoac use-tunnel.cmd -> docker compose up -d (neu chua chay)" -ForegroundColor Cyan
