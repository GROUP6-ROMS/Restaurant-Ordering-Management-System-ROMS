package com.romsteam.roms.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.romsteam.roms.dto.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Filter kiểm soát tần suất truy cập các endpoint nhạy cảm (Rate Limiting).
 * Chặn các cuộc tấn công Brute-Force mã PIN và spam gửi email OTP làm cạn kiệt quota SMTP.
 * Trả về mã lỗi HTTP 429 Too Many Requests khi phát hiện vi phạm.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();
        String method = request.getMethod();

        // 1. Kiểm tra giới hạn cho Endpoint gửi Email OTP khôi phục mã PIN (Tối đa 3 lần / 10 phút)
        if ("POST".equalsIgnoreCase(method) && uri.endsWith("/api/auth/forgot-pin/request-otp")) {
            String clientIp = rateLimitingService.getClientIp(request);
            if (!rateLimitingService.tryConsumeOtp(clientIp)) {
                log.warn("[RateLimit] IP {} vuot qua gioi han gui email OTP (3 lan/10 phut)", clientIp);
                writeRateLimitResponse(response, "Bạn đã gửi yêu cầu OTP quá số lần cho phép (3 lần / 10 phút). Vui lòng thử lại sau!");
                return;
            }
        }

        // 2. Kiểm tra giới hạn cho Endpoint Đăng nhập ca và Xác thực PIN Quản lý (Tối đa 10 lần / 5 phút)
        if ("POST".equalsIgnoreCase(method) && (uri.endsWith("/api/auth/login") || uri.endsWith("/api/auth/verify-manager-pin"))) {
            String clientIp = rateLimitingService.getClientIp(request);
            if (!rateLimitingService.tryConsumeAuth(clientIp)) {
                log.warn("[RateLimit] IP {} vuot qua gioi han thu dang nhap hoac xac thuc PIN (10 lan/5 phut)", clientIp);
                writeRateLimitResponse(response, "Bạn đã thử đăng nhập / xác thực mã PIN quá nhiều lần. Vui lòng thử lại sau 5 phút!");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void writeRateLimitResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        String json;
        try {
            ApiResponse<?> errorResponse = ApiResponse.error(message);
            json = objectMapper.writeValueAsString(errorResponse);
        } catch (Exception e) {
            json = "{\"success\":false,\"message\":\"" + message.replace("\"", "\\\"") + "\",\"status\":429}";
        }
        response.getWriter().write(json);
    }
}
