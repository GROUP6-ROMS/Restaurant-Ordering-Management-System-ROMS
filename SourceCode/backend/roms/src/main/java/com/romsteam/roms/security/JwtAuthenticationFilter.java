package com.romsteam.roms.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Component
// Ke thua OncePerRequestFilter: Dam bao bo loc chi chay dung mot lan duy nhat cho moi yeu cau HTTP
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    // Tiem cac dependency can thiet qua constructor
    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, UserDetailsService userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Trich xuat chuoi JWT token tu HTTP Header "Authorization"
        String token = getJwtFromRequest(request);

        // 2. Neu co token va token hop le thi nap thong tin nguoi dung vao SecurityContext
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            if (jwtTokenProvider.isCustomerDiningToken(token)) {
                // 2.1. Xử lý Dining Token của Thực khách ngồi tại bàn quét mã QR
                Long tableId = jwtTokenProvider.getTableIdFromToken(token);
                String tableNumber = jwtTokenProvider.getTableNumberFromToken(token);
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_CUSTOMER");

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        "CUSTOMER_" + (tableNumber != null ? tableNumber : tableId),
                        null,
                        Collections.singletonList(authority)
                );

                Map<String, Object> details = new HashMap<>();
                details.put("tableId", tableId);
                details.put("tableNumber", tableNumber);
                details.put("role", "ROLE_CUSTOMER");
                authentication.setDetails(details);

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                // 2.2. Xử lý Staff Token của Nhân viên đăng nhập qua tài khoản
                try {
                    String username = jwtTokenProvider.getUsernameFromToken(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (Exception ex) {
                    logger.warn("Không thể xác thực thông tin nhân viên từ token: " + ex.getMessage());
                }
            }
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
