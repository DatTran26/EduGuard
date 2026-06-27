# Kiem tra stack tunnel + firewall LAN (che do hybrid)
$ErrorActionPreference = "Continue"

function Test-HttpStatus {
    param([string]$Label, [string]$Url, [int]$TimeoutSec = 5)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
        Write-Host "[OK]   $Label -> $($r.StatusCode)" -ForegroundColor Green
        return $true
    }
    catch {
        $code = $null
        if ($_.Exception.Response) { $code = $_.Exception.Response.StatusCode.value__ }
        $detail = if ($code) { "HTTP $code" } else { $_.Exception.Message }
        Write-Host "[FAIL] $Label -> $detail" -ForegroundColor Red
        return $false
    }
}

Write-Host "=== EduGuard tunnel check ===" -ForegroundColor Cyan
Write-Host ""

$svc = Get-Service Cloudflared -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -eq "Running") {
    Write-Host "[OK]   Cloudflared service: Running" -ForegroundColor Green
}
else {
    Write-Host "[FAIL] Cloudflared service khong chay" -ForegroundColor Red
    Write-Host "       Cai dat: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "--- Origin local (may chu) ---" -ForegroundColor Cyan
$viteOk = Test-HttpStatus "Vite" "http://127.0.0.1:5173"
$lkOk = Test-HttpStatus "LiveKit HTTP" "http://127.0.0.1:7880"
$apiOk = Test-HttpStatus "API" "http://127.0.0.1:5157/api/Test"

Write-Host ""
Write-Host "--- Domain Cloudflare (6 lan) ---" -ForegroundColor Cyan
$burstResults = @()
1..6 | ForEach-Object {
    $n = $_
    try {
        $r = Invoke-WebRequest -Uri "https://class.wpcteam.homes" -UseBasicParsing -TimeoutSec 12
        $burstResults += $r.StatusCode
        Write-Host "  lan ${n}: OK $($r.StatusCode)" -ForegroundColor Green
    }
    catch {
        $burstResults += 502
        Write-Host "  lan ${n}: 502" -ForegroundColor Red
    }
}
$burstOk = @($burstResults | Where-Object { $_ -eq 200 }).Count
$classOk = $burstOk -eq 6
$intermittent = $burstOk -gt 0 -and $burstOk -lt 6

Write-Host ""
$lkBurst = @()
1..3 | ForEach-Object {
    $n = $_
    $metricsBefore = (Invoke-WebRequest -Uri "http://127.0.0.1:20241/metrics" -UseBasicParsing -TimeoutSec 3).Content
    $reqBefore = [regex]::Match($metricsBefore, 'cloudflared_tunnel_total_requests (\d+)').Groups[1].Value
    try {
        $r = Invoke-WebRequest -Uri "https://livekit.wpcteam.homes" -UseBasicParsing -TimeoutSec 12
        $lkBurst += $r.StatusCode
        $hitLocal = "?"
    }
    catch {
        $lkBurst += 502
    }
    $metricsAfter = (Invoke-WebRequest -Uri "http://127.0.0.1:20241/metrics" -UseBasicParsing -TimeoutSec 3).Content
    $reqAfter = [regex]::Match($metricsAfter, 'cloudflared_tunnel_total_requests (\d+)').Groups[1].Value
    $hitLocal = if ($reqAfter -gt $reqBefore) { "qua may nay" } else { "KHONG qua may nay" }
    $code = $lkBurst[-1]
    $color = if ($code -eq 200) { "Green" } else { "Red" }
    Write-Host "  livekit lan ${n}: $code ($hitLocal)" -ForegroundColor $color
}
$lkDomainOk = (@($lkBurst | Where-Object { $_ -eq 200 }).Count -eq 3)
$lkMissLocal = $lkBurst -contains 502 -and ($lkBurst.Count -eq 3)

Write-Host ""
Write-Host "--- Cloudflared metrics ---" -ForegroundColor Cyan
try {
    $metrics = (Invoke-WebRequest -Uri "http://127.0.0.1:20241/metrics" -UseBasicParsing -TimeoutSec 3).Content
    foreach ($pattern in @(
        "cloudflared_tunnel_ha_connections",
        "cloudflared_tunnel_total_requests",
        "cloudflared_tunnel_request_errors"
    )) {
        $line = ($metrics -split "`n" | Where-Object { $_ -match "^$pattern " } | Select-Object -First 1)
        if ($line) { Write-Host "  $line" }
    }
}
catch {
    Write-Host "  Khong doc duoc metrics :20241" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "--- Firewall LAN (UDP camera) ---" -ForegroundColor Cyan
$fwRules = @("EduGuard Vite 5173", "EduGuard API 5157", "LiveKit WS 7880", "LiveKit Media UDP")
foreach ($name in $fwRules) {
    $rule = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
    if ($rule -and ($rule | Where-Object { $_.Enabled -eq "True" })) {
        Write-Host "[OK]   $name" -ForegroundColor Green
    }
    elseif ($rule) {
        Write-Host "[OFF]  $name (da tao nhung dang tat)" -ForegroundColor Yellow
    }
    else {
        Write-Host "[MISS] $name -> chay open-lan-firewall.cmd (Admin)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Ket luan ===" -ForegroundColor Cyan

if (-not $viteOk -or -not $lkOk) {
    Write-Host "Origin chua san sang. Thu tu:" -ForegroundColor Yellow
    Write-Host "  1. cd infra\livekit && docker compose up -d"
    Write-Host "  2. cd backend\EduGuard.Api && dotnet run --launch-profile http"
    Write-Host "  3. cd frontend && npm run dev"
    Write-Host "  4. Restart-Service Cloudflared"
}

if ($intermittent) {
    Write-Host "PHAT HIEN: Local OK, domain luc duoc luc 502 ($burstOk/6 thanh cong)" -ForegroundColor Yellow
    Write-Host "  -> Nguyen nhan: NHIEU CONNECTOR tren cung tunnel (may cu offline)" -ForegroundColor Yellow
    Write-Host "  -> Sua: Zero Trust > Networks > Tunnels > [tunnel] > Connectors" -ForegroundColor Yellow
    Write-Host "     Xoa connector may khac / Inactive, chi giu may dang chay Vite+Docker" -ForegroundColor Yellow
    Write-Host "  -> localhost trong Public Hostname VAN DUOC, khong can doi 127.0.0.1" -ForegroundColor Yellow
}

if ($viteOk -and $lkOk -and -not $classOk -and -not $intermittent) {
    Write-Host "Local OK, domain 502 lien tuc -> thu:" -ForegroundColor Yellow
    Write-Host "  A) Xoa connector cu (Cloudflare > Tunnels > Connectors)"
    Write-Host "  B) Dam bao Vite + Docker chay truoc, roi Restart-Service Cloudflared"
    Write-Host "  C) Neu van loi: doi Service URL sang http://10.20.4.154:5173 (IP Wi-Fi may chu)"
}

if (-not $apiOk) {
    Write-Host "API :5157 chua chay -> dang nhap/API se loi du web mo duoc." -ForegroundColor Yellow
}

if ($classOk -and -not $lkDomainOk -and $lkOk) {
    Write-Host "class OK nhung livekit.wpcteam.homes loi:" -ForegroundColor Yellow
    Write-Host "  -> Neu log 'KHONG qua may nay': route livekit tro ve tunnel/connector khac" -ForegroundColor Yellow
    Write-Host "     Xoa Public Hostname livekit cu, them lai CUNG tunnel voi class" -ForegroundColor Yellow
    Write-Host "     Cloudflare DNS: livekit khong duoc tro A record IP public rieng" -ForegroundColor Yellow
    Write-Host "  -> Sau do: Restart-Service Cloudflared" -ForegroundColor Yellow
}

if ($classOk -and $lkDomainOk -and $apiOk) {
    Write-Host "Stack tunnel on. Mo: https://class.wpcteam.homes" -ForegroundColor Green
}

Write-Host ""
Write-Host "Docs: docs/PROCTORING_NETWORK_MODES.md" -ForegroundColor DarkGray
