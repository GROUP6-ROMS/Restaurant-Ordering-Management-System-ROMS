package com.romsteam.roms.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;

/**
 * Service quản lý giới hạn tần suất gọi API (Rate Limiting) theo thuật toán Token Bucket (Bucket4j).
 * Lưu trữ trong bộ nhớ đệm Caffeine với cơ chế tự động giải phóng (expireAfterAccess),
 * ngăn chặn brute-force mã PIN và chống spam gọi email OTP qua Gmail SMTP.
 */
@Service
public class RateLimitingService {

    // Bộ đệm giới hạn cho yêu cầu OTP: Tối đa 3 lần / 10 phút trên mỗi IP
    private final Cache<String, Bucket> otpBuckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(15))
            .maximumSize(10_000)
            .build();

    // Bộ đệm giới hạn cho đăng nhập và xác thực PIN Quản lý: Tối đa 10 lần / 5 phút trên mỗi IP
    private final Cache<String, Bucket> authBuckets = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(10))
            .maximumSize(10_000)
            .build();

    /**
     * Trích xuất địa chỉ IP thực của Client, hỗ trợ chạy sau Nginx Reverse Proxy (X-Forwarded-For, X-Real-IP)
     */
    public String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(xRealIp)) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Tiêu thụ 1 token cho hành động yêu cầu mã OTP (tối đa 3 lần / 10 phút)
     * @return true nếu còn token (cho phép thực thi), false nếu đã hết token (vượt ngưỡng)
     */
    public boolean tryConsumeOtp(String clientIp) {
        if (!StringUtils.hasText(clientIp)) {
            return true;
        }
        Bucket bucket = otpBuckets.get(clientIp, k -> createOtpBucket());
        return bucket != null && bucket.tryConsume(1);
    }

    /**
     * Tiêu thụ 1 token cho hành động Đăng nhập hoặc Xác thực PIN (tối đa 10 lần / 5 phút)
     * @return true nếu còn token, false nếu vượt ngưỡng
     */
    public boolean tryConsumeAuth(String clientIp) {
        if (!StringUtils.hasText(clientIp)) {
            return true;
        }
        Bucket bucket = authBuckets.get(clientIp, k -> createAuthBucket());
        return bucket != null && bucket.tryConsume(1);
    }

    private Bucket createOtpBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(3)
                .refillGreedy(3, Duration.ofMinutes(10))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createAuthBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(10)
                .refillGreedy(10, Duration.ofMinutes(5))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Đặt lại giới hạn cho một địa chỉ IP (phục vụ testing hoặc reset thủ công)
     */
    public void resetLimitsForIp(String clientIp) {
        if (StringUtils.hasText(clientIp)) {
            otpBuckets.invalidate(clientIp);
            authBuckets.invalidate(clientIp);
        }
    }
}
