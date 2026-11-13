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

    @Value("${app.frontend.url:http://roms-restaurant.duckdns.org}")
    private String frontendBaseUrl;

    private static final DateTimeFormatter VI_DATETIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm - 'ngày' dd/MM/yyyy");
    private static final NumberFormat CURRENCY_FORMATTER = NumberFormat.getInstance(new Locale("vi", "VN"));

    private String getSafeBaseUrl() {
        if (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty() && !frontendBaseUrl.contains("localhost")) {
            return frontendBaseUrl.trim();
        }
        return "http://roms-restaurant.duckdns.org";
    }

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

            helper.setFrom(fromEmail, "ROMS Restaurant System");
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

                helper.setFrom(fromEmail, "ROMS Restaurant System");
                helper.setTo(toEmail);
                helper.setSubject("[ROMS] Tiếp nhận đơn đặt bàn #" + reservation.getBookingCode() + " - " + reservation.getCustomerName());

                String trackingUrl = getSafeBaseUrl() + "/reservation/tracking?code=" + reservation.getBookingCode();
                String htmlContent = buildReservationCreatedHtml(reservation, trackingUrl);
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

                helper.setFrom(fromEmail, "ROMS Restaurant System");
                helper.setTo(toEmail);
                helper.setSubject("[ROMS] Đơn đặt bàn #" + reservation.getBookingCode() + " ĐÃ ĐƯỢC XÁC NHẬN - Bàn " + tableNumber);

                String trackingUrl = getSafeBaseUrl() + "/reservation/tracking?code=" + reservation.getBookingCode();
                String htmlContent = buildReservationConfirmedHtml(reservation, tableNumber, zoneName, trackingUrl);
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

                helper.setFrom(fromEmail, "ROMS Restaurant System");
                helper.setTo(toEmail);
                helper.setSubject("[ROMS] Thông báo hủy đơn đặt bàn #" + reservation.getBookingCode());

                String htmlContent = buildReservationCancelledHtml(reservation, cancelReason);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info("[EMAIL SERVICE] ✅ Đã gửi email thông báo hủy đơn #{} tới: {}", reservation.getBookingCode(), toEmail);
            } catch (Exception e) {
                log.error("[EMAIL SERVICE] ❌ Lỗi khi gửi email thông báo hủy đơn #{}: {}", reservation.getBookingCode(), e.getMessage());
            }
        });
    }

    private String buildOtpHtmlContent(String recipientName, String otp) {
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
                  <div class="greeting">Xin chào %s,</div>
                  <div class="desc">
                    Hệ thống nhận được yêu cầu đặt lại mã PIN đăng nhập cho tài khoản Quản lý cơ sở của bạn.
                    Dưới đây là mã xác thực OTP dùng một lần để hoàn tất quy trình:
                  </div>
                  <div class="otp-box">
                    <div class="otp-label">MÃ XÁC THỰC OTP CỦA BẠN</div>
                    <div class="otp-code">%s</div>
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
            """.formatted(recipientName, otp);
    }

    private String buildReservationCreatedHtml(Reservation r, String trackingUrl) {
        String timeStr = r.getReservationTime() != null ? r.getReservationTime().format(VI_DATETIME_FORMATTER) : "Chưa xác định";
        String preOrderHtml = buildPreOrderItemsHtml(r);

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8F5F2; margin: 0; padding: 24px; color: #1F1B1A; }
                .email-container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #EAE0DE; }
                .header { background: linear-gradient(135deg, #9D4124 0%, #7D311A 100%); color: #FFFFFF; padding: 26px 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
                .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
                .body { padding: 30px 24px; }
                .status-badge { display: inline-block; background: #FEF3C7; color: #92400E; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 20px; border: 1px solid #FCD34D; text-transform: uppercase; margin-bottom: 16px; }
                .greeting { font-size: 17px; font-weight: 700; color: #1F1B1A; margin-bottom: 10px; }
                .desc { font-size: 14px; color: #56423D; line-height: 1.6; margin-bottom: 20px; }
                .info-card { background: #FFF8F6; border: 1.5px solid #FFDBC9; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                .info-label { color: #89726B; font-weight: 600; }
                .info-value { color: #1F1B1A; font-weight: 700; text-align: right; }
                .booking-code { font-family: monospace; font-size: 18px; font-weight: 900; color: #9D4124; letter-spacing: 1px; }
                .cta-btn { display: block; width: fit-content; margin: 24px auto 16px; background: #9D4124; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; text-align: center; box-shadow: 0 4px 12px rgba(157,65,36,0.25); }
                .notice-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #1E40AF; line-height: 1.5; margin-top: 16px; }
                .footer { background: #FAF7F5; padding: 20px 24px; text-align: center; font-size: 12px; color: #89726B; border-top: 1px solid #EAE0DE; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h1>ROMS RESTAURANT</h1>
                  <p>Tinh Hoa Ẩm Thực • Phục Vụ Tận Tâm</p>
                </div>
                <div class="body">
                  <span class="status-badge">⏳ ĐANG CHỜ NHÀ HÀNG XÁC NHẬN</span>
                  <div class="greeting">Kính chào Quý khách %s,</div>
                  <div class="desc">
                    ROMS Restaurant đã tiếp nhận yêu cầu đặt bàn của Quản lý/Thực khách. Quản lý nhà hàng sẽ liên hệ qua số điện thoại <b>%s</b> trong vòng <b>5 - 10 phút</b> để xác nhận và sắp xếp vị trí bàn phù hợp nhất!
                  </div>

                  <div class="info-card">
                    <div class="info-row">
                      <span class="info-label">Mã đặt chỗ tra cứu:</span>
                      <span class="info-value booking-code">%s</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Thời gian hẹn:</span>
                      <span class="info-value">%s</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Số lượng khách:</span>
                      <span class="info-value">%d người</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Khu vực mong muốn:</span>
                      <span class="info-value">%s</span>
                    </div>
                    %s
                  </div>

                  %s

                  <a href="%s" class="cta-btn" target="_blank">🔍 THEO DÕI TIẾN ĐỘ ĐƠN ĐẶT BÀN</a>

                  <div class="notice-box">
                    💡 <b>Lưu ý:</b> Quý khách có thể sử dụng Mã đặt chỗ hoặc Số điện thoại để tra cứu trạng thái bàn ăn trực tiếp trên website ROMS bất cứ lúc nào.
                  </div>
                </div>
                <div class="footer">
                  Hotline hỗ trợ 24/7: <b>1900 6868</b> • Email: roms.service.restaurant@gmail.com<br>
                  © 2026 ROMS Restaurant. Kính chúc Quý khách một bữa ăn ngon miệng và trọn vẹn!
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                r.getCustomerName(),
                r.getCustomerPhone(),
                r.getBookingCode(),
                timeStr,
                r.getGuestCount() != null ? r.getGuestCount() : 1,
                r.getRequestedZone() != null ? r.getRequestedZone() : "Tùy chọn",
                (r.getNote() != null && !r.getNote().trim().isEmpty())
                        ? "<div class=\"info-row\"><span class=\"info-label\">Ghi chú:</span><span class=\"info-value\">" + r.getNote().trim() + "</span></div>"
                        : "",
                preOrderHtml,
                trackingUrl
        );
    }

    private String buildReservationConfirmedHtml(Reservation r, String tableNumber, String zoneName, String trackingUrl) {
        String timeStr = r.getReservationTime() != null ? r.getReservationTime().format(VI_DATETIME_FORMATTER) : "Chưa xác định";
        String preOrderHtml = buildPreOrderItemsHtml(r);

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8F5F2; margin: 0; padding: 24px; color: #1F1B1A; }
                .email-container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #EAE0DE; }
                .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF; padding: 26px 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
                .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.95; }
                .body { padding: 30px 24px; }
                .status-badge { display: inline-block; background: #D1FAE5; color: #065F46; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 20px; border: 1px solid #A7F3D0; text-transform: uppercase; margin-bottom: 16px; }
                .greeting { font-size: 17px; font-weight: 700; color: #1F1B1A; margin-bottom: 10px; }
                .desc { font-size: 14px; color: #56423D; line-height: 1.6; margin-bottom: 20px; }
                .table-highlight { background: #ECFDF5; border: 2px solid #059669; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px; text-align: center; }
                .table-title { font-size: 13px; color: #047857; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
                .table-name { font-size: 26px; font-weight: 900; color: #065F46; }
                .info-card { background: #FFF8F6; border: 1.5px solid #FFDBC9; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                .info-label { color: #89726B; font-weight: 600; }
                .info-value { color: #1F1B1A; font-weight: 700; text-align: right; }
                .booking-code { font-family: monospace; font-size: 17px; font-weight: 900; color: #9D4124; }
                .cta-btn { display: block; width: fit-content; margin: 24px auto 16px; background: #059669; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; text-align: center; box-shadow: 0 4px 12px rgba(5,150,105,0.25); }
                .safe-lock-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 4px; font-size: 13px; color: #92400E; line-height: 1.55; margin-top: 16px; }
                .footer { background: #FAF7F5; padding: 20px 24px; text-align: center; font-size: 12px; color: #89726B; border-top: 1px solid #EAE0DE; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h1>ROMS RESTAURANT</h1>
                  <p>Xác Nhận Giữ Chỗ & Bàn Ăn Thành Công</p>
                </div>
                <div class="body">
                  <span class="status-badge">✅ ĐÃ XÁC NHẬN & XẾP BÀN</span>
                  <div class="greeting">Kính chào Quý khách %s,</div>
                  <div class="desc">
                    ROMS Restaurant trân trọng thông báo đơn đặt bàn của Quý khách đã được Quản lý kiểm duyệt và bố trí vị trí bàn hoàn tất!
                  </div>

                  <div class="table-highlight">
                    <div class="table-title">Vị trí bàn ăn dành riêng cho bạn</div>
                    <div class="table-name">Bàn %s • %s</div>
                  </div>

                  <div class="info-card">
                    <div class="info-row">
                      <span class="info-label">Mã đặt chỗ:</span>
                      <span class="info-value booking-code">%s</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Thời gian hẹn:</span>
                      <span class="info-value">%s</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Số lượng khách:</span>
                      <span class="info-value">%d người</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Số điện thoại liên hệ:</span>
                      <span class="info-value">%s</span>
                    </div>
                  </div>

                  %s

                  <a href="%s" class="cta-btn" target="_blank">📲 XEM THẺ ĐẶT BÀN & THỰC ĐƠN</a>

                  <div class="safe-lock-box">
                    🛡️ <b>Cam kết giữ bàn an toàn (Buffer Lock):</b> Bàn ăn của Quý khách được kích hoạt chế độ khóa độc quyền trước 60 phút và bảo lưu giữ chỗ trong vòng <b>45 phút</b> kể từ giờ hẹn. Khi đến nhà hàng, Quý khách chỉ cần đọc <b>Mã đặt chỗ (%s)</b> hoặc <b>Số điện thoại (%s)</b> cho Lễ tân để được đón tiếp ngay!
                  </div>
                </div>
                <div class="footer">
                  Hotline hỗ trợ 24/7: <b>1900 6868</b> • Email: roms.service.restaurant@gmail.com<br>
                  © 2026 ROMS Restaurant. Hân hạnh được đón tiếp Quý khách!
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                r.getCustomerName(),
                tableNumber,
                zoneName != null ? zoneName : "Khu vực tiêu chuẩn",
                r.getBookingCode(),
                timeStr,
                r.getGuestCount() != null ? r.getGuestCount() : 1,
                r.getCustomerPhone(),
                preOrderHtml,
                trackingUrl,
                r.getBookingCode(),
                r.getCustomerPhone()
        );
    }

    private String buildReservationCancelledHtml(Reservation r, String cancelReason) {
        String timeStr = r.getReservationTime() != null ? r.getReservationTime().format(VI_DATETIME_FORMATTER) : "Chưa xác định";

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8F5F2; margin: 0; padding: 24px; color: #1F1B1A; }
                .email-container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #EAE0DE; }
                .header { background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #FFFFFF; padding: 26px 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
                .body { padding: 30px 24px; }
                .status-badge { display: inline-block; background: #FEE2E2; color: #991B1B; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 20px; border: 1px solid #FECACA; text-transform: uppercase; margin-bottom: 16px; }
                .greeting { font-size: 17px; font-weight: 700; color: #1F1B1A; margin-bottom: 10px; }
                .desc { font-size: 14px; color: #56423D; line-height: 1.6; margin-bottom: 20px; }
                .cancel-reason-box { background: #FEF2F2; border: 1.5px solid #FCA5A5; border-radius: 12px; padding: 16px; margin: 18px 0; font-size: 14px; color: #991B1B; line-height: 1.5; }
                .footer { background: #FAF7F5; padding: 20px 24px; text-align: center; font-size: 12px; color: #89726B; border-top: 1px solid #EAE0DE; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h1>ROMS RESTAURANT</h1>
                  <p>Thông Báo Đơn Đặt Bàn Đã Hủy</p>
                </div>
                <div class="body">
                  <span class="status-badge">❌ ĐÃ HỦY ĐƠN ĐẶT BÀN</span>
                  <div class="greeting">Kính chào Quý khách %s,</div>
                  <div class="desc">
                    ROMS Restaurant rất tiếc phải thông báo đơn đặt bàn mang mã <b>#%s</b> (hẹn lúc %s) đã được hủy trên hệ thống.
                  </div>

                  <div class="cancel-reason-box">
                    <b>Lý do hủy:</b> %s
                  </div>

                  <p style="font-size: 14px; color: #56423D; line-height: 1.6;">
                    Nếu có bất kỳ sự nhầm lẫn nào hoặc Quý khách muốn đặt lại bàn vào một khung giờ khác, xin vui lòng liên hệ ngay với Tổng đài chăm sóc khách hàng của chúng tôi để được hỗ trợ tốt nhất.
                  </p>
                </div>
                <div class="footer">
                  Hotline hỗ trợ: <b>1900 6868</b> • Email: roms.service.restaurant@gmail.com<br>
                  © 2026 ROMS Restaurant. Rất mong có cơ hội được phục vụ Quý khách trong những dịp tới!
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                r.getCustomerName(),
                r.getBookingCode(),
                timeStr,
                (cancelReason != null && !cancelReason.trim().isEmpty()) ? cancelReason.trim() : "Quản lý cập nhật theo yêu cầu khách hàng"
        );
    }

    private String buildPreOrderItemsHtml(Reservation r) {
        if (r.getItems() == null || r.getItems().isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<div style=\"margin-top: 18px; margin-bottom: 18px;\">");
        sb.append("<div style=\"font-size: 14px; font-weight: 800; color: #1F1B1A; margin-bottom: 8px;\">📋 Món ăn đặt trước:</div>");
        sb.append("<table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">");
        sb.append("<tr style=\"background: #FAF7F5; border-bottom: 1.5px solid #EAE0DE; text-align: left;\">");
        sb.append("<th style=\"padding: 8px 10px; color: #89726B;\">Món</th>");
        sb.append("<th style=\"padding: 8px 10px; text-align: center; color: #89726B;\">SL</th>");
        sb.append("<th style=\"padding: 8px 10px; text-align: right; color: #89726B;\">Thành tiền</th>");
        sb.append("</tr>");

        BigDecimal total = BigDecimal.ZERO;
        for (ReservationItem item : r.getItems()) {
            if (item.getQuantity() == null || item.getQuantity() <= 0) continue;
            String dishName = (item.getMenuItem() != null && item.getMenuItem().getName() != null)
                    ? item.getMenuItem().getName() : "Món ăn";
            BigDecimal subtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
            total = total.add(subtotal);

            sb.append("<tr style=\"border-bottom: 1px dashed #EAE0DE;\">");
            sb.append("<td style=\"padding: 8px 10px; font-weight: 600; color: #1F1B1A;\">").append(dishName).append("</td>");
            sb.append("<td style=\"padding: 8px 10px; text-align: center; color: #56423D;\">x").append(item.getQuantity()).append("</td>");
            sb.append("<td style=\"padding: 8px 10px; text-align: right; font-weight: 700; color: #9D4124;\">")
                    .append(CURRENCY_FORMATTER.format(subtotal)).append("₫</td>");
            sb.append("</tr>");
        }

        sb.append("<tr style=\"background: #FFF8F6; font-weight: 800;\">");
        sb.append("<td colspan=\"2\" style=\"padding: 10px; color: #1F1B1A;\">Tạm tính món đặt trước:</td>");
        sb.append("<td style=\"padding: 10px; text-align: right; color: #9D4124; font-size: 14px;\">")
                .append(CURRENCY_FORMATTER.format(total)).append("₫</td>");
        sb.append("</tr>");
        sb.append("</table>");
        sb.append("</div>");

        return sb.toString();
    }
}
