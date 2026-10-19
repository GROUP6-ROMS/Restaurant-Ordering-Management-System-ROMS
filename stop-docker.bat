@echo off
chcp 65001 > nul
echo ===================================================================
echo [ROMS] DỪNG HỆ THỐNG DOCKER CONTAINERS
echo ===================================================================
docker compose down
echo.
echo Đã dừng và thu hồi toàn bộ Container của ROMS thành công!
pause
