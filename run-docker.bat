@echo off
chcp 65001 > nul
echo ===================================================================
echo [ROMS] KHỞI CHẠY HỆ THỐNG QUA DOCKER (PRODUCTION CONTAINERIZATION)
echo ===================================================================
echo.
echo 1. Kiểm tra trạng thái Docker Desktop...
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo [THÔNG BÁO] Docker Desktop đang tắt. Đang khởi động Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Vui lòng đợi khoảng 30s để Docker Engine chuyển sang trạng thái xanh (Running)...
    pause
)

echo 2. Đang build và khởi chạy các dịch vụ (Frontend, Backend, Nginx)...
docker compose up -d --build

echo.
echo ===================================================================
echo [ROMS] HỆ THỐNG ĐÃ KHỞI CHẠY THÀNH CÔNG TRÊN DOCKER!
echo -------------------------------------------------------------------
echo * Ứng dụng Web ROMS:       http://localhost   (hoặc http://localhost:5173)
echo * Backend REST API Docs:    http://localhost:8080/swagger-ui.html
echo * Giám sát sức khỏe Hệ thống: http://localhost:8080/actuator/health
echo ===================================================================
echo.
pause
