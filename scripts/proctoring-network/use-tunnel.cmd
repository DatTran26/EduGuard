@echo off
cd /d "%~dp0"
echo === EduGuard tunnel + LAN hybrid (1 lenh) ===
echo Cap nhat .env, livekit.yaml (IP Wi-Fi), firewall LAN, restart LiveKit
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0apply-proctoring-network.ps1" -Mode tunnel
echo.
echo Tiep theo (neu chua chay):
echo   1. dotnet run --launch-profile http   (backend\EduGuard.Api)
echo   2. npm run dev   (frontend)
echo   3. Restart-Service Cloudflared   (Admin, neu vua bat may)
echo.
echo Redis da duoc script tu dong bat (eduguard-redis). Restart API neu vua moi bat Redis.
echo.
pause
