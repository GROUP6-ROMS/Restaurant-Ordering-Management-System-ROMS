/**
 * ROMS Table Standee & Decal Generator (Chuẩn in ấn Decal / Mica để bàn)
 * Kết xuất đồ họa độ phân giải cao (1000 x 1500 px, chuẩn 300 DPI)
 * Hỗ trợ xuất file PNG sắc nét và in ấn trực tiếp không phụ thuộc mạng ngoài.
 */

export function generateStandeeCanvas({ table, restaurantProfile, qrCanvas }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');

  const isVip = Boolean(
    table.code?.toUpperCase().includes('VIP') ||
    table.name?.toUpperCase().includes('VIP') ||
    table.zone?.toUpperCase().includes('VIP') ||
    table.zoneName?.toUpperCase().includes('VIP')
  );

  const primaryColor = isVip ? '#78350F' : '#9D4124';
  const secondaryColor = isVip ? '#D97706' : '#C85A32';
  const brandName = restaurantProfile?.brandName || restaurantProfile?.name || 'ROMS RESTAURANT';
  const wifiName = restaurantProfile?.wifiName || 'ROMS-GUEST';
  const wifiPass = restaurantProfile?.wifiPassword || 'roms-welcome';

  // 1. Nền thẻ mica / decal (Màu kem ngà ấm sang trọng)
  ctx.fillStyle = isVip ? '#FFFDF8' : '#FFFDFB';
  ctx.fillRect(0, 0, 1000, 1500);

  // 2. Viền ngoài bo góc sang trọng (Outer Border)
  ctx.save();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, 30, 30, 940, 1440, 36);
  ctx.stroke();

  // 3. Viền chỉ mảnh bên trong (Inner Hairline Border)
  ctx.strokeStyle = isVip ? '#F59E0B' : '#E8C3BA';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 46, 46, 908, 1408, 26);
  ctx.stroke();
  ctx.restore();

  // 4. Họa tiết góc trang trí (Corner Accents)
  drawCornerDecorations(ctx, primaryColor);

  // 5. Header thương hiệu
  ctx.textAlign = 'center';
  ctx.fillStyle = primaryColor;
  ctx.font = '900 28px "Epilogue", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText(`★  ${brandName.toUpperCase()}  ★`, 500, 115);

  ctx.fillStyle = '#89726B';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('HỆ THỐNG GỌI MÓN THÔNG MINH TẠI BÀN', 500, 150);

  // Đường phân cách trang trí
  ctx.strokeStyle = '#F0E6E4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(180, 175);
  ctx.lineTo(820, 175);
  ctx.stroke();

  // Điểm nhấn giữa đường kẻ
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(500, 175, 5, 0, Math.PI * 2);
  ctx.fill();

  // 6. Huy hiệu phân loại bàn (Badge: BÀN ĂN / PHÒNG VIP)
  ctx.save();
  ctx.fillStyle = primaryColor;
  drawRoundedRect(ctx, 400, 205, 200, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(isVip ? 'PHÒNG VIP' : 'BÀN ĂN', 500, 234);
  ctx.restore();

  // 7. Mã số bàn to, nổi bật (Table Code Headline)
  ctx.fillStyle = '#1F1B1A';
  ctx.font = '900 80px "Epilogue", sans-serif';
  ctx.letterSpacing = '-1px';
  const tableCodeText = table.code?.toUpperCase().startsWith('T-') || table.code?.toUpperCase().startsWith('B-') || table.code?.toUpperCase().startsWith('VIP')
    ? table.code.toUpperCase()
    : (table.code ? `BÀN ${table.code}` : 'BÀN ĂN');
  ctx.fillText(tableCodeText, 500, 330);

  // Thông tin phân khu & sức chứa
  ctx.fillStyle = '#56423D';
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  const subInfo = `${table.name || ''}  •  ${table.zoneName || 'Khu vực phục vụ'}  •  ${table.capacity || 4} Chỗ ngồi`;
  ctx.fillText(subInfo, 500, 375);

  // 8. Khung chứa mã QR Code trung tâm
  const qrBoxX = 230;
  const qrBoxY = 415;
  const qrBoxSize = 540;

  ctx.save();
  // Đổ bóng mềm cho hộp QR
  ctx.shadowColor = 'rgba(157, 65, 36, 0.12)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
  ctx.fill();
  ctx.restore();

  // Viền hộp QR
  ctx.strokeStyle = '#EAE0DE';
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
  ctx.stroke();

  // Vẽ mã QR vào trong hộp
  if (qrCanvas) {
    const qrInnerX = qrBoxX + 35;
    const qrInnerY = qrBoxY + 35;
    const qrInnerSize = qrBoxSize - 70;
    ctx.drawImage(qrCanvas, qrInnerX, qrInnerY, qrInnerSize, qrInnerSize);

    // Vẽ logo ROMS nhỏ ở tâm mã QR
    const centerSize = 84;
    const centerX = qrBoxX + (qrBoxSize - centerSize) / 2;
    const centerY = qrBoxY + (qrBoxSize - centerSize) / 2;

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 8;
    drawRoundedRect(ctx, centerX, centerY, centerSize, centerSize, 16);
    ctx.fill();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, centerX, centerY, centerSize, centerSize, 16);
    ctx.stroke();

    ctx.fillStyle = primaryColor;
    ctx.font = '900 40px "Epilogue", sans-serif';
    ctx.fillText('R', 500, centerY + 56);
    ctx.restore();
  }

  // 9. Dòng kêu gọi hành động (Call To Action)
  ctx.fillStyle = primaryColor;
  ctx.font = '900 32px "Epilogue", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('📱 DÙNG CAMERA ĐIỆN THOẠI ĐỂ QUÉT MÃ', 500, 1025);

  // 10. Hộp hướng dẫn 3 bước thao tác
  const guideX = 110;
  const guideY = 1060;
  const guideW = 780;
  const guideH = 175;

  ctx.fillStyle = '#FAF6F5';
  drawRoundedRect(ctx, guideX, guideY, guideW, guideH, 20);
  ctx.fill();
  ctx.strokeStyle = '#F0E6E4';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, guideX, guideY, guideW, guideH, 20);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#2C221E';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';

  const steps = [
    '①  Mở ứng dụng Camera hoặc Zalo quét mã QR tại bàn',
    '②  Khám phá thực đơn đặc sắc & chọn món ăn yêu thích',
    '③  Bấm gửi đơn, Bếp KDS sẽ chế biến và phục vụ tận bàn'
  ];

  steps.forEach((st, idx) => {
    ctx.fillText(st, guideX + 36, guideY + 48 + idx * 46);
  });

  // 11. Hộp thông tin tiện ích WiFi
  ctx.textAlign = 'center';
  const wifiY = 1290;
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#EAE0DE';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 160, wifiY, 680, 72, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1F1B1A';
  ctx.font = '800 23px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`📶 WiFi: ${wifiName}   |   Mật khẩu: ${wifiPass}`, 500, wifiY + 44);
  ctx.restore();

  // 12. Chân trang (Footer)
  ctx.fillStyle = '#89726B';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Hotline hỗ trợ: 1900 8924  •  ROMS Smart Table Terminal  •  Cần hỗ trợ vui lòng gọi nhân viên', 500, 1420);

  return canvas;
}

/**
 * Tải file ảnh Tem Bàn PNG HD về máy tính
 */
export function downloadTableStandeePng({ table, restaurantProfile, qrCanvas }) {
  const canvas = generateStandeeCanvas({ table, restaurantProfile, qrCanvas });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeCode = (table.code || table.tableNumber || `Ban_${table.id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Tem_Ban_${safeCode}_ROMS.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, 'image/png');
}

/**
 * Hàm phụ trợ vẽ hình chữ nhật bo góc
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Vẽ 4 họa tiết cổ điển ở 4 góc thẻ
 */
function drawCornerDecorations(ctx, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  const offsets = [
    { x: 58, y: 58, dx: 1, dy: 1 },
    { x: 942, y: 58, dx: -1, dy: 1 },
    { x: 58, y: 1442, dx: 1, dy: -1 },
    { x: 942, y: 1442, dx: -1, dy: -1 },
  ];

  offsets.forEach(({ x, y, dx, dy }) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 24);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 24, y);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + dx * 8, y + dy * 8, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
