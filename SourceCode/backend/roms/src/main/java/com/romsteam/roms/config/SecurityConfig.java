package com.romsteam.roms.config;

import com.romsteam.roms.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final com.romsteam.roms.security.TraceIdFilter traceIdFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // ===================================================================
    // 1. ĐỊNH NGHĨA CẤU HÌNH CORS CHO PHÉP FRONTEND TRUY CẬP
    // ===================================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Cho phép nguồn từ Vite Frontend (port 5173, 4173), DuckDNS VPS và mọi clients
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        // Cho phép toàn bộ các phương thức HTTP
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Cho phép gửi kèm các Header xác thực (Bearer Token, Content-Type, X-Trace-Id)
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "X-Trace-Id"));

        // Công khai các Header phản hồi để Frontend Axios có thể đọc được (nhất là X-Trace-Id khi đối soát lỗi)
        configuration.setExposedHeaders(Arrays.asList("X-Trace-Id", "Authorization"));

        // Cho phép nhận Cookie/Credentials nếu có
        configuration.setAllowCredentials(true);

        // Thời gian trình duyệt lưu cache kết quả kiểm tra preflight CORS (1 giờ)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Áp dụng cấu hình này cho tất cả các đường dẫn API
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // ===================================================================
    // 2. KÍCH HOẠT CORS VÀO CHUỖI BẢO MẬT HTTP
    // ===================================================================
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // BẬT CORS và áp dụng bean corsConfigurationSource ở trên
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Tắt CSRF vì ứng dụng dùng REST API và JWT Token
                .csrf(AbstractHttpConfigurer::disable)

                // Không dùng Session stateful
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Phân quyền endpoints
                .authorizeHttpRequests(auth -> auth
                        // 1. Cổng mở công khai: Đăng nhập nhân viên, Quét mã QR, Đặt bàn từ xa, Thực đơn công khai, Swagger Docs, WebSocket, Actuator, Webhook payOS
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/customer/tables/verify-qr",
                                "/api/customer/reservations/**",
                                "/api/customer/dining/menu",
                                "/api/customer/ai/**",
                                "/api/reservations/book",
                                "/api/payment/payos/webhook",
                                "/ws-roms/**",
                                "/ws-roms-native/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/**")
                        .permitAll()

                        // 2. Nghiệp vụ gọi món và vận hành tại bàn: Bắt buộc phải có Dining Token (ROLE_CUSTOMER) hoặc tài khoản Nhân viên
                        .requestMatchers("/api/customer/dining/**")
                        .hasAnyRole("CUSTOMER", "WAITER", "MANAGER", "ADMIN")

                        // 3. Các request còn lại bắt buộc phải xác thực
                        .anyRequest().authenticated())

                // 1. Chạy TraceIdFilter ở đầu tiên để mọi request đều có Trace ID trong MDC
                .addFilterBefore(traceIdFilter, UsernamePasswordAuthenticationFilter.class)
                // 2. Đặt bộ lọc JWT chạy trước UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
