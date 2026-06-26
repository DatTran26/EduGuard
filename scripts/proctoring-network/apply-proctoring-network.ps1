param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("lan", "tailscale", "tunnel")]
    [string]$Mode,
    [switch]$SkipLiveKitRestart,
    [switch]$SkipFirewall
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$frontendEnv = Join-Path $repoRoot "frontend\.env"
$backendEnv = Join-Path $repoRoot "backend\EduGuard.Api\.env"
$livekitYaml = Join-Path $repoRoot "infra\livekit\livekit.yaml"
$livekitDir = Join-Path $repoRoot "infra\livekit"

function Get-RedisConnectionEnvValue {
    $appsettingsPath = Join-Path $repoRoot "backend\EduGuard.Api\appsettings.json"
    if (-not (Test-Path $appsettingsPath)) {
        return "localhost:6379"
    }

    $json = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
    $redis = [string]$json.ConnectionStrings.Redis
    if ([string]::IsNullOrWhiteSpace($redis)) {
        return "localhost:6379"
    }

    if ($redis -match '^redis://([^:]+):([^@]+)@([^:/]+):(\d+)$') {
        $user = $Matches[1]
        $password = $Matches[2]
        $redisHost = $Matches[3]
        $port = $Matches[4]
        return "${redisHost}:${port},user=${user},password=${password},ssl=False,abortConnect=False"
    }

    return $redis.Trim()
}

function Test-UsesLocalRedis {
    param([string]$ConnectionValue)
    return $ConnectionValue -match '(^|,)localhost:6379(,|$)|127\.0\.0\.1:6379'
}

function Ensure-RedisContainer {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host '[WARN] Docker khong co - Redis can chay: docker run -d --name eduguard-redis -p 6379:6379 redis:7-alpine' -ForegroundColor Yellow
        return
    }

    $containerName = "eduguard-redis"
    $existing = docker ps -a --filter "name=^${containerName}$" --format "{{.Names}}" 2>$null

    if ($existing -eq $containerName) {
        $running = docker ps --filter "name=^${containerName}$" --format "{{.Names}}" 2>$null
        if ($running -ne $containerName) {
            docker start $containerName | Out-Null
            Write-Host '[OK] Redis: da start eduguard-redis' -ForegroundColor Green
        }
        else {
            Write-Host '[OK] Redis: eduguard-redis dang chay' -ForegroundColor Green
        }
        return
    }

    docker run -d --name $containerName -p 6379:6379 redis:7-alpine | Out-Null
    Write-Host '[OK] Redis: da tao va start eduguard-redis (localhost:6379)' -ForegroundColor Green
}

function Get-LanIPv4 {
    $wifi = Get-NetIPAddress -InterfaceAlias "Wi-Fi" -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike "169.254.*" } |
        Select-Object -First 1
    if ($wifi) {
        return $wifi.IPAddress
    }

    $ethernet = Get-NetIPAddress -InterfaceAlias "Ethernet" -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike "169.254.*" } |
        Select-Object -First 1
    if ($ethernet) {
        return $ethernet.IPAddress
    }

    throw "Không tìm thấy IP LAN (Wi-Fi/Ethernet). Kiểm tra kết nối mạng."
}

function Get-TailscaleIPv4 {
    $ip = & tailscale ip -4 2>$null
    if (-not $ip) {
        throw "Tailscale chưa cài hoặc chưa đăng nhập. Chạy: tailscale up"
    }
    return $ip.Trim()
}

$liveKitHost = ""
$webOrigin = ""
$liveKitScheme = "ws"
$mediaNodeIp = ""
$tunnelHost = "livekit.wpcteam.homes"
$frontendOrigin = "https://class.wpcteam.homes"
$turnEnabled = $false

switch ($Mode) {
    "lan" {
        $ip = Get-LanIPv4
        $mediaNodeIp = $ip
        $liveKitHost = $ip
        $webOrigin = "http://${ip}:5173"
        Write-Host "LAN IP: $ip"
    }
    "tailscale" {
        $ip = Get-TailscaleIPv4
        $mediaNodeIp = $ip
        $liveKitHost = $ip
        $webOrigin = "http://${ip}:5173"
        Write-Host "Tailscale IP: $ip"
    }
    "tunnel" {
        $mediaNodeIp = Get-LanIPv4
        $liveKitHost = $tunnelHost
        $webOrigin = $frontendOrigin
        $liveKitScheme = "wss"
        $turnEnabled = $true
        Write-Host "Tunnel: wss://$tunnelHost"
        Write-Host "Media UDP (LAN): $mediaNodeIp"
    }
}

$liveKitUrl = "${liveKitScheme}://${liveKitHost}:7880"
if ($Mode -eq "tunnel") {
    $liveKitUrl = "${liveKitScheme}://${liveKitHost}"
}

$turnBlock = @"
WebRtc__IceServers__0__Urls__0=stun:stun.l.google.com:19302
"@

if ($turnEnabled) {
    $turnBlock += @"

WebRtc__IceServers__1__Urls__0=turn:${tunnelHost}:3478?transport=udp
WebRtc__IceServers__1__Urls__1=turn:${tunnelHost}:3478?transport=tcp
WebRtc__IceServers__1__Username=eduguard
WebRtc__IceServers__1__Credential=eduguard-dev-turn-secret
"@
}
else {
    $turnBlock += @"

# WebRtc__IceServers__1__Urls__0=turn:livekit.wpcteam.homes:3478?transport=udp
# WebRtc__IceServers__1__Urls__1=turn:livekit.wpcteam.homes:3478?transport=tcp
# WebRtc__IceServers__1__Username=eduguard
# WebRtc__IceServers__1__Credential=eduguard-dev-turn-secret
"@
}

$redisConnectionEnv = Get-RedisConnectionEnvValue

$frontendContent = @"
VITE_API_BASE_URL=/api
VITE_DEV_LOG=true

# Mode: $Mode (generated $(Get-Date -Format "yyyy-MM-dd HH:mm"))
VITE_LIVEKIT_URL=$liveKitUrl

# HS/GV mở: $webOrigin
# docs/PROCTORING_NETWORK_MODES.md
"@

$backendContent = @"

ConnectionStrings__Redis=$redisConnectionEnv
Redis__Enabled=true

# Redis: lay tu backend/EduGuard.Api/appsettings.json ConnectionStrings:Redis
LiveKit__Enabled=true
LiveKit__Url=$liveKitUrl
LiveKit__ApiKey=devkey
LiveKit__ApiSecret=eduguard-dev-livekit-secret

$turnBlock

Cors__AllowedOrigins__0=http://localhost:5173
Cors__AllowedOrigins__1=$webOrigin

# docs/PROCTORING_NETWORK_MODES.md
"@

function Write-Utf8NoBomFile {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Write-LiveKitYaml {
    param([string]$NodeIp)

    $generatedAt = Get-Date -Format "yyyy-MM-dd HH:mm"
    $content = @"
# Auto-generated by apply-proctoring-network.ps1 ($generatedAt) - mode: $Mode
# Media UDP clients on LAN reach node_ip; signaling uses VITE_LIVEKIT_URL / LiveKit__Url in .env
port: 7880
bind_addresses:
  - ""
rtc:
  tcp_port: 7881
  port_range_start: 57000
  port_range_end: 57100
  use_external_ip: false
  node_ip: $NodeIp
keys:
  devkey: eduguard-dev-livekit-secret
logging:
  level: info
"@

    Write-Utf8NoBomFile -Path $livekitYaml -Content $content.TrimEnd()
}

function Restart-LiveKitStack {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host '[SKIP] Docker khong co trong PATH - chay thu cong: cd infra\livekit; docker compose restart' -ForegroundColor Yellow
        return
    }

    if (-not (Test-Path (Join-Path $livekitDir "docker-compose.yml"))) {
        Write-Host "[SKIP] Khong tim thay infra\livekit\docker-compose.yml" -ForegroundColor Yellow
        return
    }

    Push-Location $livekitDir
    try {
        $null = docker compose ps --status running -q livekit 2>&1
        if ($LASTEXITCODE -eq 0 -and (docker compose ps --status running -q livekit 2>$null)) {
            Write-Host "Dang restart LiveKit..." -ForegroundColor Cyan
            docker compose restart livekit | Out-Host
        }
        else {
            Write-Host "Dang khoi dong LiveKit + coturn..." -ForegroundColor Cyan
            docker compose up -d | Out-Host
        }
    }
    finally {
        Pop-Location
    }
}

function Enable-LanFirewallRules {
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator
    )

    if (-not $isAdmin) {
        Write-Host "[WARN] Firewall LAN: can quyen Administrator." -ForegroundColor Yellow
        Write-Host "       Chay (Admin): scripts\proctoring-network\open-lan-firewall.cmd" -ForegroundColor Yellow
        return
    }

    $firewallRules = @(
        @{ Name = "EduGuard Vite 5173"; Protocol = "TCP"; Port = 5173 },
        @{ Name = "EduGuard API 5157"; Protocol = "TCP"; Port = 5157 },
        @{ Name = "LiveKit WS 7880"; Protocol = "TCP"; Port = 7880 },
        @{ Name = "LiveKit Media UDP"; Protocol = "UDP"; Port = "57000-57100" }
    )

    foreach ($r in $firewallRules) {
        $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
        if ($existing) {
            Enable-NetFirewallRule -DisplayName $r.Name | Out-Null
            Write-Host ('[OK] Firewall: ' + $r.Name) -ForegroundColor Green
        }
        else {
            New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Protocol $r.Protocol -LocalPort $r.Port -Action Allow -Profile Private | Out-Null
            Write-Host ('[OK] Firewall (moi): ' + $r.Name) -ForegroundColor Green
        }
    }
}

Write-Utf8NoBomFile -Path $frontendEnv -Content $frontendContent.TrimEnd()
Write-Utf8NoBomFile -Path $backendEnv -Content $backendContent.TrimStart()
Write-LiveKitYaml -NodeIp $mediaNodeIp
if (Test-UsesLocalRedis $redisConnectionEnv) {
    Ensure-RedisContainer
}
else {
    Write-Host '[OK] Redis Cloud — bo qua docker eduguard-redis local' -ForegroundColor Green
}

if (-not $SkipLiveKitRestart) {
    Restart-LiveKitStack
}

if ($Mode -eq "tunnel" -and -not $SkipFirewall) {
    Enable-LanFirewallRules
}

Write-Host ""
Write-Host "Da cap nhat:" -ForegroundColor Green
Write-Host "  frontend\.env"
Write-Host "  backend\EduGuard.Api\.env"
Write-Host "  infra\livekit\livekit.yaml (node_ip=$mediaNodeIp)"
Write-Host ""
Write-Host "LiveKit WS: $liveKitUrl"
Write-Host "Web:        $webOrigin"
Write-Host ""
if ($Mode -eq "tunnel") {
    Write-Host "HS/GV tren cung Wi-Fi: mo $webOrigin (camera UDP qua $mediaNodeIp)" -ForegroundColor Cyan
}
Write-Host "Restart Vite + API de ap dung .env moi." -ForegroundColor Yellow
