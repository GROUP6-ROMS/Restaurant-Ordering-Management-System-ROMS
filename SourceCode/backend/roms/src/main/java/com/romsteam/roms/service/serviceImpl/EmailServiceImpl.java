package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.ReservationItem;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    private static final DateTimeFormatter VI_DATETIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm - 'ngày' dd/MM/yyyy");
    private static final NumberFormat CURRENCY_FORMATTER = NumberFormat.getInstance(new Locale("vi", "VN"));

    private boolean isMailConfigured() {
        return mailSender != null
                && fromEmail != null && !fromEmail.trim().isEmpty()
                && mailPassword != null && !mailPassword.trim().isEmpty();
    }

    @Override
    public boolean sendOtpEmail(String toEmail, String recipientName, String otp) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("[EMAIL SERVICE] Địa chỉ email người nhận trống, không thể gửi OTP!");
            return false;
        }

        String safeName = (recipientName != null && !recipientName.trim().isEmpty()) ? recipientName.trim() : "Quản lý";

        if (!isMailConfigured()) {
            log.error("[EMAIL SERVICE] ❌ Chưa cấu hình thông tin Gmail (spring.mail.username / spring.mail.password)!");
            throw new AppException("Hệ thống chưa thiết lập cấu hình gửi email thật (Gmail SMTP). Vui lòng cấu hình tài khoản gửi thư!", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail, "ROMS Restaurant");
            helper.setTo(toEmail.trim());
            helper.setSubject("[ROMS] Mã xác thực OTP đặt lại mã PIN Quản lý: " + otp);

            String htmlContent = buildOtpHtmlContent(safeName, otp);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("[EMAIL SERVICE] ✅ Đã gửi email chứa mã OTP thành công tới: {}", toEmail);
            return true;

        } catch (Exception e) {
            log.error("[EMAIL SERVICE] ❌ Lỗi khi gửi email qua Gmail SMTP tới {}: {}", toEmail, e.getMessage(), e);
            throw new AppException("Không thể gửi email OTP qua máy chủ Gmail: " + e.getMessage() + ". Vui lòng kiểm tra lại cấu hình hoặc thử lại sau!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void sendReservationCreatedEmail(Reservation reservation) {
        if (reservation == null || reservation.getCustomerEmail() == null || reservation.getCustomerEmail().trim().isEmpty()) {
            return;
        }
        if (!isMailConfigured()) {
            log.warn("[EMAIL SERVICE] Bỏ qua gửi email xác nhận đặt bàn vì Gmail SMTP chưa được cấu hình.");
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                String toEmail = reservation.getCustomerEmail().trim();
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

                helper.setFrom(fromEmail, "ROMS Restaurant");
                helper.setTo(toEmail);
                helper.setSubject("[ROMS Restaurant] Tiếp nhận yêu cầu đặt bàn thành công - Mã #" + reservation.getBookingCode());

                String htmlContent = buildReservationCreatedHtml(reservation);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info("[EMAIL SERVICE] ✅ Đã gửi email tiếp nhận đặt bàn #{} tới: {}", reservation.getBookingCode(), toEmail);
            } catch (Exception e) {
                log.error("[EMAIL SERVICE] ❌ Lỗi khi gửi email tiếp nhận đặt bàn #{}: {}", reservation.getBookingCode(), e.getMessage());
            }
        });
    }

    @Override
    public void sendReservationConfirmedEmail(Reservation reservation, String tableNumber, String zoneName) {
        if (reservation == null || reservation.getCustomerEmail() == null || reservation.getCustomerEmail().trim().isEmpty()) {
            return;
        }
        if (!isMailConfigured()) {
            log.warn("[EMAIL SERVICE] Bỏ qua gửi email xác nhận xếp bàn vì Gmail SMTP chưa được cấu hình.");
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                String toEmail = reservation.getCustomerEmail().trim();
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

                helper.setFrom(fromEmail, "ROMS Restaurant");
                helper.setTo(toEmail);
                helper.setSubject("[ROMS Restaurant] Yêu cầu đặt bàn của bạn đã được xác nhận - Bàn " + tableNumber + " (Mã #" + reservation.getBookingCode() + ")");

                String htmlContent = buildReservationConfirmedHtml(reservation, tableNumber, zoneName);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info("[EMAIL SERVICE] ✅ Đã gửi email xác nhận xếp bàn #{} tới: {}", reservation.getBookingCode(), toEmail);
            } catch (Exception e) {
                log.error("[EMAIL SERVICE] ❌ Lỗi khi gửi email xác nhận xếp bàn #{}: {}", reservation.getBookingCode(), e.getMessage());
            }
        });
    }

    @Override
    public void sendReservationCancelledEmail(Reservation reservation, String cancelReason) {
        if (reservation == null || reservation.getCustomerEmail() == null || reservation.getCustomerEmail().trim().isEmpty()) {
            return;
        }
        if (!isMailConfigured()) {
            log.warn("[EMAIL SERVICE] Bỏ qua gửi email thông báo hủy bàn vì Gmail SMTP chưa được cấu hình.");
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                String toEmail = reservation.getCustomerEmail().trim();
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

                helper.setFrom(fromEmail, "ROMS Restaurant");
                helper.setTo(toEmail);
                helper.setSubject("[ROMS Restaurant] Thông báo hủy yêu cầu đặt bàn #" + reservation.getBookingCode());

                String htmlContent = buildReservationCancelledHtml(reservation, cancelReason);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info("[EMAIL SERVICE] ✅ Đã gửi email thông báo hủy đơn #{} tới: {}", reservation.getBookingCode(), toEmail);
            } catch (Exception e) {
                log.error("[EMAIL SERVICE] ❌ Lỗi khi gửi email thông báo hủy đơn #{}: {}", reservation.getBookingCode(), e.getMessage());
            }
        });
    }

    String buildOtpHtmlContent(String recipientName, String otp) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8F5F2; margin: 0; padding: 24px; color: #1F1B1A; }
                .email-container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #EAE0DE; }
                .header { background: linear-gradient(135deg, #9D4124 0%, #7D311A 100%); color: #FFFFFF; padding: 28px 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
                .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
                .body { padding: 32px 28px; }
                .greeting { font-size: 16px; font-weight: 700; color: #1F1B1A; margin-bottom: 12px; }
                .desc { font-size: 14px; color: #56423D; line-height: 1.6; margin-bottom: 24px; }
                .otp-box { background: #FFF8F6; border: 2px dashed #9D4124; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
                .otp-label { font-size: 12px; font-weight: 700; color: #89726B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .otp-code { font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #9D4124; font-family: monospace; }
                .otp-note { font-size: 12px; color: #BA1A1A; margin-top: 8px; font-weight: 600; }
                .warning { background: #FFF3E0; border-left: 4px solid #FFA000; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #56423D; margin-top: 24px; line-height: 1.5; }
                .footer { background: #FAF7F5; padding: 20px 24px; text-align: center; font-size: 12px; color: #89726B; border-top: 1px solid #EAE0DE; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h1>ROMS RESTAURANT</h1>
                  <p>Hệ Thống Quản Lý & Vận Hành Nhà Hàng Thông Minh</p>
                </div>
                <div class="body">
                  <div class="greeting">Xin chào {{RECIPIENT_NAME}},</div>
                  <div class="desc">
                    Hệ thống nhận được yêu cầu đặt lại mã PIN đăng nhập cho tài khoản Quản lý cơ sở của bạn.
                    Dưới đây là mã xác thực OTP dùng một lần để hoàn tất quy trình:
                  </div>
                  <div class="otp-box">
                    <div class="otp-label">MÃ XÁC THỰC OTP CỦA BẠN</div>
                    <div class="otp-code">{{OTP}}</div>
                    <div class="otp-note">⏱ Mã có hiệu lực trong vòng 5 phút</div>
                  </div>
                  <div class="warning">
                    ⚠️ <b>Lưu ý an toàn:</b> Tuyệt đối không chia sẻ mã xác thực này cho bất kỳ ai, bao gồm cả nhân viên nhà hàng. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và kiểm tra lại bảo mật tài khoản.
                  </div>
                </div>
                <div class="footer">
                  © 2026 ROMS Bistro • Hệ Thống Quản Lý & Vận Hành Nhà Hàng Thông Minh
                </div>
              </div>
            </body>
            </html>
            """
            .replace("{{RECIPIENT_NAME}}", recipientName != null ? recipientName : "Quản lý")
            .replace("{{OTP}}", otp != null ? otp : "------");
    }

    String buildReservationCreatedHtml(Reservation r) {
        String timeStr = r.getReservationTime() != null ? r.getReservationTime().format(VI_DATETIME_FORMATTER) : "Chưa xác định";
        String preOrderHtml = buildPreOrderItemsHtml(r);
        String zoneText = resolveZoneDisplayName(r.getRequestedZone());
        String guestStr = (r.getGuestCount() != null ? r.getGuestCount() : 1) + " khách";

        String noteRow = (r.getNote() != null && !r.getNote().trim().isEmpty())
                ? "<div class=\"detail-row\"><span class=\"detail-label\">📝 Ghi chú:</span><span class=\"detail-val\">" + r.getNote().trim() + "</span></div>"
                : "<div class=\"detail-row\"><span class=\"detail-label\">📝 Ghi chú:</span><span class=\"detail-val\" style=\"color: #89726B; font-weight: normal;\">Không có</span></div>";

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F5F2; margin: 0; padding: 24px 12px; color: #1F1B1A; }
                .email-card { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #EAE0DE; }
                .header-brand { background: linear-gradient(135deg, #9D4124 0%, #752811 100%); color: #FFFFFF; padding: 28px 24px; text-align: center; }
                .brand-title { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
                .brand-subtitle { margin: 6px 0 0; font-size: 13px; opacity: 0.92; letter-spacing: 0.5px; font-weight: 500; }
                .body-content { padding: 32px 26px; }
                .badge-pill { display: inline-block; background: #FEF3C7; color: #92400E; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 20px; border: 1.2px solid #FCD34D; text-transform: uppercase; margin-bottom: 18px; letter-spacing: 0.5px; }
                .greeting-text { font-size: 18px; font-weight: 800; color: #1F1B1A; margin-bottom: 10px; }
                .intro-text { font-size: 14px; color: #56423D; line-height: 1.65; margin-bottom: 22px; }
                .booking-code-box { background: #FFF8F6; border: 2px dashed #9D4124; border-radius: 14px; padding: 18px; text-align: center; margin-bottom: 24px; }
                .booking-code-label { font-size: 11px; font-weight: 800; color: #89726B; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px; }
                .booking-code-value { font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; color: #9D4124; letter-spacing: 3px; }
                .details-table-card { background: #FAF7F5; border: 1px solid #EAE0DE; border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
                .detail-row { border-bottom: 1px solid #EAE0DE; padding: 12px 18px; display: table; width: 100%; box-sizing: border-box; }
                .detail-row:last-child { border-bottom: none; }
                .detail-label { display: table-cell; width: 42%; font-size: 13px; color: #89726B; font-weight: 600; vertical-align: top; }
                .detail-val { display: table-cell; width: 58%; font-size: 13px; color: #1F1B1A; font-weight: 700; text-align: right; vertical-align: top; }
                .next-steps-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px 18px; border-radius: 6px; font-size: 13px; color: #1E40AF; line-height: 1.6; margin-top: 20px; }
                .footer-bar { background: #F8F5F2; padding: 22px 24px; text-align: center; font-size: 12px; color: #89726B; border-top: 1px solid #EAE0DE; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="email-card">
                <div class="header-brand">
                  <div class="brand-title">ROMS RESTAURANT</div>
                  <div class="brand-subtitle">Tinh Hoa Ẩm Thực • Phục Vụ Tận Tâm</div>
                </div>
                <div class="body-content">
                  <span class="badge-pill">⏳ ĐÃ TIẾP NHẬN YÊU CẦU ĐẶT BÀN</span>
                  <div class="greeting-text">Kính chào Quý khách {{CUSTOMER_NAME}},</div>
                  <div class="intro-text">
                    Cảm ơn Quý khách đã tin tưởng lựa chọn <b>ROMS Restaurant</b>. Hệ thống đã tiếp nhận thành công yêu cầu đặt bàn của Quý khách. Đội ngũ Quản lý nhà hàng đang kiểm tra sơ đồ bàn và sẽ liên hệ xác nhận trong thời gian sớm nhất!
                  </div>

                  <div class="booking-code-box">
                    <div class="booking-code-label">MÃ ĐẶT CHỖ CỦA QUÝ KHÁCH</div>
                    <div class="booking-code-value">{{BOOKING_CODE}}</div>
                    <div style="font-size: 12px; color: #89726B; margin-top: 6px;">Vui lòng lưu lại mã này để nhân viên đối soát khi đến nhà hàng</div>
                  </div>

                  <div class="details-table-card">
                    <div class="detail-row">
                      <span class="detail-label">👤 Khách hàng:</span>
                      <span class="detail-val">{{CUSTOMER_NAME}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">📞 Số điện thoại:</span>
                      <span class="detail-val">{{CUSTOMER_PHONE}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">✉️ Email thông báo:</span>
                      <span class="detail-val">{{CUSTOMER_EMAIL}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">📅 Thời gian hẹn:</span>
                      <span class="detail-val">{{RESERVATION_TIME}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">👥 Số lượng khách:</span>
                      <span class="detail-val">{{GUEST_COUNT}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">📍 Khu vực mong muốn:</span>
                      <span class="detail-val">{{ZONE_NAME}}</span>
                    </div>
                    {{NOTE_ROW}}
                    <div class="detail-row">
                      <span class="detail-label">⚡ Trạng thái:</span>
                      <span class="detail-val" style="color: #B45309;">Chờ Quản lý xác nhận & xếp bàn</span>
                    </div>
                  </div>

                  {{PRE_ORDER_HTML}}

                  <div class="next-steps-box">
                    💡 <b>Quy trình tiếp theo:</b> Quản lý ROMS Restaurant sẽ nhanh chóng bố trí vị trí bàn phù hợp nhất theo yêu cầu của Quý khách. Ngay sau khi xếp bàn xong, hệ thống sẽ tự động gửi <b>Email Thông Báo Xác Nhận Kèm Vị Trí Bàn Cụ Thể</b> đến hộp thư này.
                  </div>
                </div>
                <div class="footer-bar">
                  Hotline đặt bàn 24/7: <b style="color: #9D4124;">1900 6868</b> • Email: roms.service.restaurant@gmail.com<br>
                  Địa chỉ: Nhóm 6 - Đại học FPT & Tổ hợp Nhà Hàng ROMS<br>
                  © 2026 ROMS Restaurant. Trân trọng cảm ơn Quý khách!
                </div>
              </div>
            </body>
            </html>
            """
            .replace("{{CUSTOMER_NAME}}", r.getCustomerName() != null ? r.getCustomerName() : "Quý khách")
            .replace("{{BOOKING_CODE}}", r.getBookingCode() != null ? r.getBookingCode() : "N/A")
            .replace("{{CUSTOMER_PHONE}}", r.getCustomerPhone() != null ? r.getCustomerPhone() : "Chưa cập nhật")
            .replace("{{CUSTOMER_EMAIL}}", r.getCustomerEmail() != null ? r.getCustomerEmail() : "Chưa cập nhật")
            .replace("{{RESERVATION_TIME}}", timeStr)
            .replace("{{GUEST_COUNT}}", guestStr)
            .replace("{{ZONE_NAME}}", zoneText)
            .replace("{{NOTE_ROW}}", noteRow)
            .replace("{{PRE_ORDER_HTML}}", preOrderHtml);
    }

    String buildReservationConfirmedHtml(Reservation r, String tableNumber, String zoneName) {
        String timeStr = r.getReservationTime() != null ? r.getReservationTime().format(VI_DATETIME_FORMATTER) : "Chưa xác định";
        String preOrderHtml = buildPreOrderItemsHtml(r);
        String finalTable = (tableNumber != null && !tableNumber.trim().isEmpty()) ? tableNumber.trim() : "Bàn tiêu chuẩn";
        String finalZoneName = (zoneName != null && !zoneName.trim().isEmpty()) ? zoneName.trim() : "Khu vực tiêu chuẩn";
        String guestStr = (r.getGuestCount() != null ? r.getGuestCount() : 1) + " khách";

        String noteRow = (r.getNote() != null && !r.getNote().trim().isEmpty())
                ? "<div class=\"detail-row\"><span class=\"detail-label\">📝 Ghi chú:</span><span class=\"detail-val\">" + r.getNote().trim() + "</span></div>"
                : "<div class=\"detail-row\"><span class=\"detail-label\">📝 Ghi chú:</span><span class=\"detail-val\" style=\"color: #89726B; font-weight: normal;\">Không có</span></div>";

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F5F2; margin: 0; padding: 24px 12px; color: #1F1B1A; }
                .email-card { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #EAE0DE; }
                .header-brand { background: linear-gradient(135deg, #059669 0%, #046A4E 100%); color: #FFFFFF; padding: 28px 24px; text-align: center; }
                .brand-title { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
                .brand-subtitle { margin: 6px 0 0; font-size: 13px; opacity: 0.95; letter-spacing: 0.5px; font-weight: 500; }
                .body-content { padding: 32px 26px; }
                .badge-pill { display: inline-block; background: #D1FAE5; color: #065F46; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 20px; border: 1.2px solid #A7F3D0; text-transform: uppercase; margin-bottom: 18px; letter-spacing: 0.5px; }
                .greeting-text { font-size: 18px; font-weight: 800; color: #1F1B1A; margin-bottom: 10px; }
                .intro-text { font-size: 14px; color: #56423D; line-height: 1.65; margin-bottom: 22px; }
                .table-box-highlight { background: #ECFDF5; border: 2px solid #059669; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px; }
                .table-box-title { font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
                .table-box-name { font-size: 28px; font-weight: 900; color: #065F46; letter-spacing: 0.5px; }
                .table-box-desc { font-size: 13px; font-weight: 600; color: #059669; margin-top: 4px; }
                .details-table-card { background: #FAF7F5; border: 1px solid #EAE0DE; border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
                .detail-row { border-bottom: 1px solid #EAE0DE; padding: 12px 18px; display: table; width: 100%; box-sizing: border-box; }
                .detail-row:last-child { border-bottom: none; }
                .detail-label { display: table-cell; width: 42%; font-size: 13px; color: #89726B; font-weight: 600; vertical-align: top; }
                .detail-val { display: table-cell; width: 58%; font-size: 13px; color: #1F1B1A; font-weight: 700; text-align: right; vertical-align: top; }
                .safe-lock-box { background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 16px 18px; border-radius: 6px; font-size: 13px; color: #92400E; line-height: 1.6; margin-top: 20px; }
                .reception-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px 18px; border-radius: 6px; font-size: 13px; color: #1E40AF; line-height: 1.6; margin-top: 14px; }
                .footer-bar { background: #F8F5F2; padding: 22px 24px; text-align: center; font-size: 12px; color: #89726B; border-top: 1px solid #EAE0DE; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="email-card">
                <div class="header-brand">
                  <div class="brand-title">ROMS RESTAURANT</div>
                  <div class="brand-subtitle">Xác Nhận Giữ Chỗ & Bố Trí Bàn Ăn Thành Công</div>
                </div>
                <div class="body-content">
                  <span class="badge-pill">✅ ĐÃ XÁC NHẬN & ĐÃ XẾP BÀN</span>
                  <div class="greeting-text">Kính chào Quý khách {{CUSTOMER_NAME}},</div>
                  <div class="intro-text">
                    ROMS Restaurant trân trọng thông báo yêu cầu đặt bàn của Quý khách đã được Quản lý duyệt và <b>xếp vị trí bàn thành công</b>. Chúng tôi đã hoàn tất chuẩn bị để chào đón Quý khách và đoàn khách!
                  </div>

                  <div class="table-box-highlight">
                    <div class="table-box-title">VỊ TRÍ BÀN ĂN DÀNH RIÊNG CHO BẠN</div>
                    <div class="table-box-name">Bàn {{TABLE_NUMBER}}</div>
                    <div class="table-box-desc">📍 Phân khu: {{ZONE_NAME}}</div>
                  </div>

                  <div class="details-table-card">
                    <div class="detail-row">
                      <span class="detail-label">🏷️ Mã đặt chỗ:</span>
                      <span class="detail-val" style="font-family: monospace; font-size: 16px; color: #059669;">{{BOOKING_CODE}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">👤 Khách hàng:</span>
                      <span class="detail-val">{{CUSTOMER_NAME}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">📞 Số điện thoại:</span>
                      <span class="detail-val">{{CUSTOMER_PHONE}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">📅 Thời gian hẹn đón:</span>
                      <span class="detail-val">{{RESERVATION_TIME}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">👥 Số lượng khách:</span>
                      <span class="detail-val">{{GUEST_COUNT}}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">🪑 Vị trí đã bố trí:</span>
                      <span class="detail-val" style="color: #065F46;">Bàn {{TABLE_NUMBER}} ({{ZONE_NAME}})</span>
                    </div>
                    {{NOTE_ROW}}
                    <div class="detail-row">
                      <span class="detail-label">⚡ Trạng thái:</span>
                      <span class="detail-val" style="color: #059669;">Đã xác nhận & Khóa giữ chỗ an toàn</span>
                    </div>
                  </div>

                  {{PRE_ORDER_HTML}}

                  <div class="safe-lock-box">
                    🛡️ <b>Cam kết giữ chỗ an toàn (Buffer Lock):</b> Bàn ăn <b>{{TABLE_NUMBER}}</b> được kích hoạt chế độ khóa độc quyền trước 60 phút và nhà hàng cam kết bảo lưu giữ chỗ tối đa trong vòng <b>45 phút</b> kể từ giờ hẹn.
                  </div>

                  <div class="reception-box">
                    🛎️ <b>Hướng dẫn khi đến nhà hàng:</b> Khi đến ROMS Restaurant, Quý khách chỉ cần đọc <b>Mã đặt chỗ ({{BOOKING_CODE}})</b> hoặc <b>Số điện thoại ({{CUSTOMER_PHONE}})</b> tại quầy Lễ tân / Thu ngân để được nhân viên dẫn trực tiếp vào bàn đã chuẩn bị sẵn sàng.
                  </div>
                </div>
                <div class="footer-bar">
                  Hotline hỗ trợ 24/7: <b style="color: #059669;">1900 6868</b> • Email: roms.service.restaurant@gmail.com<br>
                  Địa chỉ: Nhóm 6 - Đại học FPT & Tổ hợp Nhà Hàng ROMS<br>
                  © 2026 ROMS Restaurant. Hân hạnh được đón tiếp và phục vụ Quý khách!
                </div>
              </div>
            </body>
            </html>
            """
            .replace("{{CUSTOMER_NAME}}", r.getCustomerName() != null ? r.getCustomerName() : "Quý khách")
            .replace("{{TABLE_NUMBER}}", finalTable)
            .replace("{{ZONE_NAME}}", finalZoneName)
            .replace("{{BOOKING_CODE}}", r.getBookingCode() != null ? r.getBookingCode() : "N/A")
            .replace("{{CUSTOMER_PHONE}}", r.getCustomerPhone() != null ? r.getCustomerPhone() : "Chưa cập nhật")
            .replace("{{RESERVATION_TIME}}", timeStr)
            .replace("{{GUEST_COUNT}}", guestStr)
            .replace("{{NOTE_ROW}}", noteRow)
            .replace("{{PRE_ORDER_HTML}}", preOrderHtml);
    }

    String buildReservationCancelledHtml(Reservation r, String cancelReason) {
        String timeStr = r.getReservationTime() != null ? r.getReservationTime().format(VI_DATETIME_FORMATTER) : "Chưa xác định";
        String reason = (cancelReason != null && !cancelReason.trim().isEmpty()) ? cancelReason.trim() : "Quản lý cập nhật theo yêu cầu khách hàng";

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F5F2; margin: 0; padding: 24px 12px; color: #1F1B1A; }
                .email-card { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #EAE0DE; }
                .header-brand { background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #FFFFFF; padding: 26px 24px; text-align: center; }
                .brand-title { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
                .body-content { padding: 30px 24px; }
                .badge-pill { display: inline-block; background: #FEE2E2; color: #991B1B; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 20px; border: 1px solid #FECACA; text-transform: uppercase; margin-bottom: 16px; }
                .greeting-text { font-size: 17px; font-weight: 700; color: #1F1B1A; margin-bottom: 10px; }
                .intro-text { font-size: 14px; color: #56423D; line-height: 1.6; margin-bottom: 20px; }
                .cancel-reason-box { background: #FEF2F2; border: 1.5px solid #FCA5A5; border-radius: 12px; padding: 16px; margin: 18px 0; font-size: 14px; color: #991B1B; line-height: 1.5; }
                .footer-bar { background: #FAF7F5; padding: 20px 24px; text-align: center; font-size: 12px; color: #89726B; border-top: 1px solid #EAE0DE; }
              </style>
            </head>
            <body>
              <div class="email-card">
                <div class="header-brand">
                  <div class="brand-title">ROMS RESTAURANT</div>
                  <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Thông Báo Đơn Đặt Bàn Đã Hủy</p>
                </div>
                <div class="body-content">
                  <span class="badge-pill">❌ ĐÃ HỦY ĐƠN ĐẶT BÀN</span>
                  <div class="greeting-text">Kính chào Quý khách {{CUSTOMER_NAME}},</div>
                  <div class="intro-text">
                    ROMS Restaurant rất tiếc phải thông báo đơn đặt bàn mang mã <b>#{{BOOKING_CODE}}</b> (hẹn lúc {{RESERVATION_TIME}}) đã được hủy trên hệ thống.
                  </div>

                  <div class="cancel-reason-box">
                    <b>Lý do hủy:</b> {{CANCEL_REASON}}
                  </div>

                  <p style="font-size: 14px; color: #56423D; line-height: 1.6;">
                    Nếu có bất kỳ sự nhầm lẫn nào hoặc Quý khách muốn đặt lại bàn vào một khung giờ khác, xin vui lòng liên hệ ngay với Tổng đài chăm sóc khách hàng của chúng tôi để được hỗ trợ tốt nhất.
                  </p>
                </div>
                <div class="footer-bar">
                  Hotline hỗ trợ: <b>1900 6868</b> • Email: roms.service.restaurant@gmail.com<br>
                  © 2026 ROMS Restaurant. Rất mong có cơ hội được phục vụ Quý khách trong những dịp tới!
                </div>
              </div>
            </body>
            </html>
            """
            .replace("{{CUSTOMER_NAME}}", r.getCustomerName() != null ? r.getCustomerName() : "Quý khách")
            .replace("{{BOOKING_CODE}}", r.getBookingCode() != null ? r.getBookingCode() : "N/A")
            .replace("{{RESERVATION_TIME}}", timeStr)
            .replace("{{CANCEL_REASON}}", reason);
    }

    private String buildPreOrderItemsHtml(Reservation r) {
        if (r.getItems() == null || r.getItems().isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<div style=\"margin-top: 18px; margin-bottom: 22px; border: 1px solid #EAE0DE; border-radius: 12px; overflow: hidden;\">");
        sb.append("<div style=\"background: #FDF9F7; padding: 10px 14px; font-size: 13px; font-weight: 800; color: #1F1B1A; border-bottom: 1px solid #EAE0DE;\">📋 Danh Sách Món Ăn Đặt Trước:</div>");
        sb.append("<table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">");
        sb.append("<tr style=\"background: #FAF7F5; border-bottom: 1px solid #EAE0DE; text-align: left;\">");
        sb.append("<th style=\"padding: 8px 12px; color: #89726B; font-weight: 600;\">Món ăn</th>");
        sb.append("<th style=\"padding: 8px 12px; text-align: center; color: #89726B; font-weight: 600;\">SL</th>");
        sb.append("<th style=\"padding: 8px 12px; text-align: right; color: #89726B; font-weight: 600;\">Thành tiền</th>");
        sb.append("</tr>");

        BigDecimal total = BigDecimal.ZERO;
        for (ReservationItem item : r.getItems()) {
            if (item.getQuantity() == null || item.getQuantity() <= 0) continue;
            String dishName = (item.getMenuItem() != null && item.getMenuItem().getName() != null)
                    ? item.getMenuItem().getName() : "Món ăn";
            BigDecimal subtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
            total = total.add(subtotal);

            sb.append("<tr style=\"border-bottom: 1px dashed #EAE0DE;\">");
            sb.append("<td style=\"padding: 10px 12px; font-weight: 600; color: #1F1B1A;\">").append(dishName).append("</td>");
            sb.append("<td style=\"padding: 10px 12px; text-align: center; color: #56423D; font-weight: 700;\">x").append(item.getQuantity()).append("</td>");
            sb.append("<td style=\"padding: 10px 12px; text-align: right; font-weight: 700; color: #9D4124;\">")
                    .append(CURRENCY_FORMATTER.format(subtotal)).append("₫</td>");
            sb.append("</tr>");
        }

        sb.append("<tr style=\"background: #FFF8F6; font-weight: 800;\">");
        sb.append("<td colspan=\"2\" style=\"padding: 12px; color: #1F1B1A;\">Tổng tiền tạm tính món đặt trước:</td>");
        sb.append("<td style=\"padding: 12px; text-align: right; color: #9D4124; font-size: 15px;\">")
                .append(CURRENCY_FORMATTER.format(total)).append("₫</td>");
        sb.append("</tr>");
        sb.append("</table>");
        sb.append("</div>");

        return sb.toString();
    }

    private String resolveZoneDisplayName(String zoneCode) {
        if (zoneCode == null || zoneCode.trim().isEmpty()) return "Tùy chọn sắp xếp của nhà hàng";
        return switch (zoneCode.trim().toUpperCase()) {
            case "VIP" -> "Phòng VIP Riêng Tư";
            case "ZONE_1" -> "Tầng 1 - Sảnh Chính";
            case "ZONE_2" -> "Tầng 2 - Ban Công Thoáng Mát";
            default -> zoneCode;
        };
    }
}
