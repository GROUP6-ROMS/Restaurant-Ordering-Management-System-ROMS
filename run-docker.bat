@echo off
title ROMS - Docker Container Launcher
cls
echo ===================================================================
echo   ROMS RESTAURANT SYSTEM - DOCKER LAUNCHER
echo ===================================================================
echo.

echo [1/3] Kiem tra trang thai Docker Desktop...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [THONG BAO] Docker Desktop chua bat. Dang khoi dong Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Vui long cho khoang 30 giay de Docker Engine khoi dong...
    echo Khi thay bieu tuong ca voi o goc phai duoi man hinh dung yen, bam phim bat ky.
    pause
)

echo.
echo [2/3] Dang build va khoi chay cac container ROMS...
echo Lenh: docker compose up -d --build
docker compose up -d --build

if %errorlevel% equ 0 (
    echo.
    echo ===================================================================
    echo   ROMS DA KHOI CHAY THANH CONG TREN DOCKER!
    echo ===================================================================
    echo   - Web ROMS:          http://localhost
    echo   - Cong Web phu:      http://localhost:5173
    echo   - Swagger API Docs:  http://localhost:8080/swagger-ui.html
    echo   - Actuator Health:   http://localhost:8080/actuator/health
    echo ===================================================================
) else (
    echo.
    echo [LOI] Docker compose chua thanh cong. Vui long kiem tra Docker Desktop da Engine running chua.
)

echo.
pause
