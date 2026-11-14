#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ROMS Master Database Reset & Clean Seed Script
Sử dụng: Chạy file này trước khi vào phòng chấm thi 5-10 phút để reset sạch dữ liệu rác test,
đồng thời nạp mới toàn bộ kịch bản demo sống động với thời gian thực (Dynamic Realtime).
"""

import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = '222.255.184.250'
VPS_USER = 'root'
VPS_PASS = 'Romsswp391!@'
LOCAL_SQL_FILE = 'Documents/SEED_ROMS_DATABASE_14112026.sql'
REMOTE_TMP_SQL = '/tmp/SEED_ROMS_DATABASE_14112026.sql'

print("==================================================================")
print("🚀 ĐANG KHỞI CHẠY TIẾN TRÌNH RESET DỮ LIỆU SẠCH CHO BUỔI DEMO...")
print("==================================================================")

print(f"1. Kết nối tới máy chủ VPS ({VPS_HOST})...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(VPS_HOST, port=22, username=VPS_USER, password=VPS_PASS, timeout=15)
    print("   -> Kết nối thành công!")
except Exception as e:
    print(f"   ❌ Lỗi kết nối SSH: {e}")
    sys.exit(1)

print(f"2. Tải file script SQL chuẩn ({LOCAL_SQL_FILE}) lên máy chủ...")
sftp = ssh.open_sftp()
sftp.put(LOCAL_SQL_FILE, REMOTE_TMP_SQL)
sftp.close()
print("   -> Tải file lên VPS thành công!")

print("3. Sao chép vào container Database và thực thi làm sạch toàn bộ dữ liệu...")
cmds = [
    f'docker cp {REMOTE_TMP_SQL} roms-database:/tmp/seed_clean.sql',
    'docker exec roms-database /opt/mssql-tools18/bin/sqlcmd -I -S localhost -U sa -P "RomsPass123@2026" -C -d ROMS_DB -i /tmp/seed_clean.sql'
]

start_time = time.time()
for cmd in cmds:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if "Msg " in out:
        print("   ⚠️ SQL Message:", out.strip())
    if err and "Sqlcmd" in err:
        print("   ⚠️ SQL Error:", err.strip())

elapsed = round(time.time() - start_time, 2)
print(f"   -> Nạp và làm sạch Database hoàn tất trong {elapsed} giây!")

print("\n4. Kiểm tra trạng thái hệ thống sau khi reset:")
check_query = """SET NOCOUNT ON;
PRINT '--- TRẠNG THÁI CÁC BÀN ---';
SELECT table_number, status, ISNULL(blocked_reason, ISNULL(reserved_time, N'Sẵn sàng')) AS note FROM restaurant_tables ORDER BY id;
PRINT '--- PHIÊN ĂN ĐANG HOẠT ĐỘNG ---';
SELECT d.id AS session_id, t.table_number, d.guest_count, d.status, d.start_time FROM dining_sessions d JOIN restaurant_tables t ON d.table_id = t.id WHERE d.status = 'ACTIVE';
PRINT '--- VÉ BẾP KDS HIỆN TẠI ---';
SELECT o.id AS order_id, o.status, o.order_time FROM orders o WHERE o.status IN ('COOKING', 'CONFIRMED');
PRINT '--- THỐNG KÊ ĐƠN ĐẶT BÀN ---';
SELECT status, COUNT(*) AS count_res FROM reservations GROUP BY status;
"""

cmd_check = f'docker exec roms-database /opt/mssql-tools18/bin/sqlcmd -I -S localhost -U sa -P "RomsPass123@2026" -C -d ROMS_DB -W -Q "{check_query}"'
stdin, stdout, stderr = ssh.exec_command(cmd_check)
print(stdout.read().decode('utf-8'))

ssh.close()

print("==================================================================")
print("🎉 HỆ THỐNG ĐÃ SẴN SÀNG 100% CHO BUỔI BẢO VỆ ĐỒ ÁN!")
print("==================================================================")
print("🔑 THÔNG TIN TÀI KHOẢN DEMO (MÃ THẺ / MÃ PIN: 123456):")
print("  - Quản Lý: MGR-001 (Dương Trong)")
print("  - Phục Vụ: EMP-001 (Phạm Minh Đức)")
print("  - Bếp KDS: KDS-001 (Ngô Viết Bảo Huy)")
print("  - Thu Ngân: CSH-001 (Đỗ Võ Thanh Trung)")
print("🌐 Website: http://roms-restaurant.duckdns.org")
print("==================================================================")
