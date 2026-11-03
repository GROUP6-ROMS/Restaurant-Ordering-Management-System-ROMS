package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.service.EmailService;
import org.springframework.http.HttpStatus;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Override
    public boolean sendOtpEmail(String toEmail, String recipientName, String otp) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("[EMAIL SERVICE] Địa chỉ email người nhận trống, không thể gửi OTP!");
            return false;
        }

        String safeName = (recipientName != null && !recipientName.trim().isEmpty()) ? recipientName.trim() : "Quản lý";

        // Kiểm tra xem cấu hình Gmail SMTP đã được điền mật khẩu ứng dụng chưa
        boolean hasValidCredentials = fromEmail != null && !fromEmail.trim().isEmpty() &&
                mailPassword != null && !mailPassword.trim().isEmpty();

        if (mailSender == null || !hasValidCredentials) {
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

    /**
     * Tạo template Email HTML chuyên nghiệp với màu sắc thương hiệu ROMS Bistro
     */
    private String buildOtpHtmlContent(String recipientName, String otp) {
        String template = """
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
                  <div class="greeting">Xin chào {recipientName},</div>
                  <div class="desc">
                    Hệ thống nhận được yêu cầu đặt lại mã PIN đăng nhập cho tài khoản Quản lý cơ sở của bạn.
                    Dưới đây là mã xác thực OTP dùng một lần để hoàn tất quy trình:
                  </div>
                  
                  <div class="otp-box">
                    <div class="otp-label">MÃ XÁC THỰC OTP CỦA BẠN</div>
                    <div class="otp-code">{otp}</div>
                    <div class="otp-note">⏱ Mã có hiệu lực trong vòng 5 phút</div>
                  </div>
                  
                  <div class="warning">
                    ⚠️ <b>Lưu ý an toàn:</b> Tuyệt đối không chia sẻ mã xác thực này cho bất kỳ ai, bao gồm cả nhân viên nhà hàng. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và kiểm tra lại bảo mật tài khoản.
                  </div>
                </div>
                <div class="footer">
                  © 2026 ROMS Bistro Management System • SWP391 Capstone Project
                </div>
              </div>
            </body>
            </html>
            """;
        return template.replace("{recipientName}", recipientName).replace("{otp}", otp);
    }
}

