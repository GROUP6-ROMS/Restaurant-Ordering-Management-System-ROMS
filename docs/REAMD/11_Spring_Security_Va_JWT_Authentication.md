# BƯỚC 11: CẤU HÌNH SPRING SECURITY 6 & JWT AUTHENTICATION

## 1. Bước Này Làm Gì?
- Cấu hình hạ tầng bảo mật Spring Security 6 và xác thực bằng chuẩn JSON Web Token (JWT).
- Tạo lớp sinh/giải mã token (`JwtTokenProvider`), bộ lọc kiểm tra token trên mỗi request (`JwtAuthenticationFilter`), dịch vụ nạp tài khoản từ CSDL (`UserDetailsServiceImpl`), và file cấu hình chuỗi bảo mật (`SecurityConfig`).

---

## 2. Các File Code & Chức Năng

### File 1: `JwtTokenProvider.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/security/JwtTokenProvider.java`
- **Chức năng:** Tạo chuỗi JWT mang thông tin tài khoản & vai trò nhân viên sau khi đăng nhập thành công; giải mã và kiểm tra tính hợp lệ của token khi có request gửi lên.

```java
package com.romsteam.roms.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component // Danh dau la Spring Component de inject vao cac class khac khi can
public class JwtTokenProvider {

    // Khoa bi mat dung de ky va giai ma JWT (doc tu application.properties)
    @Value("${jwt.secret}")
    private String jwtSecret;

    // Thoi gian song cua JWT tinh bang mili-giay (vi du: 86400000 ms = 24 gio)
    @Value("${jwt.expiration}")
    private long jwtExpirationDate;

    // Tao khoa ky HMAC an toan tu chuoi bi mat Base64/Hex
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    // 1. Tao chuoi token JWT tu doi tuong xac thuc thanh cong (sau khi user dang nhap)
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationDate);

        return Jwts.builder()
                .subject(userDetails.getUsername()) // Luu username vao phan Subject cua token
                .issuedAt(currentDate)              // Thoi diem cap phat token
                .expiration(expireDate)             // Thoi diem token het han
                .signWith(getSigningKey())          // Ky dien tu bang khoa bi mat HMAC SHA-256
                .compact();                         // Dong goi thanh chuoi ky tu dang xxxxx.yyyyy.zzzzz
    }

    // 2. Trich xuat username tu ben trong chuoi token gui len
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey()) // Kiem tra chu ky hop le truoc khi boc tach
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    // 3. Kiem tra token co hop le, nguyen ven va con han su dung hay khong
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true; // Token hoan toan hop le
        } catch (MalformedJwtException e) {
            System.err.println("JWT token không đúng định dạng: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            System.err.println("JWT token đã hết hạn sử dụng: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("JWT token không được hỗ trợ: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("Chuỗi JWT rỗng hoặc không hợp lệ: " + e.getMessage());
        }
        return false; // Token co loi hoac da bi lam gia
    }
}
```

---

### File 2: `UserDetailsServiceImpl.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/service/serviceImpl/UserDetailsServiceImpl.java`
- **Chức năng:** Cầu nối giữa Spring Security và cơ sở dữ liệu `staffs`. Nạp thông tin tài khoản, mật khẩu đã mã hóa và quyền hạn theo vai trò nhân viên.

```java
package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final StaffRepository staffRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Tim thong tin nhan vien trong CSDL theo ten dang nhap
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy nhân viên với tên đăng nhập: " + username));

        // 2. Kiem tra xem tai khoan co dang bi khoa (nghi viec) hay khong
        if (!staff.getIsActive()) {
            throw new UsernameNotFoundException("Tài khoản này hiện đang bị khóa hoặc đã ngưng hoạt động!");
        }

        // 3. Chuyen doi vai tro UserRole thanh GrantedAuthority (Chuan Spring Security quy dinh tien to "ROLE_")
        // Vi du: WAITER -> "ROLE_WAITER", MANAGER -> "ROLE_MANAGER"
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + staff.getRole().name());

        // 4. Tra ve doi tuong User chuan cua Spring Security
        // LUU Y: He thong ROMS su dung ma PIN 6 chu so da ma hoa BCrypt (staff.getPinCode()) lam thong tin xac thuc (credentials), khong dung password truyen thong
        return new User(
                staff.getUsername(),
                staff.getPinCode(), // Ma PIN 6 so BCrypt lay tu Entity Staff
                Collections.singletonList(authority)
        );
    }
}
```

---

### File 3: `JwtAuthenticationFilter.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/security/JwtAuthenticationFilter.java`
- **Chức năng:** Bộ lọc đánh chặn từng HTTP request gửi đến server, bóc tách Bearer Token từ header Authorization, nếu hợp lệ sẽ cấp quyền vào Security Context.

```java
package com.romsteam.roms.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
// Ke thua OncePerRequestFilter: Dam bao bo loc chi chay dung mot lan duy nhat cho moi yeu cau HTTP
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Trich xuat chuoi JWT token tu HTTP Header "Authorization"
        String token = getJwtFromRequest(request);

        // 2. Neu co token va token hop le thi nap thong tin nguoi dung vao SecurityContext
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            // Lay username tu token
            String username = jwtTokenProvider.getUsernameFromToken(token);

            // Nap chi tiet UserDetails tu database
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // Tao doi tuong xac thuc danh tinh chinh thuc
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // Luu thong tin xac thuc vao Security Context cua thread hien tai
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 3. Cho phep request tiep tuc di qua cac filter ke tiep de vao Controller
        filterChain.doFilter(request, response);
    }

    // Phuong thuc phu: Cat bo tien to "Bearer " de lay chuoi token thuan
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Bo qua 7 ky tu "Bearer "
        }
        return null;
    }
}
```

---

### File 4: `SecurityConfig.java`
- **Đường dẫn:** `src/main/java/com/romsteam/roms/config/SecurityConfig.java`
- **Chức năng:** Cấu hình trung tâm Spring Security: tắt CSRF, thiết lập chế độ Stateless (không lưu session trên RAM server), mở quyền cho các endpoint công khai và bảo vệ các API quản trị.

```java
package com.romsteam.roms.config;

import com.romsteam.roms.security.JwtAuthenticationFilter;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Cho phep dung cac annotation phan quyen nhu @PreAuthorize("hasRole('MANAGER')") tren tung ham Service/Controller
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // Tiem JwtAuthenticationFilter qua constructor
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // 1. Khai bao thuat toan ma hoa mat khau an toan chuan nganh BCrypt
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. Cung cap Bean AuthenticationManager cho Controller goi ham authenticate() luc dang nhap
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // 3. Cau hinh chuoi bao mat HTTP Security Filter Chain
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Tat bao ve CSRF vi he thong REST API xac thuc qua JWT khong dung Cookie trinh duyet
                .csrf(AbstractHttpConfigurer::disable)

                // Cau hinh khong luu phien lam viec (Session) tren server -> Stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Cau hinh phan quyen truy cap URL endpoints:
                .authorizeHttpRequests(auth -> auth
                        // Cac API cong khai khong can dang nhap token:
                        .requestMatchers(
                                "/api/auth/**",            // Dang nhap, lam moi token
                                "/api/customer/**",        // Khach quet QR xem menu, dat mon tai ban
                                "/api/reservations/book",  // Khach dat ban truoc tren trang chu
                                "/v3/api-docs/**",         // Tai lieu OpenAPI Swagger
                                "/swagger-ui/**",          // Giao dien Swagger UI
                                "/swagger-ui.html"
                        ).permitAll()

                        // Moi API con lai deu phai co Bearer Token JWT hop le moi duoc truy cap
                        .anyRequest().authenticated()
                )

                // Them bo loc JWT cua chung ta chay truoc UsernamePasswordAuthenticationFilter mac dinh
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```
